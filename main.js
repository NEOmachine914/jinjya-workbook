// ===== 共通ユーティリティ =====
const $ = (sel) => document.querySelector(sel);
const on = (el, ev, fn) => el && el.addEventListener(ev, fn);

// ===== 入口 =====
document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.id;

  if (page === 'page-index') initIndex();
  if (page === 'page-questions') initQuestions();
  if (page === 'page-results') initResults();
});

// ===== index.html =====
function initIndex() {
  const form = $('#start-form');
  on(form, 'submit', (e) => {
    e.preventDefault();
    const username = $('#username').value.trim();
    if (!username) {
      alert('名前を入力してください');
      return;
    }
    // hidden の既定値（必要に応じて index.html 側で変更可）
    const examRound = parseInt($('#examRound')?.value || '12', 10);
    const questionCount = parseInt($('#questionCount')?.value || '100', 10);

    sessionStorage.setItem('username', username);
    sessionStorage.setItem('examRound', String(examRound));
    sessionStorage.setItem('questionCount', String(questionCount));

    location.href = 'questions.html';
  });
}

// ===== questions.html =====
async function initQuestions() {
  const username = sessionStorage.getItem('username');
  const examRound = sessionStorage.getItem('examRound');
  const questionCount = parseInt(sessionStorage.getItem('questionCount') || '0', 10);

  if (!username || !examRound || !questionCount) {
    document.body.innerHTML = '<div class="container"><p>エラー：必要なデータが見つかりません。最初からやり直してください。</p></div>';
    return;
  }

  // 画面要素
  const $common = $('#common-text');
  const $qNo = $('#question-number');
  const $qText = $('#question-text');
  const $options = $('#options');
  const $feedback = $('#feedback-message');
  const $bar = $('#progress-bar');

  // 問題データ読み込み（ファイル名は main_questions_xx.json）
  const file = `main_questions_${examRound}.json`;
  let groups;
  try {
    const res = await fetch(file, { cache: 'no-store' });
    if (!res.ok) throw new Error(`${file} が読み込めませんでした`);
    groups = await res.json();
  } catch (e) {
    renderError(`問題データの読み込みに失敗しました：${e.message}`);
    return;
  }

  // グループ構造 → 1問ずつの配列へフラット化
  const allQuestions = [];
  for (const g of groups) {
    const commonText = g.common_text || null;
    for (const q of g.questions || []) {
      allQuestions.push({
        groupId: g.group_id || '',
        commonText,
        question: q.question,
        choices: q.choices,
        answer: q.answer, // ※JSONが0始まり想定（既存データに合わせる）
        explanation: q.explanation || '',
        attribute: q.attribute || ''
      });
    }
  }

  // 指定数だけ取り出し
  const selected = allQuestions.slice(0, questionCount);

  let idx = 0;
  let score = 0;
  const mistakes = []; // {question, correct, user, commonText}

  render();

  function render() {
    if (idx >= selected.length) {
      // 結果保存 → results へ
      sessionStorage.setItem('correctCount', String(score));
      sessionStorage.setItem('totalCount', String(selected.length));
      sessionStorage.setItem('mistakes', JSON.stringify(mistakes));
      location.href = 'results.html';
      return;
    }

    const q = selected[idx];

    // 進捗バー
    const pct = Math.round((idx / selected.length) * 100);
    if ($bar) $bar.style.width = `${pct}%`;

    // 共通文
    if (q.commonText) {
      $common.style.display = 'block';
      $common.textContent = q.commonText;
    } else {
      $common.style.display = 'none';
      $common.textContent = '';
    }

    // 番号・本文
    $qNo.textContent = `問 ${idx + 1} / 全${selected.length}問`;
    $qText.textContent = q.question;

    // 選択肢
    $options.innerHTML = '';
    q.choices.forEach((choice, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'option-btn';
      btn.textContent = choice;
      on(btn, 'click', () => answer(i));
      $options.appendChild(btn);
    });

    // フィードバック消去
    $feedback.textContent = '';
    $feedback.className = '';
  }

  function answer(selectedIndex) {
    const q = selected[idx];
    const correct = selectedIndex === q.answer; // ※0始まり前提
    const btns = [...$options.querySelectorAll('button')];

    btns.forEach((b) => (b.disabled = true));
    if (correct) {
      score++;
      btns[selectedIndex].classList.add('correct');
      $feedback.textContent = '正解！';
      $feedback.className = 'correct';
    } else {
      btns[selectedIndex].classList.add('incorrect');
      if (typeof q.answer === 'number' && btns[q.answer]) {
        btns[q.answer].classList.add('correct');
      }
      $feedback.textContent = '不正解…';
      $feedback.className = 'incorrect';

      mistakes.push({
        question: q.question,
        correct: q.choices[q.answer],
        user: q.choices[selectedIndex],
        commonText: q.commonText || ''
      });
    }

    // 次へ
    setTimeout(() => {
      idx++;
      render();
    }, 700);
  }

  function renderError(msg) {
    document.body.innerHTML = `
      <div class="container">
        <h1>エラー</h1>
        <p>${msg}</p>
        <p><a href="index.html">トップへ戻る</a></p>
      </div>`;
  }
}

// ===== results.html =====
function initResults() {
  const username = sessionStorage.getItem('username');
  const correct = parseInt(sessionStorage.getItem('correctCount') || '0', 10);
  const total = parseInt(sessionStorage.getItem('totalCount') || '0', 10);
  const mistakes = JSON.parse(sessionStorage.getItem('mistakes') || '[]');

  $('#result-username').textContent = username || '-';
  $('#correct-count').textContent = String(correct);
  $('#total-count').textContent = String(total);

  const rate = total ? Math.round((correct / total) * 100) : 0;
  $('#accuracy-rate').textContent = String(rate);

  const judge = $('#result-judgment');
  if (rate >= 70) {
    judge.textContent = '合格';
    judge.classList.add('pass');
  } else {
    judge.textContent = '不合格';
    judge.classList.add('fail');
  }

  const list = $('#wrong-questions-list');
  list.innerHTML = '';
  if (mistakes.length === 0) {
    list.innerHTML = '<li>全問正解！</li>';
  } else {
    mistakes.forEach((m) => {
      const li = document.createElement('li');
      li.className = 'wrong-question-item';
      li.innerHTML = `
        ${m.commonText ? `<div class="common-text">${escapeHtml(m.commonText)}</div>` : ''}
        <div class="wrong-q-text">${escapeHtml(m.question)}</div>
        <div class="wrong-q-answer">正解：${escapeHtml(m.correct)}</div>
        <div class="wrong-q-user-answer">あなたの回答：${escapeHtml(m.user)}</div>
      `;
      list.appendChild(li);
    });
  }

  on($('#retry-button'), 'click', () => (location.href = 'index.html'));
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
