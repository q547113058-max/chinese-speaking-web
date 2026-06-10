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
const courseSelect = document.querySelector("#courseSelect");
const courseSummary = document.querySelector("#courseSummary");
const submodeTabs = document.querySelectorAll(".submode-tab");
const readingCharacterPicker = document.querySelector("#readingCharacterPicker");
const readingLayerTabs = document.querySelector("#readingLayerTabs");
const readingBoard = document.querySelector("#readingBoard");
const readingSentenceBox = document.querySelector("#readingSentenceBox");
const characterLessonBox = document.querySelector("#characterLessonBox");
const readingSentenceInput = document.querySelector("#readingSentenceInput");
const evaluateReadingButton = document.querySelector("#evaluateReadingButton");
const readingSceneLevelTabs = document.querySelector("#readingSceneLevelTabs");
const readingPassageBox = document.querySelector("#readingPassageBox");
const readingHanziPopover = document.querySelector("#readingHanziPopover");
const readingQuestions = document.querySelector("#readingQuestions");
const readingSceneScore = document.querySelector("#readingSceneScore");
const readingTextCards = document.querySelector("#readingTextCards");
const readingPinyinCards = document.querySelector("#readingPinyinCards");
const readingScore = document.querySelector("#readingScore");
const resetReadingButton = document.querySelector("#resetReadingButton");
const listeningTonePanel = document.querySelector("#listeningTonePanel");
const listeningScenePanel = document.querySelector("#listeningScenePanel");
const listeningSceneQuestions = document.querySelector("#listeningSceneQuestions");
const listeningSceneScore = document.querySelector("#listeningSceneScore");
const sceneTranscriptBox = document.querySelector("#sceneTranscriptBox");
const playSceneAudioButton = document.querySelector("#playSceneAudioButton");
const showSceneTranscriptButton = document.querySelector("#showSceneTranscriptButton");
const listeningPrompt = document.querySelector("#listeningPrompt");
const listeningProgress = document.querySelector("#listeningProgress");
const listeningHint = document.querySelector("#listeningHint");
const toneOptions = document.querySelector("#toneOptions");
const playListeningButton = document.querySelector("#playListeningButton");
const voiceToneButton = document.querySelector("#voiceToneButton");
const resetListeningButton = document.querySelector("#resetListeningButton");
const speakingTarget = document.querySelector("#speakingTarget");
const speakingPinyin = document.querySelector("#speakingPinyin");
const speakingMode = document.querySelector("#speakingMode");
const playTargetButton = document.querySelector("#playTargetButton");
const shadowButton = document.querySelector("#shadowButton");
const speakingScore = document.querySelector("#speakingScore");
const dialogueRole = document.querySelector("#dialogueRole");
const dialogueTask = document.querySelector("#dialogueTask");
const dialogueChoices = document.querySelector("#dialogueChoices");
const dialogueInput = document.querySelector("#dialogueInput");
const dialogueRecordButton = document.querySelector("#dialogueRecordButton");
const sendDialogueButton = document.querySelector("#sendDialogueButton");
const dialogueScore = document.querySelector("#dialogueScore");
const writingTarget = document.querySelector("#writingTarget");
const writingMode = document.querySelector("#writingMode");
const traceToggle = document.querySelector("#traceToggle");
const writingCanvas = document.querySelector("#writingCanvas");
const particleCanvas = document.querySelector("#particleCanvas");
const traceCharacter = document.querySelector("#traceCharacter");
const undoStrokeButton = document.querySelector("#undoStrokeButton");
const clearCanvasButton = document.querySelector("#clearCanvasButton");
const writingScore = document.querySelector("#writingScore");
const writingSentencePrompt = document.querySelector("#writingSentencePrompt");
const writingSentenceInput = document.querySelector("#writingSentenceInput");
const evaluateWritingSentenceButton = document.querySelector("#evaluateWritingSentenceButton");
const writingSentenceScore = document.querySelector("#writingSentenceScore");

