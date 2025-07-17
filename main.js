document.addEventListener("DOMContentLoaded", function () {
    const startButton = document.getElementById("startButton");

    if (startButton) {
        startButton.addEventListener("click", function () {
            const username = document.getElementById("username").value.trim();
            const examRound = document.getElementById("examRound").value;
            const questionCount = document.getElementById("questionCount").value;

            if (!username) {
                alert("名前を入力してください。");
                return;
            }

            const query = `?username=${encodeURIComponent(username)}&examRound=${encodeURIComponent(examRound)}&questionCount=${encodeURIComponent(questionCount)}`;
            window.location.href = "questions.html" + query;
        });
    }
});
