# 中文口语陪练网页 App

一个最小可用的中文口语陪练网页应用。学习者可以用英文输入或录音，应用会生成自然中文回复、拼音、英文解释和口语建议，并支持中文朗读。

## 功能

- 英文文字输入，生成中文陪练回复。
- 浏览器录音上传和语音识别。
- 中文、拼音、英文解释、口语建议展示。
- 中文朗读，优先使用 OpenAI TTS；没有音频 API key 时回退到浏览器朗读。
- 读：从当前回复生成汉字-拼音配对游戏。
- 听：从当前回复生成声调练习，显示对应汉字后播放，支持按钮选择或说出声调并获得即时反馈。
- 说：从当前回复生成跟读短句，支持录音自查和转写参考，不展示自动分数。
- 写：从当前回复生成 1-3 个字词，支持 Canvas 手写、临摹自查和 AI/OCR 参考，不展示自动分数。
- 初级、中级、高级三档难度。
- 语速、拼音、英文解释显示开关。
- 无 `OPENAI_API_KEY` 时使用模拟回复，便于先测试界面和流程。
- 可通过 OpenAI-compatible Chat Completions 接口接入 Qwen / MiniMax / OpenAI 等模型；当前推荐 Qwen3.6-Flash 处理即时反馈和 JSON 判断。

## 技术栈

- Node.js 20+
- 原生 HTTP server
- 原生 HTML/CSS/JavaScript
- OpenAI Responses API、Audio Transcriptions API、Text-to-Speech API
- OpenAI-compatible Chat Completions API

## 运行

```powershell
$env:OPENAI_API_KEY="你的 OpenAI API key"
npm start
```

然后打开：

```text
http://localhost:5173
```

也可以使用自定义端口：

```powershell
$env:PORT="5180"
npm start
```

## 环境变量

参考 [.env.example](./.env.example)：

- `CHAT_API_KEY`：OpenAI-compatible chat API key，例如 DashScope/Qwen key。真实密钥只能放在本地 `.env`、GitHub Secrets 或部署平台环境变量中。
- `CHAT_BASE_URL`：chat completions 接口地址，DashScope 示例为 `https://dashscope.aliyuncs.com/compatible-mode/v1`。
- `CHAT_MODEL`：聊天模型，当前推荐 `qwen3.6-flash`。
- `OPENAI_API_KEY`：OpenAI API key。缺省时进入模拟模式；配置后可用于音频能力。
- `OPENAI_CHAT_MODEL`：OpenAI 回复模型，默认 `gpt-4.1-mini`。
- `VISION_API_KEY`：legacy/experimental Canvas 图片参考判断使用的 OpenAI-compatible vision API key；未设置时会依次回退到 `CHAT_API_KEY`、`OPENAI_API_KEY`。
- `VISION_BASE_URL`：vision chat completions 接口地址，默认 `https://api.openai.com/v1`。
- `VISION_MODEL`：支持图片输入的视觉模型；未设置时会依次回退到 `OPENAI_VISION_MODEL`、`CHAT_MODEL`、`OPENAI_CHAT_MODEL`、`gpt-4.1-mini`。
- `OPENAI_TRANSCRIBE_MODEL`：语音识别模型，默认 `gpt-4o-mini-transcribe`。
- `OPENAI_TTS_MODEL`：中文朗读模型，默认 `gpt-4o-mini-tts`。
- `OPENAI_TTS_VOICE`：朗读音色，默认 `coral`。
- `PORT`：本地服务端口，默认 `5173`。

## 项目文档

- [项目说明](./docs/PROJECT.md)
- [变更日志](./docs/CHANGELOG.md)

## GitHub 管理

当前项目已关联 GitHub 仓库：

```text
https://github.com/q547113058-max/chinese-speaking-web
```

本机 Git 已安装并可用，默认使用标准 Git 工作流：

```powershell
git status
git add .
git commit -m "说明本次修改"
git push
```

