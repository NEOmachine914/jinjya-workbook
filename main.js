// 3画面共通：URLに頼らず、要素の存在で画面を判定
document.addEventListener('DOMContentLoaded', () => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // ===== ① トップ（開始） =====
  const startForm = $('#start-form');
  const startBtn  = $('#start-btn');
  if (startForm || startBtn) {
    const handleStart = (e) => {
      e?.preventDefault?.();
      const username = ($('#username')?.value || '').trim();
      if (!username) { alert('名前を入力してください'); return; }
      // 固定パラメータ
      sessionStorage.setItem('username', username);
      sessionStorage.setItem('examRound', '12');
      sessionStorage.setItem('questionCount', '100');
      location.href = 'questions.html';
    };
    // フォーム submit / ボタンクリックの両方を拾う（どちらでも動く保険）
    startForm?.addEventListener('submit', handleStart);
    startBtn?.addEventListener('click', handleStart);
    return;
  }

  // ===== ② 出題 =====
  const quizContainer = $('#quiz-container');
  if (quizContainer) {
    const username    = sessionStorage.getItem('username') || '';
    const examRound   = sessionStorage.getItem('examRound') || '12';
    const questionCnt = parseInt(sessionStorage.getItem('questionCount') || '100', 10);

    if (!username) { quizContainer.innerHTML = '<p>エラー：最初からやり直してください。</p>'; return; }

    (async () => {
      try {
        const res = await fetch(`main_questions_${examRound}.json?ts=${Date.now()}`);
        if (!res.ok) throw new Error('問題ファイルを読み込めませんでした。');
        const groups = await res.json();

        // グループ平坦化。各グループの最初だけ共通文を付与
        const all = [];
        groups.forEach(g => {
          const ct = (g.common_text || '').trim();
          (g.questions || []).forEach((q, i) => {
            const copy = { ...q };
            if (ct && i === 0) copy.common_text = ct;
            all.push(copy);
          });
        });

        const total = Math.min(questionCnt, all.length);
        const questions = all.slice(0, total);

        let idx = 0, score = 0;
        const wrongs = [];

        const render = () => {
          if (idx >= questions.length) {
            sessionStorage.setItem('result-username', username);
            sessionStorage.setItem('correct-count', String(score));
            sessionStorage.setItem('total-count', String(questions.length));
            sessionStorage.setItem('wrongs', JSON.stringify(wrongs));
            location.href = 'results.html';
            return;
          }
          const q = questions[idx];
          let html = `
            <div class="container">
              <div id="question-box">
                <div id="question-number">問${idx + 1} / 全${questions.length}問</div>
          `;
          if (q.common_text) html += `<div class="common-text">${q.common_text}</div>`;
          html += `
                <div id="question-text">${q.question}</div>
                <div class="options-grid">
          `;
          q.choices.forEach((c, i) => {
            html += `<button class="option-btn" data-i="${i}">${c}</button>`;
          });
          html += `
                </div>
                <div class="feedback-container"><span id="feedback-message"></span></div>
              </div>
            </div>`;
          quizContainer.innerHTML = html;

          $$('.option-btn', quizContainer).forEach(btn => {
            btn.addEventListener('click', () => {
              const sel = Number(btn.dataset.i);
              const ok  = sel === q.answer; // JSON は 0始まり
              const fb  = $('#feedback-message', quizContainer);

              $$('.option-btn', quizContainer).forEach((b, i) => {
                b.disabled = true;
                if (i === q.answer) b.classList.add('correct');
                if (i === sel && !ok) b.classList.add('incorrect');
              });

              if (ok) {
                score++; fb.textContent = '正解！'; fb.className = 'correct';
              } else {
                fb.textContent = '不正解…'; fb.className = 'incorrect';
                wrongs.push({ question: q.question, correct: q.choices[q.answer], user: q.choices[sel] });
              }
              setTimeout(() => { idx++; render(); }, 650);
            });
          });
        };
        render();
      } catch (e) {
        console.error(e);
        quizContainer.innerHTML = '<p>問題データの読み込みに失敗しました。</p>';
      }
    })();
    return;
  }

  // ===== ③ 結果 =====
  const resultsRoot = $('#page-results');
  if (resultsRoot) {
    const name   = sessionStorage.getItem('result-username') || '';
    const ok     = parseInt(sessionStorage.getItem('correct-count') || '0', 10);
    const total  = parseInt(sessionStorage.getItem('total-count') || '0', 10);
    const wrongs = JSON.parse(sessionStorage.getItem('wrongs') || '[]');

    $('#result-username').textContent = name || '—';
    $('#correct-count').textContent   = String(ok);
    $('#total-count').textContent     = String(total);
    const rate = total ? Math.round(ok / total * 100) : 0;
    $('#accuracy-rate').textContent = String(rate);
    const judge = $('#result-judgment');
    judge.textContent = rate >= 70 ? '合格' : '不合格';
    judge.className   = `judgment ${rate >= 70 ? 'pass' : 'fail'}`;

    const list = $('#wrong-questions-list');
    if (!wrongs.length) list.innerHTML = '<p>全問正解でした！</p>';
    else list.innerHTML = wrongs.map(w => `
      <div class="wrong-question-item">
        <div class="wrong-q-text">Q. ${w.question}</div>
        <div class="wrong-q-answer">正解：${w.correct}</div>
        <div class="wrong-q-user-answer">あなたの回答：${w.user}</div>
      </div>`).join('');

    $('#retry-button')?.addEventListener('click', () => location.href = 'index.html');
  }
});
