document.addEventListener("DOMContentLoaded", function () {
    const startButton = document.getElementById("start-button");
    if (startButton) {
        startButton.addEventListener("click", function () {
            const currentUser = document.getElementById("username").value;
            const currentRound = document.getElementById("examRound").value;
            const count = parseInt(document.getElementById("questionCount").value);
            localStorage.setItem("username", currentUser);
            localStorage.setItem("examRound", currentRound);
            localStorage.setItem("questionCount", count);
            window.location.href = "questions.html";
        });
    }

    if (window.location.href.includes("questions.html")) {
        loadQuestions();
    }

    if (window.location.href.includes("results.html")) {
        displayResults();
    }
});

function loadQuestions() {
    const currentUser = localStorage.getItem("username");
    const currentRound = localStorage.getItem("examRound");
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
    const questionText = document.getElementById("question-text");
    const commonText = document.getElementById("common-text");
    const answerInput = document.getElementById("answer");
    const nextButton = document.getElementById("next-button");

    if (currentQuestionIndex < questions.length) {
        const q = questions[currentQuestionIndex];
        questionText.textContent = q.question;
        commonText.textContent = q.common_text || "";
        answerInput.value = "";
        nextButton.disabled = false;
    } else {
        saveResults();
    }
}

function saveResults() {
    const currentUser = localStorage.getItem("username");
    const results = questions.map((q, index) => {
        return {
            question: q.question,
            correct_answer: q.answer,
            user_answer: userAnswers[index],
            is_correct: q.answer === userAnswers[index]
        };
    });
    localStorage.setItem("results", JSON.stringify(results));
    window.location.href = "results.html";
}

function displayResults() {
    const resultsContainer = document.getElementById("results-container");
    const results = JSON.parse(localStorage.getItem("results") || "[]");
    const correctCount = results.filter(r => r.is_correct).length;
    const percentage = Math.round((correctCount / results.length) * 100);

    document.getElementById("score").textContent = `正解数: ${correctCount} / ${results.length}（${percentage}%）`;

    results.forEach(r => {
        const div = document.createElement("div");
        div.className = "result-item";
        div.innerHTML = `
            <p><strong>問題:</strong> ${r.question}</p>
            <p><strong>正解:</strong> ${r.correct_answer}</p>
            <p><strong>あなたの答え:</strong> ${r.user_answer}</p>
            <p><strong>${r.is_correct ? "⭕ 正解" : "❌ 不正解"}</strong></p>
            <hr>
        `;
        resultsContainer.appendChild(div);
    });
}

function shuffleArray(array) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

let questions = [];
let currentQuestionIndex = 0;
let userAnswers = [];

document.addEventListener("DOMContentLoaded", () => {
    const nextButton = document.getElementById("next-button");
    if (nextButton) {
        nextButton.addEventListener("click", () => {
            const answer = document.getElementById("answer").value.trim();
            if (answer === "") return;
            userAnswers.push(answer);
            currentQuestionIndex++;
            showQuestion();
        });
    }
});
