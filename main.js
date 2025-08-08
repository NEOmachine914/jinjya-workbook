// main.js（統合版） — index / questions / results をページIDで制御
document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.id || "";

  if (page === "page-index") initIndex();
  else if (page === "page-questions") initQuestions();
  else if (page === "page-results") initResults();
});

/* ---------- 共通ユーティリティ ---------- */
const SS = {
  set: (k, v) => sessionStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v)),
  get: (k) => sessionStorage.getItem(k),
  getJSON: (k) => {
    const v = sessionStorage.getItem(k);
    try { return v ? JSON.parse(v) : null; } catch { return null; }
  },
  del: (k) => sessionStorage.removeItem(k),
};
const $ = (sel) => document.querySelector(sel);

/* =========================================================
   ① トップ画面
========================================================= */
function initIndex() {
  const input = $("#username");
  const btn = $("#start-btn");

  btn.addEventListener("click", () => {
    const name = (input.value || "").trim();
    if (!name) { alert("名前を入力してください。"); input.focus(); return; }

    // 仕様：第12回／100問固定
    SS.set("username", name);
    SS.set("examRound", "12");
    SS.set("questionCount", 100);

    // 初期化
    SS.del("questions");
    SS.set("currentQuestionIndex", 0);
    SS.set("score", 0);

    location.href = "questions.html";
  });
}

/* =========================================================
   ② 出題画面
========================================================= */
async function initQuestions() {
  const username = SS.get("username");
  const examRound = SS.get("examRound") || "12";
  let questionCount = Number(SS.get("questionCount") || 100);

  if (!username) {
    alert("セッション情報がありません。最初からやり直してください。");
    location.href = "index.html";
    return;
  }

  // 既に読み込み済みがあれば利用、なければ読み込み
  let questions = SS.getJSON("questions");
  if (!questions) {
    try {
      const res = await fetch(`main_questions_${examRound}.json`, { cache: "no-store" });
      if (!res.ok) throw new Error("問題データの読み込みに失敗しました。");
      const raw = await res.json();

      // フラット化（JSON順を保持）。answerは0始まりに補正
      const flat = [];
      for (const group of raw) {
        const ct = group.common_text || null;
        let firstInGroup = true;
        for (const q of group.questions) {
          flat.push({
            id: `${group.group_id}-${q.question_id}`,
            commonText: firstInGroup && ct ? ct : null,
            question: q.question,
            choices: q.choices,
            answer: typeof q.answer === "number" ? q.answer - 1 : q.answer, // 1始まり→0始まり
            explanation: q.explanation || "",
            attribute: q.attribute || "",
          });
          firstInGroup = false;
        }
      }

      if (!Array.isArray(flat) || flat.length === 0) throw new Error("問題データが空です。");

      // 100問固定だが、データ不足時は「あるだけ出題」
      if (flat.length < questionCount) questionCount = flat.length;
      questions = flat.slice(0, questionCount);

      SS.set("questions", questions);
      SS.set("questionCount", questionCount);
      SS.set("currentQuestionIndex", 0);
      SS.set("score", 0);
    } catch (e) {
      alert(e.message || "問題データの読み込みに失敗しました。");
      location.href = "index.html";
      return;
    }
  }

  // UI要素
  const progressBar = $("#progress-bar");
  const qNum = $("#question-number");
  const qCommon = $("#common-text");
  const qText = $("#question-text");
  const options = $("#options");
  const feedback = $("#feedback-message");

  let index = Number(SS.get("currentQuestionIndex") || 0);
  let score = Number(SS.get("score") || 0);
  const total = questions.length;

  function render() {
    if (index >= total) {
      // 結果へ
      SS.set("score", score);
      location.href = "results.html";
      return;
    }

    // 進捗
    const pct = ((index) / total) * 100;
    progressBar.style.width = `${pct}%`;
    qNum.textContent = `問${index + 1} / 全${total}問`;

    // 問題
    const q = questions[index];
    if (q.commonText) {
      qCommon.style.display = "";
      qCommon.textContent = q.commonText;
    } else {
      qCommon.style.display = "none";
      qCommon.textContent = "";
    }
    qText.textContent = q.question;

    // 選択肢
    options.innerHTML = "";
    feedback.textContent = "";
    const btns = [];

    q.choices.forEach((choice, i) => {
      const btn = document.createElement("button");
      btn.className = "option-btn";
      btn.textContent = choice;

      btn.addEventListener("click", () => {
        // 多重クリック防止
        btns.forEach(b => b.disabled = true);

        if (i === q.answer) {
          btn.classList.add("correct");
          score++;
          feedback.textContent = "正解";
          feedback.id = "feedback-message";
          feedback.className = "correct";
        } else {
          btn.classList.add("incorrect");
          feedback.textContent = "不正解";
          feedback.id = "feedback-message";
          feedback.className = "incorrect";
          // 正解をハイライト
          if (btns[q.answer]) btns[q.answer].classList.add("correct");
        }

        // 状態保存
        index++;
        SS.set("currentQuestionIndex", index);
        SS.set("score", score);

        // 次へ（短い遅延で読める時間を確保）
        setTimeout(render, 600);
      });

      options.appendChild(btn);
      btns.push(btn);
    });
  }

  render();
}

/* =========================================================
   ③ 結果画面
========================================================= */
function initResults() {
  const username = SS.get("username") || "受験者";
  const questions = SS.getJSON("questions") || [];
  const score = Number(SS.get("score") || 0);
  const total = questions.length || Number(SS.get("questionCount") || 100);
  const rate = total ? Math.round((score / total) * 1000) / 10 : 0; // 小数1桁

  // 表示
  const $id = (id) => document.getElementById(id);
  $id("result-username").textContent = username;
  $id("correct-count").textContent = score;
  $id("total-count").textContent = total;
  $id("accuracy-rate").textContent = rate.toFixed(1);

  const judgeEl = $id("result-judgment");
  const pass = rate >= 70;
  judgeEl.textContent = pass ? "合格" : "不合格";
  judgeEl.className = `judgment ${pass ? "pass" : "fail"}`;

  //（拡張用）不正解リスト等は将来対応。今は空でOK
  const wrongList = $id("wrong-questions-list");
  wrongList.innerHTML = "";

  // トップへ
  $id("retry-button").addEventListener("click", () => {
    // 必要キーのみ削除（usernameは残す：運用次第で変更可）
    ["questions", "currentQuestionIndex", "score", "questionCount"].forEach(SS.del);
    // examRound/usernameを残すならこのまま。毎回クリアしたければ以下を有効化：
    // ["username","examRound"].forEach(SS.del);
    location.href = "index.html";
  });
}
