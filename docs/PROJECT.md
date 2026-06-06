# 项目说明

## 项目目标

`chinese-speaking-web` 是一个面向中文学习者的口语陪练网页应用。核心目标是在浏览器里完成“英文表达 -> 中文陪练回复 -> 拼音与解释 -> 中文朗读”的练习闭环。

## 当前能力

- 文字练习：用户输入英文句子，服务端调用 OpenAI 生成中文回复。
- 语音练习：浏览器录音后上传到服务端，服务端调用 OpenAI 语音识别得到英文转写。
- 中文朗读：服务端调用 OpenAI TTS 生成中文音频；没有 API key 或 TTS 失败时，前端使用浏览器 `speechSynthesis` 回退朗读。
- 难度控制：支持 `beginner`、`intermediate`、`advanced` 三档。
- 显示控制：前端可开关拼音和英文解释。
- 本地模拟：没有 `OPENAI_API_KEY` 时，后端返回固定示例，方便调试 UI 和交互流程。

## 目录结构

```text
chinese-speaking-web/
  .env.example
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
- 静态资源：所有 `GET` 静态页面和资源从 `public/` 目录读取。

## 前端结构

入口页面：[public/index.html](../public/index.html)

- [public/app.js](../public/app.js)：负责录音、上传、练习请求、朗读、消息渲染和状态展示。
- [public/styles.css](../public/styles.css)：负责响应式布局、对话气泡、设置区、输入区和按钮状态。

## 开发与文档同步规则

修改代码时必须同步检查文档：

- 修改接口、模型、环境变量、启动方式：更新 `README.md` 和本文件。
- 修改用户可见文案、功能行为或限制：更新本文件和 `docs/CHANGELOG.md`。
- 修复 bug：在 `docs/CHANGELOG.md` 记录修复内容。
- 新增文件或目录：更新本文件的目录结构。

## GitHub 管理规则

项目应托管在 GitHub 仓库中。每次完成一组代码或文档修改后：

1. 检查变更范围。
2. 确认文档已经同步更新。
3. 提交本地变更。
4. 推送到 GitHub。

当前本机环境说明：GitHub CLI 已安装并已登录，但 `git` 命令当前不在 PATH 中。若要使用标准 Git 工作流，需要安装 Git 或修复 PATH。

在 Git 不可用时，可以使用项目脚本同步到 GitHub：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\sync-github.ps1 -Message "说明本次修改"
```

脚本会跳过 `.env`、`.git/`、`node_modules/` 和 `.log` 文件，并通过 GitHub API 创建或更新远端文件。

## MiniMax / OpenAI-compatible chat

Chat replies are generated through an OpenAI-compatible chat completions endpoint when `CHAT_API_KEY` is set.

```env
CHAT_API_KEY=your_minimax_api_key
CHAT_BASE_URL=https://api.minimaxi.com/v1
CHAT_MODEL=MiniMax-M3
```

The real key is stored only in local `.env` or runtime secrets. `.env` is excluded from GitHub sync.

OpenAI audio transcription and TTS remain controlled by `OPENAI_API_KEY`, `OPENAI_TRANSCRIBE_MODEL`, `OPENAI_TTS_MODEL`, and `OPENAI_TTS_VOICE`.
