# 项目说明

## 项目目标

`chinese-speaking-web` 是一个面向中文学习者的口语陪练网页应用。核心目标是在浏览器里完成“英文表达 -> 中文陪练回复 -> 拼音与解释 -> 中文朗读”的练习闭环。

## 当前能力

- 文字练习：用户输入英文句子，服务端生成中文回复。
- 语音练习：浏览器录音后上传到服务端，服务端调用语音识别得到英文转写。
- 中文朗读：服务端可调用 OpenAI TTS 生成中文音频；没有 API key 或 TTS 失败时，前端使用浏览器 `speechSynthesis` 回退朗读。
- 难度控制：支持 `beginner`、`intermediate`、`advanced` 三档。
- 显示控制：前端可开关拼音和英文解释。
- 本地模拟：没有 `OPENAI_API_KEY` 时，后端返回固定示例，方便调试 UI 和交互流程。
- Chat 模型：配置 `CHAT_API_KEY` 后，可使用 OpenAI-compatible Chat Completions 接口生成回复；当前推荐 DashScope/Qwen3.6-Flash 处理即时反馈和 JSON 判断。
- Vision 模型：配置 `VISION_API_KEY`、`VISION_BASE_URL`、`VISION_MODEL` 后，可通过 legacy/experimental API 做 Canvas 图片参考判断；正常前端不展示自动分数。

## 目录结构

```text
chinese-speaking-web/
  .env.example
  .gitignore
  package.json
  README.md
  server.js
  docs/
    PROJECT.md
    CHANGELOG.md
  scripts/
    sync-github.ps1
  public/
    hanzi-data/
    index.html
    styles.css
    app.js
```

## 服务端结构

入口文件：[server.js](../server.js)

- `GET /api/health`：返回服务状态和 AI 是否启用。
- `POST /api/transcribe`：接收浏览器上传的音频，返回英文转写。
- `POST /api/practice`：接收英文文本和练习设置，返回中文、拼音、解释和建议。
- `POST /api/tts`：接收中文文本和语速，返回 MP3 音频；无 API key 时返回 `{ "fallback": true }`。
- `GET /api/courses`：返回内置场景课程列表。
- `GET /api/courses/:id`：返回单个场景课程和听说读写练习结构。
- `POST /api/listening/evaluate`：legacy/experimental API，用于判断声调辨别或场景听力理解题；正常前端不展示自动分数。
- `POST /api/speaking/evaluate`：legacy/experimental API，接收跟读音频和目标句；正常前端不再调用或展示自动跟读分数。
- `POST /api/speaking/dialogue`：处理 4-5 轮场景口语对话并返回 Luming 回应、声调反馈和下一轮任务。
- `POST /api/reading/evaluate`：legacy/experimental API，用于阅读/写作造句参考判断；正常前端不再调用或展示自动造句分数。
- `POST /api/writing/evaluate`：legacy/experimental API，接收 Canvas 图片、目标字词、模式和 `strokes` 轨迹；正常前端不再调用或展示自动书写分数。
- API 路由使用精确路径匹配，避免 `/api/health-check` 这类前缀路径误命中。
- JSON 请求体默认限制为 256 KB，音频上传请求体限制为 8 MB。
- `/api/practice` catches chat-model timeout/abort failures and returns local fallback practice content so the chat flow remains usable during unstable network or model latency.
- Realtime chat requests use a compact JSON prompt, small output budget, and Qwen `enable_thinking=false` when DashScope/Qwen is configured, so chat does not wait for long reasoning output.
- 静态资源：所有 `GET` 静态页面和资源从 `public/` 目录读取。

## 前端结构

入口页面：[public/index.html](../public/index.html)

- [public/app.js](../public/app.js)：负责录音、上传、练习请求、朗读、消息渲染和状态展示。
- 工作区使用“聊 / 听 / 说 / 读 / 写”五种互斥模式，并以内置场景课程为主数据源。每个技能模式包含二级模式：听含声调/场景听力，说含跟读/场景对话，读含七层汉字/场景阅读，写含笔顺手写/造句输入。
- [public/styles.css](../public/styles.css)：负责响应式布局、对话气泡、设置区、输入区和按钮状态。

## 开发与文档同步规则

修改代码时必须同步检查文档：

- 修改接口、模型、环境变量、启动方式：更新 `README.md` 和本文件。
- 修改用户可见文案、功能行为或限制：更新本文件和 `docs/CHANGELOG.md`。
- 修复 bug：在 `docs/CHANGELOG.md` 记录修复内容。
- 新增文件或目录：更新本文件的目录结构。

## GitHub 管理规则

项目托管在 GitHub 仓库：

```text
https://github.com/q547113058-max/chinese-speaking-web
```

当前本机 Git 已安装并可用，后续默认使用标准 Git 工作流：

```powershell
git status
git add .
git commit -m "说明本次修改"
git push
```

