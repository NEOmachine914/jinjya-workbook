/**
 * 神社検定問題集アプリケーション
 * ページに応じて初期化処理を呼び出します。
 */
document.addEventListener('DOMContentLoaded', () => {
    const pageId = document.body.id;

    if (pageId === 'page-index') {
        initIndexPage();
    } else if (pageId === 'page-questions') {
        initQuestionsPage();
    } else if (pageId === 'page-results') {
        initResultsPage();
    }
});

/**
 * トップページ (index.html) の初期化
 */
function initIndexPage() {
    const startButton = document.getElementById('start-button');
    const usernameInput = document.getElementById('username');

    startButton.addEventListener('click', () => {
        const username = usernameInput.value.trim();
        const examRound = document.getElementById('examRound').value;
        const questionCount = document.getElementById('questionCount').value;

        if (!username) {
            alert('名前を入力してください。');
            return;
        }

        // ユーザー設定をセッションストレージに保存
        sessionStorage.setItem('quizUser', username);
        sessionStorage.setItem('quizExamRound', examRound);
        sessionStorage.setItem('quizQuestionCount', questionCount);

        // 問題ページに遷移
        window.location.href = 'questions.html';
    });
}

/**
 * 問題ページ (questions.html) の初期化
 */
async function initQuestionsPage() {
    // --- DOM要素の取得 ---
    const progressBar = document.getElementById('progress-bar');
    const questionNumberEl = document.getElementById('question-number');
    const commonPassageEl = document.getElementById('common-passage');
    const questionTextEl = document.getElementById('question-text');
    const optionsEl = document.getElementById('options');
    const nextButton = document.getElementById('next-button');
    const feedbackMessageEl = document.getElementById('feedback-message');

    // --- 設定の読み込み ---
    const examRound = sessionStorage.getItem('quizExamRound');
    const questionCount = parseInt(sessionStorage.getItem('quizQuestionCount'), 10);

    if (!examRound || isNaN(questionCount)) {
        alert('設定が読み込めませんでした。トップページに戻ります。');
        window.location.href = 'index.html';
        return;
    }

    // --- クイズの状態管理 ---
    let questions = [];
    let currentQuestionIndex = 0;
    let userAnswers = [];
    let selectedAnswer = null;
    let answered = false;

    /**
     * 問題データを読み込み、整形する
     */
    async function loadAndPrepareQuestions() {
        try {
            const response = await fetch(`questions_${examRound}.json`);
            if (!response.ok) throw new Error('問題ファイルが見つかりません。');
            const questionGroups = await response.json();

            // 問題をフラットな配列に変換し、必要な情報を追加
            const allQuestions = questionGroups.flatMap(group =>
                group.questions.map(q => ({
                    ...q,
                    common_text: group.common_text && typeof group.common_text === 'string' ? group.common_text : '',
                    group_id: group.group_id
                }))
            );

            // シャッフルして指定数だけ取り出す
            const shuffled = allQuestions.sort(() => 0.5 - Math.random());
            return shuffled.slice(0, questionCount);
        } catch (error) {
            console.error('問題データの読み込みエラー:', error);
            alert('問題データの読み込みに失敗しました。トップページに戻ります。');
            window.location.href = 'index.html';
            return null;
        }
    }

    /**
     * 問題を画面に表示する
     */
    function displayQuestion() {
        answered = false;
        selectedAnswer = null;
        const currentQuestion = questions[currentQuestionIndex];

        // プログレスバー更新
        progressBar.style.width = `${((currentQuestionIndex + 1) / questions.length) * 100}%`;

        // 問題番号
        questionNumberEl.textContent = `問題 ${currentQuestionIndex + 1} / ${questions.length}`;

        // 共通問題文
        if (currentQuestion.common_text) {
            commonPassageEl.textContent = currentQuestion.common_text;
            commonPassageEl.style.display = 'block';
        } else {
            commonPassageEl.style.display = 'none';
        }

        // 問題文
        questionTextEl.textContent = currentQuestion.question;

        // 選択肢
        optionsEl.innerHTML = '';
        currentQuestion.choices.forEach((choice, index) => {
            const button = document.createElement('button');
            button.classList.add('option-btn');
            button.textContent = `${index + 1}. ${choice}`;
            button.dataset.index = index; // 0-indexed
            button.addEventListener('click', handleOptionSelect);
            optionsEl.appendChild(button);
        });
        
        feedbackMessageEl.textContent = '';
        nextButton.textContent = '回答する';
        nextButton.disabled = true;
    }
    
    /**
     * 選択肢がクリックされた時の処理
     */
    function handleOptionSelect(event) {
        if (answered) return;

        // 他の選択肢の選択状態を解除
        document.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('selected'));
        
        // クリックされたボタンを選択状態にする
        const selectedButton = event.currentTarget;
        selectedButton.classList.add('selected');
        selectedAnswer = parseInt(selectedButton.dataset.index, 10);
        
        nextButton.disabled = false;
    }
    
    /**
     * 「回答する」/「次へ」ボタンがクリックされた時の処理
     */
    function handleNextClick() {
        if (!answered) {
            // --- 回答・正誤判定処理 ---
            answered = true;
            const currentQuestion = questions[currentQuestionIndex];
            const correctAnserIndex = currentQuestion.answer - 1; // answerは1-indexedなので調整
            
            const isCorrect = selectedAnswer === correctAnserIndex;
            
            // 回答を記録
            userAnswers.push({
                question: currentQuestion,
                selected: selectedAnswer,
                correct: correctAnserIndex,
                isCorrect: isCorrect
            });

            // フィードバック表示
            const optionButtons = document.querySelectorAll('.option-btn');
            optionButtons.forEach(btn => {
                const btnIndex = parseInt(btn.dataset.index, 10);
                if (btnIndex === correctAnserIndex) {
                    btn.classList.add('correct');
                } else if (btnIndex === selectedAnswer) {
                    btn.classList.add('incorrect');
                }
                btn.disabled = true;
            });
            
            if (isCorrect) {
                feedbackMessageEl.textContent = '正解！';
                feedbackMessageEl.className = 'correct';
            } else {
                feedbackMessageEl.textContent = `不正解... 正解は ${correctAnserIndex + 1} です。`;
                feedbackMessageEl.className = 'incorrect';
            }

            if (currentQuestionIndex < questions.length - 1) {
                nextButton.textContent = '次の問題へ';
            } else {
                nextButton.textContent = '結果を見る';
            }

        } else {
            // --- 次の問題へ / 結果表示 ---
            currentQuestionIndex++;
            if (currentQuestionIndex < questions.length) {
                displayQuestion();
            } else {
                // クイズ終了
                sessionStorage.setItem('quizResults', JSON.stringify(userAnswers));
                window.location.href = 'results.html';
            }
        }
    }

    // --- 初期化処理の実行 ---
    nextButton.addEventListener('click', handleNextClick);
    questions = await loadAndPrepareQuestions();
    if (questions && questions.length > 0) {
        displayQuestion();
    }
}


