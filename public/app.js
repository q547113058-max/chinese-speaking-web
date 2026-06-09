const conversation = document.querySelector("#conversation");
const textInput = document.querySelector("#textInput");
const sendButton = document.querySelector("#sendButton");
const recordButton = document.querySelector("#recordButton");
const aiStatus = document.querySelector("#aiStatus");
const level = document.querySelector("#level");
const speed = document.querySelector("#speed");
const showPinyin = document.querySelector("#showPinyin");
const showExplanation = document.querySelector("#showExplanation");
const modeTabs = document.querySelectorAll(".mode-tab");
const modePanes = document.querySelectorAll(".mode-pane");
const composer = document.querySelector(".composer");
const readingTextCards = document.querySelector("#readingTextCards");
const readingPinyinCards = document.querySelector("#readingPinyinCards");
const readingScore = document.querySelector("#readingScore");
const resetReadingButton = document.querySelector("#resetReadingButton");
const listeningPrompt = document.querySelector("#listeningPrompt");
const listeningProgress = document.querySelector("#listeningProgress");
const listeningHint = document.querySelector("#listeningHint");
const toneOptions = document.querySelector("#toneOptions");
const playListeningButton = document.querySelector("#playListeningButton");
const resetListeningButton = document.querySelector("#resetListeningButton");
const speakingTarget = document.querySelector("#speakingTarget");
const speakingPinyin = document.querySelector("#speakingPinyin");
const speakingMode = document.querySelector("#speakingMode");
const playTargetButton = document.querySelector("#playTargetButton");
const shadowButton = document.querySelector("#shadowButton");
const speakingScore = document.querySelector("#speakingScore");
const writingTarget = document.querySelector("#writingTarget");
const writingMode = document.querySelector("#writingMode");
const traceToggle = document.querySelector("#traceToggle");
const writingCanvas = document.querySelector("#writingCanvas");
const traceCharacter = document.querySelector("#traceCharacter");
const undoStrokeButton = document.querySelector("#undoStrokeButton");
const clearCanvasButton = document.querySelector("#clearCanvasButton");
const saveCanvasButton = document.querySelector("#saveCanvasButton");
const evaluateWritingButton = document.querySelector("#evaluateWritingButton");
const writingScore = document.querySelector("#writingScore");

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
let currentAudio = null;
let currentAudioUrl = null;
let currentUtterance = null;
let playbackSerial = 0;
let shadowRecording = false;
let shadowAudioContext = null;
let shadowSourceNode = null;
let shadowProcessorNode = null;
let shadowMicStream = null;
let shadowPcmChunks = [];
let currentExercise = null;
let writingCtx = null;
let writingStrokes = [];
let activeStroke = null;
let currentMode = "chat";
let readingState = null;
let listeningState = null;

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
      turns: Array.isArray(saved.turns) ? saved.turns.slice(-40) : [],
      skillResults: Array.isArray(saved.skillResults) ? saved.skillResults.slice(-20) : []
    };
  } catch {
    return { persona: defaultPersona, turns: [], skillResults: [] };
  }
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify({
    persona: appState.persona,
    turns: appState.turns.slice(-40),
    skillResults: appState.skillResults.slice(-20)
  }));
}

function rememberTurn(turn) {
  appState.turns.push({ ...turn, at: new Date().toISOString() });
  appState.turns = appState.turns.slice(-40);
  saveState();
}

function rememberSkillResult(result) {
  appState.skillResults.push({ ...result, at: new Date().toISOString() });
  appState.skillResults = appState.skillResults.slice(-20);
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
    .replace(/[,.?!;:\u3002\uff0c\uff01\uff1f\uff1b\uff1a]/g, " ")
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function pinyinForText(text = "", pinyin = "") {
  const pinyinSentence = String(pinyin).split(/[\u3002\uff01\uff1f!?.]/).find(Boolean)?.trim();
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

function shuffleItems(items = []) {
  return items
    .map((item) => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ item }) => item);
}

