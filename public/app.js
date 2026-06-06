const conversation = document.querySelector("#conversation");
const textInput = document.querySelector("#textInput");
const sendButton = document.querySelector("#sendButton");
const recordButton = document.querySelector("#recordButton");
const aiStatus = document.querySelector("#aiStatus");
const level = document.querySelector("#level");
const difficultyPanel = document.querySelector("#difficultyPanel");
const speed = document.querySelector("#speed");
const showPinyin = document.querySelector("#showPinyin");
const showExplanation = document.querySelector("#showExplanation");

const storageKey = "chinese-speaking-coach-state";
const targetSampleRate = 16000;
const defaultPersona = {
  name: "\u82cf\u68e0",
  role: "\u4e2d\u6587\u7cfb\u672c\u79d1\u751f\uff0c\u4e13\u95e8\u966a\u5916\u56fd\u5b66\u4e60\u8005\u7ec3\u4e2d\u6587\u7684\u5bf9\u8bdd\u4f19\u4f34",
  personality: "\u8ba8\u559c\u53ef\u7231\u3001\u6e29\u67d4\u8010\u5fc3\u3001\u771f\u8bda\u597d\u5947\uff0c\u6709\u4e00\u70b9\u4e66\u5377\u6c14",
  speakingStyle: "\u50cf\u771f\u5b9e\u4e2d\u6587\u7cfb\u5973\u751f\u804a\u5929\u4e00\u6837\u63a5\u8bdd\uff0c\u4e0d\u7ffb\u8bd1\u7528\u6237\u7684\u8bdd\uff0c\u7528\u81ea\u7136\u53e3\u8bed\u56de\u5e94\u542b\u4e49",
  scenario: "\u9762\u5411\u60f3\u5b66\u4e2d\u6587\u7684\u5916\u56fd\u4eba\uff0c\u8fdb\u884c\u8f7b\u677e\u3001\u53ef\u6301\u7eed\u7684\u4e2d\u6587\u53e3\u8bed\u966a\u7ec3",
  avatar: "/coach-avatar.png"
};
const greeting = {
  chinese: "\u4f60\u597d\u5440\uff0c\u6211\u662f\u82cf\u68e0\u3002\u4f60\u53ef\u4ee5\u7528\u82f1\u8bed\u8ddf\u6211\u8bf4\u4e00\u53e5\u8bdd\uff0c\u6211\u4f1a\u50cf\u670b\u53cb\u4e00\u6837\u7528\u4e2d\u6587\u63a5\u7740\u804a\u3002",
  pinyin: "N\u01d0 h\u01ceo ya, w\u01d2 sh\u00ec S\u016b T\u00e1ng. N\u01d0 k\u011by\u01d0 y\u00f2ng Y\u012bngw\u00e9n g\u0113n w\u01d2 shu\u014d y\u00ed j\u00f9 hu\u00e0, w\u01d2 hu\u00ec xi\u00e0ng p\u00e9ngyou y\u00edy\u00e0ng y\u00f2ng Zh\u014dngw\u00e9n ji\u0113zhe li\u00e1o.",
  explanation: "Hi, I'm Su Tang. Say something in English, and I will continue the conversation in Chinese like a friend.",
  suggestion: "\u5148\u968f\u4fbf\u8bf4\u4e00\u53e5\u4eca\u5929\u53d1\u751f\u7684\u4e8b\u5c31\u53ef\u4ee5\u3002"
};

let isRecording = false;
let audioContext = null;
let sourceNode = null;
let processorNode = null;
let micStream = null;
let pcmChunks = [];

const settings = () => ({
  level: level.value,
  speed: Number(speed.value),
  showPinyin: showPinyin.checked,
  showExplanation: showExplanation.checked
});

const appState = loadState();
appState.persona = defaultPersona;
saveState();

