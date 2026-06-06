const conversation = document.querySelector("#conversation");
const textInput = document.querySelector("#textInput");
const sendButton = document.querySelector("#sendButton");
const recordButton = document.querySelector("#recordButton");
const aiStatus = document.querySelector("#aiStatus");
const level = document.querySelector("#level");
const speed = document.querySelector("#speed");
const showPinyin = document.querySelector("#showPinyin");
const showExplanation = document.querySelector("#showExplanation");

const storageKey = "chinese-speaking-coach-state";
const targetSampleRate = 16000;
const simpleLevelLabels = {
  beginner: "初级",
  intermediate: "中级",
  advanced: "高级"
};
const levelDescriptions = {
  beginner: "短句、常用词、简单语法",
  intermediate: "自然日常表达、简单复合句",
  advanced: "更地道、更像真实聊天"
};
const defaultPersona = {
  name: "苏棠",
  role: "中文系本科生，专门陪外国学习者练中文的对话伙伴",
  personality: "讨喜可爱、温柔耐心、真诚好奇，有一点书卷气，会自然鼓励你继续说",
  speakingStyle: "像真实中文系女生聊天一样接话，不翻译你的话，用自然口语回应含义",
  scenario: "面向想学中文的外国人，进行轻松、可持续的中文口语陪练",
  avatar: "/coach-avatar.png"
};
const greeting = {
  chinese: "你好呀，我是苏棠。你可以用英语跟我说一句话，我会像朋友一样用中文接着聊。",
  pinyin: "Ni hao ya, wo shi Su Tang. Ni keyi yong Yingwen gen wo shuo yi ju hua, wo hui xiang pengyou yiyang yong Zhongwen jiezhe liao.",
  ipa: "[ni xaʊ ja | wɔ ʂɨ su tʰɑŋ | ni kʰɤ ji jʊŋ iŋ wən kən wɔ ʂwɔ i tɕy xwa | wɔ xweɪ ɕjɑŋ pʰəŋ joʊ i jɑŋ jʊŋ ʈʂʊŋ wən tɕjɛ ʈʂɤ ljɑʊ]",
  explanation: "Hi, I'm Su Tang. Say something in English, and I will continue the conversation in Chinese like a friend.",
  suggestion: "先随便说一句今天发生的事就可以。"
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
  return `<div class="avatar">英</div>`;
}

function renderAssistantMessage(article, payload) {
  const pinyinBlock = showPinyin.checked
    ? `<p class="pinyin">${escapeHtml(payload.pinyin || "")}</p><p class="ipa">${escapeHtml(payload.ipa || "")}</p>`
    : "";
  const explanationHtml = showExplanation.checked && payload.explanation ? `<p class="explanation">${escapeHtml(payload.explanation)}</p>` : "";
  const suggestionHtml = payload.suggestion ? `<p class="suggestion">${escapeHtml(payload.suggestion)}</p>` : "";

  article.innerHTML = `
    ${avatarHtml("assistant")}
    <div class="bubble">
      <div class="reply-head">
        <p class="label">${escapeHtml(defaultPersona.name)} 回复</p>
        <button class="play-button" type="button" aria-label="播放中文">播放</button>
      </div>
      <p class="chinese">${escapeHtml(payload.chinese)}</p>
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
    ${avatarHtml("assistant")}
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

function addGreeting() {
  if (appState.turns.length === 0) {
    addMessage("assistant", greeting);
    rememberTurn({ role: "assistant", ...greeting });
  } else {
    addMessage("assistant", {
      chinese: "我回来啦。我们接着刚才的话题聊吧。",
      pinyin: "Wo huilai la. Women jiezhe gangcai de huati liao ba.",
      ipa: "[wɔ xweɪ laɪ la | wɔ mən tɕjɛ ʈʂɤ kɑŋ tsʰaɪ tɤ xwa tʰi ljɑʊ pa]",
      explanation: "I'm back. Let's continue from where we left off.",
      suggestion: "你可以直接说下一句英文，我会接着聊。"
    });
  }
}

function updateLevelText() {
  for (const option of level.options) {
    option.textContent = simpleLevelLabels[option.value];
  }
  const selected = level.options[level.selectedIndex];
  selected.textContent = `${simpleLevelLabels[level.value]}：${levelDescriptions[level.value]}`;
  level.title = selected.textContent;
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
    if (!response.ok) throw new Error(data.error || "生成失败");
    replaceTypingMessage(typingMessage, data);
    rememberTurn({ role: "user", text: cleanText });
    rememberTurn({ role: "assistant", chinese: data.chinese, pinyin: data.pinyin, ipa: data.ipa, explanation: data.explanation });
    await playChinese(data.chinese);
  } catch (error) {
    typingMessage.remove();
    addError(error.message || "网络失败，请重试。");
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

    if (!response.ok) throw new Error("语音生成失败");
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
    addError(error.message || "播放失败");
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
  } catch {
    addError("无法使用麦克风。请允许麦克风权限后重试。");
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
    if (!response.ok) throw new Error(data.error || "识别失败");
    await requestPractice(data.transcript);
  } catch (error) {
    addError(error.message || "语音识别失败。");
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
level.addEventListener("change", updateLevelText);

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

updateLevelText();
addGreeting();