function deriveExercise(payload = {}) {
  const chinese = String(payload.chinese || "").trim();
  const sentence = chinese.split(/[。！？!?]/).find(Boolean)?.trim() || chinese || "你好呀，我们开始练习吧";
  const sentencePinyin = pinyinForText(sentence, payload.pinyin || "");
  const matches = sentence.match(/\p{Script=Han}{1,2}/gu) || ["你", "好"];
  const seen = new Set();
  const items = [];
  for (const text of matches) {
    if (seen.has(text)) continue;
    seen.add(text);
    items.push({
      text,
      type: [...text].length === 1 ? "character" : "word",
      hint: [...text].length === 1 ? "注意字形结构和笔画位置" : "先看整体结构，再慢慢写"
    });
    if (items.length >= 3) break;
  }
  const derived = readingListeningItems(sentence, sentencePinyin);
  return {
    reading: { items: derived.reading },
    listening: { items: derived.listening },
    speaking: { text: sentence, pinyin: sentencePinyin },
    writing: { items }
  };
}

function normalizeExercise(payload = {}) {
  const fallback = deriveExercise(payload);
  const exercise = payload.exercise || fallback;
  const speakingText = exercise.speaking?.text || fallback.speaking.text;
  return {
    reading: {
      items: Array.isArray(exercise.reading?.items) && exercise.reading.items.length > 0 ? exercise.reading.items.slice(0, 4) : fallback.reading.items
    },
    listening: {
      items: Array.isArray(exercise.listening?.items) && exercise.listening.items.length > 0 ? exercise.listening.items.slice(0, 4) : fallback.listening.items
    },
    speaking: {
      text: speakingText,
      pinyin: pinyinForText(speakingText, exercise.speaking?.pinyin || payload.pinyin || "") || fallback.speaking.pinyin
    },
    writing: {
      items: Array.isArray(exercise.writing?.items) && exercise.writing.items.length > 0 ? exercise.writing.items.slice(0, 3) : fallback.writing.items
    }
  };
}

function scrollToBottom() {
  conversation.scrollTop = conversation.scrollHeight;
}

