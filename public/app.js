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

let mediaRecorder = null;
let chunks = [];
let isRecording = false;

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

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
  });
}

function scrollToBottom() {
  conversation.scrollTop = conversation.scrollHeight;
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

  conversation.appendChild(article);
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
  textInput.value = "";
  setState("正在生成中文回复...", true);

  try {
    const response = await fetch("/api/practice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: cleanText, settings: settings() })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "生成失败");
    addMessage("assistant", data);
    setState("可以继续说下一句。");
  } catch (error) {
    addError(error.message || "网络失败，请重试。");
    setState("失败了。请重试。");
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
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "zh-CN";
        utterance.rate = settings().speed;
        window.speechSynthesis.speak(utterance);
        setState("正在使用浏览器朗读。");
        return;
      }
    }

    if (!response.ok) throw new Error("语音生成失败");
    const blob = await response.blob();
    const audio = new Audio(URL.createObjectURL(blob));
    audio.playbackRate = settings().speed;
    audio.play();
    audio.addEventListener("ended", () => setState("播放完成。"), { once: true });
    setState("正在播放中文。");
  } catch (error) {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "zh-CN";
      utterance.rate = settings().speed;
      window.speechSynthesis.speak(utterance);
      setState("正在使用浏览器朗读。");
      return;
    }
    addError(error.message || "播放失败");
    setState("播放失败。");
  }
}

async function startRecording() {
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
    addError("当前浏览器不支持录音。请换用新版 Chrome、Edge 或 Safari。");
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    chunks = [];
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.addEventListener("dataavailable", (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    });
    mediaRecorder.addEventListener("stop", () => {
      stream.getTracks().forEach((track) => track.stop());
      uploadRecording();
    });
    mediaRecorder.start();
    isRecording = true;
    recordButton.classList.add("recording");
    setState("正在录音。再点一次停止。");
  } catch {
    addError("无法使用麦克风。请允许浏览器麦克风权限后重试。");
    setState("麦克风权限被拒绝。");
  }
}

function stopRecording() {
  if (!mediaRecorder || mediaRecorder.state === "inactive") return;
  mediaRecorder.stop();
  isRecording = false;
  recordButton.classList.remove("recording");
  setState("正在上传和识别语音...", true);
}

async function uploadRecording() {
  try {
    const blob = new Blob(chunks, { type: mediaRecorder?.mimeType || "audio/webm" });
    const formData = new FormData();
    formData.append("audio", blob, "speech.webm");

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
