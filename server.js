import http from "node:http";
import { readFile } from "node:fs/promises";
import { createReadStream, existsSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const publicDir = join(__dirname, "public");
const port = Number(process.env.PORT || 5173);

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
  if (!process.env.OPENAI_API_KEY) return fallbackLesson(text, settings);

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_CHAT_MODEL || "gpt-4.1-mini",
      input: [
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
    throw new Error(`OpenAI response failed: ${error}`);
  }

  const data = await response.json();
  const content = data.output_text || data.output?.flatMap((item) => item.content || []).map((item) => item.text || "").join("\n");
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
  if (!process.env.OPENAI_API_KEY) {
    return { transcript: "I want to order coffee." };
  }

  const parts = parseMultipart(body, req.headers["content-type"] || "");
  const file = parts.find((part) => part.name === "audio");
  if (!file) throw new Error("No audio file received.");

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

async function synthesizeSpeech(text, speed) {
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
      speed: Number(speed || 1)
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`TTS failed: ${error}`);
  }

  return Buffer.from(await response.arrayBuffer());
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
      sendJson(res, 200, { ok: true, aiEnabled: Boolean(process.env.OPENAI_API_KEY) });
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
  console.log(process.env.OPENAI_API_KEY ? "AI mode enabled." : "No OPENAI_API_KEY found. Using mock practice replies.");
});