function setMode(mode = "chat") {
  currentMode = mode;
  modeTabs.forEach((tab) => {
    const active = tab.dataset.mode === mode;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", String(active));
  });
  modePanes.forEach((pane) => pane.classList.toggle("active", pane.dataset.pane === mode));
  composer.classList.toggle("hidden", mode !== "chat");
  if (mode === "chat") scrollToBottom();
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

function setCurrentExercise(payload = {}) {
  currentExercise = normalizeExercise(payload);
  speakingTarget.textContent = currentExercise.speaking.text;
  speakingPinyin.textContent = currentExercise.speaking.pinyin || "";
  writingTarget.innerHTML = "";
  for (const item of currentExercise.writing.items) {
    const option = document.createElement("option");
    option.value = item.text;
    option.textContent = item.text;
    option.dataset.type = item.type || "character";
    option.dataset.hint = item.hint || "";
    writingTarget.appendChild(option);
  }
  resetReadingGame();
  resetListeningGame();
  updateTraceCharacter();
  clearWritingCanvas();
}

function resetReadingGame() {
  const items = (currentExercise?.reading?.items || [])
    .filter((item) => item.text)
    .slice(0, 4)
    .map((item, index) => ({
      id: `read-${index}`,
      text: item.text,
      pinyin: item.pinyin || "\u2014"
    }));
  readingState = {
    items,
    pinyinOrder: shuffleItems(items),
    selectedText: null,
    selectedPinyin: null,
    wrong: [],
    matched: new Set(),
    attempts: 0,
    startedAt: Date.now(),
    completed: false
  };
  readingScore.innerHTML = "";
  renderReadingGame();
}

function readingCardClass(side, item) {
  const classes = ["match-card"];
  if (readingState.matched.has(item.id)) classes.push("matched");
  if ((side === "text" && readingState.selectedText === item.id) || (side === "pinyin" && readingState.selectedPinyin === item.id)) classes.push("selected");
  if (readingState.wrong.includes(`${side}:${item.id}`)) classes.push("wrong");
  return classes.join(" ");
}

function renderReadingGame() {
  if (!readingState?.items?.length) {
    readingTextCards.innerHTML = "";
    readingPinyinCards.innerHTML = "";
    readingScore.innerHTML = `<div class="score-card muted-card">\u5f53\u524d\u56de\u590d\u6682\u65f6\u6ca1\u6709\u53ef\u914d\u5bf9\u7684\u6c49\u5b57\u3002</div>`;
    return;
  }

  readingTextCards.innerHTML = readingState.items.map((item) => `
    <button class="${readingCardClass("text", item)}" type="button" data-side="text" data-id="${escapeHtml(item.id)}">${escapeHtml(item.text)}</button>
  `).join("");
  readingPinyinCards.innerHTML = readingState.pinyinOrder.map((item) => `
    <button class="${readingCardClass("pinyin", item)}" type="button" data-side="pinyin" data-id="${escapeHtml(item.id)}">${escapeHtml(item.pinyin)}</button>
  `).join("");

  if (!readingState.completed && !readingScore.textContent.trim()) {
    readingScore.innerHTML = `<div class="score-card muted-card">\u70b9\u4e00\u4e2a\u6c49\u5b57\uff0c\u518d\u70b9\u5bf9\u5e94\u7684\u62fc\u97f3\u3002</div>`;
  }
}

function handleReadingCardClick(event) {
  const card = event.target.closest(".match-card");
  if (!card || readingState.completed) return;
  const id = card.dataset.id;
  const side = card.dataset.side;
  if (readingState.matched.has(id)) return;

  if (side === "text") readingState.selectedText = id;
  if (side === "pinyin") readingState.selectedPinyin = id;

  if (readingState.selectedText && readingState.selectedPinyin) {
    readingState.attempts += 1;
    if (readingState.selectedText === readingState.selectedPinyin) {
      readingState.matched.add(id);
      readingState.selectedText = null;
      readingState.selectedPinyin = null;
      readingScore.innerHTML = `<div class="score-card muted-card">\u914d\u5bf9\u6b63\u786e\u3002</div>`;
      if (readingState.matched.size === readingState.items.length) completeReadingGame();
    } else {
      readingState.wrong = [`text:${readingState.selectedText}`, `pinyin:${readingState.selectedPinyin}`];
      readingScore.innerHTML = `<div class="score-card muted-card">\u8fd9\u4e00\u5bf9\u4e0d\u5bf9\uff0c\u518d\u8bd5\u4e00\u6b21\u3002</div>`;
      setTimeout(() => {
        readingState.wrong = [];
        readingState.selectedText = null;
        readingState.selectedPinyin = null;
        renderReadingGame();
      }, 550);
    }
  }

  renderReadingGame();
}

function completeReadingGame() {
  readingState.completed = true;
  const durationSeconds = Math.max(1, Math.round((Date.now() - readingState.startedAt) / 1000));
  const score = Math.max(0, Math.round((readingState.items.length / Math.max(readingState.attempts, readingState.items.length)) * 100));
  const result = {
    score,
    attempts: readingState.attempts,
    total: readingState.items.length,
    durationSeconds
  };
  readingScore.innerHTML = `
    <div class="score-card">
      <div class="score-summary"><span>\u914d\u5bf9\u5b8c\u6210</span><strong>${score}</strong></div>
      <p class="transcript">\u7528\u65f6 ${durationSeconds} \u79d2\uff0c\u5c1d\u8bd5 ${readingState.attempts} \u6b21\u3002</p>
    </div>
  `;
  rememberSkillResult({ type: "reading", target: readingState.items.map((item) => item.text).join(""), result });
}

const toneChoices = [
  { tone: 1, label: "\u4e00\u58f0" },
  { tone: 2, label: "\u4e8c\u58f0" },
  { tone: 3, label: "\u4e09\u58f0" },
  { tone: 4, label: "\u56db\u58f0" },
  { tone: 5, label: "\u8f7b\u58f0" }
];

function resetListeningGame() {
  const items = (currentExercise?.listening?.items || [])
    .filter((item) => item.text && Number(item.tone) > 0)
    .slice(0, 4)
    .map((item, index) => ({
      id: `listen-${index}`,
      text: item.text,
      pinyin: item.pinyin || "",
      tone: Number(item.tone)
    }));
  listeningState = {
    items,
    index: 0,
    correct: 0,
    selectedTone: null,
    completed: false,
    recorded: false
  };
  listeningScore.innerHTML = "";
  renderListeningGame();
}

function renderListeningGame() {
  if (!listeningState?.items?.length) {
    listeningPrompt.textContent = "\u5f53\u524d\u56de\u590d\u6682\u65f6\u6ca1\u6709\u53ef\u5224\u65ad\u58f0\u8c03\u7684\u9898\u76ee\u3002";
    listeningProgress.textContent = "";
    listeningHint.textContent = "\u9700\u8981\u5e26\u58f0\u8c03\u7684\u62fc\u97f3\u624d\u80fd\u751f\u6210\u542c\u529b\u9898\u3002";
    toneOptions.innerHTML = "";
    listeningScore.innerHTML = `<div class="score-card muted-card">\u9700\u8981\u5e26\u58f0\u8c03\u7684\u62fc\u97f3\u624d\u80fd\u751f\u6210\u542c\u529b\u9898\u3002</div>`;
    return;
  }

  if (listeningState.completed) {
    const total = listeningState.items.length;
    const score = Math.round((listeningState.correct / total) * 100);
    listeningPrompt.textContent = "\u542c\u529b\u7ec3\u4e60\u5b8c\u6210";
    listeningProgress.textContent = `${listeningState.correct} / ${total}`;
    listeningHint.textContent = "";
    toneOptions.innerHTML = "";
    listeningScore.innerHTML = `
      <div class="score-card">
        <div class="score-summary"><span>\u58f0\u8c03\u9009\u62e9</span><strong>${score}</strong></div>
        <p class="transcript">\u7b54\u5bf9 ${listeningState.correct} / ${total} \u9898\u3002</p>
      </div>
    `;
    if (!listeningState.recorded) {
      listeningState.recorded = true;
      rememberSkillResult({ type: "listening", target: listeningState.items.map((item) => item.text).join(""), result: { score, correct: listeningState.correct, total } });
    }
    return;
  }

  const item = listeningState.items[listeningState.index];
  listeningPrompt.textContent = item.text;
  listeningProgress.textContent = `${listeningState.index + 1} / ${listeningState.items.length}`;
  listeningHint.textContent = "\u64ad\u653e\u540e\u9009\u8fd9\u4e2a\u5b57\u7684\u58f0\u8c03\u3002";
  toneOptions.innerHTML = toneChoices.map((choice) => {
    const classes = ["tone-option"];
    if (listeningState.selectedTone === choice.tone) classes.push("selected");
    if (listeningState.selectedTone && choice.tone === item.tone) classes.push("correct");
    if (listeningState.selectedTone === choice.tone && choice.tone !== item.tone) classes.push("wrong");
    return `<button class="${classes.join(" ")}" type="button" data-tone="${choice.tone}">${choice.label}</button>`;
  }).join("");

  if (!listeningState.selectedTone) {
    listeningScore.innerHTML = `<div class="score-card muted-card">\u5148\u64ad\u653e\uff0c\u518d\u9009\u58f0\u8c03\u3002</div>`;
  }
}

function handleToneChoice(event) {
  const button = event.target.closest(".tone-option");
  if (!button || listeningState.completed || listeningState.selectedTone) return;
  const item = listeningState.items[listeningState.index];
  const tone = Number(button.dataset.tone);
  listeningState.selectedTone = tone;
  if (tone === item.tone) listeningState.correct += 1;
  listeningScore.innerHTML = `<div class="score-card muted-card">${tone === item.tone ? "\u9009\u5bf9\u4e86\u3002" : `\u8fd9\u4e2a\u5b57\u662f ${toneChoices.find((choice) => choice.tone === item.tone)?.label || ""}\u3002`}</div>`;
  renderListeningGame();
  setTimeout(() => {
    listeningState.index += 1;
    listeningState.selectedTone = null;
    if (listeningState.index >= listeningState.items.length) listeningState.completed = true;
    renderListeningGame();
  }, 750);
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
    setCurrentExercise(payload);
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
    rememberTurn({ role: "assistant", chinese: data.chinese, pinyin: data.pinyin, explanation: data.explanation, suggestion: data.suggestion, exercise: data.exercise });
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
  stopPlayback();
  const serial = ++playbackSerial;
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
        if (serial === playbackSerial) speakWithBrowser(text);
        return;
      }
    }

    if (!response.ok) throw new Error("\u8bed\u97f3\u751f\u6210\u5931\u8d25");
    const blob = await response.blob();
    if (serial !== playbackSerial) return;
    currentAudioUrl = URL.createObjectURL(blob);
    const audio = new Audio(currentAudioUrl);
    currentAudio = audio;
    audio.playbackRate = settings().speed;
    audio.addEventListener("ended", () => {
      if (currentAudio === audio) stopPlayback();
      setBusy(false);
    }, { once: true });
    await audio.play();
  } catch (error) {
    if (serial !== playbackSerial) return;
    if ("speechSynthesis" in window) {
      speakWithBrowser(text);
      return;
    }
    addError(error.message || "\u64ad\u653e\u5931\u8d25");
    setBusy(false);
  }
}

