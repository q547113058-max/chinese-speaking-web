const conversation = document.querySelector("#conversation");
const textInput = document.querySelector("#textInput");
const sendButton = document.querySelector("#sendButton");
const recordButton = document.querySelector("#recordButton");
const stateText = document.querySelector("#stateText");
const aiStatus = document.querySelector("#aiStatus");
const level = document.querySelector("#level");
const speed = document.querySelector("#speed");
const showPinyin = document.querySelector("#showPinyin");
const showExplanation = document.querySelector("#showExplanation");

const storageKey = "chinese-speaking-coach-state";
const levelDescriptions = {
  beginner: "初级：短句、常用词、简单语法，适合刚开始开口。",
  intermediate: "中级：日常表达更自然，会加入简单复合句和追问。",
  advanced: "高级：更像真实成年人聊天，词汇更丰富，表达更地道。"
};

let isRecording = false;
let audioContext = null;
let sourceNode = null;
let processorNode = null;
let micStream = null;
let pcmChunks = [];
const targetSampleRate = 16000;

const setState = (text, busy = false) => {
  stateText.textContent = text;
  sendButton.disabled = busy;
  recordButton.disabled = busy && !isRecording;
};

const settings = () => ({
  level: level.value,
  speed: Number(speed.value),
  showPinyin: showPinyin.checked,
  showExplanation: showExplanation.checked
});

const appState = loadState();

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
    return {
      persona: saved.persona || null,
      turns: Array.isArray(saved.turns) ? saved.turns.slice(-40) : []
    };
  } catch {
    return { persona: null, turns: [] };
  }
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify({
    persona: appState.persona,
    turns: appState.turns.slice(-40)
  }));
}

function rememberTurn(turn) {
  appState.turns.push({ ...turn, at: new Date().toISOString() });
  appState.turns = appState.turns.slice(-40);
  saveState();
}

function recentContext() {
  return {
    persona: appState.persona,
    turns: appState.turns.slice(-8)
  };
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
  });
}

function scrollToBottom() {
  conversation.scrollTop = conversation.scrollHeight;
}

function setupLevelDescription() {
  const description = document.createElement("p");
  description.className = "level-description";
  level.insertAdjacentElement("afterend", description);

  const update = () => {
    description.textContent = levelDescriptions[level.value] || levelDescriptions.beginner;
  };

  level.addEventListener("change", update);
  update();
}

function addPersonaMessage(persona) {
  if (!persona) return;
  const article = document.createElement("article");
  article.className = "message assistant persona-message";
  article.innerHTML = `
    <div class="avatar">中</div>
    <div class="bubble persona-bubble">
      <p class="label">陪练人设</p>
      <p class="chinese">${escapeHtml(persona.name || "中文陪练")}</p>
      <p class="explanation">${escapeHtml(persona.role || "")}</p>
      <p class="suggestion">${escapeHtml(`${persona.personality || ""} ${persona.scenario || ""}`.trim())}</p>
    </div>
  `;
  conversation.appendChild(article);
  scrollToBottom();
}

async function ensurePersona() {
  if (appState.persona) {
    addPersonaMessage(appState.persona);
    return;
  }

  try {
    setState("正在生成陪练人设...", true);
    const response = await fetch("/api/persona", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings: settings() })
    });
    appState.persona = await response.json();
  } catch {
    appState.persona = {
      name: "小雨",
      role: "耐心的中文对话伙伴",
      personality: "温和、好奇、会自然追问",
      speakingStyle: levelDescriptions[level.value],
      scenario: "日常闲聊"
    };
  }

  saveState();
  addPersonaMessage(appState.persona);
  setState("准备好了。点击麦克风录音，或输入英文后发送。");
}

function renderAssistantMessage(article, payload) {
  const pinyinHtml = showPinyin.checked && payload.pinyin ? `<p class="pinyin">${escapeHtml(payload.pinyin)}</p>` : "";
  const explanationHtml = showExplanation.checked && payload.explanation ? `<p class="explanation">${escapeHtml(payload.explanation)}</p>` : "";
  const suggestionHtml = payload.suggestion ? `<p class="suggestion">${escapeHtml(payload.suggestion)}</p>` : "";

  article.innerHTML = `
    <div class="avatar">中</div>
    <div class="bubble">
      <div class="reply-head">
        <p class="label">中文回复</p>
        <button class="play-button" type="button" aria-label="播放中文">播放</button>
      </div>
      <p class="chinese">${escapeHtml(payload.chinese)}</p>
      ${pinyinHtml}
      ${explanationHtml}
      ${suggestionHtml}
    </div>
  `;
  article.querySelector(".play-button").addEventListener("click", () => playChinese(payload.chinese));
}

function addMessage(kind, payload) {
  const article = document.createElement("article");
  article.className = `message ${kind}`;

  if (kind === "user") {
    article.innerHTML = `
      <div class="avatar">英</div>
      <div class="bubble">
        <p class="label">你说</p>
        <p>${escapeHtml(payload.text)}</p>
      </div>
    `;
  } else {
    renderAssistantMessage(article, payload);
  }

  conversation.appendChild(article);
  scrollToBottom();
  return article;
}

function addTypingMessage() {
  const article = document.createElement("article");
  article.className = "message assistant typing";
  article.innerHTML = `
    <div class="avatar">中</div>
    <div class="bubble typing-bubble" aria-label="正在生成">
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
    </div>
  `;
  conversation.appendChild(article);
  scrollToBottom();
  return article;
}