const storageKey = "chinese-speaking-coach-state";
const targetSampleRate = 16000;
const defaultPersona = {
  name: "Luming",
  role: "\u4e2d\u6587\u542c\u8bf4\u8bfb\u5199\u573a\u666f\u8bad\u7ec3\u6559\u7ec3",
  personality: "\u6e29\u548c\u3001\u6e05\u6670\u3001\u53cd\u9988\u7cbe\u51c6",
  speakingStyle: "\u7528\u81ea\u7136\u4e2d\u6587\u5e26\u5b66\u4e60\u8005\u5b8c\u6210\u771f\u5b9e\u573a\u666f\u4efb\u52a1",
  scenario: "\u56f4\u7ed5\u771f\u5b9e\u4e2d\u6587\u573a\u666f\u8bad\u7ec3\u542c\u8bf4\u8bfb\u5199",
  avatar: "/coach-avatar.png"
};
const greeting = {
  chinese: "\u4f60\u597d\uff0c\u6211\u662f Luming\u3002\u4eca\u5929\u6211\u4eec\u7528\u771f\u5b9e\u573a\u666f\u7ec3\u542c\u8bf4\u8bfb\u5199\u3002",
  pinyin: "N\u01d0 h\u01ceo, w\u01d2 sh\u00ec Luming. J\u012bnti\u0101n w\u01d2men y\u00f2ng zh\u0113nsh\u00ed ch\u01cengj\u01d0ng li\u00e0n t\u012bng shu\u014d d\u00fa xi\u011b.",
  explanation: "Hi, I'm Luming. Today we will practice listening, speaking, reading, and writing through real scenarios.",
  suggestion: "\u5148\u9009\u4e00\u4e2a\u573a\u666f\uff0c\u518d\u8fdb\u5165\u542c\u8bf4\u8bfb\u5199\u7ec3\u4e60\u3002"
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
let currentCourse = null;
let courses = [];
let writingCtx = null;
let particleCtx = null;
let writingStrokes = [];
let activeStroke = null;
let currentMode = "chat";
let readingState = null;
let readingLessonIndex = 0;
let readingLayer = "shape";
let readingSceneLevel = "basic";
let listeningState = null;
let listeningSceneAnswers = {};
let dialogueTurns = [];
let voiceToneRecording = false;
let dialogueRecording = false;

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
    const turns = Array.isArray(saved.turns)
      ? saved.turns.filter((turn) => !String(turn.chinese || turn.text || "").includes("\u6211\u662f\u82cf\u68e0")).slice(-40)
      : [];
    return {
      persona: saved.persona || defaultPersona,
      turns,
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
    course: exercise.course || payload.course || null,
    reading: {
      items: Array.isArray(exercise.reading?.items) && exercise.reading.items.length > 0 ? exercise.reading.items.slice(0, 4) : fallback.reading.items,
      lesson: Array.isArray(exercise.reading?.lesson) ? exercise.reading.lesson : [],
      passage: exercise.reading?.passage || "",
      basicPassage: exercise.reading?.basicPassage || exercise.reading?.passage || "",
      advancedPassage: exercise.reading?.advancedPassage || exercise.reading?.passage || "",
      advancedSentences: Array.isArray(exercise.reading?.advancedSentences) ? exercise.reading.advancedSentences : [],
      lexicon: exercise.reading?.lexicon || {},
      questions: Array.isArray(exercise.reading?.questions) ? exercise.reading.questions : []
    },
    listening: {
      items: Array.isArray(exercise.listening?.items) && exercise.listening.items.length > 0 ? exercise.listening.items.slice(0, 4) : fallback.listening.items,
      scene: exercise.listening?.scene || null
    },
    speaking: {
      text: speakingText,
      pinyin: pinyinForText(speakingText, exercise.speaking?.pinyin || payload.pinyin || "") || fallback.speaking.pinyin,
      role: exercise.speaking?.role || "",
      choices: Array.isArray(exercise.speaking?.choices) ? exercise.speaking.choices : []
    },
    writing: {
      items: Array.isArray(exercise.writing?.items) && exercise.writing.items.length > 0 ? exercise.writing.items.slice(0, 3) : fallback.writing.items,
      sentencePrompt: exercise.writing?.sentencePrompt || ""
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
  if (currentExercise.course) currentCourse = currentExercise.course;
  speakingTarget.textContent = currentExercise.speaking.text;
  speakingPinyin.textContent = currentExercise.speaking.pinyin || "";
  dialogueRole.textContent = currentExercise.speaking.role || "\u8bf7\u5148\u9009\u62e9\u573a\u666f\u8bfe\u7a0b\u3002";
  dialogueTask.textContent = "\u5b8c\u6210 4-5 \u8f6e\u573a\u666f\u5bf9\u8bdd\uff0cLuming \u4f1a\u540c\u65f6\u7ed9\u51fa\u56de\u5e94\u548c\u58f0\u8c03\u53cd\u9988\u3002";
  dialogueChoices.innerHTML = (currentExercise.speaking.choices || []).map((choice) => `
    <button class="choice-button" type="button" data-choice="${escapeHtml(choice)}">${escapeHtml(choice)}</button>
  `).join("");
  writingTarget.innerHTML = "";
  for (const item of currentExercise.writing.items) {
    const option = document.createElement("option");
    option.value = item.text;
    option.textContent = item.text;
    option.dataset.type = item.type || "character";
    option.dataset.hint = item.hint || "";
    writingTarget.appendChild(option);
  }
  readingLessonIndex = 0;
  readingLayer = "shape";
  readingSceneLevel = "basic";
  readingHanziPopover.hidden = true;
  readingSentenceInput.value = "";
  readingSceneScore.innerHTML = "";
  resetReadingGame();
  resetListeningGame();
  renderCharacterLesson();
  renderReadingScene();
  renderListeningScene();
  updateTraceCharacter();
  writingSentencePrompt.textContent = currentExercise.writing.sentencePrompt || "\u7528\u76ee\u6807\u5b57\u5199\u4e00\u53e5\u8bdd\u3002";
  clearWritingCanvas();
}

async function loadCourses() {
  try {
    const response = await fetch("/api/courses");
    const data = await response.json();
    courses = Array.isArray(data.courses) ? data.courses : [];
    courseSelect.innerHTML = courses.map((course) => `<option value="${escapeHtml(course.id)}">${escapeHtml(course.scene)}</option>`).join("");
    if (courses[0]) await loadCourse(courses[0].id);
  } catch {
    courseSummary.textContent = "\u573a\u666f\u8bfe\u7a0b\u52a0\u8f7d\u5931\u8d25\uff0c\u53ef\u7ee7\u7eed\u4f7f\u7528\u5f53\u524d\u804a\u5929\u7ec3\u4e60\u3002";
  }
}

async function loadCourse(courseId) {
  const response = await fetch(`/api/courses/${encodeURIComponent(courseId)}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "\u8bfe\u7a0b\u52a0\u8f7d\u5931\u8d25");
  currentCourse = data;
  courseSummary.textContent = `${data.level || ""} · ${data.summary || data.scene || ""}`;
  setCurrentExercise({ chinese: data.dialogue?.map((item) => item.text).join(""), pinyin: data.dialogue?.map((item) => item.pinyin).join(" "), exercise: data.exercise });
}

function switchSubmode(skill, submode) {
  submodeTabs.forEach((tab) => {
    if (tab.dataset.skill !== skill) return;
    tab.classList.toggle("active", tab.dataset.submode === submode);
  });
  document.querySelectorAll(`[data-${skill}-panel]`).forEach((panel) => {
    panel.classList.toggle("active", panel.dataset[`${skill}Panel`] === submode);
  });
}

function selectedReadingCharacter() {
  const lesson = currentExercise?.reading?.lesson || [];
  if (readingLessonIndex >= lesson.length) readingLessonIndex = 0;
  return lesson[readingLessonIndex] || null;
}

function renderStrokeSvg(item = {}) {
  const char = [...String(item.text || "")][0] || "";
  if (!char) return `<div class="stroke-fallback"></div>`;
  return `
    <div class="stroke-demo hanzi-writer-target" id="hanziStrokeDemo" data-hanzi="${escapeHtml(char)}" role="img" aria-label="${escapeHtml(char)} 笔顺动画">
      <div class="stroke-loading">加载真实笔顺...</div>
    </div>
  `;
}

function showStaticStrokeFallback(target, char, message) {
  if (!target) return;
  target.classList.add("stroke-static");
  target.innerHTML = `
    <div class="stroke-fallback">${escapeHtml(char || "")}</div>
    <p class="target-hint">${escapeHtml(message)}</p>
  `;
}

async function initHanziStroke(item = {}) {
  const target = document.getElementById("hanziStrokeDemo");
  const char = target?.dataset?.hanzi || [...String(item.text || "")][0] || "";
  if (!target || !char) return;

  try {
    const response = await fetch(`/hanzi-data/${encodeURIComponent(char)}.json`);
    if (!response.ok) throw new Error("missing stroke data");
    const charData = await response.json();
    const strokes = Array.isArray(charData.strokes) ? charData.strokes : [];
    if (!strokes.length) throw new Error("invalid stroke data");
    if (target.dataset.hanzi !== char) return;
    target.classList.remove("stroke-static");
    target.innerHTML = `
      <svg class="stroke-demo hanzi-data-stroke" viewBox="0 0 1024 1024" role="img" aria-label="${escapeHtml(char)} 真实笔顺">
        <line x1="512" y1="0" x2="512" y2="1024"></line>
        <line x1="0" y1="512" x2="1024" y2="512"></line>
        <g transform="translate(0 900) scale(1 -1)">
          ${strokes.map((path, index) => `<path style="--stroke-order:${index}" d="${escapeHtml(path)}"></path>`).join("")}
        </g>
      </svg>
    `;
  } catch {
    showStaticStrokeFallback(target, char, "暂无这个字的本地真实笔顺数据，不播放简化假动画。");
  }
}

function renderReadingCharacterPicker(lesson) {
  readingCharacterPicker.innerHTML = lesson.map((item, index) => `
    <button class="choice-button ${index === readingLessonIndex ? "selected" : ""}" type="button" data-reading-character="${index}">
      ${escapeHtml(item.text || "")}
    </button>
  `).join("");
}

function renderReadingLayerTabs() {
  readingLayerTabs.querySelectorAll("[data-reading-layer]").forEach((button) => {
    button.classList.toggle("active", button.dataset.readingLayer === readingLayer);
  });
}

function stripPinyinToneMarks(text = "") {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ü/g, "v").replace(/Ü/g, "V");
}

function splitPinyinSyllable(pinyin = "") {
  const syllable = stripPinyinToneMarks(String(pinyin).split(/[\s,.;]+/)[0] || "").toLowerCase();
  const initials = ["zh", "ch", "sh", "b", "p", "m", "f", "d", "t", "n", "l", "g", "k", "h", "j", "q", "x", "r", "z", "c", "s", "y", "w"];
  const initial = initials.find((value) => syllable.startsWith(value)) || "";
  const final = initial ? syllable.slice(initial.length) : syllable;
  return { initial, final, display: [initial, final].filter(Boolean).join(" ") };
}

const pinyinInitialAudio = {
  b: "播",
  p: "坡",
  m: "摸",
  f: "佛",
  d: "得",
  t: "特",
  n: "呢",
  l: "了",
  g: "哥",
  k: "科",
  h: "喝",
  j: "基",
  q: "七",
  x: "西",
  zh: "知",
  ch: "吃",
  sh: "师",
  r: "日",
  z: "资",
  c: "次",
  s: "思",
  y: "衣",
  w: "乌"
};

const pinyinFinalAudio = {
  a: "啊",
  o: "喔",
  e: "额",
  i: "衣",
  u: "乌",
  v: "迂",
  ü: "迂",
  ai: "哀",
  ei: "诶",
  ui: "威",
  ao: "熬",
  ou: "欧",
  iu: "优",
  ie: "耶",
  ve: "约",
  üe: "约",
  er: "儿",
  an: "安",
  en: "恩",
  in: "因",
  un: "温",
  vn: "晕",
  ün: "晕",
  ang: "昂",
  eng: "亨",
  ing: "鹰",
  ong: "翁",
  ia: "呀",
  iao: "腰",
  ian: "烟",
  iang: "央",
  iong: "雍",
  ua: "哇",
  uo: "窝",
  uai: "歪",
  uan: "弯",
  uang: "汪",
  ueng: "翁"
};

const toneAudioLabels = {
  1: "一声",
  2: "二声",
  3: "三声",
  4: "四声",
  5: "轻声"
};

function pinyinToneFromMarks(pinyin = "") {
  if (/[āēīōūǖ]/i.test(pinyin)) return 1;
  if (/[áéíóúǘ]/i.test(pinyin)) return 2;
  if (/[ǎěǐǒǔǚ]/i.test(pinyin)) return 3;
  if (/[àèìòùǜ]/i.test(pinyin)) return 4;
  return 5;
}

function pinyinAudioText(item = {}, pinyinParts = splitPinyinSyllable(item.pinyin || "")) {
  const initial = pinyinInitialAudio[pinyinParts.initial] || "";
  const final = pinyinFinalAudio[pinyinParts.final] || pinyinParts.final || "";
  const tone = toneAudioLabels[item.tone || pinyinToneFromMarks(item.pinyin || "")] || "轻声";
  const parts = [];
  if (initial) parts.push(`声母${initial}`);
  if (final) parts.push(`韵母${final}`);
  parts.push(tone);
  parts.push(`合起来读，${item.text}，${item.text}`);
  return parts.join("。");
}

function idiomAudioText(item = {}) {
  const idiom = item.idiom || item.text || "";
  const story = item.idiomStory || "";
  const explanation = item.idiomExplanation || `这个表达可以帮助你理解${item.text || "这个字"}的用法。`;
  return `${idiom}。背景故事：${story}。解释：${explanation}`;
}

function renderCharacterLesson() {
  const lesson = currentExercise?.reading?.lesson || [];
  if (!lesson.length) {
    readingCharacterPicker.innerHTML = "";
    readingBoard.classList.add("hidden");
    readingSentenceBox.classList.add("hidden");
    characterLessonBox.innerHTML = `<p class="target-hint">\u6682\u65f6\u6ca1\u6709\u4e03\u5c42\u6c49\u5b57\u6570\u636e\u3002</p>`;
    return;
  }
  const item = selectedReadingCharacter();
  renderReadingCharacterPicker(lesson);
  renderReadingLayerTabs();
  readingBoard.classList.toggle("hidden", readingLayer !== "words");
  readingSentenceBox.classList.toggle("hidden", readingLayer !== "compose");

  if (readingLayer === "shape") {
    characterLessonBox.innerHTML = `
      <div class="character-card lesson-card">
        <div class="character-glyph">${escapeHtml(item.text)}</div>
        <div>
          <p class="label">讲字</p>
          <h3>${escapeHtml(item.text)} · ${escapeHtml(item.pinyin || "")}</h3>
          <p>${escapeHtml(item.story || "")}</p>
          <p class="target-hint">使用本地真实笔顺数据播放；没有数据时只显示静态字形。</p>
        </div>
      </div>
      ${renderStrokeSvg(item)}
    `;
    requestAnimationFrame(() => initHanziStroke(item));
  } else if (readingLayer === "pinyin") {
    const pinyinParts = splitPinyinSyllable(item.pinyin || "");
    const spellText = `${pinyinParts.display || item.pinyin || ""} ${item.text || ""}`.trim();
    const spellAudio = pinyinAudioText(item, pinyinParts);
    characterLessonBox.innerHTML = `
      <div class="lesson-focus">
        <p class="label">讲拼音</p>
        <h3>${escapeHtml(item.text)} · ${escapeHtml(item.pinyin || "")}</h3>
        <p class="pinyin-spell">${escapeHtml(spellText)}</p>
        <p>${escapeHtml(item.pinyinTip || "")}</p>
        <div class="choice-row">
          <button class="play-button" type="button" data-reading-play="${escapeHtml(item.text || "")}">播放标准音</button>
          <button class="play-button" type="button" data-reading-play="${escapeHtml(spellAudio)}">播放拼读</button>
          <button class="primary-button" type="button" data-reading-play="${escapeHtml(item.text || "")}">跟读一遍</button>
        </div>
      </div>
    `;
  } else if (readingLayer === "words") {
    characterLessonBox.innerHTML = `
      <div class="lesson-focus">
        <p class="label">讲组词</p>
        <h3>${escapeHtml((item.words || []).join(" / ") || item.text)}</h3>
        <p class="target-hint">先读词，再完成下面的配对游戏。</p>
      </div>
    `;
  } else if (readingLayer === "idiom") {
    const idiomAudio = idiomAudioText(item);
    characterLessonBox.innerHTML = `
      <div class="lesson-focus">
        <p class="label">讲成语</p>
        <h3>${escapeHtml(item.idiom || item.text)}</h3>
        <p>${escapeHtml(item.idiomStory || "")}</p>
        <p>${escapeHtml(item.idiomExplanation || "")}</p>
        <button class="play-button" type="button" data-reading-play="${escapeHtml(idiomAudio)}">播放背景故事和解释</button>
      </div>
    `;
  } else if (readingLayer === "sentences") {
    characterLessonBox.innerHTML = `
      <div class="lesson-focus">
        <p class="label">讲句子</p>
        <div class="example-list">
          ${(item.examples || []).map((example, index) => `
            <div class="example-row">
              <p><strong>${index + 1}. ${escapeHtml(example.text || "")}</strong></p>
              <p class="target-pinyin">${escapeHtml(example.pinyin || "")}</p>
              <p class="target-hint">${escapeHtml(example.translation || "")}</p>
              <button class="play-button" type="button" data-reading-play="${escapeHtml(example.text || "")}">播放跟读</button>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  } else if (readingLayer === "compose") {
    characterLessonBox.innerHTML = `
      <div class="lesson-focus">
        <p class="label">造句练习</p>
        <h3>用「${escapeHtml(item.text)}」写一句中文</h3>
        <p class="target-hint">${escapeHtml(item.sceneCue || "")}</p>
      </div>
    `;
  } else {
    characterLessonBox.innerHTML = `
      <div class="lesson-focus">
        <p class="label">场景对话</p>
        <h3>把「${escapeHtml(item.text)}」放进真实对话</h3>
        <p>${escapeHtml(item.sceneCue || "")}</p>
        <button class="primary-button" type="button" id="readingToDialogueButton">进入场景对话</button>
      </div>
    `;
  }
}

function renderReadingScene() {
  readingSceneLevelTabs.querySelectorAll("[data-reading-scene-level]").forEach((button) => {
    button.classList.toggle("active", button.dataset.readingSceneLevel === readingSceneLevel);
  });
  const passage = readingSceneLevel === "advanced"
    ? currentExercise?.reading?.advancedPassage || currentExercise?.reading?.passage || ""
    : currentExercise?.reading?.basicPassage || currentExercise?.reading?.passage || "";
  const label = readingSceneLevel === "advanced" ? "高阶场景阅读" : "基础场景阅读";
  readingPassageBox.innerHTML = passage
    ? `<p class="label">${label}</p><p class="reading-passage">${[...passage].map((char) => /\p{Script=Han}/u.test(char) ? `<button class="inline-hanzi" type="button" data-hanzi="${escapeHtml(char)}">${escapeHtml(char)}</button>` : escapeHtml(char)).join("")}</p>`
    : `<p class="target-hint">\u6682\u65f6\u6ca1\u6709\u573a\u666f\u77ed\u6587\u3002</p>`;
  readingQuestions.innerHTML = (currentExercise?.reading?.questions || []).map((question, index) => `
    <div class="question-row">
      <p>${index + 1}. ${escapeHtml(question.prompt || "")}</p>
      <input type="text" data-reading-answer="${index}" placeholder="\u7528\u4e2d\u6587\u56de\u7b54" />
    </div>
  `).join("");
}

function showReadingHanziInfo(button) {
  const char = button?.dataset?.hanzi || button?.textContent || "";
  const info = currentExercise?.reading?.lexicon?.[char] || {};
  readingHanziPopover.hidden = false;
  readingHanziPopover.innerHTML = `
    <strong>${escapeHtml(char)}</strong>
    <span>${escapeHtml(info.pinyin || "\u62fc\u97f3\u5f85\u8865\u5145")}</span>
    <p>${escapeHtml(info.translation || "\u7ed3\u5408\u4e0a\u4e0b\u6587\u7406\u89e3\u8fd9\u4e2a\u5b57\u3002")}</p>
  `;
  playChinese(`${char}\u3002${info.translation || "\u7ed3\u5408\u4e0a\u4e0b\u6587\u7406\u89e3\u8fd9\u4e2a\u5b57\u3002"}`);
}

function renderListeningScene(showTranscript = false) {
  const scene = currentExercise?.listening?.scene;
  if (!scene) return;
  sceneTranscriptBox.innerHTML = `
    <p class="label">\u573a\u666f\u542c\u529b</p>
    <p class="target-text">${escapeHtml(currentCourse?.scene || currentExercise?.course?.scene || "")}</p>
    ${showTranscript ? "" : `<p class="target-hint">\u5148\u542c\u5b8c\u97f3\u9891\u5e76\u56de\u7b54\u95ee\u9898\uff0c\u9700\u8981\u65f6\u518d\u70b9\u51fb\u201c\u67e5\u770b\u6587\u672c\u548c\u62fc\u97f3\u201d\u3002</p>`}
    <div class="transcript-lines ${showTranscript ? "" : "hidden"}">
      ${(scene.dialogue || []).map((line, index) => `
        <button class="transcript-line" type="button" data-line="${index}">
          <strong>${escapeHtml(line.speaker || "Luming")}</strong>
          <span>${escapeHtml(line.text || "")}</span>
          <em>${escapeHtml(line.pinyin || "")}</em>
        </button>
      `).join("")}
    </div>
  `;
  listeningSceneQuestions.innerHTML = (scene.questions || []).map((question) => `
    <div class="question-row" data-question="${escapeHtml(question.id)}">
      <p>${escapeHtml(question.prompt)}</p>
      <div class="choice-row">
        ${(question.options || []).map((option, index) => `<button class="choice-button" type="button" data-question="${escapeHtml(question.id)}" data-answer="${index}">${escapeHtml(option)}</button>`).join("")}
      </div>
    </div>
  `).join("");
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
  const result = {
    attempts: readingState.attempts,
    total: readingState.items.length,
    durationSeconds
  };
  readingScore.innerHTML = `
    <div class="score-card">
      <div class="score-summary"><span>\u914d\u5bf9\u5b8c\u6210</span><strong>\u5b8c\u6210</strong></div>
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

function parseToneFromText(text = "") {
  if (/(\u4e00\u58f0|\u7b2c\u4e00\u58f0|1|first)/i.test(text)) return 1;
  if (/(\u4e8c\u58f0|\u7b2c\u4e8c\u58f0|2|second)/i.test(text)) return 2;
  if (/(\u4e09\u58f0|\u7b2c\u4e09\u58f0|3|third)/i.test(text)) return 3;
  if (/(\u56db\u58f0|\u7b2c\u56db\u58f0|4|fourth)/i.test(text)) return 4;
  if (/(\u8f7b\u58f0|\u7b2c\u4e94\u58f0|5|neutral)/i.test(text)) return 5;
  return 0;
}

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
    voiceToneButton.disabled = true;
    listeningScore.innerHTML = `<div class="score-card muted-card">\u9700\u8981\u5e26\u58f0\u8c03\u7684\u62fc\u97f3\u624d\u80fd\u751f\u6210\u542c\u529b\u9898\u3002</div>`;
    return;
  }

  if (listeningState.completed) {
    const total = listeningState.items.length;
    listeningPrompt.textContent = "\u542c\u529b\u7ec3\u4e60\u5b8c\u6210";
    listeningProgress.textContent = "\u5b8c\u6210";
    listeningHint.textContent = "";
    toneOptions.innerHTML = "";
    voiceToneButton.disabled = true;
    listeningScore.innerHTML = `
      <div class="score-card">
        <div class="score-summary"><span>\u58f0\u8c03\u9009\u62e9</span><strong>\u5b8c\u6210</strong></div>
        <p class="transcript">\u7b54\u5bf9 ${listeningState.correct} / ${total} \u9898\u3002</p>
      </div>
    `;
    if (!listeningState.recorded) {
      listeningState.recorded = true;
      rememberSkillResult({ type: "listening", target: listeningState.items.map((item) => item.text).join(""), result: { correct: listeningState.correct, total } });
    }
    return;
  }

  const item = listeningState.items[listeningState.index];
  listeningPrompt.textContent = item.text;
  listeningProgress.textContent = `${listeningState.index + 1} / ${listeningState.items.length}`;
  listeningHint.textContent = "\u64ad\u653e\u540e\u9009\u58f0\u8c03\uff0c\u6216\u8005\u8bf4\u51fa\u201c\u4e00\u58f0\u201d\u7b49\u7b54\u6848\u3002";
  voiceToneButton.disabled = Boolean(listeningState.selectedTone);
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
  if (!button) return;
  const tone = Number(button.dataset.tone);
  submitToneAnswer(tone);
}

function submitToneAnswer(tone, context = {}) {
  if (!tone || listeningState.completed || listeningState.selectedTone) return;
  const item = listeningState.items[listeningState.index];
  listeningState.selectedTone = tone;
  if (tone === item.tone) listeningState.correct += 1;
  const expectedLabel = toneChoices.find((choice) => choice.tone === item.tone)?.label || "";
  const transcriptLine = context.transcript ? `<p class="transcript">\u8bc6\u522b\uff1a${escapeHtml(context.transcript)}</p>` : "";
  const feedbackItems = Array.isArray(context.feedback) && context.feedback.length
    ? `<ul class="feedback-list">${context.feedback.slice(0, 2).map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>`
    : `<p class="transcript">${tone === item.tone ? "\u9009\u5bf9\u4e86\u3002" : `\u8fd9\u4e2a\u5b57\u662f ${expectedLabel}\u3002`}</p>`;
  listeningScore.innerHTML = `
    <div class="score-card muted-card">
      ${transcriptLine}
      ${feedbackItems}
    </div>
  `;
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

function correctnessHtml(correctness = {}) {
  if (!correctness || !correctness.status) return "";
  const labels = {
    correct: "\u6b63\u786e",
    partial: "\u57fa\u672c\u6b63\u786e",
    incorrect: "\u9700\u4fee\u6539"
  };
  const label = labels[correctness.status] || "\u5df2\u5224\u8bfb";
  const feedback = correctness.feedback ? `<p class="score-note">${escapeHtml(correctness.feedback)}</p>` : "";
  const revision = correctness.suggestedRevision ? `<p class="score-note">\u53c2\u8003\u8bf4\u6cd5\uff1a${escapeHtml(correctness.suggestedRevision)}</p>` : "";
  return `
    <p class="transcript"><span>\u5224\u8bfb\uff1a</span>${escapeHtml(label)}</p>
    ${feedback}
    ${revision}
  `;
}

function renderFeedback(container, result = {}) {
  if (!result) {
    container.innerHTML = "";
    return;
  }
  const feedback = Array.isArray(result.feedback) ? result.feedback.map((item) => `<li>${escapeHtml(item)}</li>`).join("") : "";
  const modeLabels = {
    audio: "\u8bed\u97f3\u5224\u8bfb",
    transcript: "\u8f6c\u5199\u53c2\u8003",
    trace: "\u4e34\u6479",
    free: "\u81ea\u7531\u4e66\u5199",
    ai: "AI \u53c2\u8003",
    "ai+stroke": "AI + \u7b14\u987a\u53c2\u8003",
    stroke: "\u7b14\u987a\u81ea\u67e5",
    "stroke-fallback": "\u7b14\u987a\u81ea\u67e5",
    fallback: "\u672c\u5730\u53c2\u8003",
    scene: "\u573a\u666f\u7ec3\u4e60",
    "reading-sentence": "\u9020\u53e5\u53cd\u9988",
    "writing-sentence": "\u9020\u53e5\u53cd\u9988",
    self: "\u81ea\u67e5",
    "self-fallback": "\u81ea\u67e5"
  };
  const modeLabel = modeLabels[result.modeUsed] || modeLabels[result.modeRequested] || result.modeUsed || result.modeRequested || "";
  const fallbackNote = result.modeRequested === "audio" && result.modeUsed !== "audio" ? `<p class="score-note">\u672a\u4f7f\u7528\u97f3\u9891\u53c2\u8003\uff0c\u5df2\u5207\u56de\u8f6c\u5199\u53c2\u8003\u3002</p>` : "";
  const fallbackReasons = {
    "vision-not-configured": "\u672a\u914d\u7f6e\u53ef\u7528\u7684\u89c6\u89c9\u6a21\u578b\u3002",
    "invalid-image": "\u624b\u5199\u56fe\u7247\u65e0\u6548\uff0c\u8bf7\u6e05\u7a7a\u540e\u91cd\u5199\u3002",
    "vision-request-failed": "\u89c6\u89c9\u8bf7\u6c42\u5931\u8d25\uff0c\u8bf7\u6539\u7528\u81ea\u67e5\u3002",
    "vision-invalid-response": "\u89c6\u89c9\u6a21\u578b\u672a\u8fd4\u56de\u6709\u6548\u53c2\u8003\uff0c\u8bf7\u6539\u7528\u81ea\u67e5\u3002",
    "vision-timeout": "\u89c6\u89c9\u8bf7\u6c42\u8d85\u65f6\uff0c\u8bf7\u6539\u7528\u81ea\u67e5\u3002"
  };
  const reasonNote = result.fallbackReason ? `<p class="score-note">${escapeHtml(fallbackReasons[result.fallbackReason] || result.fallbackReason)}</p>` : "";
  const audioMetrics = result.audioMetrics ? `
    <p class="score-note">
      \u5f55\u97f3 ${escapeHtml(result.audioMetrics.durationSeconds)}s\uff0c\u6709\u6548\u8bed\u97f3 ${Math.round(Number(result.audioMetrics.voicedRatio || 0) * 100)}%\uff0c\u505c\u987f ${escapeHtml(result.audioMetrics.pauseCount)} \u6b21
    </p>
  ` : "";
  const recognizedText = result.recognizedText ? `<p class="score-note">\u8bc6\u522b\uff1a${escapeHtml(result.recognizedText)}</p>` : "";
  const suggestedRevision = result.suggestedRevision ? `<p class="score-note">\u53c2\u8003\u6539\u5199\uff1a${escapeHtml(result.suggestedRevision)}</p>` : "";
  const scoreValue = Number(result.score);
  const summaryValue = Number.isFinite(scoreValue) ? `${Math.round(scoreValue)}\u5206` : "\u5b8c\u6210";
  container.innerHTML = `
    <div class="score-card">
      <div class="score-summary">
        <span>${escapeHtml(modeLabel || "\u7ec3\u4e60\u53cd\u9988")}</span>
        <strong>${summaryValue}</strong>
      </div>
      ${fallbackNote}
      ${reasonNote}
      ${audioMetrics}
      ${recognizedText}
      ${suggestedRevision}
      ${correctnessHtml(result.correctness)}
      ${result.transcript ? `<p class="transcript"><span>识别：</span>${escapeHtml(result.transcript)}</p>` : ""}
      ${feedback ? `<ul class="feedback-list">${feedback}</ul>` : ""}
    </div>
  `;
}

function updateSkillBusy(busy) {
  shadowButton.disabled = busy;
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
    shadowButton.textContent = "\u7ed3\u675f\u8ddf\u8bfb";
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
  if (!shadowPcmChunks.length) {
    speakingScore.innerHTML = `<div class="score-card muted-card">\u6ca1\u6709\u5f55\u5230\u8bed\u97f3\uff0c\u8bf7\u91cd\u65b0\u8ddf\u8bfb\u4e00\u904d\u3002</div>`;
    return;
  }
  updateSkillBusy(true);
  speakingScore.innerHTML = `<div class="score-card muted-card">Luming \u6b63\u5728\u8bc6\u522b\u5e76\u5224\u8bfb\u4f60\u7684\u8ddf\u8bfb...</div>`;
  try {
    const formData = new FormData();
    formData.append("targetText", currentExercise.speaking.text);
    formData.append("targetPinyin", currentExercise.speaking.pinyin || "");
    formData.append("mode", speakingMode.value === "transcript" ? "transcript" : "audio");
    formData.append("audio", new Blob(shadowPcmChunks, { type: "application/octet-stream" }), "shadow.pcm");
    const response = await fetch("/api/speaking/evaluate", { method: "POST", body: formData });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "\u8ddf\u8bfb\u5224\u8bfb\u5931\u8d25");
    renderFeedback(speakingScore, result);
    rememberSkillResult({ type: "speaking", target: currentExercise.speaking.text, result });
  } catch (error) {
    speakingScore.innerHTML = "";
    addError(error.message || "\u8ddf\u8bfb\u5224\u8bfb\u5931\u8d25\u3002");
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
  particleCtx = particleCanvas?.getContext("2d") || null;
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
    y: ((source.clientY - rect.top) / rect.height) * writingCanvas.height,
    t: Date.now()
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

function applyWritingMode({ clear = true } = {}) {
  traceToggle.checked = writingMode.value === "trace";
  updateTraceCharacter();
  if (clear) clearWritingCanvas();
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

async function evaluateReadingSentence(source = "reading") {
  const input = source === "writing" ? writingSentenceInput : readingSentenceInput;
  const container = source === "writing" ? writingSentenceScore : readingScore;
  const prompt = source === "writing" ? currentExercise?.writing?.sentencePrompt : "\u7528\u76ee\u6807\u5b57\u9020\u4e00\u53e5\u4e2d\u6587\u3002";
  if (!input.value.trim()) return;
  container.innerHTML = `<div class="score-card muted-card">Luming \u6b63\u5728\u770b\u4f60\u7684\u53e5\u5b50...</div>`;
  let result;
  try {
    const response = await fetch("/api/reading/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: source === "writing" ? "writing-sentence" : "reading-sentence",
        courseId: currentCourse?.id || currentExercise?.course?.id || "",
        character: selectedReadingCharacter()?.text || currentExercise?.writing?.items?.[0]?.text || "",
        text: input.value,
        prompt
      })
    });
    result = await response.json();
    if (!response.ok) throw new Error(result.error || "\u9020\u53e5\u53cd\u9988\u5931\u8d25\u3002");
  } catch {
    result = {
      modeUsed: source === "writing" ? "writing-sentence" : "reading-sentence",
      completed: true,
      feedback: [
        "\u5df2\u5b8c\u6210\u9020\u53e5\u7ec3\u4e60\u3002",
        prompt || "\u8bf7\u5bf9\u7167\u5f53\u524d\u573a\u666f\uff0c\u68c0\u67e5\u53e5\u5b50\u662f\u5426\u81ea\u7136\u3002"
      ],
      suggestedRevision: input.value
    };
  }
  renderFeedback(container, result);
  rememberSkillResult({ type: source === "writing" ? "writing-sentence" : "reading-sentence", target: input.value, result });
}

async function evaluateReadingScene() {
  const inputs = [...readingQuestions.querySelectorAll("[data-reading-answer]")];
  const answers = inputs.map((input) => input.value.trim());
  const questions = currentExercise?.reading?.questions || [];
  const rows = questions.map((question, index) => {
    const answer = answers[index] || "";
    const reference = String(question.answer || "");
    const hit = answer && (reference.includes(answer) || answer.includes(reference));
    return `<li>${hit ? "\u547d\u4e2d" : "\u53c2\u8003"}：${escapeHtml(question.prompt || "")} / ${escapeHtml(reference || "\u8bf7\u56de\u5230\u77ed\u6587\u91cc\u627e\u5173\u952e\u53e5")}</li>`;
  }).join("");
  readingSceneScore.innerHTML = `
    <div class="score-card">
      <div class="score-summary"><span>\u9605\u8bfb\u7406\u89e3</span><strong>\u5df2\u8bb0\u5f55</strong></div>
      <p class="transcript">\u5df2\u56de\u7b54 ${answers.filter(Boolean).length} / ${questions.length} \u9898\u3002</p>
      <ul class="feedback-list">${rows}</ul>
    </div>
  `;
  rememberSkillResult({ type: "reading-scene", target: currentCourse?.scene || "", result: { answers } });
}

async function evaluateListeningScene() {
  const total = currentExercise?.listening?.scene?.questions?.length || 0;
  listeningSceneScore.innerHTML = `
    <div class="score-card">
      <div class="score-summary"><span>\u573a\u666f\u542c\u529b</span><strong>\u5df2\u5b8c\u6210</strong></div>
      <p class="transcript">\u5df2\u56de\u7b54 ${Object.keys(listeningSceneAnswers).length} / ${total} \u9898\u3002\u53ef\u67e5\u770b\u6587\u672c\u5e76\u70b9\u51fb\u53e5\u5b50\u91cd\u542c\u3002</p>
    </div>
  `;
  rememberSkillResult({ type: "listening-scene", target: currentCourse?.scene || "", result: { answers: listeningSceneAnswers } });
  renderListeningScene(true);
}

function selectListeningAnswer(button) {
  const questionId = button.dataset.question;
  listeningSceneAnswers[questionId] = Number(button.dataset.answer);
  button.parentElement.querySelectorAll(".choice-button").forEach((item) => item.classList.toggle("selected", item === button));
  const total = currentExercise?.listening?.scene?.questions?.length || 0;
  if (Object.keys(listeningSceneAnswers).length >= total) evaluateListeningScene();
}

async function sendDialogue(text = dialogueInput.value) {
  const content = String(text || "").trim();
  if (!content) return;
  dialogueScore.innerHTML = `<div class="score-card muted-card">Luming \u6b63\u5728\u56de\u5e94...</div>`;
  try {
    const response = await fetch("/api/speaking/dialogue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseId: currentCourse?.id || currentExercise?.course?.id || "",
        text: content,
        turns: dialogueTurns
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "\u5bf9\u8bdd\u5931\u8d25");
    dialogueTurns.push({ role: "user", text: content }, { role: "assistant", text: data.roleReply });
    dialogueInput.value = "";
    dialogueTask.textContent = data.nextTask || "";
    dialogueScore.innerHTML = `
      <div class="score-card">
        <div class="score-summary"><span>\u7b2c ${data.round || dialogueTurns.length / 2} \u8f6e</span><strong>\u7ee7\u7eed</strong></div>
        <p class="transcript"><span>\u4f60\uff1a</span>${escapeHtml(content)}</p>
        ${correctnessHtml(data.correctness)}
        <p class="transcript"><span>Luming\uff1a</span>${escapeHtml(data.roleReply || "")}</p>
        <ul class="feedback-list"><li>${escapeHtml(data.toneFeedback || "")}</li></ul>
      </div>
    `;
    rememberSkillResult({ type: "speaking-dialogue", target: currentCourse?.scene || "", result: data });
  } catch (error) {
    dialogueScore.innerHTML = "";
    addError(error.message || "\u5bf9\u8bdd\u5931\u8d25\u3002");
  }
}

async function capturePcmOnce(milliseconds = 2400) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!navigator.mediaDevices?.getUserMedia || !AudioContextClass) throw new Error("\u5f53\u524d\u6d4f\u89c8\u5668\u4e0d\u652f\u6301\u5f55\u97f3\u3002");
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const context = new AudioContextClass();
  const source = context.createMediaStreamSource(stream);
  const processor = context.createScriptProcessor(4096, 1, 1);
  const chunks = [];
  processor.onaudioprocess = (event) => chunks.push(floatTo16KhzPcm(event.inputBuffer.getChannelData(0), context.sampleRate));
  source.connect(processor);
  processor.connect(context.destination);
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
  processor.disconnect();
  source.disconnect();
  stream.getTracks().forEach((track) => track.stop());
  await context.close();
  return new Blob(chunks, { type: "application/octet-stream" });
}

async function transcribeBlob(blob) {
  const formData = new FormData();
  formData.append("audio", blob, "skill.pcm");
  const response = await fetch("/api/transcribe", { method: "POST", body: formData });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "\u8bed\u97f3\u8bc6\u522b\u5931\u8d25");
  return data.transcript || "";
}

async function answerToneByVoice() {
  const item = listeningState?.items?.[listeningState.index];
  if (!item || listeningState.completed || listeningState.selectedTone) return;
  voiceToneButton.disabled = true;
  listeningScore.innerHTML = `<div class="score-card muted-card">\u8bf7\u8bf4\u51fa\u201c\u4e00\u58f0\u201d\u3001\u201c\u4e8c\u58f0\u201d\u7b49\u7b54\u6848...</div>`;
  try {
    const transcript = await transcribeBlob(await capturePcmOnce(2600));
    let data = {};
    try {
      const response = await fetch("/api/listening/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "tone-voice",
          courseId: currentCourse?.id || currentExercise?.course?.id || "",
          text: item.text,
          pinyin: item.pinyin,
          expectedTone: item.tone,
          answerText: transcript
        })
      });
      data = await response.json();
      if (!response.ok) throw new Error(data.error || "\u58f0\u8c03\u5224\u65ad\u5931\u8d25\u3002");
    } catch {
      data = {
        modeUsed: "local-fallback",
        answerTone: parseToneFromText(transcript),
        feedback: []
      };
    }
    const tone = Number(data.answerTone || parseToneFromText(transcript));
    if (!tone) throw new Error("\u6ca1\u6709\u8bc6\u522b\u5230\u660e\u786e\u7684\u58f0\u8c03\u7b54\u6848\u3002");
    submitToneAnswer(tone, { transcript, feedback: data.feedback });
  } catch (error) {
    listeningScore.innerHTML = "";
    addError(error.message || "\u8bed\u97f3\u56de\u7b54\u5931\u8d25\u3002");
  } finally {
    voiceToneButton.disabled = Boolean(listeningState?.selectedTone || listeningState?.completed);
  }
}