function stopPlayback() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }

  if (currentAudioUrl) {
    URL.revokeObjectURL(currentAudioUrl);
    currentAudioUrl = null;
  }

  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }

  currentUtterance = null;
}

function speakWithBrowser(text) {
  stopPlayback();
  const utterance = new SpeechSynthesisUtterance(text);
  currentUtterance = utterance;
  utterance.lang = "zh-CN";
  utterance.rate = settings().speed;
  utterance.addEventListener("end", () => {
    if (currentUtterance === utterance) currentUtterance = null;
    setBusy(false);
  });
  window.speechSynthesis.speak(utterance);
}

function renderRadar(container, result, labels) {
  if (!result) {
    container.innerHTML = "";
    return;
  }
  const radar = result.radar || {};
  const rows = labels.map(([key, label]) => {
    const value = Math.max(0, Math.min(100, Number(radar[key]) || 0));
    return `
      <div class="radar-row">
        <span>${escapeHtml(label)}</span>
        <div class="radar-track"><div class="radar-fill" style="width:${value}%"></div></div>
        <strong>${value}</strong>
      </div>
    `;
  }).join("");
  const feedback = Array.isArray(result.feedback) ? result.feedback.map((item) => `<li>${escapeHtml(item)}</li>`).join("") : "";
  const modeLabels = {
    audio: "\u97f3\u9891\u8bc4\u5206",
    transcript: "\u8f6c\u5199\u8bc4\u5206",
    ai: "AI \u8bc4\u5206",
    self: "\u81ea\u67e5\u8bc4\u5206",
    "self-fallback": "\u81ea\u67e5\u515c\u5e95"
  };
  const modeLabel = modeLabels[result.modeUsed] || modeLabels[result.modeRequested] || result.modeUsed || result.modeRequested || "";
  const fallbackNote = result.modeRequested === "audio" && result.modeUsed !== "audio" ? `<p class="score-note">\u672a\u4f7f\u7528\u97f3\u9891\u8bc4\u5206\uff0c\u5df2\u5207\u56de\u8f6c\u5199\u8bc4\u5206\u3002</p>` : "";
  const fallbackReasons = {
    "vision-not-configured": "\u672a\u914d\u7f6e\u53ef\u7528\u7684\u89c6\u89c9\u8bc4\u5206\u6a21\u578b\u3002",
    "invalid-image": "\u624b\u5199\u56fe\u7247\u65e0\u6548\uff0c\u8bf7\u6e05\u7a7a\u540e\u91cd\u5199\u3002",
    "vision-request-failed": "\u89c6\u89c9\u8bc4\u5206\u8bf7\u6c42\u5931\u8d25\uff0c\u5df2\u5207\u56de\u81ea\u67e5\u3002",
    "vision-invalid-response": "\u89c6\u89c9\u6a21\u578b\u672a\u8fd4\u56de\u6709\u6548\u8bc4\u5206\uff0c\u5df2\u5207\u56de\u81ea\u67e5\u3002"
  };
  const reasonNote = result.fallbackReason ? `<p class="score-note">${escapeHtml(fallbackReasons[result.fallbackReason] || result.fallbackReason)}</p>` : "";
  const audioMetrics = result.audioMetrics ? `
    <p class="score-note">
      \u5f55\u97f3 ${escapeHtml(result.audioMetrics.durationSeconds)}s\uff0c\u6709\u6548\u8bed\u97f3 ${Math.round(Number(result.audioMetrics.voicedRatio || 0) * 100)}%\uff0c\u505c\u987f ${escapeHtml(result.audioMetrics.pauseCount)} \u6b21
    </p>
  ` : "";
  const recognizedText = result.recognizedText ? `<p class="score-note">\u8bc6\u522b\uff1a${escapeHtml(result.recognizedText)}</p>` : "";
  container.innerHTML = `
    <div class="score-card">
      <div class="score-summary">
        <span>${escapeHtml(modeLabel)}</span>
        <strong>${Math.round(Number(result.score) || 0)}</strong>
      </div>
      <div class="radar-list">${rows}</div>
      ${fallbackNote}
      ${reasonNote}
      ${audioMetrics}
      ${recognizedText}
      ${result.transcript ? `<p class="transcript"><span>识别：</span>${escapeHtml(result.transcript)}</p>` : ""}
      ${feedback ? `<ul class="feedback-list">${feedback}</ul>` : ""}
    </div>
  `;
}

