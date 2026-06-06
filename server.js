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
const minimaxTtsVoice = process.env.TTS_VOICE || "Chinese (Mandarin)_Lyrical_Voice";
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
  ".svg": "image/svg+xml"
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
  let chinese = "我想练习中文。";
  let pinyin = "Wo xiang lianxi Zhongwen.";
  let explanation = "This means: I want to practice Chinese.";
  let suggestion = "Try repeating the Chinese sentence slowly, then say it once at normal speed.";

  if (lower.includes("coffee")) {
    chinese = "我想点一杯咖啡。";
    pinyin = "Wo xiang dian yi bei kafei.";
    explanation = "Use this when you want to order a cup of coffee.";
    suggestion = "In Chinese, '点' is commonly used when ordering food or drinks.";
  } else if (lower.includes("hello") || lower.includes("hi")) {
    chinese = "你好，很高兴认识你。";
    pinyin = "Ni hao, hen gaoxing renshi ni.";
    explanation = "This is a friendly way to say hello and nice to meet you.";
    suggestion = "Say '你好' with a clear falling-rising tone on '你'.";
  } else if (lower.includes("where") || lower.includes("direction")) {
    chinese = "请问，地铁站在哪里？";
    pinyin = "Qingwen, ditiezhan zai nali?";
    explanation = "This asks: Excuse me, where is the subway station?";
    suggestion = "'请问' makes the question sound polite.";
  }

  if (settings.level === "advanced") {
    chinese += " 你可以帮我推荐一下吗？";
    pinyin += " Ni keyi bang wo tuijian yixia ma?";
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

async function generatePracticeReply(text, settings) {
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
            "You are a Chinese speaking coach. The learner speaks English. Reply with one natural Chinese sentence or two short sentences, pinyin without tone marks, a concise English explanation, and one short speaking suggestion. Return strict JSON with keys: chinese, pinyin, explanation, suggestion."
        },
        {
          role: "user",
          content: `Learner level: ${settings.level || "beginner"}. Learner said: ${text}`
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
      sendJson(res, 200, await generatePracticeReply(body.text || "", body.settings || {}));
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