function setBusy(busy = false) {
  sendButton.disabled = busy;
  recordButton.disabled = busy && !isRecording;
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
    return {
      persona: saved.persona || defaultPersona,
      turns: Array.isArray(saved.turns) ? saved.turns.slice(-40) : []
    };
  } catch {
    return { persona: defaultPersona, turns: [] };
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

function avatarHtml(kind = "assistant") {
  if (kind === "assistant") {
    return `<img class="avatar avatar-img" src="${defaultPersona.avatar}" alt="${defaultPersona.name}" />`;
  }
  return `<div class="avatar">\u82f1</div>`;
}

function renderAssistantMessage(article, payload) {
  const pinyinBlock = showPinyin.checked && payload.pinyin ? `<p class="pinyin">${escapeHtml(payload.pinyin)}</p>` : "";
  const explanationHtml = showExplanation.checked && payload.explanation ? `<p class="explanation">${escapeHtml(payload.explanation)}</p>` : "";
  const suggestionHtml = payload.suggestion ? `<p class="suggestion">${escapeHtml(payload.suggestion)}</p>` : "";

  article.innerHTML = `
    ${avatarHtml("assistant")}
    <div class="bubble">
      <div class="reply-head">
        <p class="label">${escapeHtml(defaultPersona.name)} \u56de\u590d</p>
        <button class="play-button" type="button" aria-label="\u64ad\u653e\u4e2d\u6587">\u64ad\u653e</button>
      </div>
      <p class="chinese">${escapeHtml(payload.chinese || "")}</p>
      ${pinyinBlock}
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
      ${avatarHtml("user")}
      <div class="bubble">
        <p class="label">\u4f60\u8bf4</p>
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
    ${avatarHtml("assistant")}
    <div class="bubble typing-bubble" aria-label="\u6b63\u5728\u751f\u6210">
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
      <p class="label">\u51fa\u9519\u4e86</p>
      <p>${escapeHtml(error)}</p>
    </div>
  `;
  conversation.appendChild(article);
  scrollToBottom();
}

function renderStoredConversation() {
  if (appState.turns.length === 0) {
    addMessage("assistant", greeting);
    rememberTurn({ role: "assistant", ...greeting });
    return;
  }

  for (const turn of appState.turns) {
    if (turn.role === "user") addMessage("user", { text: turn.text || "" });
    if (turn.role === "assistant") addMessage("assistant", turn);
  }
}

function updateDifficultyPanel() {
  difficultyPanel.querySelectorAll("[data-level]").forEach((item) => {
    item.classList.toggle("active", item.dataset.level === level.value);
  });
}

async function requestPractice(text) {
  const cleanText = text.trim();
  if (!cleanText) return;

  addMessage("user", { text: cleanText });
  const typingMessage = addTypingMessage();
  textInput.value = "";
  setBusy(true);

  try {
    const response = await fetch("/api/practice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: cleanText, settings: settings(), context: recentContext() })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "\u751f\u6210\u5931\u8d25");
    replaceTypingMessage(typingMessage, data);
    rememberTurn({ role: "user", text: cleanText });
    rememberTurn({ role: "assistant", chinese: data.chinese, pinyin: data.pinyin, explanation: data.explanation, suggestion: data.suggestion });
    await playChinese(data.chinese);
  } catch (error) {
    typingMessage.remove();
    addError(error.message || "\u7f51\u7edc\u5931\u8d25\uff0c\u8bf7\u91cd\u8bd5\u3002");
  } finally {
    setBusy(false);
  }
}

async function playChinese(text) {
  if (!text) return;
  setBusy(true);
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

    if (!response.ok) throw new Error("\u8bed\u97f3\u751f\u6210\u5931\u8d25");
    const blob = await response.blob();
    const audio = new Audio(URL.createObjectURL(blob));
    audio.playbackRate = settings().speed;
    audio.addEventListener("ended", () => setBusy(false), { once: true });
    await audio.play();
  } catch (error) {
    if ("speechSynthesis" in window) {
      speakWithBrowser(text);
      return;
    }
    addError(error.message || "\u64ad\u653e\u5931\u8d25");
    setBusy(false);
  }
}

function speakWithBrowser(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-CN";
  utterance.rate = settings().speed;
  utterance.addEventListener("end", () => setBusy(false));
  window.speechSynthesis.speak(utterance);
}

async function startRecording() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!navigator.mediaDevices?.getUserMedia || !AudioContextClass) {
    addError("\u5f53\u524d\u6d4f\u89c8\u5668\u4e0d\u652f\u6301\u5f55\u97f3\u3002");
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
  } catch {
    addError("\u65e0\u6cd5\u4f7f\u7528\u9ea6\u514b\u98ce\u3002\u8bf7\u5141\u8bb8\u6743\u9650\u540e\u91cd\u8bd5\u3002");
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
    setBusy(true);
    const blob = new Blob(pcmChunks, { type: "application/octet-stream" });
    const formData = new FormData();
    formData.append("audio", blob, "speech.pcm");

    const response = await fetch("/api/transcribe", { method: "POST", body: formData });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "\u8bc6\u522b\u5931\u8d25");
    await requestPractice(data.transcript);
  } catch (error) {
    addError(error.message || "\u8bed\u97f3\u8bc6\u522b\u5931\u8d25\u3002");
    setBusy(false);
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
level.addEventListener("change", updateDifficultyPanel);
level.addEventListener("focus", () => difficultyPanel.classList.add("open"));
level.addEventListener("click", () => difficultyPanel.classList.add("open"));
document.addEventListener("click", (event) => {
  if (!event.target.closest(".level-control")) difficultyPanel.classList.remove("open");
});

fetch("/api/health")
  .then((response) => response.json())
  .then((data) => {
    aiStatus.textContent = data.aiEnabled ? "AI connected" : "Mock mode";
    aiStatus.classList.toggle("mock", !data.aiEnabled);
  })
  .catch(() => {
    aiStatus.textContent = "Offline";
    aiStatus.classList.add("mock");
  });

updateDifficultyPanel();
renderStoredConversation();
