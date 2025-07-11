let questions = [];
let currentQuestionIndex = 0;

function loadQuestions() {
  currentUser = localStorage.getItem("username");
  currentRound = localStorage.getItem("examRound");
  const count = parseInt(localStorage.getItem("questionCount"));

  // JSONではなくJSの変数から直接読み込む
  const allGroups = questions_12;

  questions = [];
  allGroups.forEach(group => {
    group.questions.forEach(q => {
      questions.push({
        ...q,
        common_text: group.common_text
      });
    });
  });

  questions = shuffleArray(questions).slice(0, count);
  showQuestion();
}

function shuffleArray(array) {
  const shuffled = array.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function showQuestion() {
  const q = questions[currentQuestionIndex];
  document.getElementById("common-text").innerText = q.common_text;
  document.getElementById("question-text").innerText = `問${currentQuestionIndex + 1}. ${q.question}`;

  const ul = document.getElementById("choices-list");
  ul.innerHTML = "";
  q.choices.forEach((choice, index) => {
    const li = document.createElement("li");
    li.innerHTML = `<label><input type="radio" name="choice" value="${index}"> ${choice}</label>`;
    ul.appendChild(li);
  });

  document.getElementById("next-button").disabled = true;
}
