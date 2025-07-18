
document.addEventListener("DOMContentLoaded", () => {
  const startButton = document.getElementById("startBtn");
  const usernameInput = document.getElementById("username");
  const examRoundSelect = document.getElementById("examRound");
  const questionCountSelect = document.getElementById("questionCount");

  startButton.addEventListener("click", () => {
    const username = usernameInput.value.trim();
    const examRound = examRoundSelect.value;
    const questionCount = questionCountSelect.value;

    if (username === "") {
      alert("名前を入力してください。");
      return;
    }

    const url = `questions.html?username=${encodeURIComponent(username)}&examRound=${encodeURIComponent(examRound)}&questionCount=${encodeURIComponent(questionCount)}`;
    window.location.href = url;
  });
});
