/* ==========================================================================
   IRON DIARY · session.js
   Session lifecycle, effective set values, weekly autocalc, best sets,
   achievements evaluation, nutrition streak, and PR statistics.
   ========================================================================== */
import { buildDay, sessionKey, WEEKS, DAYS, MEALS, scaleMeal, ACHIEVEMENTS } from './program.js';
import {
  roundTo, floorTo, autoregDelta, accProgression, e1rm, SPEED, bodyPlan, dateKey, addDays,
} from './engine.js';

export const skey = (st, w, d) => sessionKey(st.cycle.n, w, d);
export const getSession = (st, w, d) => st.log[skey(st, w, d)] || null;
export const planFor = (st, w, d) => getSession(st, w, d)?.plan || buildDay(w, d, st);

export function ensureSession(st, w, d) {
  const k = skey(st, w, d);
  if (!st.log[k]) {
    st.log[k] = {
      key: k, cycle: st.cycle.n, week: w, day: d,
      createdAt: Date.now(), startedAt: null, finishedAt: null,
      mod: 0, plan: buildDay(w, d, st), sets: {}, warm: {},
      applied: null, accApplied: null, note: '',
    };
  }
  return st.log[k];
}

export function setLog(sess, exId, i) {
  if (!sess.sets[exId]) sess.sets[exId] = [];
  if (!sess.sets[exId][i]) sess.sets[exId][i] = {};
  return sess.sets[exId][i];
}

export function effSet(sess, ex, i) {
  const plan = ex.sets[i];
  const log = sess?.sets?.[ex.id]?.[i] || {};
  const mod = ex.kind === 'acc' ? 0 : (sess?.mod || 0);
  let w;
  if (log.w != null) w = log.w;
  else if (plan.type === 'bo' && ex.sets[0]?.type === 'top') {
    const top = effSet(sess, ex, 0).w;
    w = roundTo(top * (1 - ex.drop));
  } else w = mod ? roundTo(plan.w * (1 + mod)) : plan.w;
  const lastBo = plan.type === 'bo' && i === ex.sets.length - 1;
  return {
    ...plan, w, r: log.r ?? plan.r,
    done: !!log.done, rir: log.rir ?? null, speed: log.speed ?? null, at: log.at || null,
    edited: log.w != null || log.r != null,
    optional: mod < 0 && lastBo,
    targetR: plan.r, targetRir: plan.rir,
  };
}

export const effSets = (sess, ex) => ex.sets.map((_, i) => effSet(sess, ex, i));

export function previewDelta(st, sess, ex) {
  const sets = effSets(sess, ex);
  if (ex.kind === 'acc') {
    const done = sets.filter(s => s.done);
    if (!done.length) return { verdict: 'nodata', w: null };
    const used = Math.max(...done.map(s => s.w));
    return accProgression({ sets, w: used, step: ex.step, lo: ex.lo, hi: ex.hi, bw: ex.bw });
  }
  return autoregDelta({ sets, lower: ex.lower, reduced: (sess?.mod || 0) < 0 });
}

export function nextPointer(w, d) {
  if (d < 4) return { week: w, day: d + 1, end: false };
  if (w < 8) return { week: w + 1, day: 1, end: false };
  return { week: 8, day: 4, end: true };
}

export function finishSession(st, sess) {
  const applied = {}, accApplied = {};
  for (const ex of sess.plan) {
    const r = previewDelta(st, sess, ex);
    if (r.verdict === 'nodata') continue;
    if (ex.kind === 'acc') {
      accApplied[ex.id] = { from: st.accW[ex.id] ?? null, to: r.w, verdict: r.verdict };
      st.accW[ex.id] = r.w;
    } else {
      applied[ex.id] = r.delta;
      st.adj[ex.id] = (st.adj[ex.id] || 0) + r.delta;
    }
  }
  sess.applied = applied;
  sess.accApplied = accApplied;
  if (!sess.startedAt) sess.startedAt = sess.createdAt;
  sess.finishedAt = Date.now();
  const cur = st.cycle.week * 10 + st.cycle.day;
  if (sess.week * 10 + sess.day >= cur) {
    const n = nextPointer(sess.week, sess.day);
    st.cycle.week = n.week; st.cycle.day = n.day;
    st.cycle.complete = n.end;
  }
  return { applied, accApplied };
}

