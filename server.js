import http from "node:http";
import { readFile } from "node:fs/promises";
import { createReadStream, existsSync, readFileSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const publicDir = join(__dirname, "public");

function loadLocalEnv() {
  const envPath = join(__dirname, ".env");
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

loadLocalEnv();

const port = Number(process.env.PORT || 5173);
const chatApiKey = process.env.CHAT_API_KEY || process.env.OPENAI_API_KEY;
const chatBaseUrl = (process.env.CHAT_BASE_URL || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "");
const chatModel = process.env.CHAT_MODEL || process.env.OPENAI_CHAT_MODEL || "gpt-4.1-mini";
const visionApiKey = process.env.VISION_API_KEY || process.env.CHAT_API_KEY || process.env.OPENAI_API_KEY;
const visionBaseUrl = (process.env.VISION_BASE_URL || process.env.CHAT_BASE_URL || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "");
const visionModel = process.env.VISION_MODEL || process.env.OPENAI_VISION_MODEL || process.env.CHAT_MODEL || process.env.OPENAI_CHAT_MODEL || "gpt-4.1-mini";
const ttsProvider = (process.env.TTS_PROVIDER || (process.env.TTS_API_KEY || process.env.CHAT_API_KEY ? "minimax" : "openai")).toLowerCase();
const ttsApiKey = process.env.TTS_API_KEY || process.env.CHAT_API_KEY || process.env.OPENAI_API_KEY;
const minimaxTtsBaseUrl = (process.env.TTS_BASE_URL || "https://api.minimaxi.com/v1").replace(/\/+$/, "");
const minimaxTtsModel = process.env.TTS_MODEL || "speech-2.8-hd";
const minimaxTtsVoice = process.env.TTS_VOICE || "Chinese (Mandarin)_Warm_Girl";
const sttProvider = (process.env.STT_PROVIDER || (process.env.DASHSCOPE_API_KEY ? "qwen" : "openai")).toLowerCase();
const qwenSttApiKey = process.env.DASHSCOPE_API_KEY || process.env.QWEN_API_KEY;
const qwenSttBaseUrl = process.env.STT_WS_URL || "wss://dashscope.aliyuncs.com/api-ws/v1/realtime";
const qwenSttModel = process.env.STT_MODEL || "qwen3.5-livetranslate-flash-realtime-2026-05-19";
const qwenAsrModel = process.env.STT_TRANSCRIPTION_MODEL || "qwen3-asr-flash-realtime";
const sttSourceLanguage = process.env.STT_SOURCE_LANGUAGE || "en";
const sttTargetLanguage = process.env.STT_TARGET_LANGUAGE || "zh";
const jsonBodyLimitBytes = 256 * 1024;
const audioBodyLimitBytes = 8 * 1024 * 1024;
const writingImageLimitBytes = 1024 * 1024;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml"
};

const fixedPersona = {
  name: "Luming",
  role: "\u4e13\u95e8\u5e26\u5916\u56fd\u5b66\u4e60\u8005\u8fdb\u884c\u4e2d\u6587\u542c\u8bf4\u8bfb\u5199\u8bad\u7ec3\u7684 AI \u6559\u7ec3",
  personality: "\u6e29\u548c\u3001\u7cbe\u51c6\u3001\u5584\u4e8e\u628a\u771f\u5b9e\u573a\u666f\u62c6\u6210\u53ef\u7ec3\u4e60\u7684\u5c0f\u4efb\u52a1",
  speakingStyle:
    "\u50cf\u771f\u5b9e\u4e2d\u6587\u8001\u5e08\u4e00\u6837\u7b80\u6d01\u53cd\u9988\uff1b\u5148\u8ba9\u5b66\u4e60\u8005\u5b8c\u6210\u4efb\u52a1\uff0c\u518d\u8bf4\u6700\u91cd\u8981\u7684\u4e00\u4e24\u4e2a\u6539\u8fdb\u70b9\uff1b\u573a\u666f\u5bf9\u8bdd\u8981\u81ea\u7136\u3001\u5b9e\u7528\u3002",
  scenario: "\u56f4\u7ed5\u771f\u5b9e\u4e2d\u6587\u573a\u666f\uff0c\u7ec3\u4e60\u542c\u8bf4\u8bfb\u5199\u56db\u9879\u80fd\u529b"
};

const courseLibrary = [
  {
    id: "business-toast",
    level: "intermediate",
    scene: "\u5317\u4eac\u5546\u52a1\u665a\u5bb4\u56de\u5e94\u795d\u9152",
    summary: "\u5b66\u4f1a\u793c\u8c8c\u56de\u5e94\u795d\u9152\uff0c\u8868\u8fbe\u611f\u8c22\u548c\u5408\u4f5c\u613f\u671b\u3002",
    dialogue: [
      { speaker: "\u5f20\u603b", text: "\u6b22\u8fce\u4f60\u6765\u5317\u4eac\uff0c\u5e0c\u671b\u6211\u4eec\u5408\u4f5c\u987a\u5229\u3002", pinyin: "Hu\u0101ny\u00edng n\u01d0 l\u00e1i B\u011bij\u012bng, x\u012bw\u00e0ng w\u01d2men h\u00e9zu\u00f2 sh\u00f9nl\u00ec." },
      { speaker: "Luming", text: "\u8c22\u8c22\u5f20\u603b\uff0c\u8fd9\u676f\u9152\u6211\u656c\u5927\u5bb6\uff0c\u4e5f\u795d\u6211\u4eec\u5408\u4f5c\u6210\u529f\u3002", pinyin: "Xi\u00e8xie Zh\u0101ng z\u01d2ng, zh\u00e8 b\u0113i ji\u01d4 w\u01d2 j\u00ecng d\u00e0ji\u0101, y\u011b zh\u00f9 w\u01d2men h\u00e9zu\u00f2 ch\u00e9ngg\u014dng." }
    ],
    characters: [
      { text: "\u656c", pinyin: "j\u00ecng", tone: 4, story: "\u656c\u6709\u5c0a\u91cd\u7684\u610f\u601d\uff0c\u5728\u795d\u9152\u91cc\u5e38\u8bf4\u6211\u656c\u4f60\u3002", words: ["\u656c\u9152", "\u5c0a\u656c"], idiom: "\u656c\u800c\u8fdc\u4e4b", strokes: ["top-left", "top-right", "down", "left-fall", "right-fall"] },
      { text: "\u9152", pinyin: "ji\u01d4", tone: 3, story: "\u9152\u5b57\u5de6\u8fb9\u4e09\u70b9\u6c34\uff0c\u53f3\u8fb9\u50cf\u76db\u9152\u7684\u5668\u5177\u3002", words: ["\u7ea2\u9152", "\u656c\u9152"], idiom: "\u9152\u9022\u77e5\u5df1", strokes: ["dot", "dot", "up", "box", "inside"] }
    ],
    listening: {
      questions: [
        { id: "bt-q1", prompt: "\u5f20\u603b\u5e0c\u671b\u4ec0\u4e48\uff1f", options: ["\u5408\u4f5c\u987a\u5229", "\u660e\u5929\u53bb\u8336\u9986", "\u7acb\u523b\u7ed3\u8d26"], answer: 0 },
        { id: "bt-q2", prompt: "Luming \u8bf4\u8fd9\u676f\u9152\u656c\u8c01\uff1f", options: ["\u5927\u5bb6", "\u81ea\u5df1", "\u670d\u52a1\u5458"], answer: 0 },
        { id: "bt-q3", prompt: "\u8fd9\u6bb5\u5bf9\u8bdd\u6700\u50cf\u54ea\u4e2a\u573a\u666f\uff1f", options: ["\u5546\u52a1\u665a\u5bb4", "\u5730\u94c1\u95ee\u8def", "\u6821\u56ed\u62a5\u5230"], answer: 0 }
      ]
    },
    speaking: {
      shadowText: "\u8fd9\u676f\u9152\u6211\u656c\u5927\u5bb6\uff0c\u795d\u6211\u4eec\u5408\u4f5c\u6210\u529f\u3002",
      shadowPinyin: "Zh\u00e8 b\u0113i ji\u01d4 w\u01d2 j\u00ecng d\u00e0ji\u0101, zh\u00f9 w\u01d2men h\u00e9zu\u00f2 ch\u00e9ngg\u014dng.",
      role: "\u4f60\u662f\u5ba2\u4eba\uff0c\u9700\u8981\u793c\u8c8c\u56de\u5e94\u5bf9\u65b9\u7684\u795d\u9152\u3002",
      choices: ["\u8c22\u8c22\uff0c\u6211\u4e5f\u795d\u5927\u5bb6\u987a\u5229\u3002", "\u6211\u5f88\u9ad8\u5174\u6765\u5317\u4eac\u3002", "\u8fd9\u676f\u9152\u6211\u656c\u5927\u5bb6\u3002"]
    },
    reading: {
      passage: "\u665a\u5bb4\u4e0a\uff0c\u5f20\u603b\u5148\u5411\u5ba2\u4eba\u795d\u9152\u3002\u5ba2\u4eba\u7ad9\u8d77\u6765\uff0c\u8bf4\u8c22\u8c22\u5927\u5bb6\u7684\u6b22\u8fce\u3002\u4ed6\u795d\u5408\u4f5c\u6210\u529f\uff0c\u6c14\u6c1b\u5f88\u53cb\u597d\u3002",
      questions: [{ prompt: "\u5ba2\u4eba\u600e\u4e48\u56de\u5e94\uff1f", answer: "\u8868\u8fbe\u611f\u8c22\u5e76\u795d\u5408\u4f5c\u6210\u529f" }]
    },
    writing: { targets: ["\u656c", "\u9152"], sentencePrompt: "\u7528\u656c\u6216\u9152\u5199\u4e00\u53e5\u5546\u52a1\u665a\u5bb4\u91cc\u80fd\u7528\u7684\u8bdd\u3002" }
  },
  {
    id: "tea-house",
    level: "beginner",
    scene: "\u8336\u9986\u70b9\u8336",
    summary: "\u7ec3\u4e60\u70b9\u8336\u3001\u95ee\u53e3\u5473\u548c\u8868\u8fbe\u504f\u597d\u3002",
    dialogue: [
      { speaker: "\u670d\u52a1\u5458", text: "\u60a8\u60f3\u559d\u4ec0\u4e48\u8336\uff1f", pinyin: "N\u00edn xi\u01ceng h\u0113 sh\u00e9nme ch\u00e1?" },
      { speaker: "Luming", text: "\u6211\u60f3\u8981\u4e00\u676f\u9f99\u4e95\uff0c\u4e0d\u8981\u592a\u6d53\u3002", pinyin: "W\u01d2 xi\u01ceng y\u00e0o y\u00ec b\u0113i L\u00f3ngj\u01d0ng, b\u00fa y\u00e0o t\u00e0i n\u00f3ng." }
    ],
    characters: [
      { text: "\u8336", pinyin: "ch\u00e1", tone: 2, story: "\u8336\u5b57\u4e0a\u9762\u662f\u8349\u5b57\u5934\uff0c\u548c\u690d\u7269\u6709\u5173\u3002", words: ["\u8336\u9986", "\u7eff\u8336"], idiom: "\u8336\u4f59\u996d\u540e", strokes: ["top", "middle", "left", "right"] },
      { text: "\u6d53", pinyin: "n\u00f3ng", tone: 2, story: "\u6d53\u5f62\u5bb9\u5473\u9053\u539a\uff0c\u8336\u53ef\u4ee5\u6d53\u4e5f\u53ef\u4ee5\u6de1\u3002", words: ["\u6d53\u8336", "\u5f88\u6d53"], idiom: "\u6d53\u58a8\u91cd\u5f69", strokes: ["water", "cover", "fall"] }
    ],
    listening: { questions: [
      { id: "th-q1", prompt: "Luming \u60f3\u8981\u4ec0\u4e48\uff1f", options: ["\u9f99\u4e95", "\u5496\u5561", "\u725b\u5976"], answer: 0 },
      { id: "th-q2", prompt: "\u4ed6\u5e0c\u671b\u8336\u600e\u4e48\u6837\uff1f", options: ["\u4e0d\u8981\u592a\u6d53", "\u8d8a\u6d53\u8d8a\u597d", "\u4e0d\u8981\u70ed"], answer: 0 },
      { id: "th-q3", prompt: "\u8fd9\u662f\u54ea\u91cc\uff1f", options: ["\u8336\u9986", "\u673a\u573a", "\u533b\u9662"], answer: 0 }
    ] },
    speaking: { shadowText: "\u6211\u60f3\u8981\u4e00\u676f\u9f99\u4e95\uff0c\u4e0d\u8981\u592a\u6d53\u3002", shadowPinyin: "W\u01d2 xi\u01ceng y\u00e0o y\u00ec b\u0113i L\u00f3ngj\u01d0ng, b\u00fa y\u00e0o t\u00e0i n\u00f3ng.", role: "\u4f60\u5728\u8336\u9986\u70b9\u8336\u3002", choices: ["\u6211\u60f3\u8981\u4e00\u676f\u8336\u3002", "\u4e0d\u8981\u592a\u6d53\u3002", "\u53ef\u4ee5\u5c11\u653e\u4e00\u70b9\u5417\uff1f"] },
    reading: { passage: "\u8336\u9986\u91cc\u5f88\u5b89\u9759\u3002Luming \u70b9\u4e86\u4e00\u676f\u9f99\u4e95\uff0c\u8bf7\u670d\u52a1\u5458\u4e0d\u8981\u6ce1\u5f97\u592a\u6d53\u3002", questions: [{ prompt: "Luming \u70b9\u4e86\u4ec0\u4e48\uff1f", answer: "\u9f99\u4e95" }] },
    writing: { targets: ["\u8336", "\u6d53"], sentencePrompt: "\u7528\u8336\u5199\u4e00\u53e5\u70b9\u5355\u65f6\u80fd\u7528\u7684\u8bdd\u3002" }
  },
  {
    id: "order-food",
    level: "beginner",
    scene: "\u9910\u5385\u70b9\u9910",
    summary: "\u7ec3\u4e60\u8bf7\u3001\u8981\u3001\u4e0d\u8981\u548c\u53e3\u5473\u8981\u6c42\u3002",
    dialogue: [
      { speaker: "\u670d\u52a1\u5458", text: "\u60a8\u8981\u70b9\u4ec0\u4e48\uff1f", pinyin: "N\u00edn y\u00e0o di\u01cen sh\u00e9nme?" },
      { speaker: "Luming", text: "\u8bf7\u7ed9\u6211\u4e00\u4efd\u5bab\u4fdd\u9e21\u4e01\uff0c\u5c11\u653e\u8fa3\u3002", pinyin: "Q\u01d0ng g\u011bi w\u01d2 y\u00ed f\u00e8n G\u014dngb\u01ceo j\u012bd\u012bng, sh\u01ceo f\u00e0ng l\u00e0." }
    ],
    characters: [
      { text: "\u8bf7", pinyin: "q\u01d0ng", tone: 3, story: "\u8bf7\u5e38\u7528\u6765\u8868\u793a\u793c\u8c8c\u8bf7\u6c42\u3002", words: ["\u8bf7\u95ee", "\u8bf7\u7ed9\u6211"], idiom: "\u4e0d\u60c5\u4e4b\u8bf7", strokes: ["speech", "green"] },
      { text: "\u8fa3", pinyin: "l\u00e0", tone: 4, story: "\u8fa3\u662f\u4e00\u79cd\u53e3\u5473\uff0c\u70b9\u9910\u65f6\u5f88\u5e38\u7528\u3002", words: ["\u5f88\u8fa3", "\u5c11\u8fa3"], idiom: "\u9178\u751c\u82e6\u8fa3", strokes: ["left", "right", "vertical"] }
    ],
    listening: { questions: [
      { id: "of-q1", prompt: "Luming \u70b9\u4e86\u4ec0\u4e48\uff1f", options: ["\u5bab\u4fdd\u9e21\u4e01", "\u9f99\u4e95", "\u70e4\u9e2d"], answer: 0 },
      { id: "of-q2", prompt: "\u4ed6\u8981\u600e\u4e48\u505a\uff1f", options: ["\u5c11\u653e\u8fa3", "\u591a\u653e\u76d0", "\u4e0d\u8981\u996d"], answer: 0 },
      { id: "of-q3", prompt: "\u8fd9\u662f\u4ec0\u4e48\u573a\u666f\uff1f", options: ["\u70b9\u9910", "\u95ee\u8def", "\u4e70\u7968"], answer: 0 }
    ] },
    speaking: { shadowText: "\u8bf7\u7ed9\u6211\u4e00\u4efd\u5bab\u4fdd\u9e21\u4e01\uff0c\u5c11\u653e\u8fa3\u3002", shadowPinyin: "Q\u01d0ng g\u011bi w\u01d2 y\u00ed f\u00e8n G\u014dngb\u01ceo j\u012bd\u012bng, sh\u01ceo f\u00e0ng l\u00e0.", role: "\u4f60\u5728\u9910\u5385\u70b9\u9910\u3002", choices: ["\u8bf7\u7ed9\u6211\u4e00\u4efd\u996d\u3002", "\u5c11\u653e\u8fa3\u3002", "\u8fd9\u4e2a\u6709\u70b9\u8fa3\u5417\uff1f"] },
    reading: { passage: "\u5728\u9910\u5385\u91cc\uff0c\u5ba2\u4eba\u8bf4\u8bf7\u7ed9\u6211\u4e00\u4efd\u5bab\u4fdd\u9e21\u4e01\u3002\u4ed6\u4e0d\u80fd\u5403\u592a\u8fa3\uff0c\u6240\u4ee5\u8bf7\u670d\u52a1\u5458\u5c11\u653e\u8fa3\u3002", questions: [{ prompt: "\u5ba2\u4eba\u4e3a\u4ec0\u4e48\u8981\u5c11\u653e\u8fa3\uff1f", answer: "\u4e0d\u80fd\u5403\u592a\u8fa3" }] },
    writing: { targets: ["\u8bf7", "\u8fa3"], sentencePrompt: "\u7528\u8bf7\u5199\u4e00\u53e5\u70b9\u9910\u65f6\u7684\u8bdd\u3002" }
  },
  {
    id: "ask-directions",
    level: "beginner",
    scene: "\u5730\u94c1\u7ad9\u95ee\u8def",
    summary: "\u7ec3\u4e60\u95ee\u8def\u3001\u8bf4\u65b9\u5411\u548c\u8868\u8fbe\u8ddd\u79bb\u3002",
    dialogue: [
      { speaker: "\u8def\u4eba", text: "\u4f60\u8981\u53bb\u54ea\u91cc\uff1f", pinyin: "N\u01d0 y\u00e0o q\u00f9 n\u01cel\u01d0?" },
      { speaker: "Luming", text: "\u8bf7\u95ee\u5730\u94c1\u7ad9\u600e\u4e48\u8d70\uff1f", pinyin: "Q\u01d0ngw\u00e8n d\u00ecti\u011b zh\u00e0n z\u011bnme z\u01d2u?" }
    ],
    characters: [
      { text: "\u8def", pinyin: "l\u00f9", tone: 4, story: "\u8def\u548c\u8d70\u8def\u6709\u5173\uff0c\u95ee\u8def\u65f6\u5f88\u5e38\u89c1\u3002", words: ["\u95ee\u8def", "\u8def\u53e3"], idiom: "\u8f7b\u8f66\u719f\u8def", strokes: ["foot", "each"] },
      { text: "\u7ad9", pinyin: "zh\u00e0n", tone: 4, story: "\u7ad9\u53ef\u4ee5\u662f\u505c\u9760\u7684\u5730\u65b9\uff0c\u5982\u5730\u94c1\u7ad9\u3002", words: ["\u8f66\u7ad9", "\u5730\u94c1\u7ad9"], idiom: "\u7ad9\u7a33\u811a\u8ddf", strokes: ["stand", "occupy"] }
    ],
    listening: { questions: [
      { id: "ad-q1", prompt: "Luming \u60f3\u53bb\u54ea\u91cc\uff1f", options: ["\u5730\u94c1\u7ad9", "\u8336\u9986", "\u9910\u5385"], answer: 0 },
      { id: "ad-q2", prompt: "\u4ed6\u7528\u4e86\u54ea\u4e2a\u793c\u8c8c\u8bcd\uff1f", options: ["\u8bf7\u95ee", "\u518d\u89c1", "\u5bf9\u4e0d\u8d77"], answer: 0 },
      { id: "ad-q3", prompt: "\u8fd9\u6bb5\u8bdd\u7684\u4efb\u52a1\u662f\uff1f", options: ["\u95ee\u8def", "\u70b9\u9910", "\u795d\u9152"], answer: 0 }
    ] },
    speaking: { shadowText: "\u8bf7\u95ee\u5730\u94c1\u7ad9\u600e\u4e48\u8d70\uff1f", shadowPinyin: "Q\u01d0ngw\u00e8n d\u00ecti\u011b zh\u00e0n z\u011bnme z\u01d2u?", role: "\u4f60\u5728\u5730\u94c1\u7ad9\u9644\u8fd1\u95ee\u8def\u3002", choices: ["\u8bf7\u95ee\u5730\u94c1\u7ad9\u600e\u4e48\u8d70\uff1f", "\u8fd9\u91cc\u79bb\u5730\u94c1\u8fdc\u5417\uff1f", "\u8c22\u8c22\u4f60\u3002"] },
    reading: { passage: "Luming \u60f3\u53bb\u5730\u94c1\u7ad9\u3002\u4ed6\u5728\u8def\u53e3\u95ee\u4e00\u4f4d\u8def\u4eba\uff1a\u8bf7\u95ee\u5730\u94c1\u7ad9\u600e\u4e48\u8d70\uff1f", questions: [{ prompt: "Luming \u5728\u54ea\u91cc\u95ee\u8def\uff1f", answer: "\u8def\u53e3" }] },
    writing: { targets: ["\u8def", "\u7ad9"], sentencePrompt: "\u7528\u8def\u5199\u4e00\u53e5\u95ee\u8def\u7684\u8bdd\u3002" }
  },
  {
    id: "campus-chat",
    level: "intermediate",
    scene: "\u6821\u56ed\u804a\u5929",
    summary: "\u7ec3\u4e60\u4ecb\u7ecd\u4e13\u4e1a\u3001\u8bfe\u7a0b\u548c\u4eca\u5929\u7684\u5b89\u6392\u3002",
    dialogue: [
      { speaker: "\u540c\u5b66", text: "\u4f60\u4eca\u5929\u6709\u4ec0\u4e48\u8bfe\uff1f", pinyin: "N\u01d0 j\u012bnti\u0101n y\u01d2u sh\u00e9nme k\u00e8?" },
      { speaker: "Luming", text: "\u6211\u4e0a\u5348\u6709\u4e2d\u6587\u8bfe\uff0c\u4e0b\u5348\u53bb\u56fe\u4e66\u9986\u590d\u4e60\u3002", pinyin: "W\u01d2 sh\u00e0ngw\u01d4 y\u01d2u Zh\u014dngw\u00e9n k\u00e8, xi\u00e0w\u01d4 q\u00f9 t\u00fash\u016bgu\u01cen f\u00f9x\u00ed." }
    ],
    characters: [
      { text: "\u8bfe", pinyin: "k\u00e8", tone: 4, story: "\u8bfe\u548c\u5b66\u4e60\u6709\u5173\uff0c\u5b66\u6821\u91cc\u6bcf\u5929\u90fd\u6709\u8bfe\u3002", words: ["\u4e0a\u8bfe", "\u4e2d\u6587\u8bfe"], idiom: "\u8bfe\u4e0d\u5bb9\u7f13", strokes: ["speech", "fruit"] },
      { text: "\u4e60", pinyin: "x\u00ed", tone: 2, story: "\u4e60\u8868\u793a\u7ec3\u4e60\u3001\u590d\u4e60\uff0c\u5b66\u4e60\u9700\u8981\u53cd\u590d\u7ec3\u3002", words: ["\u5b66\u4e60", "\u590d\u4e60"], idiom: "\u4e60\u4ee5\u4e3a\u5e38", strokes: ["hook", "dot"] }
    ],
    listening: { questions: [
      { id: "cc-q1", prompt: "Luming \u4e0a\u5348\u6709\u4ec0\u4e48\u8bfe\uff1f", options: ["\u4e2d\u6587\u8bfe", "\u6570\u5b66\u8bfe", "\u97f3\u4e50\u8bfe"], answer: 0 },
      { id: "cc-q2", prompt: "\u4ed6\u4e0b\u5348\u53bb\u54ea\u91cc\uff1f", options: ["\u56fe\u4e66\u9986", "\u996d\u5e97", "\u673a\u573a"], answer: 0 },
      { id: "cc-q3", prompt: "\u4ed6\u53bb\u56fe\u4e66\u9986\u505a\u4ec0\u4e48\uff1f", options: ["\u590d\u4e60", "\u8df3\u821e", "\u4e70\u8336"], answer: 0 }
    ] },
    speaking: { shadowText: "\u6211\u4e0a\u5348\u6709\u4e2d\u6587\u8bfe\uff0c\u4e0b\u5348\u53bb\u56fe\u4e66\u9986\u590d\u4e60\u3002", shadowPinyin: "W\u01d2 sh\u00e0ngw\u01d4 y\u01d2u Zh\u014dngw\u00e9n k\u00e8, xi\u00e0w\u01d4 q\u00f9 t\u00fash\u016bgu\u01cen f\u00f9x\u00ed.", role: "\u4f60\u5728\u6821\u56ed\u548c\u540c\u5b66\u804a\u4eca\u5929\u7684\u5b89\u6392\u3002", choices: ["\u6211\u4eca\u5929\u6709\u4e2d\u6587\u8bfe\u3002", "\u4e0b\u5348\u6211\u8981\u590d\u4e60\u3002", "\u4f60\u4eca\u5929\u6709\u4ec0\u4e48\u8bfe\uff1f"] },
    reading: { passage: "\u6821\u56ed\u91cc\uff0c\u540c\u5b66\u95ee Luming \u4eca\u5929\u6709\u4ec0\u4e48\u8bfe\u3002Luming \u8bf4\u4ed6\u4e0a\u5348\u6709\u4e2d\u6587\u8bfe\uff0c\u4e0b\u5348\u8981\u53bb\u56fe\u4e66\u9986\u590d\u4e60\u3002", questions: [{ prompt: "Luming \u4e0b\u5348\u505a\u4ec0\u4e48\uff1f", answer: "\u53bb\u56fe\u4e66\u9986\u590d\u4e60" }] },
    writing: { targets: ["\u8bfe", "\u4e60"], sentencePrompt: "\u7528\u8bfe\u6216\u4e60\u5199\u4e00\u53e5\u6821\u56ed\u573a\u666f\u7684\u8bdd\u3002" }
  }
];

function courseSummary(course) {
  return {
    id: course.id,
    level: course.level,
    scene: course.scene,
    summary: course.summary
  };
}

function findCourse(courseId = "") {
  return courseLibrary.find((course) => course.id === courseId) || courseLibrary[0];
}

function courseToExercise(course = courseLibrary[0]) {
  const chars = course.characters || [];
  return {
    course: courseSummary(course),
    reading: {
      items: chars.map((item) => ({ text: item.text, pinyin: item.pinyin })),
      lesson: chars,
      passage: course.reading?.passage || "",
      questions: course.reading?.questions || []
    },
    listening: {
      items: chars.map((item) => ({ text: item.text, pinyin: item.pinyin, tone: item.tone })),
      scene: {
        dialogue: course.dialogue || [],
        questions: course.listening?.questions || []
      }
    },
    speaking: {
      text: course.speaking?.shadowText || course.dialogue?.[0]?.text || "",
      pinyin: course.speaking?.shadowPinyin || "",
      role: course.speaking?.role || "",
      choices: course.speaking?.choices || []
    },
    writing: {
      items: (course.writing?.targets || chars.map((item) => item.text)).slice(0, 3).map((text) => ({
        text,
        type: [...text].length === 1 ? "character" : "word",
        hint: "\u6309\u7b14\u753b\u987a\u5e8f\u5199\uff0c\u6ce8\u610f\u8d77\u7b14\u548c\u6536\u7b14\u65b9\u5411\u3002",
        strokes: chars.find((item) => item.text === text)?.strokes || []
      })),
      sentencePrompt: course.writing?.sentencePrompt || ""
    }
  };
}

function scoreMultipleChoice(answers = {}, questions = []) {
  let correct = 0;
  for (const question of questions) {
    const actual = Number(answers[question.id]);
    if (actual === Number(question.answer)) correct += 1;
  }
  const total = questions.length || 1;
  return { correct, total, score: clampScore((correct / total) * 100) };
}

async function evaluateListening(req) {
  const body = await readJsonBody(req);
  const course = findCourse(body.courseId);
  if (body.mode === "scene") {
    const result = scoreMultipleChoice(body.answers || {}, course.listening?.questions || []);
    return {
      modeRequested: "scene",
      modeUsed: "scene",
      ...result,
      transcript: course.dialogue,
      feedback: [
        result.score >= 80 ? "\u573a\u666f\u7406\u89e3\u5f88\u7a33\uff0c\u53ef\u4ee5\u5c1d\u8bd5\u8ddf\u8bfb\u6574\u6bb5\u5bf9\u8bdd\u3002" : "\u5148\u91cd\u542c\u6587\u672c\u91cc\u7684\u5173\u952e\u53e5\uff0c\u518d\u56de\u7b54\u95ee\u9898\u3002",
        "\u70b9\u51fb\u4efb\u610f\u53e5\u5b50\u53ef\u4ee5\u91cd\u542c\u5e76\u5bf9\u7167\u62fc\u97f3\u3002"
      ]
    };
  }

  const item = (course.characters || []).find((char) => char.text === body.text) || course.characters?.[0];
  const answerTone = Number(body.tone || body.answerTone || 0);
  const correct = item ? answerTone === Number(item.tone) : false;
  return {
    modeRequested: body.mode || "tone",
    modeUsed: body.mode || "tone",
    score: correct ? 100 : 0,
    correct,
    expectedTone: item?.tone || 0,
    feedback: [
      correct ? "\u58f0\u8c03\u5224\u65ad\u6b63\u786e\u3002" : `\u8fd9\u4e2a\u5b57\u662f\u7b2c ${item?.tone || 0} \u58f0\uff0c\u5148\u542c\u9ad8\u4f4e\u53d8\u5316\u3002`,
      "\u518d\u64ad\u653e\u4e00\u6b21\uff0c\u8ddf\u7740 Luming \u8bfb\u51fa\u6765\u3002"
    ]
  };
}

function fallbackReadingScore({ text = "", course, mode = "sentence" }) {
    const hasChinese = /\p{Script=Han}/u.test(text);
    const radar = {
      accuracy: hasChinese ? 70 : 20,
      naturalness: hasChinese ? 68 : 20,
      grammar: hasChinese ? 72 : 25,
      sceneFit: text.includes(course.characters?.[0]?.text || "") ? 82 : 55
    };
    return {
      modeRequested: mode,
      modeUsed: "fallback",
      score: averageScores(radar),
      radar,
      feedback: ["\u53e5\u5b50\u8981\u5305\u542b\u76ee\u6807\u5b57\u8bcd\u3002", "\u5c3d\u91cf\u8ba9\u53e5\u5b50\u548c\u5f53\u524d\u573a\u666f\u6709\u5173\u3002"]
    };
}

async function evaluateReading(req) {
  const body = await readJsonBody(req);
  const text = String(body.text || "");
  const course = findCourse(body.courseId);
  const mode = body.mode || "sentence";
  const prompt = String(body.prompt || course.writing?.sentencePrompt || "");
  if (!chatApiKey) return fallbackReadingScore({ text, course, mode });

  try {
    const response = await fetch(`${chatBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${chatApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: chatModel,
        messages: [
          { role: "system", content: "Score a Mandarin learner sentence. Return strict JSON with score, radar, feedback. radar keys: accuracy, naturalness, grammar, sceneFit, each 0-100. feedback is 2 concise Chinese suggestions." },
          { role: "user", content: `Scene: ${course.scene}\nPrompt: ${prompt}\nLearner sentence: ${text}` }
        ]
      })
    });
    if (!response.ok) throw new Error("reading model failed");
    const data = await response.json();
    const parsed = extractJson(data.choices?.[0]?.message?.content || "");
    const radar = {
      accuracy: clampScore(parsed.radar?.accuracy),
      naturalness: clampScore(parsed.radar?.naturalness),
      grammar: clampScore(parsed.radar?.grammar),
      sceneFit: clampScore(parsed.radar?.sceneFit)
    };
    return {
      modeRequested: body.mode || "sentence",
      modeUsed: "ai",
      score: clampScore(parsed.score || averageScores(radar)),
      radar,
      feedback: Array.isArray(parsed.feedback) ? parsed.feedback.slice(0, 3).map(String) : []
    };
  } catch {
    return fallbackReadingScore({ text, course, mode });
  }
}

async function speakingDialogue(req) {
  const body = await readJsonBody(req);
  const course = findCourse(body.courseId);
  const turns = Array.isArray(body.turns) ? body.turns.slice(-8) : [];
  const userText = String(body.text || body.choice || "");
  if (!chatApiKey) {
    return {
      roleReply: "\u56de\u5e94\u5f88\u81ea\u7136\u3002\u4e0b\u4e00\u53e5\u8bf7\u7ee7\u7eed\u8868\u8fbe\u4f60\u7684\u9700\u6c42\u3002",
      toneFeedback: "\u58f0\u8c03\u53ef\u4ee5\u518d\u653e\u6162\uff0c\u6ce8\u610f\u5173\u952e\u8bcd\u7684\u56db\u58f0\u3002",
      nextTask: "\u7528\u4e00\u53e5\u4e2d\u6587\u7ee7\u7eed\u8fd9\u4e2a\u573a\u666f\u3002",
      round: Math.min(5, turns.length + 1)
    };
  }

  const response = await fetch(`${chatBaseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${chatApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: chatModel,
      messages: [
        { role: "system", content: "You are Luming, a Mandarin scenario coach. Continue a 4-5 round roleplay. Return strict JSON with roleReply, toneFeedback, nextTask. Keep Chinese concise." },
        { role: "user", content: `Scene: ${course.scene}\nLearner role: ${course.speaking?.role}\nHistory: ${JSON.stringify(turns)}\nLearner says: ${userText}` }
      ]
    })
  });
  if (!response.ok) throw new Error("Dialogue model failed.");
  const data = await response.json();
  const parsed = extractJson(data.choices?.[0]?.message?.content || "");
  return {
    roleReply: parsed.roleReply || "\u597d\u7684\uff0c\u6211\u4eec\u7ee7\u7eed\u3002",
    toneFeedback: parsed.toneFeedback || "\u8bf7\u653e\u6162\u8bed\u901f\uff0c\u6ce8\u610f\u58f0\u8c03\u8d77\u4f0f\u3002",
    nextTask: parsed.nextTask || "\u8bf7\u7528\u4e00\u53e5\u4e2d\u6587\u56de\u5e94\u3002",
    round: Math.min(5, turns.length + 1)
  };
}

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

async function readRequestBody(req, maxBytes = jsonBodyLimitBytes) {
  const chunks = [];
  let totalBytes = 0;
  for await (const chunk of req) {
    totalBytes += chunk.length;
    if (totalBytes > maxBytes) throw new Error("Request body too large.");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function readJsonBody(req, maxBytes = jsonBodyLimitBytes) {
  return JSON.parse((await readRequestBody(req, maxBytes)).toString("utf8") || "{}");
}

function parseMultipart(buffer, contentType) {
  const match = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!match) throw new Error("Missing multipart boundary.");
  const boundary = Buffer.from(`--${match[1] || match[2]}`);
  const parts = [];
  let start = buffer.indexOf(boundary);

  while (start !== -1) {
    start += boundary.length;
    if (buffer[start] === 45 && buffer[start + 1] === 45) break;
    if (buffer[start] === 13 && buffer[start + 1] === 10) start += 2;
    const headerEnd = buffer.indexOf(Buffer.from("\r\n\r\n"), start);
    if (headerEnd === -1) break;

    const headersRaw = buffer.slice(start, headerEnd).toString("utf8");
    const nextBoundary = buffer.indexOf(boundary, headerEnd + 4);
    if (nextBoundary === -1) break;
    let bodyEnd = nextBoundary;
    if (buffer[bodyEnd - 2] === 13 && buffer[bodyEnd - 1] === 10) bodyEnd -= 2;

    const disposition = headersRaw.match(/Content-Disposition:[^\n]+/i)?.[0] || "";
    const name = disposition.match(/name="([^"]+)"/)?.[1];
    const filename = disposition.match(/filename="([^"]+)"/)?.[1];
    const type = headersRaw.match(/Content-Type:\s*([^\r\n]+)/i)?.[1]?.trim() || "application/octet-stream";
    parts.push({ name, filename, type, data: buffer.slice(headerEnd + 4, bodyEnd) });
    start = nextBoundary;
  }

  return parts;
}