async function recordDialogueReply() {
  dialogueRecordButton.disabled = true;
  dialogueScore.innerHTML = `<div class="score-card muted-card">\u8bf7\u7528\u4e2d\u6587\u8bf4\u51fa\u4f60\u7684\u56de\u5e94...</div>`;
  try {
    const transcript = await transcribeBlob(await capturePcmOnce(3600));
    dialogueInput.value = transcript;
    await sendDialogue(transcript);
  } catch (error) {
    addError(error.message || "\u8bed\u97f3\u5bf9\u8bdd\u5931\u8d25\u3002");
  } finally {
    dialogueRecordButton.disabled = false;
  }
}

function runInkParticles() {
  if (!particleCanvas || !particleCtx) return;
  particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
  const particles = Array.from({ length: 80 }, () => ({
    x: Math.random() * particleCanvas.width,
    y: Math.random() * particleCanvas.height,
    r: Math.random() * 2 + 1,
    a: 1
  }));
  let frame = 0;
  function draw() {
    particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
    particleCtx.fillStyle = "rgba(190, 142, 50, 0.8)";
    for (const particle of particles) {
      particle.x += (particleCanvas.width / 2 - particle.x) * 0.035;
      particle.y += (particleCanvas.height / 2 - particle.y) * 0.035;
      particle.a *= 0.985;
      particleCtx.globalAlpha = particle.a;
      particleCtx.beginPath();
      particleCtx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
      particleCtx.fill();
    }
    particleCtx.globalAlpha = 1;
    frame += 1;
    if (frame < 80) requestAnimationFrame(draw);
    else particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
  }
  draw();
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

submodeTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    if (tab.dataset.skill) switchSubmode(tab.dataset.skill, tab.dataset.submode);
  });
});

