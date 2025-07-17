// index.html側の処理
if (window.location.pathname.includes("index.html") || window.location.pathname === "/" || window.location.pathname.endsWith("/jinjya-workbook/")) {
    document.getElementById("start-button").addEventListener("click", function () {
        const username = document.getElementById("username").value.trim();
        const examRound = document.getElementById("examRound").value;
        const questionCount = document.getElementById("questionCount").value;

        if (!username) {
            alert("名前を入力してください。");
            return;
        }

        const query = `?username=${encodeURIComponent(username)}&examRound=${examRound}&questionCount=${questionCount}`;
        window.location.href = `questions.html${query}`;
    });
}

// questions.html側の処理
if (window.location.pathname.includes("questions.html")) {
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get("username");
    const examRound = urlParams.get("examRound");
    const questionCount = parseInt(urlParams.get("questionCount"), 10);

    if (!username || !examRound || isNaN(questionCount)) {
        window.location.href = "index.html";
    }
    // ここに問題出題処理を書く
}