function updateSkillBusy(busy) {
  shadowButton.disabled = busy;
  evaluateWritingButton.disabled = busy;
  playTargetButton.disabled = busy;
}

async function startShadowRecording() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!navigator.mediaDevices?.getUserMedia || !AudioContextClass) {
    addError("当前浏览器不支持录音。");
    return;
  }
  try {
    shadowMicStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    shadowAudioContext = new AudioContextClass();
    shadowSourceNode = shadowAudioContext.createMediaStreamSource(shadowMicStream);
    shadowProcessorNode = shadowAudioContext.createScriptProcessor(4096, 1, 1);
    shadowPcmChunks = [];
    shadowProcessorNode.onaudioprocess = (event) => {
      if (!shadowRecording) return;
      shadowPcmChunks.push(floatTo16KhzPcm(event.inputBuffer.getChannelData(0), shadowAudioContext.sampleRate));
    };
    shadowSourceNode.connect(shadowProcessorNode);
    shadowProcessorNode.connect(shadowAudioContext.destination);
    shadowRecording = true;
    shadowButton.classList.add("recording");
    shadowButton.textContent = "结束评分";
  } catch {
    addError("无法使用麦克风。请允许权限后重试。");
  }
}

async function stopShadowRecording() {
  if (!shadowRecording) return;
  shadowRecording = false;
  shadowProcessorNode?.disconnect();
  shadowSourceNode?.disconnect();
  shadowMicStream?.getTracks().forEach((track) => track.stop());
  await shadowAudioContext?.close();
  shadowProcessorNode = null;
  shadowSourceNode = null;
  shadowMicStream = null;
  shadowAudioContext = null;
  shadowButton.classList.remove("recording");
  shadowButton.textContent = "录音跟读";
  await evaluateSpeaking();
}