function replaceTypingMessage(article, payload) {
  article.className = "message assistant";
  renderAssistantMessage(article, payload);
  scrollToBottom();
}

function addError(error) {
  const article = document.createElement("article");
  article.className = "message assistant";
  article.innerHTML = `
    <div class="avatar error">!</div>
    <div class="bubble error-bubble">
      <p class="label">出错了</p>
      <p>${escapeHtml(error)}</p>
    </div>
  `;
  conversation.appendChild(article);
  scrollToBottom();
}

async function requestPractice(text) {
  const cleanText = text.trim();
  if (!cleanText) return;

  addMessage("user", { text: cleanText });
  const typingMessage = addTypingMessage();
  textInput.value = "";
  setState("正在生成中文回复...", true);

  try {
    const response = await fetch("/api/practice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: cleanText, settings: settings(), context: recentContext() })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "生成失败");
    replaceTypingMessage(typingMessage, data);
    rememberTurn({ role: "user", text: cleanText });
    rememberTurn({ role: "assistant", chinese: data.chinese, pinyin: data.pinyin, explanation: data.explanation });
    setState("回复已生成，正在自动播放...", true);
    await playChinese(data.chinese);
  } catch (error) {
    typingMessage.remove();
    addError(error.message || "网络失败，请重试。");
    setState("失败了，请重试。");
  }
}

async function playChinese(text) {
  if (!text) return;
  setState("正在准备中文发音...", true);
  try {
    const response = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, speed: settings().speed })
    });

    if (response.headers.get("content-type")?.includes("application/json")) {
      const data = await response.json();
      if (data.fallback) {
        speakWithBrowser(text);
        return;
      }
    }

    if (!response.ok) throw new Error("语音生成失败");
    const blob = await response.blob();
    const audio = new Audio(URL.createObjectURL(blob));
    audio.playbackRate = settings().speed;
    audio.addEventListener("ended", () => setState("播放完成，可以继续说下一句。"), { once: true });
    await audio.play();
    setState("正在播放中文。", true);
  } catch (error) {
    if ("speechSynthesis" in window) {
      speakWithBrowser(text);
      return;
    }
    addError(error.message || "播放失败");
    setState("播放失败。");
  }
}

function speakWithBrowser(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-CN";
  utterance.rate = settings().speed;
  utterance.addEventListener("end", () => setState("播放完成，可以继续说下一句。"));
  window.speechSynthesis.speak(utterance);
  setState("正在使用浏览器朗读。", true);
}

async function startRecording() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!navigator.mediaDevices?.getUserMedia || !AudioContextClass) {
    addError("当前浏览器不支持录音。请使用新版 Chrome、Edge 或 Safari。");
    return;
  }

  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioContext = new AudioContextClass();
    sourceNode = audioContext.createMediaStreamSource(micStream);
    processorNode = audioContext.createScriptProcessor(4096, 1, 1);
    pcmChunks = [];
    processorNode.onaudioprocess = (event) => {
      if (!isRecording) return;
      pcmChunks.push(floatTo16KhzPcm(event.inputBuffer.getChannelData(0), audioContext.sampleRate));
    };
    sourceNode.connect(processorNode);
    processorNode.connect(audioContext.destination);
    isRecording = true;
    recordButton.classList.add("recording");
    setState("正在录音。再点一次停止。");
  } catch {
    addError("无法使用麦克风。请允许麦克风权限后重试。");
    setState("麦克风权限被拒绝。");
  }
}

function stopRecording() {
  if (!isRecording) return;
  isRecording = false;
  processorNode?.disconnect();
  sourceNode?.disconnect();
  micStream?.getTracks().forEach((track) => track.stop());
  audioContext?.close();
  processorNode = null;
  sourceNode = null;
  micStream = null;
  audioContext = null;
  recordButton.classList.remove("recording");
  setState("正在上传并识别语音...", true);
  uploadRecording();
}

function floatTo16KhzPcm(input, sourceSampleRate) {
  const ratio = sourceSampleRate / targetSampleRate;
  const length = Math.floor(input.length / ratio);
  const output = new Int16Array(length);

  for (let i = 0; i < length; i += 1) {
    const sourceIndex = Math.floor(i * ratio);
    const sample = Math.max(-1, Math.min(1, input[sourceIndex]));
    output[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }

  return output;
}

async function uploadRecording() {
  try {
    const blob = new Blob(pcmChunks, { type: "application/octet-stream" });
    const formData = new FormData();
    formData.append("audio", blob, "speech.pcm");

    const response = await fetch("/api/transcribe", { method: "POST", body: formData });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "识别失败");
    setState("语音识别完成，正在生成回复...", true);
    await requestPractice(data.transcript);
  } catch (error) {
    addError(error.message || "语音识别失败。");
    setState("语音识别失败，请重试。");
  }
}

sendButton.addEventListener("click", () => requestPractice(textInput.value));
textInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    requestPractice(textInput.value);
  }
});
recordButton.addEventListener("click", () => {
  if (isRecording) stopRecording();
  else startRecording();
});

for (const control of [showPinyin, showExplanation]) {
  control.addEventListener("change", () => {
    setState("显示设置已更新。新回复会按当前设置展示。");
  });
}

setupLevelDescription();
ensurePersona();

fetch("/api/health")
  .then((response) => response.json())
  .then((data) => {
    aiStatus.textContent = data.aiEnabled ? "AI 已连接" : "模拟模式";
    aiStatus.classList.toggle("mock", !data.aiEnabled);
  })
  .catch(() => {
    aiStatus.textContent = "离线";
    aiStatus.classList.add("mock");
  });