export function reopenSession(st, sess) {
  Object.entries(sess.applied || {}).forEach(([id, d]) => { st.adj[id] = (st.adj[id] || 0) - d; });
  Object.entries(sess.accApplied || {}).forEach(([id, a]) => {
    if (a.from == null) delete st.accW[id]; else st.accW[id] = a.from;
  });
  sess.applied = null; sess.accApplied = null; sess.finishedAt = null;
}

/* ------------------------------------------------------------ Stats */
export function sessionStats(sess) {
  let tonnage = 0, reps = 0, done = 0, total = 0, speedSum = 0, speedN = 0;
  if (!sess) return { tonnage, reps, done, total, avgSpeed: null };
  for (const ex of sess.plan) {
    ex.sets.forEach((_, i) => {
      const e = effSet(sess, ex, i);
      if (e.optional && !e.done) return;
      total++;
      if (!e.done) return;
      done++;
      if (e.speed && SPEED[e.speed]) { speedSum += SPEED[e.speed].score5; speedN++; }
      if (ex.unit === 'reps') {
        reps += e.r * (ex.perSide ? 2 : 1);
        if (e.w > 0 && !ex.bwPlus) tonnage += e.w * e.r * (ex.perSide ? 2 : 1);
      }
    });
  }
  return { tonnage, reps, done, total, avgSpeed: speedN ? speedSum / speedN : null };
}

export function dayCounts(st, w, d) {
  const sess = getSession(st, w, d);
  if (sess) {
    const x = sessionStats(sess);
    return { done: x.done, total: x.total, frac: x.total ? x.done / x.total : 0 };
  }
  const plan = buildDay(w, d, st);
  const total = plan.reduce((a, ex) => a + ex.sets.length, 0);
  return { done: 0, total, frac: 0 };
}

export function weekTotals(st, w) {
  let done = 0, total = 0, tonnage = 0, reps = 0, speedSum = 0, speedN = 0;
  for (let d = 1; d <= 4; d++) {
    const sess = getSession(st, w, d);
    const c = dayCounts(st, w, d);
    done += c.done;
    total += c.total;
    if (sess) {
      const x = sessionStats(sess);
      tonnage += x.tonnage;
      reps += x.reps;
      if (x.avgSpeed != null) { speedSum += x.avgSpeed; speedN++; }
    }
  }
  const avgScore = speedN ? Math.round(speedSum / speedN) : null;
  const feelMap = { 1: 'Еле', 2: 'Тяжко', 3: 'Норм', 4: 'Бодро', 5: 'Летит' };
  return {
    done, total, tonnage, reps,
    avgScore,
    feelLabel: avgScore ? feelMap[avgScore] : null,
  };
}

export const allSessions = (st) =>
  Object.values(st.log).filter(s => s.startedAt || Object.keys(s.sets || {}).length).sort((a, b) => (a.startedAt || a.createdAt) - (b.startedAt || b.createdAt));

export const COMP = ['sq', 'bp', 'dl', 'ohp'];
export const COMP_LABEL = { sq: 'Присед', bp: 'Жим лёжа', dl: 'Тяга классика', ohp: 'Жим стоя' };

