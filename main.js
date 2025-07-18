
document.addEventListener("DOMContentLoaded", function () {
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get("username") || "ゲスト";
    const examRound = urlParams.get("examRound") || "12";
    const questionCount = parseInt(urlParams.get("questionCount"), 10) || 10;

    const jsonFileName = `questions_${examRound}.json`;

    fetch(jsonFileName)
        .then((response) => {
            if (!response.ok) {
                throw new Error("問題データの取得に失敗しました");
            }
            return response.json();
        })
        .then((data) => {
            if (!data || !Array.isArray(data)) {
                throw new Error("問題データの形式が不正です");
            }

            const allQuestions = data.flatMap(group => group.questions.map(q => ({
                ...q,
                group_id: group.group_id,
                group_comment: group.comment
            })));

            const selectedQuestions = allQuestions.sort(() => 0.5 - Math.random()).slice(0, questionCount);

            sessionStorage.setItem("username", username);
            sessionStorage.setItem("examRound", examRound);
            sessionStorage.setItem("questionCount", questionCount);
            sessionStorage.setItem("questions", JSON.stringify(selectedQuestions));

            window.location.href = "index.html";
        })
        .catch((error) => {
            console.error("読み込みエラー:", error);
            document.getElementById("question-container").innerHTML = `<div class="error">問題データの読み込みに失敗しました</div>`;
        });
});