如果将来遇到没有 `git` 命令的环境，可以使用 GitHub CLI 备用同步脚本：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\sync-github.ps1 -Message "说明本次修改"
```

备用脚本会跳过 `.env`、`.git/`、`node_modules/` 和 `.log` 文件，通过 GitHub API 创建或更新远端文件。只在标准 Git 不可用时使用它。

## 维护约定

每次修改代码时，必须同步检查并更新相关文档：

- 用户可见功能、运行方式、接口、环境变量变化：更新 `README.md` 和 `docs/PROJECT.md`。
- 行为变化、修复、已知限制变化：更新 `docs/CHANGELOG.md`。
- GitHub 管理流程或发布方式变化：更新本文档的 GitHub 管理和维护约定。

每次完成一组代码或文档修改后，都要提交并推送到 GitHub。
## MiniMax Speech 2.8 TTS

Server-side TTS now supports MiniMax Speech 2.8 over the MiniMax T2A API:

```env
TTS_PROVIDER=minimax
TTS_BASE_URL=https://api.minimaxi.com/v1
TTS_MODEL=speech-2.8-hd
TTS_VOICE=Chinese (Mandarin)_Warm_Girl
```

`TTS_API_KEY` is optional. When it is not set, the server reuses `CHAT_API_KEY`; if chat uses a non-MiniMax provider, set `TTS_API_KEY` separately for MiniMax TTS. Speech recognition is still not MiniMax-backed because MiniMax Speech 2.8 is a text-to-speech model, not a speech-to-text model.
## Qwen Realtime STT

Speech recognition can use Alibaba Cloud Model Studio / DashScope realtime WebSocket:

```env
STT_PROVIDER=qwen
DASHSCOPE_API_KEY=your_dashscope_api_key
STT_WS_URL=wss://dashscope.aliyuncs.com/api-ws/v1/realtime
STT_MODEL=qwen3.5-livetranslate-flash-realtime-2026-05-19
STT_TRANSCRIPTION_MODEL=qwen3-asr-flash-realtime
STT_SOURCE_LANGUAGE=en
STT_TARGET_LANGUAGE=zh
```

The browser records 16 kHz mono PCM and uploads it to `/api/transcribe`. The server streams that PCM to Qwen realtime and returns the source-language transcript.

## API safety limits

API routes use exact path matching. For example, `/api/health-check` is not treated as `/api/health`.

JSON request bodies are limited to 256 KB. Audio upload bodies are limited to 8 MB.

## Speaking and writing practice

Each `/api/practice` response includes an `exercise` object:

```json
{
  "speaking": { "text": "中文短句", "pinyin": "带声调拼音" },
  "reading": { "items": [{ "text": "字", "pinyin": "pinyin" }] },
  "listening": { "items": [{ "text": "字", "pinyin": "pinyin", "tone": 3 }] },
  "writing": { "items": [{ "text": "字或词", "type": "character", "hint": "提示" }] }
}
```

`POST /api/speaking/evaluate` remains available as a legacy/experimental endpoint, but the normal frontend no longer calls it or displays automatic speaking scores.

`POST /api/writing/evaluate` remains available as a legacy/experimental endpoint, but the normal frontend no longer calls it or displays automatic handwriting scores.

The app now includes a scenario course library. `GET /api/courses` lists the built-in scenarios, and `GET /api/courses/:id` returns one course with listening, speaking, reading, and writing data. Legacy/experimental skill APIs include `/api/listening/evaluate`, `/api/speaking/evaluate`, `/api/writing/evaluate`, `/api/speaking/dialogue`, and `/api/reading/evaluate`.

The frontend uses mutually exclusive workspace modes: `聊`, `听`, `说`, `读`, and `写`. Each skill mode has internal submodes: listening has tone and scene listening, speaking has shadowing and roleplay, reading has seven-layer character study and scene reading, and writing has stroke-order handwriting and sentence input. Results continue to be stored in the latest 20 practice results.
## Local persona and context

The app does not require accounts. It stores practice state in the browser:

```text
localStorage["chinese-speaking-coach-state"]
```

The stored JSON contains the generated coach persona, recent conversation turns, and the latest 20 skill practice results. Each practice request sends only the latest turns to the server so the model can answer with context while keeping storage simple and local to the browser.
## Fixed coach persona

The coach is initialized as `Luming`: a Mandarin scenario coach for listening, speaking, reading, and writing practice. The app uses `/coach-avatar.png` as the coach avatar, greets users as Luming on entry, and sends this persona with conversation context on every practice request.

Each reply includes:

- Chinese reply
- Pinyin
- Pinyin with tone marks
- English explanation
- Speaking suggestion

## Legacy scoring API latency policy

The scoring APIs are still present for experiments and compatibility, but the normal frontend no longer calls them. If they are used directly, they follow this latency policy:

- `AI_SCORE_TIMEOUT_MS` controls scoring-model and vision-model calls. The default is `3500`.
- `AI_CHAT_TIMEOUT_MS` controls normal chat/persona calls. The default is `12000`.
- Speaking `audio` mode now returns an immediate acoustic score from the uploaded PCM recording instead of waiting for STT. Speaking `transcript` mode still uses STT and the configured chat model when configured.
- Writing handwriting defaults to `stroke` mode for local stroke-order scoring. `ai` mode still calls the configured vision model, but falls back to the stroke score when the model is unavailable or too slow.

## Practice feedback policy

The frontend no longer shows automatic numeric scores or radar charts. Speaking, handwriting, sentence practice, and scene practice now show completion/self-check feedback only. Reading/listening games may still show immediate correct/incorrect guidance where the answer is explicit, but they do not display a percentage score.

If the configured chat model times out, `/api/practice` falls back to local practice content instead of surfacing raw abort errors to the learner.

Listening opens on `场景辨别` by default. `声调辨别` supports both button choice and voice answer: play the character audio, then choose or say the tone. Voice answers use STT plus Qwen3.6-Flash/chat-model judgment with a local fallback.

Listening scene courses use dialogues of at least 50 Chinese characters. The transcript and pinyin are hidden at first and only appear after the learner clicks `查看文本和拼音`.

Speaking opens on `场景对话` by default, and Reading opens on `场景阅读` by default. `跟读练习` and `七层汉字` stay available as secondary submodes.

Speaking voice responses now include content correctness judgment. Shadowing checks whether the recognized speech matches the target sentence; scene dialogue checks whether the learner completed the current role task and shows a reference response. The dialogue API accepts `text`, `userText`, `transcript`, or `choice`, and combines AI feedback with local task matching so valid spoken replies are not rejected only because they differ from preset buttons.

Reading now includes a seven-layer character lesson: shape story with local real stroke-order data, pinyin spelling such as `j ing 敬`, word matching, idiom background/explanation playback, three example-sentence shadowing prompts, sentence feedback through Qwen3.6-Flash/chat-model feedback without numeric scores, and a shortcut into Speaking scene dialogue. Pinyin playback uses Mandarin-friendly syllable prompts instead of reading Latin letters as English. If local real stroke data is missing, the app shows a static character instead of playing simplified fake strokes. Scene reading has manual `基础 / 高阶` switching; high-level passages use 5-8 sentences and clickable Hanzi that play the character plus its meaning.

Writing handwriting now uses a single `临摹` mode with the target character shown as a trace guide. The handwriting toolbar keeps only useful direct actions: undo and clear.