如遇国外下载或 GitHub 连接不稳定，先启动 `vpn-mihomo` 本地代理，再执行下载、安装或推送相关命令。当前代理地址为 `http://127.0.0.1:17890`。

`scripts/sync-github.ps1` 是备用方案，只在 `git` 不可用时通过 GitHub API 同步文件。脚本会跳过 `.env`、`.git/`、`node_modules/` 和 `.log` 文件。
## MiniMax Speech 2.8 TTS

Server-side TTS uses MiniMax Speech 2.8 when `TTS_PROVIDER=minimax`.

```env
TTS_PROVIDER=minimax
TTS_BASE_URL=https://api.minimaxi.com/v1
TTS_MODEL=speech-2.8-hd
TTS_VOICE=Chinese (Mandarin)_Warm_Girl
```

The server reuses `CHAT_API_KEY` for TTS unless `TTS_API_KEY` is set. Speech recognition remains OpenAI/mock because MiniMax Speech 2.8 is TTS, not STT.
## Qwen Realtime STT

Speech recognition uses DashScope realtime WebSocket when `STT_PROVIDER=qwen`.

```env
STT_PROVIDER=qwen
DASHSCOPE_API_KEY=your_dashscope_api_key
STT_WS_URL=wss://dashscope.aliyuncs.com/api-ws/v1/realtime
STT_MODEL=qwen3.5-livetranslate-flash-realtime-2026-05-19
STT_TRANSCRIPTION_MODEL=qwen3-asr-flash-realtime
STT_SOURCE_LANGUAGE=en
STT_TARGET_LANGUAGE=zh
```

The frontend records 16 kHz mono PCM for compatibility with Qwen realtime audio input. The real DashScope key is stored only in `.env`, GitHub Secrets, or deployment environment variables.

## Legacy scoring API latency policy

The scoring APIs are still present for experiments and compatibility, but the normal frontend no longer calls them.

- Fast skill feedback is the default. `AI_SCORE_TIMEOUT_MS` limits legacy scoring and vision calls; default: `3500`.
- Normal chat remains more tolerant. `AI_CHAT_TIMEOUT_MS` limits chat/persona generation; default: `30000`, because Qwen3.6-Flash can exceed 12 seconds on structured JSON coaching prompts.
- `/api/speaking/evaluate` and `/api/writing/evaluate` are retained only as legacy/experimental paths.
- The Writing UI uses self-check completion feedback so handwriting practice does not block on remote vision calls.

## Practice feedback policy

The learner-facing UI does not present automatic numeric scores or radar charts. The current product direction is completion, self-check, explicit correct/incorrect feedback for deterministic quiz items, and Luming conversation guidance. Frontend speaking, handwriting, sentence practice, and scene practice no longer call the scoring APIs during normal use.

Listening defaults to `场景辨别`. `声调辨别` supports audio playback plus five tone-choice buttons, and also allows learners to say the tone aloud. Voice answers are transcribed by STT, judged by Qwen3.6-Flash/chat-model logic, and fall back to local tone-word parsing if the AI path is unavailable.

Listening scene dialogues are at least 50 Chinese characters. The transcript and pinyin are hidden by default and become visible only after clicking `查看文本和拼音`.

Speaking defaults to `场景对话`, and Reading defaults to `场景阅读`; shadowing and seven-layer character study remain available as secondary submodes.

Speaking voice responses include content correctness judgment. Shadowing checks the STT transcript against the target sentence; scene dialogue checks whether the learner's spoken reply completes the current role task and returns a reference response. `/api/speaking/dialogue` accepts `text`, `userText`, `transcript`, or `choice`, and merges model judgment with local scenario-target matching to avoid rejecting valid free-form spoken answers.

Reading `七层汉字` contains shape story with local real stroke-order data, pinyin spelling playback, word matching, idiom background/explanation playback, three example sentences for shadowing, Qwen3.6-Flash/chat-model sentence feedback without numeric scores, and a shortcut into Speaking scene dialogue. Pinyin playback uses Mandarin-friendly syllable prompts instead of asking TTS to read Latin letters. The app uses local stroke data in `public/hanzi-data/`; if real data is missing, it shows a static character and does not play simplified fake strokes. Reading `场景阅读` supports manual `基础 / 高阶` switching; high-level passages contain 5-8 sentences, and clicking a Hanzi plays the character plus its meaning.

Writing handwriting has one learner-facing mode: `临摹`, with the target character visible as a trace guide. The handwriting toolbar intentionally keeps only undo and clear. There is no save, completion, or check button because the app no longer performs automatic handwriting evaluation in normal use.

## 2026-06-11 model latency notes

- Normal chat and reading sentence feedback use the compact Qwen/DashScope request path.
- Listening tone voice answers first parse clear STT transcripts locally, so answers like `四声` do not wait for the model. Ambiguous transcripts still fall through to the configured chat model.
- Vision handwriting remains an experimental API path and falls back when the configured vision endpoint is unavailable.
