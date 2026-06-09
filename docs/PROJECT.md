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
- Chat 模型：配置 `CHAT_API_KEY` 后，可使用 OpenAI-compatible Chat Completions 接口生成回复，例如 MiniMax-M3。

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
- `POST /api/speaking/evaluate`：接收跟读音频和目标句，返回转写、总分、维度评分和建议；专用音频评分未配置时降级为转写评分。
- `POST /api/writing/evaluate`：接收 Canvas 图片、目标字词和模式，返回书写评分结构；AI/OCR 未配置时降级为自查模式。
- API 路由使用精确路径匹配，避免 `/api/health-check` 这类前缀路径误命中。
- JSON 请求体默认限制为 256 KB，音频上传请求体限制为 8 MB。
- 静态资源：所有 `GET` 静态页面和资源从 `public/` 目录读取。

## 前端结构

入口页面：[public/index.html](../public/index.html)

- [public/app.js](../public/app.js)：负责录音、上传、练习请求、朗读、消息渲染和状态展示。
- 工作区使用“聊 / 读 / 听 / 说 / 写”五种互斥模式：聊显示原对话和输入区；读做汉字-拼音配对；听做声调选择；说、写沿用当前练习功能。技能模式都使用当前苏棠回复派生出的练习目标，并替换工作区内容，不和对话列表共同占屏。
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
