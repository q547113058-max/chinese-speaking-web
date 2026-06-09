# 中文口语陪练网页 App

一个最小可用的中文口语陪练网页应用。学习者可以用英文输入或录音，应用会生成自然中文回复、拼音、英文解释和口语建议，并支持中文朗读。

## 功能

- 英文文字输入，生成中文陪练回复。
- 浏览器录音上传和语音识别。
- 中文、拼音、英文解释、口语建议展示。
- 中文朗读，优先使用 OpenAI TTS；没有音频 API key 时回退到浏览器朗读。
- 说：从当前回复生成跟读短句，支持转写评分和音频评分降级路径。
- 写：从当前回复生成 1-3 个字词，支持 Canvas 手写、临摹自查和 AI/OCR 降级路径。
- 初级、中级、高级三档难度。
- 语速、拼音、英文解释显示开关。
- 无 `OPENAI_API_KEY` 时使用模拟回复，便于先测试界面和流程。
- 可通过 OpenAI-compatible Chat Completions 接口接入 MiniMax 等模型。

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

- `CHAT_API_KEY`：OpenAI-compatible chat API key，例如 MiniMax key。真实密钥只能放在本地 `.env`、GitHub Secrets 或部署平台环境变量中。
- `CHAT_BASE_URL`：chat completions 接口地址，MiniMax 示例为 `https://api.minimaxi.com/v1`。
- `CHAT_MODEL`：聊天模型，MiniMax 示例为 `MiniMax-M3`。
- `OPENAI_API_KEY`：OpenAI API key。缺省时进入模拟模式；配置后可用于音频能力。
- `OPENAI_CHAT_MODEL`：OpenAI 回复模型，默认 `gpt-4.1-mini`。
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

`TTS_API_KEY` is optional. When it is not set, the server reuses `CHAT_API_KEY`, so the same MiniMax key can drive both MiniMax-M3 chat and MiniMax Speech 2.8 TTS. Speech recognition is still not MiniMax-backed because MiniMax Speech 2.8 is a text-to-speech model, not a speech-to-text model.
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
  "writing": { "items": [{ "text": "字或词", "type": "character", "hint": "提示" }] }
}
```

`POST /api/speaking/evaluate` accepts `multipart/form-data` with `audio`, `targetText`, `targetPinyin`, and `mode`. Dedicated audio scoring is represented by an adapter path; when it is not configured, the server falls back to transcript scoring.

`POST /api/writing/evaluate` accepts `imageData`, `targetText`, and `mode`. AI/OCR checking is represented by an adapter path; when it is not configured, the server returns `self-fallback`.
## Local persona and context

The app does not require accounts. It stores practice state in the browser:

```text
localStorage["chinese-speaking-coach-state"]
```

The stored JSON contains the generated coach persona, recent conversation turns, and the latest 20 speaking/writing practice results. Each practice request sends only the latest turns to the server so the model can answer with context while keeping storage simple and local to the browser.
## Fixed coach persona

The coach is initialized as `苏棠`: a likable, cute Chinese Literature undergraduate student who chats with foreign learners as a warm Mandarin conversation partner. The app uses `/coach-avatar.png` as her avatar, greets users as 苏棠 on entry, and sends this persona with conversation context on every practice request.

Each reply includes:

- Chinese reply
- Pinyin
- Pinyin with tone marks
- English explanation
- Speaking suggestion