courseSelect.addEventListener("change", () => loadCourse(courseSelect.value).catch((error) => addError(error.message)));

readingCharacterPicker.addEventListener("click", (event) => {
  const button = event.target.closest("[data-reading-character]");
  if (!button) return;
  readingLessonIndex = Number(button.dataset.readingCharacter) || 0;
  resetReadingGame();
  readingScore.innerHTML = "";
  renderCharacterLesson();
});
readingLayerTabs.addEventListener("click", (event) => {
  const button = event.target.closest("[data-reading-layer]");
  if (!button) return;
  readingLayer = button.dataset.readingLayer || "shape";
  resetReadingGame();
  readingScore.innerHTML = "";
  renderCharacterLesson();
});
readingSceneLevelTabs.addEventListener("click", (event) => {
  const button = event.target.closest("[data-reading-scene-level]");
  if (!button) return;
  readingSceneLevel = button.dataset.readingSceneLevel || "basic";
  readingHanziPopover.hidden = true;
  readingSceneScore.innerHTML = "";
  renderReadingScene();
});
characterLessonBox.addEventListener("click", (event) => {
  const playButton = event.target.closest("[data-reading-play]");
  if (playButton) {
    playChinese(playButton.dataset.readingPlay || "");
    return;
  }
  if (event.target.closest("#readingToDialogueButton")) {
    setMode("speak");
    switchSubmode("speak", "dialogue");
  }
});
readingTextCards.addEventListener("click", handleReadingCardClick);
readingPinyinCards.addEventListener("click", handleReadingCardClick);
resetReadingButton.addEventListener("click", resetReadingGame);
evaluateReadingButton.addEventListener("click", () => evaluateReadingSentence("reading"));
readingQuestions.addEventListener("change", evaluateReadingScene);
readingPassageBox.addEventListener("click", (event) => {
  const button = event.target.closest(".inline-hanzi");
  if (button) showReadingHanziInfo(button);
});
toneOptions.addEventListener("click", handleToneChoice);
playListeningButton.addEventListener("click", () => {
  const item = listeningState?.items?.[listeningState.index];
  if (item) playChinese(item.text);
});
resetListeningButton.addEventListener("click", resetListeningGame);
voiceToneButton.addEventListener("click", answerToneByVoice);
playSceneAudioButton.addEventListener("click", () => playChinese((currentExercise?.listening?.scene?.dialogue || []).map((line) => line.text).join("\n")));
showSceneTranscriptButton.addEventListener("click", () => renderListeningScene(true));
sceneTranscriptBox.addEventListener("click", (event) => {
  const line = event.target.closest(".transcript-line");
  const item = currentExercise?.listening?.scene?.dialogue?.[Number(line?.dataset.line)];
  if (item) playChinese(item.text);
});
listeningSceneQuestions.addEventListener("click", (event) => {
  const button = event.target.closest(".choice-button");
  if (button) selectListeningAnswer(button);
});

playTargetButton.addEventListener("click", () => playChinese(currentExercise?.speaking?.text || ""));
shadowButton.addEventListener("click", () => {
  if (shadowRecording) stopShadowRecording();
  else startShadowRecording();
});
dialogueChoices.addEventListener("click", (event) => {
  const button = event.target.closest(".choice-button");
  if (button) sendDialogue(button.dataset.choice || button.textContent);
});
sendDialogueButton.addEventListener("click", () => sendDialogue());
dialogueRecordButton.addEventListener("click", recordDialogueReply);
writingTarget.addEventListener("change", () => {
  applyWritingMode();
});
traceToggle.addEventListener("change", updateTraceCharacter);
undoStrokeButton.addEventListener("click", undoWritingStroke);
clearCanvasButton.addEventListener("click", clearWritingCanvas);
evaluateWritingSentenceButton.addEventListener("click", () => evaluateReadingSentence("writing"));
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
loadCourses();