export function e1rmHistory(st, lift) {
  const pts = [];
  for (const s of allSessions(st)) {
    const ex = s.plan.find(e => e.id === lift || (lift === 'dl' && e.base === 'dl' && e.kind === 'main'));
    if (!ex) continue;
    let best = 0;
    effSets(s, ex).forEach(e => { if (e.done) best = Math.max(best, e1rm(e.w, e.r, e.rir ?? 0)); });
    if (best) pts.push({ t: s.startedAt || s.createdAt, v: Math.round(best * 10) / 10, cycle: s.cycle, week: s.week });
  }
  return pts;
}

/** Best set per main lift in a given week (for "Лучшие подходы" and "Саморасчёт") */
export function bestSetsOfWeek(st, w = st.ui.week) {
  const out = {};
  for (const lift of COMP) {
    let best = null;
    for (let d = 1; d <= 4; d++) {
      const sess = getSession(st, w, d);
      if (!sess) continue;
      for (const ex of sess.plan) {
        if (ex.base !== lift || (ex.kind !== 'main' && ex.id !== 'ohp')) continue;
        effSets(sess, ex).forEach(s => {
          if (!s.done) return;
          const est = Math.round(e1rm(s.w, s.r, s.rir ?? 0));
          if (!best || est > best.est) {
            best = {
              w: s.w,
              r: s.r,
              speed: s.speed,
              speedLabel: s.speed && SPEED[s.speed] ? SPEED[s.speed].label : 'Норм',
              rir: s.rir,
              est,
            };
          }
        });
      }
    }
    out[lift] = best;
  }
  return out;
}

/** Weekly autocalculation proposal (capped at +5% per week, matching reference "Саморасчёт") */
export function weekAutocalc(st, w = st.ui.week) {
  const bests = bestSetsOfWeek(st, w);
  const res = {};
  let hasChange = false;
  for (const lift of COMP) {
    const cur = st.profile.maxes[lift];
    const b = bests[lift];
    if (!b) {
      res[lift] = { cur, best: null, next: cur, diff: 0 };
      continue;
    }
    const maxAllowed = roundTo(cur * 1.05, 2.5);
    const minAllowed = roundTo(cur * 0.95, 2.5);
    let proposed = roundTo(b.est, 2.5);
    if (b.speed === 'struggle' || (b.rir === 0 && b.r < 2)) proposed = Math.min(proposed, cur);
    const next = Math.max(minAllowed, Math.min(maxAllowed, proposed));
    const diff = next - cur;
    if (diff !== 0) hasChange = true;
    res[lift] = { cur, best: b, next, diff };
  }
  return { lifts: res, hasChange };
}

export function applyWeekAutocalc(st, w = st.ui.week) {
  const calc = weekAutocalc(st, w);
  for (const lift of COMP) {
    const item = calc.lifts[lift];
    if (item && item.best) {
      st.profile.maxes[lift] = item.next;
    }
  }
  return calc;
}

export function personalRecords(st) {
  const out = {};
  for (const lift of COMP) {
    const rec = { e1rm: null, reps: { 1: null, 2: null, 3: null, 5: null } };
    for (const s of allSessions(st)) {
      const ex = s.plan.find(e => e.id === lift);
      if (!ex) continue;
      effSets(s, ex).forEach(e => {
        if (!e.done) return;
        const v = e1rm(e.w, e.r, e.rir ?? 0);
        if (!rec.e1rm || v > rec.e1rm.v) rec.e1rm = { v, w: e.w, r: e.r, t: s.startedAt || s.createdAt };
        [1, 2, 3, 5].forEach(n => {
          if (e.r >= n && (!rec.reps[n] || e.w > rec.reps[n].w)) rec.reps[n] = { w: e.w, t: s.startedAt || s.createdAt };
        });
      });
    }
    out[lift] = rec;
  }
  return out;
}

