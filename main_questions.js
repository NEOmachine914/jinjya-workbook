// main_questions.js 修正版

document.addEventListener('DOMContentLoaded', () => {
    const username = sessionStorage.getItem('username');
    const examRound = sessionStorage.getItem('examRound');
    const questionCount = parseInt(sessionStorage.getItem('questionCount'));

    if (!username || !examRound || isNaN(questionCount)) {
        document.body.innerHTML = '<p>エラー：必要なデータが見つかりません。最初からやり直してください。</p>';
        return;
    }

    const questionFile = `questions_${examRound}.json`;

    fetch(questionFile)
        .then(response => {
            if (!response.ok) throw new Error(`問題ファイルが読み込めません (${questionFile})`);
            return response.json();
        })
        .then(data => {
            if (!Array.isArray(data) || data.length === 0) {
                throw new Error('問題データが空です');
            }

            const shuffled = data.sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, questionCount);

            sessionStorage.setItem('questions', JSON.stringify(selected));
            sessionStorage.setItem('currentQuestionIndex', '0');
            sessionStorage.setItem('correctAnswers', '0');

            window.location.href = 'questions.html';
        })
        .catch(error => {
            document.body.innerHTML = `<p>エラー: ${error.message}</p>`;
        });
});
