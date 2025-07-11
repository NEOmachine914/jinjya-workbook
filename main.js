
let currentUser = "";
let currentRound = "";
let questions = [];
let currentQuestionIndex = 0;
let correctCount = 0;
let selectedCount = 0;
let mistakeAttributes = [];
let historyKey = "jinjaQuizHistory";

document.addEventListener("DOMContentLoaded", () => {
  const startForm = document.getElementById("startForm");
  if (startForm) {
    startForm.addEventListener("submit", (e) => {
      e.preventDefault();
      currentUser = document.getElementById("username").value;
      currentRound = document.getElementById("examRound").value;
      const count = parseInt(document.getElementById("questionCount").value);
      localStorage.setItem("username", currentUser);
      localStorage.setItem("examRound", currentRound);
      localStorage.setItem("questionCount", count);
      window.location.href = "questions.html";
    });
  }

  if (window.location.pathname.includes("questions.html")) {
    loadQuestions();
  }

  if (window.location.pathname.includes("results.html")) {
    displayResults();
  }
});

function loadQuestions() {
  currentUser = localStorage.getItem("username");
  currentRound = localStorage.getItem("examRound");
  const count = parseInt(localStorage.getItem("questionCount"));

  const roundNumber = currentRound.replace("第", "").replace("回", "");
fetch(`questions_${roundNumber}.json`)
    .then((res) => res.json())
    .then((data) => {
      questions = [];
      data.forEach(group => {
        group.questions.forEach(q => {
          questions.push({
            ...q,
            common_text: group.common_text
          });
        });
      });
      questions = shuffleArray(questions).slice(0, count);
      showQuestion();
    });
}

function showQuestion() {
  const q = questions[currentQuestionIndex];
  document.getElementById("common-text").innerText = q.common_text;
  document.getElementById("question-text").innerText = `Q${currentQuestionIndex + 1}. ${q.question}`;
  const ul = document.getElementById("choices-list");
  ul.innerHTML = "";
  q.choices.forEach((choice, i) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.innerText = choice;
    btn.onclick = () => selectAnswer(i + 1);
    li.appendChild(btn);
    ul.appendChild(li);
  });
  document.getElementById("next-button").disabled = true;
}

function selectAnswer(choice) {
  const q = questions[currentQuestionIndex];
  selectedCount++;
  if (choice === q.answer) {
    correctCount++;
  } else {
    mistakeAttributes.push(q.attribute);
  }
  document.getElementById("next-button").disabled = false;
  const buttons = document.querySelectorAll("#choices-list button");
  buttons.forEach(b => b.disabled = true);
}

document.getElementById("next-button")?.addEventListener("click", () => {
  currentQuestionIndex++;
  if (currentQuestionIndex < questions.length) {
    showQuestion();
  } else {
    saveHistory();
    window.location.href = "results.html";
  }
});

function displayResults() {
  const username = localStorage.getItem("username");
  const count = parseInt(localStorage.getItem("questionCount"));
  const rate = Math.round((correctCount / count) * 100);
  const judgment = rate >= 70 ? "合格" : "不合格";

  document.getElementById("result-username").innerText = username;
  document.getElementById("correct-count").innerText = correctCount;
  document.getElementById("total-count").innerText = count;
  document.getElementById("accuracy-rate").innerText = rate;
  document.getElementById("result-judgment").innerText = judgment;

  const wrongList = document.getElementById("wrong-attributes");
  mistakeAttributes.forEach(attr => {
    const li = document.createElement("li");
    li.innerText = attr;
    wrongList.appendChild(li);
  });

  // 苦手分野累積表示
  const raw = localStorage.getItem(historyKey);
  const allHistory = raw ? JSON.parse(raw) : {};
  const past = allHistory[username] || [];
  past.push(...mistakeAttributes);
  allHistory[username] = past;
  localStorage.setItem(historyKey, JSON.stringify(allHistory));

  const weakMap = {};
  past.forEach(a => {
    weakMap[a] = (weakMap[a] || 0) + 1;
  });
  const sorted = Object.entries(weakMap).sort((a, b) => b[1] - a[1]);

  const weakList = document.getElementById("cumulative-weaknesses");
  sorted.forEach(([attr, count]) => {
    const li = document.createElement("li");
    li.innerText = `${attr}：${count}回`;
    weakList.appendChild(li);
  });
}

function shuffleArray(array) {
  return array
    .map((v) => ({ v, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ v }) => v);
}
