# 变更日志

## 2026-06-06

- 建立项目文档体系，新增 `docs/PROJECT.md` 和 `docs/CHANGELOG.md`。
- 重写 `README.md`，补充功能、技术栈、运行方式、环境变量和文档同步规则。
- 修正页面和服务端示例中的中文乱码，确保界面文案和模拟回复可读。
- 记录 GitHub 管理要求：后续每次完成代码或文档修改后都应提交并推送到 GitHub。
- 新增 `scripts/sync-github.ps1`，用于在本机没有 `git` 命令时通过 GitHub CLI 同步项目文件，并补充 Windows 执行策略下的运行方式。
- 修正同步脚本的相对路径计算，使其兼容当前 Windows PowerShell 环境。
- 修正同步脚本的远端 SHA 查询方式，并排除 `.log` 临时日志文件。

- Add OpenAI-compatible chat configuration with `CHAT_API_KEY`, `CHAT_BASE_URL`, and `CHAT_MODEL`; configure MiniMax-M3 as the example model without committing the real secret.
