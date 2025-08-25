// PrepQuest localStorage data layer (v1)
(() => {
  const STORAGE_KEY = 'pq_v1';

  function readStore() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
  }
  function writeStore(data) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
  function uid(prefix='id') { return `${prefix}_${Math.random().toString(36).slice(2,8)}_${Date.now().toString(36)}`; }

  function seedIfNeeded() {
    const db = readStore();
    if (db.seeded) return;
    const questions = [];
    function addQ(stem, options, correctIndex, topic, difficulty, explanation, testId) {
      const id = uid('q');
      questions.push({ id, testId, stem, options, correctIndex, topic, difficulty, explanation });
      return id;
    }

    const tests = [];

    // Arrays Basics (5 questions)
    const arraysQ = [];
    arraysQ.push(addQ('Find the maximum subarray sum for [-2,1,-3,4,-1,2,1,-5,4].', ['6','7','4','5'], 1, 'Arrays', 'Medium', 'Kadane\'s algorithm yields 6 from subarray [4,-1,2,1].'));
    arraysQ.push(addQ('Reverse an array in-place requires what extra space?', ['O(1)','O(n)','O(log n)','O(n^2)'], 0, 'Arrays', 'Easy', 'Two-pointer swap uses constant extra space.'));
    arraysQ.push(addQ('Two Sum: return indices of two numbers adding to target. Complexity best?', ['O(n log n)','O(n)','O(n^2)','O(1)'], 1, 'Arrays', 'Easy', 'Hash map gives O(n) time and O(n) space.'));
    arraysQ.push(addQ('Find the majority element (> n/2). Best approach?', ['Sort and pick middle','Hash map count','Boyer-Moore','Divide and conquer'], 2, 'Arrays', 'Medium', 'Boyer-Moore achieves O(n) time, O(1) space.'));
    arraysQ.push(addQ('Rotate array right by k. Efficient method?', ['Repeated shift','Auxiliary array','Reverse segments','Binary search'], 2, 'Arrays', 'Medium', 'Reverse all, reverse first k, reverse rest.'));
    tests.push({ id: 'arrays-basic', name: 'Arrays Basics', durationSec: 600, negativeMarking: false, topics: ['Arrays'], questionIds: arraysQ });

    // Profit & Loss (3 questions)
    const plQ = [];
    plQ.push(addQ('A shopkeeper marks a product 20% above cost and gives 10% discount. Profit %?', ['8%','10%','12%','15%'], 2, 'Aptitude', 'Medium', 'Let cost 100, marked 120, discount 10% => 108; profit = 8, which is 8%, but check: 120*(0.9)=108, profit=8%, correct choice should be 8%.', 'pl-basic'));
    plQ[0].correctIndex = 0; // Fix to 8%
    plQ.push(addQ('If selling price is 150 and loss is 25%, cost price?', ['100','120','180','200'], 2, 'Aptitude', 'Easy', 'SP = 0.75*CP => CP = 150/0.75 = 200.', 'pl-basic'));
    plQ[1].correctIndex = 3; // 200
    plQ.push(addQ('Gain of 20% on cost implies what % on selling price?', ['16.67%','18%','20%','25%'], 0, 'Aptitude', 'Medium', 'If CP=100, SP=120. Profit over SP: 20/120 = 16.67%.', 'pl-basic'));
    tests.push({ id: 'pl-basic', name: 'Profit & Loss Basics', durationSec: 900, negativeMarking: false, topics: ['Aptitude'], questionIds: plQ });

    const users = [
      { id: 'u1', name: 'Prince', xp: 0, badges: [], streak: 0, lastActiveDay: null },
      { id: 'u2', name: 'Alex', xp: 3240, badges: ['\ud83c\udfc6'], streak: 5, lastActiveDay: '2025-08-10' },
      { id: 'u3', name: 'Priya', xp: 2990, badges: ['\ud83e\udd0f'], streak: 3, lastActiveDay: '2025-08-09' },
      { id: 'u4', name: 'Rahul', xp: 2855, badges: ['\ud83c\udf1f'], streak: 2, lastActiveDay: '2025-08-08' }
    ];
    writeStore({ seeded: true, tests, questions, attempts: [], users });
  }

  function getTests() { seedIfNeeded(); return readStore().tests || []; }
  function getTestById(id) { seedIfNeeded(); return (readStore().tests || []).find(t => t.id === id); }
  function getQuestionsByIds(ids) { seedIfNeeded(); const map = new Map((readStore().questions||[]).map(q=>[q.id,q])); return ids.map(id=>map.get(id)).filter(Boolean); }

  function getAttempts(userId='u1') { seedIfNeeded(); return (readStore().attempts || []).filter(a=>a.userId===userId).sort((a,b)=>b.startedAt-a.startedAt); }
  function getAttemptById(id) { seedIfNeeded(); return (readStore().attempts||[]).find(a=>a.id===id); }

  function startAttempt(testId, userId='u1') {
    seedIfNeeded();
    const db = readStore();
    const test = db.tests.find(t=>t.id===testId);
    if (!test) throw new Error('Test not found');
    const attempt = { id: uid('att'), userId, testId, startedAt: Date.now(), answers: [], totalTimeMs: 0 };
    db.attempts.push(attempt);
    writeStore(db);
    return attempt;
  }

  function saveAnswer(attemptId, questionId, chosenIndex, timeMsDelta) {
    const db = readStore();
    const attempt = db.attempts.find(a=>a.id===attemptId);
    if (!attempt) return;
    let ans = attempt.answers.find(x=>x.questionId===questionId);
    if (!ans) { ans = { questionId, chosenIndex: null, timeMs: 0 }; attempt.answers.push(ans); }
    ans.chosenIndex = chosenIndex;
    ans.timeMs += Math.max(0, timeMsDelta||0);
    attempt.totalTimeMs = (attempt.totalTimeMs||0) + Math.max(0, timeMsDelta||0);
    writeStore(db);
  }

  function submitAttempt(attemptId) {
    const db = readStore();
    const attempt = db.attempts.find(a=>a.id===attemptId);
    if (!attempt || attempt.finishedAt) return attempt;
    const test = db.tests.find(t=>t.id===attempt.testId);
    const qmap = new Map(db.questions.map(q=>[q.id,q]));
    let correct = 0;
    attempt.answers.forEach(a=>{
      const q = qmap.get(a.questionId);
      a.correct = q && a.chosenIndex === q.correctIndex;
      if (a.correct) correct += 1;
    });
    attempt.finishedAt = Date.now();
    attempt.accuracy = test.questionIds.length ? Math.round((correct / test.questionIds.length)*100) : 0;
    attempt.scorePercent = attempt.accuracy; // 1:1 for now
    // Compute percentile for this test
    attempt.percentile = computePercentileForTestInternal(db, attempt.testId, attempt.scorePercent);
    // Update user stats (xp, streaks, badges)
    updateUserOnAttemptInternal(db, attempt);
    writeStore(db);
    return attempt;
  }

  // ----- Extras: users, leaderboard, percentiles, streaks/badges -----
  function getUsers() { seedIfNeeded(); return readStore().users || []; }
  function getUser(userId='u1') { seedIfNeeded(); return (readStore().users||[]).find(u=>u.id===userId); }
  function saveUserInternal(db, user) {
    const idx = (db.users||[]).findIndex(u=>u.id===user.id);
    if (idx >= 0) db.users[idx] = user; else (db.users||[]).push(user);
  }
  function todayStr() { return new Date().toISOString().slice(0,10); }
  function computePercentileForTestInternal(db, testId, scorePercent) {
    const scores = (db.attempts||[])
      .filter(a=>a.testId===testId && typeof a.scorePercent === 'number')
      .map(a=>a.scorePercent);
    if (!scores.length) return 0;
    const less = scores.filter(s => s < scorePercent).length;
    const equal = scores.filter(s => s === scorePercent).length;
    return Math.round(100 * (less + 0.5*equal) / scores.length);
  }
  function updateUserOnAttemptInternal(db, attempt, userId='u1') {
    let user = (db.users||[]).find(u=>u.id===userId);
    if (!user) { user = { id: userId, name: 'You', xp: 0, badges: [], streak: 0, lastActiveDay: null }; (db.users||[]).push(user); }
    const day = todayStr();
    if (user.lastActiveDay === day) {
      // same day, keep streak
    } else if (user.lastActiveDay) {
      const prev = new Date(user.lastActiveDay);
      const cur = new Date(day);
      const diff = Math.round((cur - prev)/(1000*60*60*24));
      user.streak = diff === 1 ? (user.streak+1) : 1;
      user.lastActiveDay = day;
    } else {
      user.streak = 1; user.lastActiveDay = day;
    }
    // XP: base + performance
    const numQuestions = (readStore().tests.find(t=>t.id===attempt.testId)?.questionIds.length) || 0;
    const avgTimePerQ = numQuestions ? Math.round((attempt.totalTimeMs||0)/numQuestions/1000) : 0;
    const baseXp = 10;
    const perfXp = Math.round((attempt.scorePercent||0));
    const streakXp = Math.min(20, user.streak * 2);
    user.xp = (user.xp||0) + baseXp + perfXp + streakXp;
    // Badges
    const attemptsByUser = (db.attempts||[]).filter(a=>a.userId===user.id);
    if (!user.badges.includes('\ud83c\udfaf') && attemptsByUser.length <= 1) user.badges.push('\ud83c\udfaf'); // First Attempt
    if (!user.badges.includes('\ud83e\uddec') && (attempt.scorePercent||0) >= 80) user.badges.push('\ud83e\uddec'); // High Scorer
    if (!user.badges.includes('\u26a1\ufe0f') && avgTimePerQ > 0 && avgTimePerQ <= 45) user.badges.push('\u26a1\ufe0f'); // Quick Thinker
    if (!user.badges.includes('\ud83d\udd25') && user.streak >= 3) user.badges.push('\ud83d\udd25'); // 3-day Streak
    saveUserInternal(db, user);
  }
  function getLeaderboard(limit=20) {
    seedIfNeeded();
    const users = (readStore().users||[]).slice().sort((a,b)=> (b.xp||0) - (a.xp||0));
    return users.slice(0, limit);
  }

  window.PQ = { getTests, getTestById, getQuestionsByIds, getAttempts, getAttemptById, startAttempt, saveAnswer, submitAttempt, getUsers, getUser, getLeaderboard };
  seedIfNeeded();
})();

