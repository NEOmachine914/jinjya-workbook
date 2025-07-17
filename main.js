// questions.html側の処理
window.addEventListener("DOMContentLoaded", function () {
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get("username");
    const examRound = urlParams.get("examRound");
    const questionCount = parseInt(urlParams.get("questionCount"), 10);

    if (!username || !examRound || isNaN(questionCount)) {
        window.location.href = "index.html";
        return;
    }

    // 試しにコンソールに表示
    console.log("受け取ったパラメータ:", {
        username,
        examRound,
        questionCount
    });

    // 問題jsonの読み込み
    fetch(`questions_${examRound}.json`)
        .then(response => response.json())
        .then(data => {
            const questions = shuffleArray(data).slice(0, questionCount);
            startQuiz(questions);
        })
        .catch(error => {
            console.error("問題jsonの読み込みでエラー:", error);
        });
});

function shuffleArray(array) {
    const copied = array.slice();
    for (let i = copied.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copied[i], copied[j]] = [copied[j], copied[i]];
    }
    return copied;
}

function startQuiz(questions) {
    const container = document.querySelector(".container");
    container.innerHTML = "";

    let currentIndex = 0;
    showQuestion();

    function showQuestion() {
        if (currentIndex >= questions.length) {
            container.innerHTML = `<h2>終了</h2>`;
            return;
        }

        const q = questions[currentIndex];
        container.innerHTML = `
            <div>
                <h2>Q${currentIndex + 1}: ${q.question}</h2>
                ${q.choices.map((choice, idx) => `<p><input type="radio" name="choice" value="${idx}"> ${choice}</p>`).join("")}
                <button id="next">次へ</button>
            </div>
        `;

        document.getElementById("next").addEventListener("click", () => {
            currentIndex++;
            showQuestion();
        });
    }
}