async function evaluateSpeaking() {
  if (!currentExercise?.speaking?.text) return;
  updateSkillBusy(true);
  speakingScore.innerHTML = `<div class="score-card muted-card">正在评分...</div>`;
  try {
    const blob = new Blob(shadowPcmChunks, { type: "application/octet-stream" });
    const formData = new FormData();
    formData.append("audio", blob, "shadow.pcm");
    formData.append("targetText", currentExercise.speaking.text);
    formData.append("targetPinyin", currentExercise.speaking.pinyin || "");
    formData.append("mode", speakingMode.value);
    const response = await fetch("/api/speaking/evaluate", { method: "POST", body: formData });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "评分失败");
    renderRadar(speakingScore, data, [
      ["accuracy", "准确"],
      ["completeness", "完整"],
      ["fluency", "流利"],
      ["tone", "声调"],
      ["rhythm", "节奏"]
    ]);
    rememberSkillResult({ type: "speaking", target: currentExercise.speaking.text, result: data });
  } catch (error) {
    speakingScore.innerHTML = "";
    addError(error.message || "跟读评分失败。");
  } finally {
    updateSkillBusy(false);
  }
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

function setupWritingCanvas() {
  writingCtx = writingCanvas.getContext("2d");
  writingCtx.lineCap = "round";
  writingCtx.lineJoin = "round";
  writingCtx.lineWidth = 8;
  writingCtx.strokeStyle = "#1e2528";
  drawWritingCanvas();
}

function drawGrid() {
  const { width, height } = writingCanvas;
  writingCtx.clearRect(0, 0, width, height);
  writingCtx.fillStyle = "#fff";
  writingCtx.fillRect(0, 0, width, height);
  writingCtx.strokeStyle = "#d9e1dc";
  writingCtx.lineWidth = 1;
  writingCtx.strokeRect(0.5, 0.5, width - 1, height - 1);
  writingCtx.setLineDash([8, 8]);
  writingCtx.beginPath();
  writingCtx.moveTo(width / 2, 0);
  writingCtx.lineTo(width / 2, height);
  writingCtx.moveTo(0, height / 2);
  writingCtx.lineTo(width, height / 2);
  writingCtx.moveTo(0, 0);
  writingCtx.lineTo(width, height);
  writingCtx.moveTo(width, 0);
  writingCtx.lineTo(0, height);
  writingCtx.stroke();
  writingCtx.setLineDash([]);
}

function drawWritingCanvas() {
  if (!writingCtx) return;
  drawGrid();
  writingCtx.strokeStyle = "#1e2528";
  writingCtx.lineWidth = 8;
  for (const stroke of writingStrokes) drawStroke(stroke);
  if (activeStroke) drawStroke(activeStroke);
}

