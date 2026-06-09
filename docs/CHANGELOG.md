# 变更日志

## 2026-06-06

- 建立项目文档体系，新增 `docs/PROJECT.md` 和 `docs/CHANGELOG.md`。
- 重写 `README.md`，补充功能、技术栈、运行方式、环境变量和文档同步规则。
- 修正页面和服务端示例中的中文乱码，确保界面文案和模拟回复可读。
- 记录 GitHub 管理要求：后续每次完成代码或文档修改后都应提交并推送到 GitHub。
- 新增 `scripts/sync-github.ps1`，用于在本机没有 `git` 命令时通过 GitHub CLI/API 同步项目文件。
- 修正同步脚本的相对路径计算，兼容当前 Windows PowerShell 环境。
- 修正同步脚本的远端 SHA 查询方式，并排除 `.log` 临时日志文件。
- 增加 OpenAI-compatible chat 配置：`CHAT_API_KEY`、`CHAT_BASE_URL`、`CHAT_MODEL`，并以 MiniMax-M3 作为示例模型。
- 通过 `vpn-mihomo` 本地代理完成 Git for Windows 下载，安装本机 Git，并将项目切换为标准 Git 管理流程。
- 更新文档，明确标准 Git 工作流为主，GitHub API 同步脚本仅作为 `git` 不可用时的备用方案。
- Add MiniMax Speech 2.8 server-side TTS support through `TTS_PROVIDER=minimax`, `TTS_BASE_URL=https://api.minimaxi.com/v1`, `TTS_MODEL=speech-2.8-hd`, and `TTS_VOICE=Chinese (Mandarin)_Lyrical_Voice`.
- Move difficulty descriptions into the level selector options, remove the difficulty panel state class, narrow the persona card, and switch TTS to `Chinese (Mandarin)_Warm_Girl`.
- Add Qwen realtime STT support with `qwen3.5-livetranslate-flash-realtime-2026-05-19`, DashScope WebSocket auth, and browser-side 16 kHz PCM recording.
- Add a floating typing indicator while a reply is being generated, auto-play generated Chinese replies, and make beginner/intermediate/advanced response behavior explicit in the model prompt.
- Add visible difficulty descriptions, generated coach personas, and browser-local conversation context stored in `localStorage["chinese-speaking-coach-state"]`.
- Initialize the coach from the supplied fixed persona, add a generated avatar asset, greet users as the persona on entry, show pinyin with tone marks, remove the bottom status bar, render saved conversation history, show all difficulty descriptions while selecting difficulty, and add a left-side persona card.
- Fix API route matching so prefix paths such as `/api/health-check` no longer hit `/api/health`, add request body size limits, and remove the extra trailing blank line in `server.js`.
- Add first-pass speaking and writing practice: `/api/practice` now returns exercise targets, `/api/speaking/evaluate` supports transcript scoring with audio-mode fallback, `/api/writing/evaluate` supports self fallback for AI/OCR mode, and the frontend includes speaking/writing tabs, radar scores, and a handwriting Canvas.
- Change the frontend practice layout to mutually exclusive `聊 / 说 / 写` workspace modes so speaking and writing no longer appear as a persistent panel under the original chat flow.
- Add first-pass reading and listening practice: `/api/practice` now includes reading/listening exercise targets, the frontend adds mutually exclusive `读` and `听` modes, reading uses Hanzi-pinyin matching, and listening uses local tone-choice scoring.
- Show the current Hanzi during listening tone-choice practice so the learner can connect the sound and tone to the written character.