/* ------------------------------------------- Nutrition totals & streak */
export function dayNutritionStats(st, k = dateKey()) {
  const P = st.profile;
  const plan = bodyPlan(P.bw, P.targetBw);
  const entry = st.nutrition[k] || { meals: {}, water: 0, supps: {} };
  const scaledMeals = MEALS.map(m => scaleMeal(m, plan.scale));
  let kcal = 0, prot = 0, doneCount = 0;
  scaledMeals.forEach(m => {
    if (entry.meals?.[m.id]) {
      kcal += m.kcal;
      prot += m.prot;
      doneCount++;
    }
  });
  const pct = plan.kcal ? Math.round((kcal / plan.kcal) * 100) : 0;
  const protPct = plan.protein ? Math.round((prot / plan.protein) * 100) : 0;
  return {
    kcal,
    targetKcal: plan.kcal,
    prot,
    targetProt: plan.protein,
    pct,
    protPct,
    scale: plan.scale,
    doneCount,
    totalMeals: scaledMeals.length,
    scaledMeals,
    hit90: pct >= 90,
    hit100: pct >= 100,
  };
}

export function nutritionStreak(st) {
  const today = dateKey();
  let streak = 0;
  const todayHit = dayNutritionStats(st, today).hit90;
  if (todayHit) streak++;
  for (let i = 1; i <= 60; i++) {
    const k = addDays(today, -i);
    if (dayNutritionStats(st, k).hit90) streak++;
    else break;
  }
  return streak;
}

/* ---------------------------------------------- Achievements Evaluator */
export function evaluateAchievements(st) {
  const P = st.profile;
  const prs = personalRecords(st);
  let anySet = false, anyFullDay = false, anyFullWeek = false, anyPr = false, gripDone = false;

  for (const s of Object.values(st.log)) {
    const x = sessionStats(s);
    if (x.done > 0) anySet = true;
    if (x.total > 0 && x.done >= x.total) anyFullDay = true;
    for (const ex of s.plan || []) {
      effSets(s, ex).forEach(set => {
        if (!set.done) return;
        if (ex.id === 'kroc' && set.r >= 20) gripDone = true;
        if (COMP.includes(ex.id) && e1rm(set.w, set.r, set.rir ?? 0) > (P.maxes[ex.id] || 0)) {
          anyPr = true;
        }
      });
    }
  }

  for (let w = 1; w <= 8; w++) {
    const wt = weekTotals(st, w);
    if (wt.total > 0 && wt.done >= wt.total) anyFullWeek = true;
    if (st.weekReviews?.[`c${st.cycle.n}-w${w}`]?.closed) anyFullWeek = true;
  }

  let anyFullFood = false;
  for (const k of Object.keys(st.nutrition || {})) {
    if (dayNutritionStats(st, k).hit100) { anyFullFood = true; break; }
  }
  const streak = nutritionStreak(st);
  const maxBw = Math.max(P.bw, ...(st.bodyweight || []).map(b => b.kg));
  const bestBp = Math.max(P.maxes.bp, prs.bp?.e1rm?.v || 0);
  const bestDl = Math.max(P.maxes.dl, prs.dl?.e1rm?.v || 0);
  const bestSq = Math.max(P.maxes.sq, prs.sq?.e1rm?.v || 0);
  const totalEst = Math.round(bestSq + bestBp + bestDl);

  const flags = {
    first_set: anySet,
    full_day: anyFullDay,
    full_week: anyFullWeek,
    new_pr: anyPr,
    full_food: anyFullFood,
    streak_7: streak >= 7,
    bw_100: maxBw >= 100,
    bench_140: bestBp >= 140,
    total_600: totalEst >= 600,
    dl_parity: bestDl >= 220,
    iron_grip: gripDone,
    bw_125: maxBw >= 125,
  };

  const list = ACHIEVEMENTS.map(a => ({ ...a, unlocked: !!flags[a.id] }));
  const unlockedCount = list.filter(a => a.unlocked).length;
  return { list, unlockedCount, totalCount: list.length };
}

export function dayCompletion(st, w, d) {
  return dayCounts(st, w, d).frac;
}

export const dayTitle = (w, d) => DAYS[d - 1].title(w);