function drawStroke(stroke) {
  if (!stroke || stroke.length < 2) return;
  writingCtx.beginPath();
  writingCtx.moveTo(stroke[0].x, stroke[0].y);
  for (const point of stroke.slice(1)) writingCtx.lineTo(point.x, point.y);
  writingCtx.stroke();
}

function canvasPoint(event) {
  const rect = writingCanvas.getBoundingClientRect();
  const source = event.touches?.[0] || event;
  return {
    x: ((source.clientX - rect.left) / rect.width) * writingCanvas.width,
    y: ((source.clientY - rect.top) / rect.height) * writingCanvas.height
  };
}

function beginStroke(event) {
  event.preventDefault();
  activeStroke = [canvasPoint(event)];
  writingCanvas.setPointerCapture?.(event.pointerId);
}

function moveStroke(event) {
  if (!activeStroke) return;
  event.preventDefault();
  activeStroke.push(canvasPoint(event));
  drawWritingCanvas();
}

function endStroke(event) {
  if (!activeStroke) return;
  event.preventDefault();
  if (activeStroke.length > 1) writingStrokes.push(activeStroke);
  activeStroke = null;
  drawWritingCanvas();
}

function updateTraceCharacter() {
  traceCharacter.textContent = traceToggle.checked ? (writingTarget.value || "") : "";
}

function clearWritingCanvas() {
  writingStrokes = [];
  activeStroke = null;
  drawWritingCanvas();
  writingScore.innerHTML = "";
}

function undoWritingStroke() {
  writingStrokes.pop();
  drawWritingCanvas();
}

function saveWritingImage() {
  const link = document.createElement("a");
  link.download = `writing-${writingTarget.value || "practice"}.png`;
  link.href = writingCanvas.toDataURL("image/png");
  link.click();
}

async function evaluateWriting() {
  if (!writingTarget.value) return;
  updateSkillBusy(true);
  writingScore.innerHTML = `<div class="score-card muted-card">正在评分...</div>`;
  try {
    const response = await fetch("/api/writing/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageData: writingCanvas.toDataURL("image/png"),
        targetText: writingTarget.value,
        mode: writingMode.value
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "书写评分失败");
    renderRadar(writingScore, data, [
      ["targetMatch", "匹配"],
      ["structure", "结构"],
      ["proportion", "比例"],
      ["strokeClarity", "笔画"],
      ["neatness", "整洁"]
    ]);
    rememberSkillResult({ type: "writing", target: writingTarget.value, result: data });
  } catch (error) {
    writingScore.innerHTML = "";
    addError(error.message || "书写评分失败。");
  } finally {
    updateSkillBusy(false);
  }
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

modeTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    setMode(tab.dataset.mode || "chat");
  });
});

readingTextCards.addEventListener("click", handleReadingCardClick);
readingPinyinCards.addEventListener("click", handleReadingCardClick);
resetReadingButton.addEventListener("click", resetReadingGame);
toneOptions.addEventListener("click", handleToneChoice);
playListeningButton.addEventListener("click", () => {
  const item = listeningState?.items?.[listeningState.index];
  if (item) playChinese(item.text);
});
resetListeningButton.addEventListener("click", resetListeningGame);

playTargetButton.addEventListener("click", () => playChinese(currentExercise?.speaking?.text || ""));
shadowButton.addEventListener("click", () => {
  if (shadowRecording) stopShadowRecording();
  else startShadowRecording();
});
writingTarget.addEventListener("change", () => {
  updateTraceCharacter();
  clearWritingCanvas();
});
traceToggle.addEventListener("change", updateTraceCharacter);
undoStrokeButton.addEventListener("click", undoWritingStroke);
clearCanvasButton.addEventListener("click", clearWritingCanvas);
saveCanvasButton.addEventListener("click", saveWritingImage);
evaluateWritingButton.addEventListener("click", evaluateWriting);
writingCanvas.addEventListener("pointerdown", beginStroke);
writingCanvas.addEventListener("pointermove", moveStroke);
writingCanvas.addEventListener("pointerup", endStroke);
writingCanvas.addEventListener("pointercancel", endStroke);
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

setupWritingCanvas();
renderStoredConversation();
if (!currentExercise) setCurrentExercise(greeting);
setMode(currentMode);
