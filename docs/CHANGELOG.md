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
- Fix speaking practice target pinyin so it is cropped to the same sentence as the displayed Chinese shadowing text.
- Add first-pass real audio scoring for speaking practice: audio mode now analyzes the uploaded PCM recording for duration, voiced speech ratio, pauses, loudness, and rhythm, while transcript mode remains text-based.
- Add AI vision scoring for handwriting practice: `mode=ai` on `/api/writing/evaluate` can call a configured OpenAI-compatible vision model and returns handwriting radar scores, recognized text, and feedback, with `self-fallback` preserved when vision is unavailable.
- Expand the app into a Luming scenario skill system: add built-in courses, `GET /api/courses`, listening scene questions, speaking roleplay, reading sentence scoring, writing stroke scoring, and second-level modes for listening/speaking/reading/writing.

## 2026-06-10

- On 2026-06-11, checked model response speed across chat, reading, speaking, listening, writing, TTS, and STT. Added a fast local parse for listening tone voice answers so clear transcripts such as `四声` return immediately and only ambiguous answers call the chat model.
- Speed up skill scoring by adding `AI_SCORE_TIMEOUT_MS` for scoring/vision calls and `AI_CHAT_TIMEOUT_MS` for normal chat calls.
- Make speaking `audio` mode return immediate local acoustic scoring instead of waiting for STT before scoring.
- Make Writing default to local stroke-order scoring; AI handwriting mode still runs vision scoring and falls back to `stroke-fallback` within the scoring timeout.
- Add timeout fallback for speaking roleplay so slow model responses do not block the practice flow.
- Fix `scripts/sync-github.ps1` so new files that return GitHub Contents API 404 are created instead of stopping the sync.
- Remove learner-facing automatic numeric scoring and radar charts from the frontend. Speaking, handwriting, sentence, and scene practice now show completion/self-check feedback and no longer call scoring APIs in normal use.
- Simplify Writing handwriting modes to `临摹` and `自由书写`; remove the confusing `AI 参考` mode from the frontend.
- Remove the Writing `完成检查` button because, without automatic scoring, it did not perform a useful user-facing action.
- Remove Writing `保存` and `自由书写`; handwriting now stays in trace-copy mode with only undo and clear actions.
- Migrate old local conversation state by filtering the previous Su Tang greeting, keeping the UI consistently branded as Luming.
- Make Listening default to `场景辨别`; `声调辨别` now supports both button choice and voice answer, with STT plus Qwen3.6-Flash/chat-model feedback and local fallback.
- Make Speaking default to `场景对话` and Reading default to `场景阅读`, keeping shadowing and seven-layer character study as secondary submodes.
- Expand built-in listening scene dialogues to at least 50 Chinese characters and hide transcripts/pinyin until `查看文本和拼音` is clicked.
- Expand Reading into the seven-layer lesson flow with stroke animation, pinyin spelling playback, idiom story playback, three example-sentence follow-read prompts, Qwen3.6-Flash/chat-model sentence feedback without numeric scores, and manual basic/advanced scene reading.
- Switch the recommended chat model example from MiniMax-M3 to DashScope/Qwen3.6-Flash while keeping MiniMax as the TTS provider.
- Add content correctness judgment to Speaking voice responses: shadowing checks the recognized reply against the target sentence, and scene dialogue checks whether the spoken response completes the role task.
- Fix Speaking scene-dialogue correctness so free-form voice replies can be judged against the role task and shadow target, not only against preset button text; `/api/speaking/dialogue` now also accepts `userText` and `transcript`.
- Replace the simplified Reading shape-layer stroke sketch with local real stroke-order data for the current course characters; missing data now falls back to a static character instead of fake stroke animation.
- Fix Reading pinyin playback so `播放拼读` uses Mandarin syllable prompts instead of Latin-letter text, and make idiom playback include both background story and explanation.
- Fix chat timeout handling so aborted chat-model requests return local fallback practice instead of showing raw `This operation was aborted` errors.
- Increase the default chat timeout to 30 seconds so Qwen3.6-Flash has enough time to answer structured coaching prompts before fallback is used.
- Add a realtime chat fast path for Qwen/DashScope: compact prompt, lower output budget, JSON response format, and `enable_thinking=false`, reducing `/api/practice` latency to about one second in smoke tests.
