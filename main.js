// ===== タイトル共通文言 =====
const BASE_TITLE = '神社検定壱級第12回過去問題';

// ===== 共通ユーティリティ =====
const $ = (sel) => document.querySelector(sel);
const on = (el, ev, fn) => el && el.addEventListener(ev, fn);
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ===== 入口 =====
document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.id;
  if (page === 'page-index') initIndex();
  if (page === 'page-questions') initQuestions();
  if (page === 'page-results') initResults();
});

// ===== index.html =====
function initIndex() {
  document.title = `${BASE_TITLE} - 開始`;

  const form = $('#start-form');
  on(form, 'submit', (e) => {
    e.preventDefault();
    const username = $('#username').value.trim();
    if (!username) {
      alert('名前を入力してください');
      return;
    }
    const examRound = parseInt($('#examRound')?.value || '12', 10);
    const questionCount = parseInt($('#questionCount')?.value || '100', 10);

    sessionStorage.setItem('username', username);
    sessionStorage.setItem('examRound', String(examRound));
    sessionStorage.setItem('questionCount', String(questionCount));

    location.href = 'questions.html';
  });

  // 今日の一問（毎日ランダム・その日中は固定）
  renderDailyQuestion(12);
}

// ===== questions.html =====
async function initQuestions() {
  document.title = `${BASE_TITLE} - 出題中`;

  const username = sessionStorage.getItem('username');
  const examRound = sessionStorage.getItem('examRound');
  const questionCount = parseInt(sessionStorage.getItem('questionCount') || '0', 10);

  if (!username || !examRound || !questionCount) {
    document.body.innerHTML = '<div class="container"><p>エラー：必要なデータが見つかりません。最初からやり直してください。</p></div>';
    return;
  }

  const $common = $('#common-text');
  const $qNo = $('#question-number');
  const $qText = $('#question-text');
  const $options = $('#options');
  const $feedback = $('#feedback-message');
  const $bar = $('#progress-bar');

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

  // グループ→設問へフラット化（answerの1/0始まり両対応）
  const allQuestions = [];
  for (const g of groups) {
    const commonText = g.common_text || null;
    for (const q of g.questions || []) {
      const choices = q.choices || [];
      const rawAns = Number(q.answer);
      let correctIndex = null;
      if (!Number.isNaN(rawAns)) {
        if (rawAns >= 1 && rawAns <= choices.length) correctIndex = rawAns - 1; // 1始まり
        else if (rawAns >= 0 && rawAns < choices.length) correctIndex = rawAns; // 0始まり
      }
      allQuestions.push({
        groupId: g.group_id || '',
        commonText,
        question: q.question,
        choices,
        correctIndex,
        explanation: q.explanation || '',
        attribute: q.attribute || ''
      });
    }
  }

  const selected = allQuestions.slice(0, questionCount);

  let idx = 0;
  let score = 0;
  const mistakes = [];

  render();

  function render() {
    if (idx >= selected.length) {
      sessionStorage.setItem('correctCount', String(score));
      sessionStorage.setItem('totalCount', String(selected.length));
      sessionStorage.setItem('mistakes', JSON.stringify(mistakes));
      location.href = 'results.html';
      return;
    }

    const q = selected[idx];

    const pct = Math.round((idx / selected.length) * 100);
    if ($bar) $bar.style.width = `${pct}%`;

    if (q.commonText) {
      $common.style.display = 'block';
      $common.textContent = q.commonText;
    } else {
      $common.style.display = 'none';
      $common.textContent = '';
    }

    $qNo.textContent = `問 ${idx + 1} / 全${selected.length}問`;
    $qText.textContent = q.question;

    $options.innerHTML = '';
    q.choices.forEach((choice, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'option-btn';
      btn.textContent = choice;
      on(btn, 'click', () => answer(i));
      $options.appendChild(btn);
    });

    $feedback.textContent = '';
    $feedback.className = '';
  }

  function answer(selectedIndex) {
    const q = selected[idx];
    const correctIdx = q.correctIndex;
    const btns = [...$options.querySelectorAll('button')];

    btns.forEach((b) => (b.disabled = true));

    if (selectedIndex === correctIdx) {
      score++;
      btns[selectedIndex].classList.add('correct');
      $feedback.textContent = '正解！';
      $feedback.className = 'correct';
    } else {
      btns[selectedIndex].classList.add('incorrect');
      if (typeof correctIdx === 'number' && btns[correctIdx]) {
        btns[correctIdx].classList.add('correct');
      }
      $feedback.textContent = '不正解…';
      $feedback.className = 'incorrect';

      mistakes.push({
        question: q.question,
        correct: q.choices[correctIdx],
        user: q.choices[selectedIndex],
        commonText: q.commonText || ''
      });
    }

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
  document.title = `${BASE_TITLE} - 結果発表`;

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

// ===== 今日の一問（毎日ランダム・その日中は固定） =====

// JSTで“今日”の通し日数
function getJstDayNumber() {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const jstMs = utcMs + 9 * 60 * 60000;
  return Math.floor(jstMs / 86400000); // 1970/1/1からの日数
}

// 軽量なシード付きPRNG（mulberry32）
function mulberry32(a) {
  return function () {
    let t = (a += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function renderDailyQuestion(round = 12) {
  const dailySection = document.getElementById('daily-quiz');
  const box = document.getElementById('daily-question-box');
  if (!dailySection || !box) return;

  try {
    const res = await fetch(`main_questions_${round}.json`, { cache: 'no-store' });
    if (!res.ok) throw new Error('JSONが読み込めませんでした');
    const groups = await res.json();

    // グループを1問ずつへフラット化（answerは1/0両対応に正規化）
    const all = [];
    groups.forEach(g => {
      const common = g.common_text || null;
      (g.questions || []).forEach(q => {
        const choices = q.choices || [];
        const rawAns = Number(q.answer);
        let correctIndex = null;
        if (!Number.isNaN(rawAns)) {
          if (rawAns >= 1 && rawAns <= choices.length) correctIndex = rawAns - 1; // 1-based
          else if (rawAns >= 0 && rawAns < choices.length) correctIndex = rawAns; // 0-based
        }
        all.push({
          common_text: common,
          question: q.question,
          choices,
          correctIndex
        });
      });
    });
    if (all.length === 0) return;

    // “毎日ランダム”：日数をseedにして、その日の間は固定
    const day = getJstDayNumber();
    const rng = mulberry32(day ^ 0x9E3779B9); // 適当なスパイス
    const idx = Math.floor(rng() * all.length);
    const q = all[idx];

    // 描画
    const common = q.common_text
      ? `<div class="common-text">${escapeHtml(q.common_text)}</div>`
      : '';

    box.innerHTML = `
      ${common}
      <div class="question" style="margin:8px 0 12px;font-weight:600;">
        ${escapeHtml(q.question)}
      </div>
      <ul id="daily-options" class="options-grid"></ul>
      <div class="feedback-container"><span id="daily-feedback"></span></div>
    `;

    const ul = box.querySelector('#daily-options');
    q.choices.forEach((choice, i) => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.textContent = choice;
      btn.addEventListener('click', () => {
        // 1回で確定
        [...ul.querySelectorAll('.option-btn')].forEach(b => (b.disabled = true));
        const correct = i === q.correctIndex;
        btn.classList.add(correct ? 'correct' : 'incorrect');
        const fb = box.querySelector('#daily-feedback');
        fb.textContent = correct
          ? '正解！'
          : `不正解… 正解は「${q.choices[q.correctIndex]}」`;
        fb.className = correct ? 'correct' : 'incorrect';
      });
      li.appendChild(btn);
      ul.appendChild(li);
    });

    dailySection.style.display = 'block';
  } catch (e) {
    console.error('今日の一問の読み込みに失敗:', e);
  }
}