/**
 * 結果ページ (results.html) の初期化
 */
function initResultsPage() {
    // --- DOM要素の取得 ---
    const usernameEl = document.getElementById('result-username');
    const correctCountEl = document.getElementById('correct-count');
    const totalCountEl = document.getElementById('total-count');
    const accuracyRateEl = document.getElementById('accuracy-rate');
    const judgmentEl = document.getElementById('result-judgment');
    const wrongQuestionsListEl = document.getElementById('wrong-questions-list');
    const retryButton = document.getElementById('retry-button');

    // --- 結果データの読み込み ---
    const username = sessionStorage.getItem('quizUser');
    const results = JSON.parse(sessionStorage.getItem('quizResults'));

    if (!username || !results) {
        alert('結果データがありません。トップページに戻ります。');
        window.location.href = 'index.html';
        return;
    }

    // --- 結果の集計と表示 ---
    usernameEl.textContent = username;
    const totalCount = results.length;
    const correctCount = results.filter(r => r.isCorrect).length;
    const accuracyRate = totalCount > 0 ? ((correctCount / totalCount) * 100).toFixed(1) : 0;

    totalCountEl.textContent = totalCount;
    correctCountEl.textContent = correctCount;
    accuracyRateEl.textContent = accuracyRate;

    // 判定
    if (accuracyRate >= 80) {
        judgmentEl.textContent = '素晴らしい！合格です！';
        judgmentEl.classList.add('pass');
    } else {
        judgmentEl.textContent = 'もう少し！頑張りましょう！';
        judgmentEl.classList.add('fail');
    }

    // 間違えた問題のリスト
    const wrongAnswers = results.filter(r => !r.isCorrect);
    if (wrongAnswers.length > 0) {
        wrongAnswers.forEach(r => {
            const item = document.createElement('div');
            item.classList.add('wrong-question-item');
            item.innerHTML = `
                <p class="wrong-q-text">Q. ${r.question.question}</p>
                <p><strong>正解:</strong> <span class="wrong-q-answer">${r.question.choices[r.correct]}</span></p>
                <p><strong>あなたの回答:</strong> <span class="wrong-q-user-answer">${r.question.choices[r.selected]}</span></p>
                <p><small>出典: ${r.question.explanation}</small></p>
            `;
            wrongQuestionsListEl.appendChild(item);
        });
    } else {
        wrongQuestionsListEl.innerHTML = '<p>全問正解です！おめでとうございます！</p>';
    }
    
    retryButton.addEventListener('click', () => {
        // ストレージをクリアしてトップに戻る
        sessionStorage.removeItem('quizUser');
        sessionStorage.removeItem('quizExamRound');
        sessionStorage.removeItem('quizQuestionCount');
        sessionStorage.removeItem('quizResults');
        window.location.href = 'index.html';
    });
}
