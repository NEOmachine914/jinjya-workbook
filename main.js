// main.js  — 3画面共通。URLではなく要素の存在でページ判定します。
document.addEventListener('DOMContentLoaded', () => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  // =========================
  // ① トップ画面（開始）
  // =========================
  const startForm = $('#start-form');
  if (startForm) {
    startForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = ($('#username')?.value || '').trim();
      if (!username) {
        alert('名前を入力してください');
        return;
      }
      // 最小構成：第12回・100問固定
      sessionStorage.setItem('username', username);
      sessionStorage.setItem('examRound', '12');
      sessionStorage.setItem('questionCount', '100');
      location.href = 'questions.html';
    });
    return; // 他の画面処理は走らせない
  }

  // =========================
  // ② 出題画面
  // =========================
  const quizContainer = $('#quiz-container');
  if (quizContainer) {
    const username = sessionStorage.getItem('username') || '';
    const examRound = sessionStorage.getItem('examRound') || '12';
    const questionCount = parseInt(sessionStorage.getItem('questionCount') || '100', 10);

    if (!username) {
      quizContainer.innerHTML = '<p>エラー：必要なデータが見つかりません。最初からやり直してください。</p>';
      return;
    }

    // 出題データの読み込み
    (async () => {
      try {
        const res = await fetch(`main_questions_${examRound}.json?ts=${Date.now()}`);
        if (!res.ok) throw new Error('問題ファイルが読み込めませんでした。');
        const raw = await res.json();
        // グループを平坦化し、common_text を各グループの最初の設問にだけ載せる
        const flat = [];
        raw.forEach(group => {
          const ct = (group.common_text || '').trim();
          (group.questions || []).forEach((q, idx) => {
            const copy = { ...q };
            if (ct && idx === 0) copy.common_text = ct;
            flat.push(copy);
          });
        });

        const total = Math.min(questionCount, flat.length);
        const questions = flat.slice(0, total); // 最小構成：並び固定（必要ならここでシャッフル可）

        let current = 0;
        let score = 0;
        const wrongs = [];

        const render = () => {
          if (current >= questions.length) {
            // 結果保存 → 結果画面へ
            sessionStorage.setItem('result-username', username);
            sessionStorage.setItem('correct-count', String(score));
            sessionStorage.setItem('total-count', String(questions.length));
            sessionStorage.setItem('wrongs', JSON.stringify(wrongs));
            location.href = 'results.html';
            return;
          }

          const q = questions[current];

          let html = `
            <div class="container">
              <div id="question-box">
                <div id="question-number">問${current + 1} / 全${questions.length}問</div>
          `;
          if (q.common_text) {
            html += `<div class="common-text">${q.common_text}</div>`;
          }
          html += `
                <div id="question-text">${q.question}</div>
                <div class="options-grid">
          `;
          q.choices.forEach((choice, i) => {
            html += `<button class="option-btn" data-idx="${i}">${choice}</button>`;
          });
          html += `
                </div>
                <div class="feedback-container"><span id="feedback-message"></span></div>
              </div>
            </div>
          `;

          quizContainer.innerHTML = html;

          // 回答処理
          $$('.option-btn', quizContainer).forEach(btn => {
            btn.addEventListener('click', () => {
              const selected = Number(btn.dataset.idx);
              const isCorrect = selected === q.answer; // JSONのanswerは0始まり
              const feedback = $('#feedback-message', quizContainer);

              // ボタン状態更新
              $$('.option-btn', quizContainer).forEach((b, idx) => {
                b.disabled = true;
                if (idx === q.answer) b.classList.add('correct');
                if (idx === selected && !isCorrect) b.classList.add('incorrect');
              });

              if (isCorrect) {
                score++;
                feedback.textContent = '正解！';
                feedback.className = 'correct';
              } else {
                feedback.textContent = '不正解…';
                feedback.className = 'incorrect';
                wrongs.push({
                  question: q.question,
                  correct: q.choices[q.answer],
                  user: q.choices[selected]
                });
              }

              // 少し待って次へ
              setTimeout(() => {
                current++;
                render();
              }, 650);
            });
          });
        };

        render();
      } catch (err) {
        console.error(err);
        quizContainer.innerHTML = '<p>問題データの読み込みに失敗しました。</p>';
      }
    })();

    return;
  }

  // =========================
  // ③ 結果画面
  // =========================
  const resultRoot = $('#page-results');
  if (resultRoot) {
    const username = sessionStorage.getItem('result-username') || '';
    const correct = parseInt(sessionStorage.getItem('correct-count') || '0', 10);
    const total = parseInt(sessionStorage.getItem('total-count') || '0', 10);
    const wrongs = JSON.parse(sessionStorage.getItem('wrongs') || '[]');

    $('#result-username').textContent = username || '—';
    $('#correct-count').textContent = String(correct);
    $('#total-count').textContent = String(total);

    const rate = total ? Math.round((correct / total) * 100) : 0;
    $('#accuracy-rate').textContent = String(rate);
    const judgeEl = $('#result-judgment');
    const pass = rate >= 70;
    judgeEl.textContent = pass ? '合格' : '不合格';
    judgeEl.className = `judgment ${pass ? 'pass' : 'fail'}`;

    const list = $('#wrong-questions-list');
    if (wrongs.length === 0) {
      list.innerHTML = '<p>全問正解でした！</p>';
    } else {
      list.innerHTML = wrongs.map(w => `
        <div class="wrong-question-item">
          <div class="wrong-q-text">Q. ${w.question}</div>
          <div class="wrong-q-answer">正解：${w.correct}</div>
          <div class="wrong-q-user-answer">あなたの回答：${w.user}</div>
        </div>
      `).join('');
    }

    $('#retry-button')?.addEventListener('click', () => {
      // もう一度最初から
      location.href = 'index.html';
    });
  }
});
  if (path.endsWith('/questions.html')) {
    const container = document.getElementById('quiz-container');
    if (!container) return;

    const username = sessionStorage.getItem('username') || '受験者';
    const examRound = sessionStorage.getItem('examRound') || '12';
    const questionCount = Number(sessionStorage.getItem('questionCount') || 100);

    let items = []; // {question, choices[], answer(1始まり), common_text}
    let idx = 0;
    let score = 0;
    const wrongList = []; // 結果画面用に保存

    (async () => {
      try {
        // 第12回のみ
        const res = await fetch('main_questions_12.json');
        if (!res.ok) throw new Error('問題ファイルを読み込めませんでした。');
        const groups = await res.json();

        // グループをフラット化（各設問へ common_text を付与）
        for (const g of groups) {
          const common = g.common_text || null;
          for (const q of g.questions) {
            items.push({
              question: q.question,
              choices: q.choices,
              answer: q.answer, // 1始まり
              common_text: common
            });
          }
        }

        // 出題数を制限（100固定）
        if (items.length > questionCount) items = items.slice(0, questionCount);

        render();
      } catch (err) {
        console.error(err);
        container.innerHTML = '<p>問題データの読み込みに失敗しました。</p>';
      }
    })();

    function render() {
      if (idx >= items.length) {
        // 結果保存 → 遷移
        sessionStorage.setItem('score', String(score));
        sessionStorage.setItem('total', String(items.length));
        sessionStorage.setItem('wrongList', JSON.stringify(wrongList));
        window.location.href = 'results.html';
        return;
      }

      const q = items[idx];

      let html = '';
      if (q.common_text) {
        html += `<div class="common-text">${escapeHtml(q.common_text).replace(/\n/g, '<br>')}</div>`;
      }

      html += `<h2>問${idx + 1} / 全${items.length}</h2>`;
      html += `<p id="question-text">${escapeHtml(q.question)}</p>`;
      html += '<ul>';
      q.choices.forEach((choice, i) => {
        html += `<li><button class="option-btn" data-i="${i}">${escapeHtml(choice)}</button></li>`;
      });
      html += '</ul>';

      container.innerHTML = html;

      container.querySelectorAll('.option-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const selected = Number(btn.getAttribute('data-i')); // 0始まり
          const isCorrect = (selected + 1) === q.answer;
          if (isCorrect) {
            score++;
          } else {
            wrongList.push({
              q: q.question,
              correct: q.choices[q.answer - 1],
              user: q.choices[selected]
            });
          }
          idx++;
          render();
        });
      });
    }

    function escapeHtml(s) {
      return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }
    return;
  }

  // ===== ③ 結果画面（results.html） =====
  if (path.endsWith('/results.html')) {
    const nameEl = document.getElementById('result-username');
    const correctEl = document.getElementById('correct-count');
    const totalEl = document.getElementById('total-count');
    const rateEl = document.getElementById('accuracy-rate');
    const judgeEl = document.getElementById('result-judgment');
    const wrongWrap = document.getElementById('wrong-questions-list');
    const retryBtn = document.getElementById('retry-button');

    const username = sessionStorage.getItem('username') || '受験者';
    const score = Number(sessionStorage.getItem('score') || 0);
    const total = Number(sessionStorage.getItem('total') || 0);
    const rate = total ? Math.round((score / total) * 100) : 0;
    const pass = rate >= 70;

    nameEl.textContent = username;
    correctEl.textContent = String(score);
    totalEl.textContent = String(total);
    rateEl.textContent = String(rate);
    judgeEl.textContent = pass ? '合格' : '不合格';
    judgeEl.classList.add(pass ? 'pass' : 'fail');

    // 間違い一覧（簡易表示）
    if (wrongWrap) {
      const wrongList = JSON.parse(sessionStorage.getItem('wrongList') || '[]');
      if (wrongList.length === 0) {
        wrongWrap.innerHTML = '<p>間違えはありません。</p>';
      } else {
        const ul = document.createElement('ul');
        ul.id = 'wrong-questions-list';
        wrongList.forEach(w => {
          const li = document.createElement('li');
          li.className = 'wrong-question-item';
          li.innerHTML = `
            <div class="wrong-q-text">${escapeHtml(w.q)}</div>
            <div class="wrong-q-answer">正解：${escapeHtml(w.correct)}</div>
            <div class="wrong-q-user-answer">あなたの解答：${escapeHtml(w.user)}</div>
          `;
          ul.appendChild(li);
        });
        wrongWrap.replaceWith(ul);
      }
    }

    retryBtn?.addEventListener('click', () => {
      // 最小構成：トップに戻るだけ
      window.location.href = 'index.html';
    });

    function escapeHtml(s) {
      return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }
  }
});