function fallbackLesson(inputText = "I want to order coffee.", settings = {}) {
  const text = inputText.trim() || "I want to order coffee.";
  const lower = text.toLowerCase();
  let chinese = "\u6211\u4eec\u6162\u6162\u6765\uff0c\u4f60\u5df2\u7ecf\u5f00\u59cb\u8bf4\u4e86\u3002";
  let pinyin = "W\u01d2men m\u00e0n m\u00e0n l\u00e1i, n\u01d0 y\u01d0j\u012bng k\u0101ish\u01d0 shu\u014d le.";
  let explanation = "Let's take it slowly. You have already started speaking.";
  let suggestion = "Try answering with one short English sentence, and I will continue in Chinese.";

  if (lower.includes("coffee")) {
    chinese = "\u54e6\uff0c\u4f60\u60f3\u559d\u5496\u5561\u5440\uff1f\u4f60\u559c\u6b22\u70ed\u7684\u8fd8\u662f\u51b0\u7684\uff1f";
    pinyin = "\u00d3, n\u01d0 xi\u01ceng h\u0113 k\u0101f\u0113i ya? N\u01d0 x\u01d0huan r\u00e8 de h\u00e1ishi b\u012bng de?";
    explanation = "I respond naturally and ask whether you like hot or iced coffee.";
    suggestion = "Practice saying re de and bing de clearly.";
  } else if (lower.includes("hello") || lower.includes("hi")) {
    chinese = "\u4f60\u597d\u5440\uff0c\u5f88\u9ad8\u5174\u89c1\u5230\u4f60\u3002\u4eca\u5929\u60f3\u804a\u4ec0\u4e48\uff1f";
    pinyin = "N\u01d0 h\u01ceo ya, h\u011bn g\u0101ox\u00ecng ji\u00e0n d\u00e0o n\u01d0. J\u012bnti\u0101n xi\u01ceng li\u00e1o sh\u00e9nme?";
    explanation = "I greet you and ask what you want to talk about today.";
    suggestion = "Try replying with a topic, like food, work, or weather.";
  }

  if (settings.level === "advanced") {
    chinese += " \u4f60\u53ef\u4ee5\u591a\u8bf4\u4e00\u70b9\uff0c\u6211\u4f1a\u63a5\u7740\u804a\u3002";
    pinyin += " N\u01d0 k\u011by\u01d0 du\u014d shu\u014d y\u00ec di\u01cen, w\u01d2 hu\u00ec ji\u0113zhe li\u00e1o.";
  }

  return withExercise({
    transcript: text,
    chinese,
    pinyin,
    explanation,
    suggestion
  });
}

