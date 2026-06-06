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

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml"
};

const fixedPersona = {
  name: "\u82cf\u68e0",
  role: "\u4e2d\u6587\u7cfb\u672c\u79d1\u751f\uff0c\u4e13\u95e8\u966a\u5916\u56fd\u5b66\u4e60\u8005\u7ec3\u4e2d\u6587\u7684\u5bf9\u8bdd\u4f19\u4f34",
  personality: "\u8ba8\u559c\u53ef\u7231\u3001\u6e29\u67d4\u8010\u5fc3\u3001\u771f\u8bda\u597d\u5947\uff0c\u6709\u4e00\u70b9\u4e66\u5377\u6c14\uff0c\u4f1a\u81ea\u7136\u9f13\u52b1\u5bf9\u65b9\u7ee7\u7eed\u8bf4",
  speakingStyle:
    "\u50cf\u771f\u5b9e\u4e2d\u6587\u7cfb\u5973\u751f\u804a\u5929\u4e00\u6837\u63a5\u8bdd\uff1b\u4e0d\u7ffb\u8bd1\u7528\u6237\u7684\u8bdd\uff1b\u7528\u81ea\u7136\u53e3\u8bed\u56de\u5e94\u542b\u4e49\uff1b\u5076\u5c14\u5e26\u4e00\u70b9\u4e2d\u6587\u6587\u5b66\u548c\u751f\u6d3b\u5316\u4f8b\u5b50\uff1b\u7ea0\u9519\u8981\u8f7b\u67d4\uff0c\u4e0d\u6253\u65ad\u5bf9\u8bdd\u3002",
  scenario: "\u9762\u5411\u60f3\u5b66\u4e2d\u6587\u7684\u5916\u56fd\u4eba\uff0c\u8fdb\u884c\u8f7b\u677e\u3001\u53ef\u6301\u7eed\u7684\u4e2d\u6587\u53e3\u8bed\u966a\u7ec3"
};

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

async function readRequestBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
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

  return {
    transcript: text,
    chinese,
    pinyin,
    explanation,
    suggestion
  };
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
    name: level === "advanced" ? "鏋楀畨" : level === "intermediate" ? "灏忓懆" : "灏忛洦",
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
            "Create one suitable persona for a Mandarin speaking practice partner. The learner speaks English and wants conversational Chinese practice. Return strict JSON with keys: name, role, personality, speakingStyle, scenario. Keep values concise."
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
      name: parsed.name || "灏忛洦",
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
            "You are Su Tang, a likable and cute Chinese Literature undergraduate student. You are a Mandarin conversation partner for foreigners who want to learn Chinese. Always stay in this persona: warm, patient, bookish, sincere, gently playful, and naturally encouraging. The learner may speak English, but you should reply as another person in a natural conversation, not as a translator. Do not translate the learner's sentence. Respond to the meaning, ask a natural follow-up question when useful, and keep the Chinese reply to one or two short spoken Mandarin sentences. Also provide pinyin with tone marks such as ni3 -> nǐ and hao3 -> hǎo, a concise English explanation of your reply, and one short speaking suggestion. Return strict JSON with keys: chinese, pinyin, explanation, suggestion."
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
  return {
    transcript: text,
    chinese: parsed.chinese || "",
    pinyin: parsed.pinyin || "",
    explanation: parsed.explanation || "",
    suggestion: parsed.suggestion || ""
  };
}

async function transcribeAudio(req) {
  const body = await readRequestBody(req);
  const parts = parseMultipart(body, req.headers["content-type"] || "");
  const file = parts.find((part) => part.name === "audio");
  if (!file) throw new Error("No audio file received.");

  if (sttProvider === "qwen") {
    if (!qwenSttApiKey) return { transcript: "I want to order coffee." };
    return { transcript: await transcribeQwenAudio(file.data) };
  }

  if (!process.env.OPENAI_API_KEY) {
    return { transcript: "I want to order coffee." };
  }

  const formData = new FormData();
  formData.append("model", process.env.OPENAI_TRANSCRIBE_MODEL || "gpt-4o-mini-transcribe");
  formData.append("file", new Blob([file.data], { type: file.type }), file.filename || "speech.webm");

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
    if (req.method === "GET" && req.url?.startsWith("/api/health")) {
      sendJson(res, 200, { ok: true, aiEnabled: Boolean(chatApiKey) });
      return;
    }

    if (req.method === "POST" && req.url?.startsWith("/api/transcribe")) {
      sendJson(res, 200, await transcribeAudio(req));
      return;
    }

    if (req.method === "POST" && req.url?.startsWith("/api/practice")) {
      const body = JSON.parse((await readRequestBody(req)).toString("utf8") || "{}");
      sendJson(res, 200, await generatePracticeReply(body.text || "", body.settings || {}, body.context || {}));
      return;
    }

    if (req.method === "POST" && req.url?.startsWith("/api/persona")) {
      const body = JSON.parse((await readRequestBody(req)).toString("utf8") || "{}");
      sendJson(res, 200, fallbackPersona(body.settings || {}));
      return;
    }

    if (req.method === "POST" && req.url?.startsWith("/api/tts")) {
      const body = JSON.parse((await readRequestBody(req)).toString("utf8") || "{}");
      const audio = await synthesizeSpeech(body.text || "", body.speed);
      if (!audio) {
        sendJson(res, 200, { fallback: true });
        return;
      }
      res.writeHead(200, { "Content-Type": "audio/mpeg" });
      res.end(audio);
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


