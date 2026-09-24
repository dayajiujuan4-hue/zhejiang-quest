const STORAGE_KEY = "zhejiangQuestState";

const defaultState = {
  totalExp: 0,
  visitedCities: [],
  totalQuizzes: 0
};

let state = loadState();
let currentCity = null;
let quizQuestions = [];
let currentQuestionIndex = 0;
let correctCount = 0;
let quizExp = 0;
let answered = false;
let firstVisit = false;

const homeScreen = document.getElementById("homeScreen");
const quizScreen = document.getElementById("quizScreen");
const resultScreen = document.getElementById("resultScreen");
const cityGrid = document.getElementById("cityGrid");
const levelValue = document.getElementById("levelValue");
const expValue = document.getElementById("expValue");
const expBar = document.getElementById("expBar");
const nextExp = document.getElementById("nextExp");
const visitedValue = document.getElementById("visitedValue");
const completionText = document.getElementById("completionText");
const quizCityName = document.getElementById("quizCityName");
const questionCount = document.getElementById("questionCount");
const questionBar = document.getElementById("questionBar");
const questionNumber = document.getElementById("questionNumber");
const questionText = document.getElementById("questionText");
const choices = document.getElementById("choices");
const feedback = document.getElementById("feedback");
const nextBtn = document.getElementById("nextBtn");
const resultTitle = document.getElementById("resultTitle");
const resultScore = document.getElementById("resultScore");
const resultExp = document.getElementById("resultExp");
const resultBonus = document.getElementById("resultBonus");

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return { ...defaultState };
    return {
      totalExp: Number(saved.totalExp) || 0,
      visitedCities: Array.isArray(saved.visitedCities) ? saved.visitedCities : [],
      totalQuizzes: Number(saved.totalQuizzes) || 0
    };
  } catch {
    return { ...defaultState };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getLevel(exp) {
  return Math.floor(exp / 100) + 1;
}

function updateStatus() {
  const level = getLevel(state.totalExp);
  const progress = state.totalExp % 100;
  const remaining = 100 - progress;

  levelValue.textContent = `Lv.${level}`;
  expValue.textContent = `${state.totalExp} EXP`;
  expBar.style.width = `${progress}%`;
  nextExp.textContent = progress === 0
    ? "次のレベルまで 100 EXP"
    : `次のレベルまで ${remaining} EXP`;

  visitedValue.textContent = `${state.visitedCities.length} / ${zhejiangData.cities.length}`;
  completionText.textContent = `制覇率 ${Math.round(state.visitedCities.length / zhejiangData.cities.length * 100)}%`;
}

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function shuffleChoices(question) {
  const order = shuffle(question.choices.map((_, i) => i));
  return {
    ...question,
    choices: order.map(i => question.choices[i]),
    answer: order.indexOf(question.answer)
  };
}

function renderCities() {
  cityGrid.innerHTML = "";

  zhejiangData.cities.forEach(city => {
    const visited = state.visitedCities.includes(city.id);
    const button = document.createElement("button");
    button.type = "button";
    button.className = `city-card${visited ? " visited" : ""}`;
    button.innerHTML = `
      <span class="tag">${visited ? "訪問済み" : "未訪問"}</span>
      <div class="card-icon">${city.icon}</div>
      <div class="jp">${city.name}</div>
      <div class="cn">${city.pinyin}</div>
      <div class="desc">${city.description}</div>
    `;
    button.addEventListener("click", () => startQuiz(city));
    cityGrid.appendChild(button);
  });
}

function showHome() {
  homeScreen.classList.remove("hidden");
  quizScreen.classList.add("hidden");
  resultScreen.classList.add("hidden");
  renderCities();
  updateStatus();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function startQuiz(city) {
  currentCity = city;
  quizQuestions = shuffle(city.questions).slice(0, 5).map(shuffleChoices);
  currentQuestionIndex = 0;
  correctCount = 0;
  quizExp = 0;
  answered = false;
  firstVisit = !state.visitedCities.includes(city.id);

  homeScreen.classList.add("hidden");
  resultScreen.classList.add("hidden");
  quizScreen.classList.remove("hidden");
  quizCityName.textContent = `${city.name}｜${city.pinyin}`;
  renderQuestion();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderQuestion() {
  const question = quizQuestions[currentQuestionIndex];
  answered = false;

  questionCount.textContent = `第${currentQuestionIndex + 1}問 / 5`;
  questionNumber.textContent = `QUESTION ${String(currentQuestionIndex + 1).padStart(2, "0")}`;
  questionText.textContent = question.question;
  questionBar.style.width = `${((currentQuestionIndex + 1) / 5) * 100}%`;

  choices.innerHTML = "";
  feedback.classList.add("hidden");
  feedback.textContent = "";
  nextBtn.classList.add("hidden");

  question.choices.forEach((choice, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice-btn";
    button.textContent = `${String.fromCharCode(65 + index)}. ${choice}`;
    button.addEventListener("click", () => answerQuestion(index, button));
    choices.appendChild(button);
  });
}

function answerQuestion(selectedIndex, selectedButton) {
  if (answered) return;
  answered = true;

  const question = quizQuestions[currentQuestionIndex];
  const buttons = [...choices.querySelectorAll(".choice-btn")];

  buttons.forEach((button, index) => {
    button.disabled = true;
    if (index === question.answer) button.classList.add("correct");
  });

  if (selectedIndex === question.answer) {
    selectedButton.classList.add("correct");
    correctCount++;
    quizExp += 10;
    feedback.innerHTML = `<strong>正解！</strong><br>${question.explanation}`;
  } else {
    selectedButton.classList.add("wrong");
    feedback.innerHTML = `<strong>不正解。</strong><br>正解は「${question.choices[question.answer]}」です。<br>${question.explanation}`;
  }

  feedback.classList.remove("hidden");
  nextBtn.textContent = currentQuestionIndex === 4 ? "結果を見る" : "次の問題へ";
  nextBtn.classList.remove("hidden");
}

function finishQuiz() {
  let bonus = 0;
  const messages = [];

  if (firstVisit) {
    bonus += 20;
    messages.push("初訪問ボーナス +20 EXP");
    state.visitedCities.push(currentCity.id);
  }

  if (correctCount === 5) {
    bonus += 10;
    messages.push("全問正解ボーナス +10 EXP");
  }

  const gained = quizExp + bonus;
  state.totalExp += gained;
  state.totalQuizzes += 1;
  saveState();
  updateStatus();

  resultTitle.textContent = `${currentCity.name}クエスト完了！`;
  resultScore.textContent = `5問中 ${correctCount}問 正解`;
  resultExp.textContent = `+${gained} EXP`;
  resultBonus.textContent = messages.length ? messages.join("　") : "次は別の都市にも挑戦してみよう。";

  quizScreen.classList.add("hidden");
  resultScreen.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

nextBtn.addEventListener("click", () => {
  if (currentQuestionIndex < 4) {
    currentQuestionIndex++;
    renderQuestion();
  } else {
    finishQuiz();
  }
});

document.getElementById("backBtn").addEventListener("click", showHome);
document.getElementById("resultHomeBtn").addEventListener("click", showHome);

document.getElementById("resetBtn").addEventListener("click", () => {
  const ok = confirm("EXP・レベル・訪問都市など、すべてのゲームデータをリセットします。よろしいですか？");
  if (!ok) return;

  localStorage.removeItem(STORAGE_KEY);
  state = { ...defaultState };
  showHome();
});

updateStatus();
renderCities();