function extractJson(text) {
  const cleaned = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("The model did not return JSON.");
    return JSON.parse(match[0]);
  }
}

function clampScore(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(100, Math.round(number)));
}

function averageScores(scores) {
  const values = Object.values(scores).map(clampScore);
  if (values.length === 0) return 0;
  return clampScore(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function normalizeChineseText(text = "") {
  return String(text).replace(/[^\p{Script=Han}a-z0-9]/giu, "").toLowerCase();
}

function textSimilarity(target = "", actual = "") {
  const targetText = normalizeChineseText(target);
  const actualText = normalizeChineseText(actual);
  if (!targetText || !actualText) return 0;
  const targetChars = [...targetText];
  const actualChars = new Set([...actualText]);
  const matched = targetChars.filter((char) => actualChars.has(char)).length;
  return clampScore((matched / targetChars.length) * 100);
}

function estimateSpeakingDurationSeconds(text = "") {
  const hanCount = [...String(text).matchAll(/\p{Script=Han}/gu)].length;
  const latinWordCount = String(text).match(/[a-z0-9]+/gi)?.length || 0;
  const unitCount = Math.max(1, hanCount || latinWordCount);
  return Math.max(0.9, unitCount * 0.42);
}

function readPcm16Samples(audioBuffer) {
  if (!Buffer.isBuffer(audioBuffer) || audioBuffer.length < 2) return [];
  const sampleCount = Math.floor(audioBuffer.length / 2);
  const samples = new Array(sampleCount);
  for (let index = 0; index < sampleCount; index += 1) {
    samples[index] = audioBuffer.readInt16LE(index * 2) / 32768;
  }
  return samples;
}

function analyzePcm16Audio(audioBuffer, targetText = "") {
  const samples = readPcm16Samples(audioBuffer);
  const sampleRate = 16000;
  if (samples.length === 0) {
    return {
      durationSeconds: 0,
      expectedSeconds: estimateSpeakingDurationSeconds(targetText),
      rms: 0,
      peak: 0,
      voicedRatio: 0,
      pauseCount: 0,
      energyVariation: 0,
      valid: false
    };
  }

  let sumSquares = 0;
  let peak = 0;
  for (const sample of samples) {
    const absolute = Math.abs(sample);
    sumSquares += sample * sample;
    if (absolute > peak) peak = absolute;
  }

  const frameSize = Math.floor(sampleRate * 0.05);
  const frameEnergies = [];
  let voicedFrames = 0;
  let pauseCount = 0;
  let previousVoiced = false;
  const speechThreshold = 0.012;

  for (let start = 0; start < samples.length; start += frameSize) {
    const end = Math.min(samples.length, start + frameSize);
    let frameSquares = 0;
    for (let index = start; index < end; index += 1) {
      frameSquares += samples[index] * samples[index];
    }
    const frameRms = Math.sqrt(frameSquares / Math.max(1, end - start));
    const voiced = frameRms >= speechThreshold;
    frameEnergies.push(frameRms);
    if (voiced) voicedFrames += 1;
    if (!voiced && previousVoiced) pauseCount += 1;
    previousVoiced = voiced;
  }

  const meanEnergy = frameEnergies.reduce((sum, value) => sum + value, 0) / Math.max(1, frameEnergies.length);
  const energyVariance = frameEnergies.reduce((sum, value) => sum + ((value - meanEnergy) ** 2), 0) / Math.max(1, frameEnergies.length);
  const energyVariation = Math.sqrt(energyVariance) / Math.max(0.001, meanEnergy);

  return {
    durationSeconds: samples.length / sampleRate,
    expectedSeconds: estimateSpeakingDurationSeconds(targetText),
    rms: Math.sqrt(sumSquares / samples.length),
    peak,
    voicedRatio: voicedFrames / Math.max(1, frameEnergies.length),
    pauseCount,
    energyVariation,
    valid: true
  };
}

function scoreAudioMetrics(metrics, targetText = "", transcript = "") {
  if (!metrics.valid || metrics.rms < 0.004 || metrics.peak < 0.02 || metrics.voicedRatio < 0.08) {
    const radar = {
      accuracy: textSimilarity(targetText, transcript),
      completeness: 10,
      fluency: 10,
      tone: 10,
      rhythm: 10
    };
    return {
      radar,
      feedback: [
        "录音声音太小或有效语音太少，请靠近麦克风再录一次。",
        "先播放示范，跟着同样的速度完整读完目标句。",
        "录音时尽量减少停顿和背景噪音。"
      ]
    };
  }

  const durationRatio = metrics.durationSeconds / Math.max(0.1, metrics.expectedSeconds);
  const durationFit = clampScore(100 - Math.abs(1 - durationRatio) * 85);
  const voicePresence = clampScore(metrics.voicedRatio * 135);
  const loudness = clampScore(100 - Math.abs(metrics.rms - 0.08) * 620);
  const clippingPenalty = metrics.peak > 0.97 ? 18 : 0;
  const pauseScore = clampScore(100 - Math.max(0, metrics.pauseCount - 2) * 14);
  const variationScore = clampScore(100 - Math.abs(metrics.energyVariation - 0.75) * 45);
  const transcriptAccuracy = textSimilarity(targetText, transcript);
  const transcriptCompleteness = transcript
    ? Math.min(100, Math.round((normalizeChineseText(transcript).length / Math.max(1, normalizeChineseText(targetText).length)) * 100))
    : 0;

  const radar = {
    accuracy: transcript ? clampScore((transcriptAccuracy * 0.72) + (durationFit * 0.28)) : clampScore((durationFit * 0.45) + (voicePresence * 0.55)),
    completeness: transcript ? clampScore((transcriptCompleteness * 0.65) + (voicePresence * 0.35)) : clampScore((durationFit * 0.5) + (voicePresence * 0.5)),
    fluency: clampScore((durationFit * 0.35) + (voicePresence * 0.3) + (pauseScore * 0.35)),
    tone: clampScore((variationScore * 0.45) + (loudness * 0.25) + (transcriptAccuracy || durationFit) * 0.3 - clippingPenalty),
    rhythm: clampScore((durationFit * 0.45) + (pauseScore * 0.35) + (variationScore * 0.2))
  };

  const feedback = [
    radar.accuracy >= 78 ? "录音和目标句整体比较接近，可以继续保持。" : "先把目标句分成两小段，确保每个字都读出来。",
    radar.fluency >= 76 ? "语速和停顿比较自然。" : "跟读时可以稍微放慢，减少中间停顿。",
    radar.tone >= 76 ? "声音起伏比较清楚，声调练习方向是对的。" : "注意把声调的高低变化读出来，尤其是三声和轻声。"
  ];

  return { radar, feedback };
}

function fallbackAudioSpeakingScore({ targetText = "", targetPinyin = "", transcript = "", mode = "audio", audioBuffer }) {
  const metrics = analyzePcm16Audio(audioBuffer, targetText);
  const acoustic = scoreAudioMetrics(metrics, targetText, transcript);
  return {
    modeRequested: mode,
    modeUsed: "audio",
    transcript,
    score: averageScores(acoustic.radar),
    radar: acoustic.radar,
    audioMetrics: {
      durationSeconds: Number(metrics.durationSeconds.toFixed(2)),
      expectedSeconds: Number(metrics.expectedSeconds.toFixed(2)),
      voicedRatio: Number(metrics.voicedRatio.toFixed(2)),
      pauseCount: metrics.pauseCount,
      rms: Number(metrics.rms.toFixed(4))
    },
    feedback: acoustic.feedback
  };
}

const toneMarks = {
  "\u0101": 1,
  "\u0113": 1,
  "\u012b": 1,
  "\u014d": 1,
  "\u016b": 1,
  "\u01d6": 1,
  "\u00e1": 2,
  "\u00e9": 2,
  "\u00ed": 2,
  "\u00f3": 2,
  "\u00fa": 2,
  "\u01d8": 2,
  "\u01ce": 3,
  "\u011b": 3,
  "\u01d0": 3,
  "\u01d2": 3,
  "\u01d4": 3,
  "\u01da": 3,
  "\u00e0": 4,
  "\u00e8": 4,
  "\u00ec": 4,
  "\u00f2": 4,
  "\u00f9": 4,
  "\u01dc": 4,
  "\u0100": 1,
  "\u0112": 1,
  "\u012a": 1,
  "\u014c": 1,
  "\u016a": 1,
  "\u01d5": 1,
  "\u00c1": 2,
  "\u00c9": 2,
  "\u00cd": 2,
  "\u00d3": 2,
  "\u00da": 2,
  "\u01d7": 2,
  "\u01cd": 3,
  "\u011a": 3,
  "\u01cf": 3,
  "\u01d1": 3,
  "\u01d3": 3,
  "\u01d9": 3,
  "\u00c0": 4,
  "\u00c8": 4,
  "\u00cc": 4,
  "\u00d2": 4,
  "\u00d9": 4,
  "\u01db": 4
};

function pinyinTone(syllable = "") {
  for (const char of String(syllable)) {
    if (toneMarks[char]) return toneMarks[char];
  }
  const numbered = String(syllable).match(/[1-5]/);
  if (numbered) return Number(numbered[0]);
  return 0;
}

function pinyinSyllables(pinyin = "") {
  return String(pinyin)
    .replace(/[,.?!;:，。！？；：]/g, " ")
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function pinyinForText(text = "", pinyin = "") {
  const pinyinSentence = String(pinyin).split(/[。！？!?.]/).find(Boolean)?.trim();
  if (pinyinSentence) return pinyinSentence;
  const hanCount = [...String(text).matchAll(/\p{Script=Han}/gu)].length;
  if (hanCount === 0) return "";
  return pinyinSyllables(pinyin).slice(0, hanCount).join(" ");
}

function readingListeningItems(text = "", pinyin = "") {
  const chars = [...String(text).matchAll(/\p{Script=Han}/gu)].map((match) => match[0]).slice(0, 4);
  const syllables = pinyinSyllables(pinyin);
  const reading = chars.map((char, index) => ({
    text: char,
    pinyin: syllables[index] || ""
  }));
  const listening = reading
    .map((item) => ({ ...item, tone: pinyinTone(item.pinyin) }))
    .filter((item) => item.tone > 0);
  return { reading, listening };
}

function createExercise(reply = {}) {
  const chinese = String(reply.chinese || "").trim();
  const speakingText = chinese.split(/[。！？!?]/).find(Boolean)?.trim() || chinese || "你好呀，我们开始练习吧";
  const speakingPinyin = pinyinForText(speakingText, reply.pinyin || "");
  const hanSegments = speakingText.match(/\p{Script=Han}{1,2}/gu) || ["你", "好"];
  const seen = new Set();
  const items = [];

  for (const segment of hanSegments) {
    if (seen.has(segment)) continue;
    seen.add(segment);
    items.push({
      text: segment,
      type: [...segment].length === 1 ? "character" : "word",
      hint: [...segment].length === 1 ? "注意字形结构和笔画位置" : "先看整体结构，再慢慢写"
    });
    if (items.length >= 3) break;
  }

  const derived = readingListeningItems(speakingText, speakingPinyin);

  return {
    reading: { items: derived.reading },
    listening: { items: derived.listening },
    speaking: {
      text: speakingText,
      pinyin: speakingPinyin
    },
    writing: { items }
  };
}

function withExercise(reply) {
  const fallback = createExercise(reply);
  const exercise = reply.exercise || fallback;
  const speaking = exercise.speaking || fallback.speaking;
  const speakingText = speaking.text || fallback.speaking.text;
  return {
    ...reply,
    exercise: {
      reading: exercise.reading || fallback.reading,
      listening: exercise.listening || fallback.listening,
      speaking: {
        text: speakingText,
        pinyin: pinyinForText(speakingText, speaking.pinyin || reply.pinyin || "") || fallback.speaking.pinyin
      },
      writing: exercise.writing || fallback.writing
    }
  };
}

function fallbackSpeakingScore({ targetText = "", transcript = "", mode = "transcript" }) {
  const accuracy = textSimilarity(targetText, transcript);
  const completeness = transcript ? Math.min(100, Math.round((normalizeChineseText(transcript).length / Math.max(1, normalizeChineseText(targetText).length)) * 100)) : 0;
  const fluency = transcript ? Math.max(45, Math.min(92, accuracy - 5 + Math.round(normalizeChineseText(transcript).length / 2))) : 20;
  const tone = transcript ? Math.max(40, accuracy - 8) : 20;
  const rhythm = transcript ? Math.max(45, Math.min(90, fluency + 3)) : 20;
  const radar = {
    accuracy,
    completeness: clampScore(completeness),
    fluency: clampScore(fluency),
    tone: clampScore(tone),
    rhythm: clampScore(rhythm)
  };

  return {
    modeRequested: mode,
    modeUsed: mode === "audio" ? "transcript" : "transcript",
    transcript,
    score: averageScores(radar),
    radar,
    feedback: [
      accuracy >= 80 ? "整体跟读很接近目标句。" : "先把目标句分成更短的两段，再逐段跟读。",
      tone >= 75 ? "声调稳定度不错，继续保持。" : "重点放慢声调变化，尤其是第三声和轻声。",
      "再听一遍示范音频后，用同样语速复述一次。"
    ]
  };
}

async function scoreSpeakingWithModel({ targetText, targetPinyin, transcript, mode, audioBuffer }) {
  const fallback = mode === "audio"
    ? () => fallbackAudioSpeakingScore({ targetText, targetPinyin, transcript, mode, audioBuffer })
    : () => fallbackSpeakingScore({ targetText, transcript, mode });

  if (!chatApiKey) return fallback();

  const response = await fetch(`${chatBaseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${chatApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: chatModel,
      messages: [
        {
          role: "system",
          content:
            mode === "audio"
              ? "Score a Mandarin learner's shadowing attempt using the transcript and acoustic measurements. Return strict JSON with keys: score, radar, feedback. radar must contain accuracy, completeness, fluency, tone, rhythm, each 0-100. feedback must be 2-3 concise Chinese suggestions. Be encouraging and practical. Do not claim to perform phoneme-level pronunciation scoring."
              : "Score a Mandarin learner's shadowing attempt using the transcript. Return strict JSON with keys: score, radar, feedback. radar must contain accuracy, completeness, fluency, tone, rhythm, each 0-100. feedback must be 2-3 concise Chinese suggestions. Be encouraging and practical."
        },
        {
          role: "user",
          content: `Target Chinese: ${targetText}\nTarget pinyin: ${targetPinyin || "(none)"}\nLearner transcript: ${transcript || "(empty)"}${
            mode === "audio" && audioBuffer
              ? `\nAcoustic fallback score: ${JSON.stringify(fallbackAudioSpeakingScore({ targetText, targetPinyin, transcript, mode, audioBuffer }).audioMetrics)}`
              : ""
          }`
        }
      ]
    })
  });

  if (!response.ok) return fallback();

  try {
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const parsed = extractJson(content);
    const acoustic = mode === "audio" && audioBuffer ? fallbackAudioSpeakingScore({ targetText, targetPinyin, transcript, mode, audioBuffer }) : null;
    const radar = {
      accuracy: clampScore(parsed.radar?.accuracy),
      completeness: clampScore(parsed.radar?.completeness),
      fluency: clampScore(parsed.radar?.fluency),
      tone: clampScore(parsed.radar?.tone),
      rhythm: clampScore(parsed.radar?.rhythm)
    };
    const hasModelRadar = ["accuracy", "completeness", "fluency", "tone", "rhythm"].some((key) => parsed.radar?.[key] !== undefined);
    if (mode === "audio" && acoustic && !hasModelRadar) return acoustic;
    const finalRadar = mode === "audio" && acoustic
      ? {
          accuracy: clampScore((radar.accuracy * 0.72) + (acoustic.radar.accuracy * 0.28)),
          completeness: clampScore((radar.completeness * 0.72) + (acoustic.radar.completeness * 0.28)),
          fluency: clampScore((radar.fluency * 0.58) + (acoustic.radar.fluency * 0.42)),
          tone: clampScore((radar.tone * 0.58) + (acoustic.radar.tone * 0.42)),
          rhythm: clampScore((radar.rhythm * 0.5) + (acoustic.radar.rhythm * 0.5))
        }
      : radar;
    return {
      modeRequested: mode,
      modeUsed: mode === "audio" ? "audio" : "transcript",
      transcript,
      score: clampScore(mode === "audio" ? averageScores(finalRadar) : (parsed.score || averageScores(finalRadar))),
      radar: finalRadar,
      ...(acoustic ? { audioMetrics: acoustic.audioMetrics } : {}),
      feedback: Array.isArray(parsed.feedback) ? parsed.feedback.slice(0, 3).map(String) : fallback().feedback
    };
  } catch {
    return fallback();
  }
}

async function evaluateSpeaking(req) {
  const body = await readRequestBody(req, audioBodyLimitBytes);
  const parts = parseMultipart(body, req.headers["content-type"] || "");
  const file = parts.find((part) => part.name === "audio");
  const targetText = parts.find((part) => part.name === "targetText")?.data.toString("utf8") || "";
  const targetPinyin = parts.find((part) => part.name === "targetPinyin")?.data.toString("utf8") || "";
  const mode = parts.find((part) => part.name === "mode")?.data.toString("utf8") || "transcript";
  if (!file) throw new Error("No audio file received.");

  let transcript = "";
  try {
    const transcription = await transcribeAudioFromBuffer(file.data, file.type, file.filename);
    transcript = mode === "audio" && transcription.fallback ? "" : (transcription.transcript || "");
  } catch (error) {
    if (mode !== "audio") throw error;
  }
  return scoreSpeakingWithModel({ targetText, targetPinyin, transcript, mode, audioBuffer: file.data });
}

function fallbackWritingScore({ mode = "self", targetText = "", fallbackReason = "" }) {
  const radar = {
    targetMatch: mode === "ai" ? 0 : 75,
    structure: mode === "ai" ? 0 : 75,
    proportion: mode === "ai" ? 0 : 75,
    strokeClarity: mode === "ai" ? 0 : 75,
    neatness: mode === "ai" ? 0 : 75
  };

  return {
    modeRequested: mode,
    modeUsed: mode === "ai" ? "self-fallback" : "self",
    ...(fallbackReason ? { fallbackReason } : {}),
    score: averageScores(radar),
    radar,
    feedback: mode === "ai"
      ? ["AI/OCR 判断服务尚未配置，请先使用临摹自查。", `目标：${targetText || "当前字词"}`]
      : ["看整体结构是否居中。", "对照目标字，检查横竖比例和收笔位置。"]
  };
}

function normalizeWritingImageData(imageData = "") {
  const data = String(imageData || "").trim();
  if (!data) return "";
  if (/^data:image\/(png|jpeg|jpg|webp);base64,[a-z0-9+/=]+$/i.test(data)) return data;
  if (/^[a-z0-9+/=]+$/i.test(data)) return `data:image/png;base64,${data}`;
  return "";
}

function normalizeWritingVisionScore(parsed = {}, fallback) {
  const radar = {
    targetMatch: clampScore(parsed.radar?.targetMatch),
    structure: clampScore(parsed.radar?.structure),
    proportion: clampScore(parsed.radar?.proportion),
    strokeClarity: clampScore(parsed.radar?.strokeClarity),
    neatness: clampScore(parsed.radar?.neatness)
  };
  const hasRadar = ["targetMatch", "structure", "proportion", "strokeClarity", "neatness"].some((key) => parsed.radar?.[key] !== undefined);
  if (!hasRadar) return fallback;
  return {
    modeRequested: "ai",
    modeUsed: "ai",
    score: clampScore(parsed.score || averageScores(radar)),
    radar,
    recognizedText: parsed.recognizedText ? String(parsed.recognizedText).slice(0, 20) : undefined,
    feedback: Array.isArray(parsed.feedback) && parsed.feedback.length > 0
      ? parsed.feedback.slice(0, 3).map(String)
      : fallback.feedback
  };
}

async function scoreWritingWithVision({ imageData = "", targetText = "", mode = "self" }) {
  if (mode !== "ai") return fallbackWritingScore({ mode, targetText });

  const fallback = fallbackWritingScore({ mode, targetText });
  const normalizedImage = normalizeWritingImageData(imageData);
  if (!visionApiKey) return fallbackWritingScore({ mode, targetText, fallbackReason: "vision-not-configured" });
  if (!normalizedImage) return fallbackWritingScore({ mode, targetText, fallbackReason: "invalid-image" });

  try {
    const response = await fetch(`${visionBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${visionApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: visionModel,
        messages: [
          {
            role: "system",
            content:
              "You are a Mandarin handwriting practice evaluator. Inspect the learner's handwritten character or word image against the target Chinese text. Return strict JSON with keys: score, radar, feedback, recognizedText. radar must contain targetMatch, structure, proportion, strokeClarity, neatness, each 0-100. feedback must be 2-3 concise Chinese suggestions. Be practical and do not overclaim certainty when the image is unclear."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Target Chinese text: ${targetText || "(unknown)"}\nEvaluate whether the handwriting matches the target and give actionable practice advice.`
              },
              {
                type: "image_url",
                image_url: { url: normalizedImage }
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) return fallbackWritingScore({ mode, targetText, fallbackReason: "vision-request-failed" });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || data.output_text || data.output?.flatMap((item) => item.content || []).map((item) => item.text || "").join("\n");
    const parsed = extractJson(content || "");
    return normalizeWritingVisionScore(parsed, fallback);
  } catch {
    return fallbackWritingScore({ mode, targetText, fallbackReason: "vision-invalid-response" });
  }
}

function scoreWritingStrokes(strokes = [], targetText = "", courseId = "") {
  const course = findCourse(courseId);
  const charInfo = (course.characters || []).find((item) => item.text === targetText);
  const expectedCount = Math.max(1, charInfo?.strokes?.length || [...targetText].length + 2);
  const actualStrokes = Array.isArray(strokes) ? strokes.filter((stroke) => Array.isArray(stroke) && stroke.length > 1) : [];
  const countFit = clampScore(100 - Math.abs(actualStrokes.length - expectedCount) * 18);
  const lengths = actualStrokes.map((stroke) => {
    let length = 0;
    for (let index = 1; index < stroke.length; index += 1) {
      const previous = stroke[index - 1];
      const current = stroke[index];
      length += Math.hypot(Number(current.x) - Number(previous.x), Number(current.y) - Number(previous.y));
    }
    return length;
  });
  const totalLength = lengths.reduce((sum, value) => sum + value, 0);
  const strokeClarity = clampScore(Math.min(100, totalLength / Math.max(1, expectedCount * 1.7)));
  const directionScore = clampScore(actualStrokes.reduce((sum, stroke) => {
    const first = stroke[0];
    const last = stroke[stroke.length - 1];
    const movement = Math.hypot(Number(last.x) - Number(first.x), Number(last.y) - Number(first.y));
    return sum + (movement > 12 ? 100 : 45);
  }, 0) / Math.max(1, actualStrokes.length));
  const radar = {
    targetMatch: actualStrokes.length ? 72 : 0,
    structure: countFit,
    proportion: clampScore((countFit * 0.55) + (directionScore * 0.45)),
    strokeClarity,
    neatness: clampScore((strokeClarity * 0.55) + (directionScore * 0.45))
  };
  return {
    modeRequested: "stroke",
    modeUsed: "stroke",
    score: averageScores(radar),
    radar,
    expectedStrokeCount: expectedCount,
    actualStrokeCount: actualStrokes.length,
    feedback: [
      actualStrokes.length === expectedCount ? "\u7b14\u753b\u6570\u91cf\u63a5\u8fd1\u76ee\u6807\u5b57\u3002" : `\u76ee\u6807\u5927\u7ea6 ${expectedCount} \u7b14\uff0c\u4f60\u5199\u4e86 ${actualStrokes.length} \u7b14\u3002`,
      directionScore >= 75 ? "\u5927\u90e8\u5206\u7b14\u753b\u65b9\u5411\u6bd4\u8f83\u6e05\u695a\u3002" : "\u6ce8\u610f\u6bcf\u4e00\u7b14\u7684\u8d77\u7b14\u548c\u6536\u7b14\u65b9\u5411\u3002"
    ]
  };
}

async function evaluateWriting(req) {
  const body = await readJsonBody(req, writingImageLimitBytes);
  const mode = body.mode || "self";
  const imageData = String(body.imageData || "");
  if (imageData.length > writingImageLimitBytes) throw new Error("Writing image too large.");
  const strokeScore = scoreWritingStrokes(body.strokes || [], body.targetText || "", body.courseId || "");
  const visionScore = await scoreWritingWithVision({ imageData, targetText: body.targetText || "", mode });
  if (mode !== "ai" && mode !== "stroke") return visionScore;
  if (mode === "stroke") return strokeScore;
  if (visionScore.modeUsed !== "ai") return { ...strokeScore, modeRequested: "ai", modeUsed: "stroke-fallback", fallbackReason: visionScore.fallbackReason };
  const radar = {
    targetMatch: clampScore((visionScore.radar.targetMatch * 0.68) + (strokeScore.radar.targetMatch * 0.32)),
    structure: clampScore((visionScore.radar.structure * 0.58) + (strokeScore.radar.structure * 0.42)),
    proportion: clampScore((visionScore.radar.proportion * 0.58) + (strokeScore.radar.proportion * 0.42)),
    strokeClarity: clampScore((visionScore.radar.strokeClarity * 0.5) + (strokeScore.radar.strokeClarity * 0.5)),
    neatness: clampScore((visionScore.radar.neatness * 0.58) + (strokeScore.radar.neatness * 0.42))
  };
  return {
    ...visionScore,
    modeUsed: "ai+stroke",
    score: averageScores(radar),
    radar,
    strokeMetrics: {
      expectedStrokeCount: strokeScore.expectedStrokeCount,
      actualStrokeCount: strokeScore.actualStrokeCount
    },
    feedback: [...(visionScore.feedback || []).slice(0, 2), ...(strokeScore.feedback || []).slice(0, 1)]
  };
}

function levelGuide(level = "beginner") {
  if (level === "advanced") {
    return "Advanced: use natural adult Mandarin, richer vocabulary, optional idiomatic phrasing, and ask more open-ended follow-up questions. Keep it conversational, not textbook-like.";
  }

  if (level === "intermediate") {
    return "Intermediate: use common everyday Mandarin with a little variety in grammar, short compound sentences, and one natural follow-up question.";
  }

  return "Beginner: use very simple spoken Mandarin, short sentences, high-frequency words, and avoid idioms or complex grammar.";
}

function fallbackPersona(settings = {}) {
  const level = settings.level || "beginner";
  return {
    name: level === "advanced" ? "林安" : level === "intermediate" ? "小周" : "小雨",
    role: "A patient Mandarin conversation partner",
    personality: "Warm, curious, and concise",
    speakingStyle: levelGuide(level),
    scenario: "Everyday casual conversation"
  };
}

async function generatePersona(settings = {}) {
  if (!chatApiKey) return fallbackPersona(settings);

  const response = await fetch(`${chatBaseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${chatApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: chatModel,
      messages: [
        {
          role: "system",
          content:
            "Create one suitable persona for Luming, a Mandarin listening, speaking, reading, and writing scenario coach. Return strict JSON with keys: name, role, personality, speakingStyle, scenario. Keep values concise."
        },
        {
          role: "user",
          content: `Learner level: ${settings.level || "beginner"}. ${levelGuide(settings.level)}`
        }
      ]
    })
  });

  if (!response.ok) return fallbackPersona(settings);

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";
  try {
    const parsed = extractJson(content);
    return {
      name: parsed.name || "小雨",
      role: parsed.role || "A Mandarin conversation partner",
      personality: parsed.personality || "Warm and patient",
      speakingStyle: parsed.speakingStyle || levelGuide(settings.level),
      scenario: parsed.scenario || "Everyday conversation"
    };
  } catch {
    return fallbackPersona(settings);
  }
}

function summarizeContext(context = {}) {
  const persona = context.persona;
  const personaText = persona
    ? `Persona: name=${persona.name}; role=${persona.role}; personality=${persona.personality}; speakingStyle=${persona.speakingStyle}; scenario=${persona.scenario}.`
    : "Persona: friendly Mandarin conversation partner.";
  const turns = Array.isArray(context.turns) ? context.turns.slice(-8) : [];
  const history = turns
    .map((turn) => {
      if (turn.role === "assistant") return `Assistant Chinese: ${turn.chinese || turn.text || ""}`;
      return `Learner English: ${turn.text || ""}`;
    })
    .filter(Boolean)
    .join("\n");

  return `${personaText}\nRecent conversation:\n${history || "(none yet)"}`;
}

async function generatePracticeReply(text, settings, context = {}) {
  if (!chatApiKey) return fallbackLesson(text, settings);

  const response = await fetch(`${chatBaseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${chatApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: chatModel,
      messages: [
        {
          role: "system",
          content:
            "You are Luming, a Mandarin listening, speaking, reading, and writing scenario coach. The learner may speak English, but you should guide them toward useful Chinese for real scenarios. Respond naturally in one or two short spoken Mandarin sentences, not as a direct translation. Also provide pinyin with tone marks such as ni3 -> nǐ and hao3 -> hǎo, a concise English explanation, and one short practice suggestion. Return strict JSON with keys: chinese, pinyin, explanation, suggestion."
        },
        {
          role: "user",
          content: `Learner level: ${settings.level || "beginner"}. ${levelGuide(settings.level)}
${summarizeContext(context)}
Learner just said: ${text}`
        }
      ]
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Chat model response failed: ${error}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || data.output_text || data.output?.flatMap((item) => item.content || []).map((item) => item.text || "").join("\n");
  const parsed = extractJson(content || "");
  return withExercise({
    transcript: text,
    chinese: parsed.chinese || "",
    pinyin: parsed.pinyin || "",
    explanation: parsed.explanation || "",
    suggestion: parsed.suggestion || "",
    exercise: parsed.exercise
  });
}

async function transcribeAudio(req) {
  const body = await readRequestBody(req, audioBodyLimitBytes);
  const parts = parseMultipart(body, req.headers["content-type"] || "");
  const file = parts.find((part) => part.name === "audio");
  if (!file) throw new Error("No audio file received.");

  return transcribeAudioFromBuffer(file.data, file.type, file.filename);
}

async function transcribeAudioFromBuffer(audioBuffer, type = "application/octet-stream", filename = "speech.pcm") {
  if (sttProvider === "qwen") {
    if (!qwenSttApiKey) return { transcript: "I want to order coffee.", fallback: true };
    return { transcript: await transcribeQwenAudio(audioBuffer) };
  }

  if (!process.env.OPENAI_API_KEY) {
    return { transcript: "I want to order coffee.", fallback: true };
  }

  const formData = new FormData();
  formData.append("model", process.env.OPENAI_TRANSCRIBE_MODEL || "gpt-4o-mini-transcribe");
  formData.append("file", new Blob([audioBuffer], { type }), filename || "speech.webm");

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: formData
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Transcription failed: ${error}`);
  }

  const data = await response.json();
  return { transcript: data.text || "" };
}

function sendWsJson(ws, payload) {
  ws.send(JSON.stringify({
    event_id: `event_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    ...payload
  }));
}

function readTranscriptFromEvent(event) {
  return event.transcript || event.text || event.delta || event.content || event.item?.transcript || event.item?.content?.[0]?.transcript || "";
}

function transcribeQwenAudio(audioBuffer) {
  return new Promise((resolve, reject) => {
    const url = `${qwenSttBaseUrl}?model=${encodeURIComponent(qwenSttModel)}`;
    const ws = new WebSocket(url, {
      headers: {
        Authorization: `Bearer ${qwenSttApiKey}`
      }
    });
    let finalTranscript = "";
    let streamingTranscript = "";
    let settled = false;
    const timeout = setTimeout(() => finish(new Error("Qwen STT timed out.")), 30000);

    function finish(error, transcript = "") {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      try {
        ws.close();
      } catch {
        // Ignore close errors after a completed request.
      }
      if (error) reject(error);
      else resolve(transcript.trim());
    }

    async function sendAudio() {
      sendWsJson(ws, {
        type: "session.update",
        session: {
          modalities: ["text"],
          input_audio_format: "pcm16",
          sample_rate: 16000,
          input_audio_transcription: {
            model: qwenAsrModel,
            language: sttSourceLanguage
          },
          translation: {
            language: sttTargetLanguage
          },
          turn_detection: null
        }
      });

      await new Promise((resolveDelay) => setTimeout(resolveDelay, 250));

      for (let offset = 0; offset < audioBuffer.length; offset += 3200) {
        const chunk = audioBuffer.subarray(offset, Math.min(offset + 3200, audioBuffer.length));
        sendWsJson(ws, {
          type: "input_audio_buffer.append",
          audio: chunk.toString("base64")
        });
        await new Promise((resolveDelay) => setTimeout(resolveDelay, 10));
      }

      sendWsJson(ws, { type: "session.finish" });
    }

    ws.addEventListener("open", () => {
      sendAudio().catch((error) => finish(error));
    });

    ws.addEventListener("message", (message) => {
      let event;
      try {
        event = JSON.parse(String(message.data));
      } catch {
        return;
      }

      if (event.type === "error") {
        finish(new Error(event.error?.message || event.message || "Qwen STT failed."));
        return;
      }

      if (event.type === "conversation.item.input_audio_transcription.text") {
        streamingTranscript += readTranscriptFromEvent(event);
      }

      if (event.type === "conversation.item.input_audio_transcription.completed") {
        finalTranscript = readTranscriptFromEvent(event) || streamingTranscript;
      }

      if (event.type === "response.text.done" && !finalTranscript) {
        finalTranscript = readTranscriptFromEvent(event);
      }

      if (event.type === "response.done" && (finalTranscript || streamingTranscript)) {
        finish(null, finalTranscript || streamingTranscript);
      }

      if (event.type === "session.finished") {
        finish(null, finalTranscript || streamingTranscript);
      }
    });

    ws.addEventListener("error", () => {
      finish(new Error("Qwen STT WebSocket connection failed."));
    });

    ws.addEventListener("close", () => {
      if (!settled && (finalTranscript || streamingTranscript)) {
        finish(null, finalTranscript || streamingTranscript);
      } else if (!settled) {
        finish(new Error("Qwen STT closed before returning a transcript."));
      }
    });
  });
}

function normalizeSpeechSpeed(speed) {
  const value = Number(speed || 1);
  if (!Number.isFinite(value)) return 1;
  return Math.min(2, Math.max(0.5, value));
}

async function synthesizeMinimaxSpeech(text, speed) {
  if (!ttsApiKey) return null;

  const response = await fetch(`${minimaxTtsBaseUrl}/t2a_v2`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ttsApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: minimaxTtsModel,
      text,
      stream: false,
      voice_setting: {
        voice_id: minimaxTtsVoice,
        speed: normalizeSpeechSpeed(speed),
        vol: 1,
        pitch: 0
      },
      audio_setting: {
        sample_rate: 32000,
        bitrate: 128000,
        format: "mp3",
        channel: 1
      }
    })
  });

  const body = await response.text();
  if (!response.ok) throw new Error(`MiniMax TTS failed: ${body}`);

  const data = JSON.parse(body);
  const audioHex = data.data?.audio;
  if (!audioHex) {
    const message = data.base_resp?.status_msg || "MiniMax TTS returned no audio.";
    throw new Error(message);
  }

  return Buffer.from(audioHex, "hex");
}

async function synthesizeOpenAISpeech(text, speed) {
  if (!process.env.OPENAI_API_KEY) return null;

  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts",
      voice: process.env.OPENAI_TTS_VOICE || "coral",
      input: text,
      speed: normalizeSpeechSpeed(speed)
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`TTS failed: ${error}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function synthesizeSpeech(text, speed) {
  if (ttsProvider === "minimax") return synthesizeMinimaxSpeech(text, speed);
  return synthesizeOpenAISpeech(text, speed);
}

async function serveStatic(req, res) {
  const requested = req.url === "/" ? "/index.html" : decodeURIComponent(req.url.split("?")[0]);
  const safePath = normalize(requested).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(publicDir, safePath);

  if (!filePath.startsWith(publicDir) || !existsSync(filePath)) {
    sendJson(res, 404, { error: "Not found" });
    return;
  }

  res.writeHead(200, { "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream" });
  createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  try {
    const { pathname } = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

    if (req.method === "GET" && pathname === "/api/health") {
      sendJson(res, 200, { ok: true, aiEnabled: Boolean(chatApiKey) });
      return;
    }

    if (req.method === "GET" && pathname === "/api/courses") {
      sendJson(res, 200, { courses: courseLibrary.map(courseSummary) });
      return;
    }

    const courseMatch = pathname.match(/^\/api\/courses\/([^/]+)$/);
    if (req.method === "GET" && courseMatch) {
      const course = findCourse(decodeURIComponent(courseMatch[1]));
      sendJson(res, 200, { ...course, exercise: courseToExercise(course) });
      return;
    }

    if (req.method === "POST" && pathname === "/api/transcribe") {
      sendJson(res, 200, await transcribeAudio(req));
      return;
    }

    if (req.method === "POST" && pathname === "/api/practice") {
      const body = await readJsonBody(req);
      sendJson(res, 200, await generatePracticeReply(body.text || "", body.settings || {}, body.context || {}));
      return;
    }

    if (req.method === "POST" && pathname === "/api/persona") {
      const body = await readJsonBody(req);
      sendJson(res, 200, fallbackPersona(body.settings || {}));
      return;
    }

    if (req.method === "POST" && pathname === "/api/tts") {
      const body = await readJsonBody(req);
      const audio = await synthesizeSpeech(body.text || "", body.speed);
      if (!audio) {
        sendJson(res, 200, { fallback: true });
        return;
      }
      res.writeHead(200, { "Content-Type": "audio/mpeg" });
      res.end(audio);
      return;
    }

    if (req.method === "POST" && pathname === "/api/speaking/evaluate") {
      sendJson(res, 200, await evaluateSpeaking(req));
      return;
    }

    if (req.method === "POST" && pathname === "/api/listening/evaluate") {
      sendJson(res, 200, await evaluateListening(req));
      return;
    }

    if (req.method === "POST" && pathname === "/api/speaking/dialogue") {
      sendJson(res, 200, await speakingDialogue(req));
      return;
    }

    if (req.method === "POST" && pathname === "/api/reading/evaluate") {
      sendJson(res, 200, await evaluateReading(req));
      return;
    }

    if (req.method === "POST" && pathname === "/api/writing/evaluate") {
      sendJson(res, 200, await evaluateWriting(req));
      return;
    }

    if (req.method === "GET") {
      await serveStatic(req, res);
      return;
    }

    sendJson(res, 405, { error: "Method not allowed" });
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Server error" });
  }
});

server.listen(port, () => {
  console.log(`Chinese speaking coach running at http://localhost:${port}`);
  console.log(chatApiKey ? `AI mode enabled with ${chatModel}.` : "No CHAT_API_KEY or OPENAI_API_KEY found. Using mock practice replies.");
});
