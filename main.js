function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

function showQuestion(questionData, index) {
    const questionBox = document.getElementById("question-box");
    const question = questionData[index];

    if (!question) {
        window.location.href = "results.html";
        return;
    }

    const html = `
        <div class="question-title">第${index + 1}問</div>
        <div class="question-text">${question.q}</div>
        <div class="choices">
            ${question.choices.map((choice, i) => `
                <label><input type="radio" name="choice" value="${i}">${choice}</label>
            `).join("")}
        </div>
        <button onclick="submitAnswer(${question.correct})">次へ</button>
    `;
    questionBox.innerHTML = html;
}

function submitAnswer(correct) {
    const choices = document.getElementsByName("choice");
    let selected = -1;
    for (let i = 0; i < choices.length; i++) {
        if (choices[i].checked) {
            selected = parseInt(choices[i].value);
            break;
        }
    }

    if (selected === -1) {
        alert("選択肢を選んでください");
        return;
    }

    const result = {
        question: currentQuestionIndex + 1,
        correct: correct === selected,
    };
    answers.push(result);
    currentQuestionIndex++;
    showQuestion(questions, currentQuestionIndex);
}

let questions = [];
let currentQuestionIndex = 0;
let answers = [];

document.addEventListener("DOMContentLoaded", () => {
    const examRound = getQueryParam("examRound") || "12";
    fetch(`questions_${examRound}.json`)
        .then((response) => response.json())
        .then((data) => {
            questions = data;
            showQuestion(questions, currentQuestionIndex);
        })
        .catch((error) => {
            console.error("読み込み失敗:", error);
            document.getElementById("question-box").innerHTML = "問題データの読み込みに失敗しました";
        });
});
