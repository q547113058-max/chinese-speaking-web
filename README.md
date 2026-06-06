# 中文口语陪练网页 App

一个最小可用的中文口语陪练网页应用。学习者可以用英文输入或录音，应用会生成自然中文回复、拼音、英文解释和口语建议，并支持中文朗读。

## 功能

- 英文文字输入，生成中文陪练回复
- 浏览器录音上传和语音识别
- 中文、拼音、英文解释、口语建议
- 中文朗读，优先使用 OpenAI TTS，无 API key 时回退到浏览器朗读
- 初级、中级、高级难度
- 语速、拼音、英文解释显示开关
- 无 `OPENAI_API_KEY` 时使用模拟回复，便于先测试界面和流程

## 技术栈

- Node.js 20+
- 原生 HTTP server
- 原生 HTML/CSS/JavaScript
- OpenAI Responses API、Audio Transcriptions API、Text-to-Speech API

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

- `OPENAI_API_KEY`：OpenAI API key。缺省时进入模拟模式。
- `OPENAI_CHAT_MODEL`：中文陪练回复模型，默认 `gpt-4.1-mini`。
- `OPENAI_TRANSCRIBE_MODEL`：语音识别模型，默认 `gpt-4o-mini-transcribe`。
- `OPENAI_TTS_MODEL`：中文朗读模型，默认 `gpt-4o-mini-tts`。
- `OPENAI_TTS_VOICE`：朗读音色，默认 `coral`。
- `PORT`：本地服务端口，默认 `5173`。

## 项目文档

- [项目说明](./docs/PROJECT.md)
- [变更日志](./docs/CHANGELOG.md)

## GitHub 同步

当前项目已配置为同步到私有仓库：

```text
https://github.com/q547113058-max/chinese-speaking-web
```

如果本机没有可用的 `git` 命令，可以使用 GitHub CLI 脚本同步：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\sync-github.ps1 -Message "说明本次修改"
```

## 维护约定

每次修改代码时，必须同步检查并更新相关文档：

- 用户可见功能、运行方式、接口、环境变量变化：更新 `README.md` 和 `docs/PROJECT.md`
- 行为变化、修复、已知限制变化：更新 `docs/CHANGELOG.md`
- 新增 GitHub 管理流程或发布方式：更新本文档的维护约定
