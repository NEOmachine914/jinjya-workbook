document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const username = params.get('username');
    const examRound = params.get('examRound');
    const questionCount = parseInt(params.get('questionCount'), 10);

    if (!username || !examRound || !questionCount) {
        document.body.innerHTML = '<p>必要なパラメータが不足しています。</p>';
        return;
    }

    const questionFile = `questions_${examRound}.json`;

    fetch(questionFile)
        .then(response => {
            if (!response.ok) {
                throw new Error('問題データの読み込みに失敗しました。');
            }
            return response.json();
        })
        .then(data => {
            if (!Array.isArray(data) || data.length === 0) {
                throw new Error('問題データが空です。');
            }

            const selectedQuestions = data.slice(0, questionCount);
            const container = document.getElementById('question-container');
            selectedQuestions.forEach((question, index) => {
                const questionElement = document.createElement('div');
                questionElement.innerHTML = `
                    <h3>問${index + 1}</h3>
                    <p>${question.q}</p>
                    ${question.a.map((answer, i) => `
                        <label><input type="radio" name="q${index}" value="${i}">${answer}</label><br>
                    `).join('')}
                `;
                container.appendChild(questionElement);
            });

            const submitBtn = document.getElementById('submit-btn');
            submitBtn.style.display = 'block';
            submitBtn.addEventListener('click', () => {
                let correct = 0;
                selectedQuestions.forEach((question, index) => {
                    const selected = document.querySelector(`input[name="q${index}"]:checked`);
                    if (selected && parseInt(selected.value) === question.c) {
                        correct++;
                    }
                });
                window.location.href = `results.html?username=${username}&examRound=${examRound}&questionCount=${questionCount}&correct=${correct}`;
            });
        })
        .catch(error => {
            document.getElementById('question-container').innerHTML = `<p>${error.message}</p>`;
        });
});
