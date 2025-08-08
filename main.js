// main.js（最小構成・完成版）
// 画面ごとに処理を分岐：index.html / questions.html / results.html

document.addEventListener('DOMContentLoaded', () => {
  const path = location.pathname;

  // ===== ① トップ画面（index.html） =====
  if (path.endsWith('/') || path.endsWith('/index.html')) {
    const form = document.getElementById('start-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value.trim();

      if (!username) {
        alert('名前を入力してください。');
        return;
      }

      // 最小構成：第12回／100問固定
      sessionStorage.setItem('username', username);
      sessionStorage.setItem('examRound', '12');
      sessionStorage.setItem('questionCount', '100');

      // 念のため初期化
      sessionStorage.removeItem('score');
      sessionStorage.removeItem('total');
      sessionStorage.removeItem('wrongList');

      window.location.href = 'questions.html';
    });
    return;
  }

  // ===== ② 出題画面（questions.html） =====
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
