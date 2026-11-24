/* ==========================================================================
   IRON DIARY · session.js
   Session lifecycle (snapshot, effective set values, finish / reopen),
   autoregulation application, statistics, PR and e1RM history.
   ========================================================================== */
import { buildDay, sessionKey, WEEKS, DAYS } from './program.js';
import { roundTo, floorTo, autoregDelta, accProgression, e1rm } from './engine.js';

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

/** Effective values of a set: logged override > derived back-off > readiness mod > plan. */
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
  let tonnage = 0, reps = 0, done = 0, total = 0;
  if (!sess) return { tonnage, reps, done, total };
  for (const ex of sess.plan) {
    ex.sets.forEach((_, i) => {
      const e = effSet(sess, ex, i);
      if (e.optional && !e.done) return;
      total++;
      if (!e.done) return;
      done++;
      if (ex.unit === 'reps') {
        reps += e.r * (ex.perSide ? 2 : 1);
        if (e.w > 0 && !ex.bwPlus) tonnage += e.w * e.r * (ex.perSide ? 2 : 1);
      }
    });
  }
  return { tonnage, reps, done, total };
}

export function planStats(plan) {
  let sets = 0, tonnage = 0;
  plan.forEach(ex => ex.sets.forEach(s => {
    sets++;
    if (ex.unit === 'reps' && s.w > 0 && !ex.bwPlus) tonnage += s.w * s.r * (ex.perSide ? 2 : 1);
  }));
  return { sets, tonnage };
}

export const allSessions = (st) =>
  Object.values(st.log).filter(s => s.startedAt).sort((a, b) => a.startedAt - b.startedAt);

export const COMP = ['sq', 'bp', 'dl', 'ohp'];
export const COMP_LABEL = { sq: 'Присед', bp: 'Жим лёжа', dl: 'Тяга', ohp: 'Армейский' };

export function e1rmHistory(st, lift) {
  const pts = [];
  for (const s of allSessions(st)) {
    const ex = s.plan.find(e => e.id === lift);
    if (!ex) continue;
    let best = 0;
    effSets(s, ex).forEach(e => { if (e.done) best = Math.max(best, e1rm(e.w, e.r, e.rir ?? 0)); });
    if (best) pts.push({ t: s.startedAt, v: Math.round(best * 10) / 10, cycle: s.cycle, week: s.week });
  }
  return pts;
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
        if (!rec.e1rm || v > rec.e1rm.v) rec.e1rm = { v, w: e.w, r: e.r, t: s.startedAt };
        [1, 2, 3, 5].forEach(n => {
          if (e.r >= n && (!rec.reps[n] || e.w > rec.reps[n].w)) rec.reps[n] = { w: e.w, t: s.startedAt };
        });
      });
    }
    out[lift] = rec;
  }
  return out;
}

/** PRs hit inside this session compared to all previous sessions. */
export function sessionPRs(st, sess) {
  const prev = { ...st, log: Object.fromEntries(Object.entries(st.log).filter(([k, s]) => k !== sess.key && s.startedAt && s.startedAt < (sess.startedAt || Date.now()))) };
  const before = personalRecords(prev);
  const list = [];
  for (const lift of COMP) {
    const ex = sess.plan.find(e => e.id === lift);
    if (!ex) continue;
    let best = 0, bestSet = null;
    effSets(sess, ex).forEach(e => {
      if (!e.done) return;
      const v = e1rm(e.w, e.r, e.rir ?? 0);
      if (v > best) { best = v; bestSet = e; }
    });
    const b = before[lift].e1rm?.v || 0;
    if (best > b && b > 0) list.push({ lift, v: best, prev: b, set: bestSet });
  }
  return list;
}

export function weeklyVolume(st, cycleN = st.cycle.n) {
  const weeks = WEEKS.map(w => ({ week: w.n, tonnage: 0, reps: 0, sets: 0 }));
  Object.values(st.log).forEach(s => {
    if (s.cycle !== cycleN) return;
    const x = sessionStats(s);
    const w = weeks[s.week - 1];
    w.tonnage += x.tonnage; w.reps += x.reps; w.sets += x.done;
  });
  return weeks;
}

export function cycleProposal(st) {
  const res = {};
  for (const lift of COMP) {
    const pts = e1rmHistory(st, lift).filter(p => p.cycle === st.cycle.n);
    const late = pts.filter(p => p.week >= 5);
    const src = late.length ? late : pts;
    const best = src.length ? Math.max(...src.map(p => p.v)) : 0;
    const cur = st.profile.maxes[lift];
    res[lift] = { cur, best, next: best ? floorTo(best) : cur };
  }
  return res;
}

export function dayCompletion(st, w, d) {
  const s = getSession(st, w, d);
  if (!s) return 0;
  if (s.finishedAt) return 1;
  const x = sessionStats(s);
  return x.total ? x.done / x.total : 0;
}

export const dayTitle = (w, d) => DAYS[d - 1].title(w);
