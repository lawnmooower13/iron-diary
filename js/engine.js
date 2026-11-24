/* ==========================================================================
   IRON DIARY · engine.js
   Pure calculation layer: rounding, plates, warm-up pyramid, e1RM,
   autoregulation, CNS readiness, DOTS, statistics. No DOM access.
   ========================================================================== */

export const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];

/* Real competition plate geometry (mm) + muted calibrated colours */
export const PLATE_SPEC = {
  25:   { d: 450, t: 27, fill: '#9E2F2B', ink: '#F3E7E6' },
  20:   { d: 450, t: 23, fill: '#284A80', ink: '#E5EBF5' },
  15:   { d: 400, t: 21, fill: '#B08A22', ink: '#17130A' },
  10:   { d: 325, t: 18, fill: '#2A6E4D', ink: '#E2F0E8' },
  5:    { d: 230, t: 15, fill: '#D3D6DC', ink: '#111214' },
  2.5:  { d: 190, t: 12, fill: '#2A2B31', ink: '#C9CDD4' },
  1.25: { d: 160, t: 10, fill: '#AAB0BA', ink: '#111214' },
};

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const roundTo = (w, step = 2.5) => Math.round((w + 1e-9) / step) * step;
export const floorTo = (w, step = 2.5) => Math.floor((w + 1e-9) / step) * step;

/** Russian decimal formatting: 182.5 -> "182,5" */
export function fmt(n, digits = 2) {
  if (n == null || Number.isNaN(n)) return '—';
  const p = Math.pow(10, digits);
  return String(Math.round(n * p) / p).replace('.', ',');
}
export function fmtInt(n) {
  if (n == null || Number.isNaN(n)) return '—';
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u2009');
}
export function fmtSigned(n) {
  if (!n) return '0';
  return (n > 0 ? '+' : '\u2212') + fmt(Math.abs(n));
}
export function fmtDuration(ms) {
  if (!ms || ms < 0) return '0:00';
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  const mm = h ? String(m).padStart(2, '0') : String(m);
  return (h ? h + ':' : '') + mm + ':' + String(sec).padStart(2, '0');
}

/* ---------------------------------------------------------------- Plates */
export function plateBreakdown(total, bar = 20, collar = 0) {
  const load = total - bar - collar * 2;
  if (load < -1e-9) {
    return { plates: [], perSide: 0, remainder: 0, achieved: bar + collar * 2, underBar: true };
  }
  let side = load / 2;
  const plates = [];
  for (const p of PLATES) {
    while (side + 1e-9 >= p) {
      plates.push(p);
      side = Math.round((side - p) * 1000) / 1000;
    }
  }
  const perSide = plates.reduce((a, b) => a + b, 0);
  return { plates, perSide, remainder: side, achieved: bar + collar * 2 + perSide * 2, underBar: false };
}

export function groupPlates(plates) {
  const map = new Map();
  plates.forEach(p => map.set(p, (map.get(p) || 0) + 1));
  return [...map.entries()].map(([w, n]) => ({ w, n }));
}

/* ------------------------------------------------------ Warm-up pyramid */
export function warmupPyramid(target, { bar = 20, pull = false } = {}) {
  if (!target || target <= bar + 5) return [];
  const out = [];
  if (pull && target >= 100) out.push({ w: 60, r: 5, p: null, note: 'гриф + 2×20' });
  else out.push({ w: bar, r: 10, p: null, note: 'пустой гриф' });
  const ladder = [[0.5, 5], [0.65, 3], [0.8, 2], [0.9, 1]];
  for (const [p, r] of ladder) {
    const w = roundTo(target * p);
    const last = out[out.length - 1].w;
    if (w > last && w < target) out.push({ w, r, p });
  }
  return out;
}

/* ------------------------------------------------------------------ e1RM */
/** Epley adjusted for reps-in-reserve: reps + RIR = potential reps. */
export function e1rm(w, reps, rir = 0) {
  if (!w || !reps) return 0;
  const n = Math.min(reps + (rir || 0), 15);
  return n <= 1 ? w : w * (1 + n / 30);
}

/* -------------------------------------------------------- Autoregulation */
export const SPEED = {
  fly:   { label: 'Летит',      mod: 1,  hint: 'взрывная скорость' },
  norm:  { label: 'Нормально',  mod: 0,  hint: 'рабочая скорость' },
  grind: { label: 'Давит',      mod: -1, hint: 'медленный гринд' },
};
export const RIR_OPTIONS = [0, 1, 2, 3];

/**
 * Converts set feedback into a load delta for the next session of the lift.
 * score per set = (actual RIR - target RIR) + speed modifier, clamped to ±3.
 * Top set has double weight. Missed reps or a readiness-reduced session cap
 * the delta so that fatigue never inflates future loads.
 */
export function autoregDelta({ sets, lower, reduced = false }) {
  let sum = 0, wsum = 0, missedTop = false, missed = false;
  for (const s of sets) {
    if (!s.done) continue;
    if ((s.r ?? 0) < (s.targetR ?? 0)) { missed = true; if (s.type === 'top') missedTop = true; }
    if (s.rir == null && s.speed == null) continue;
    const rirDiff = s.rir == null ? 0 : s.rir - s.targetRir;
    const sp = s.speed ? SPEED[s.speed].mod : 0;
    const score = clamp(rirDiff + sp, -3, 3);
    const k = s.type === 'top' ? 2 : 1;
    sum += score * k; wsum += k;
  }
  if (!wsum && !missed) return { delta: 0, score: null, verdict: 'nodata' };
  const avg = wsum ? sum / wsum : -1;
  let delta;
  if (lower) delta = avg >= 1.5 ? 5 : avg >= 0.5 ? 2.5 : avg > -0.5 ? 0 : avg > -1.5 ? -2.5 : -5;
  else delta = avg >= 1 ? 2.5 : avg > -0.75 ? 0 : avg > -1.75 ? -2.5 : -5;
  if (missed) delta = Math.min(delta, 0);
  if (missedTop) delta = Math.min(delta, -2.5);
  if (reduced) delta = Math.min(delta, 0);
  return { delta, score: avg, verdict: delta > 0 ? 'up' : delta < 0 ? 'down' : 'hold' };
}

/** Double progression for accessories / strongman implements. */
export function accProgression({ sets, w, step, lo, hi, bw }) {
  const done = sets.filter(s => s.done);
  if (!done.length) return { w, verdict: 'nodata' };
  const allHi = done.every(s => (s.r ?? 0) >= hi);
  const anyLow = done.some(s => (s.r ?? 0) < lo);
  const rirs = done.map(s => s.rir).filter(x => x != null);
  const minRir = rirs.length ? Math.min(...rirs) : 1;
  if (bw && !step) {
    if (allHi && minRir >= 1) return { w, verdict: 'harder' };
    return { w, verdict: 'hold' };
  }
  if (allHi && minRir >= 1) return { w: w + (minRir >= 3 ? step * 2 : step), verdict: 'up' };
  if (anyLow && minRir === 0) return { w: Math.max(0, w - step), verdict: 'down' };
  return { w, verdict: 'hold' };
}

/* ------------------------------------------------------- CNS readiness */
export const ZONES = {
  green:  { key: 'green',  label: 'ГОТОВ',    title: 'Полная готовность',     mod: 0,      tone: 'ok',
            text: 'План без изменений. При скорости «Летит» топ-сет можно атаковать на +2,5 кг.' },
  work:   { key: 'work',   label: 'РАБОЧИЙ',  title: 'Рабочая готовность',    mod: 0,      tone: 'ice',
            text: 'План без изменений, без форсирования: топ-сет строго по целевому RIR.' },
  yellow: { key: 'yellow', label: 'СНИЖЕНИЕ', title: 'Сниженная готовность',  mod: -0.075, tone: 'warn',
            text: 'Снизить рабочие веса на 7,5%, последний back-off сделать опциональным. Тяжёлую тягу — только при скорости «Нормально».' },
  red:    { key: 'red',    label: 'КРИТИЧНО', title: 'ЦНС не восстановлена',  mod: -0.15,  tone: 'crit',
            text: 'Тяжёлую тягу перенести. Сегодня — техника 60–70% (коррекция −15%), подсобка, хват, мобилизация.' },
};

export function readiness({ sleep, quality, hr, doms }, baselineHr) {
  const sSleep = clamp((sleep - 4) / 4.5, 0, 1);
  const sQual = clamp((quality - 1) / 4, 0, 1);
  const dHr = Math.round(hr - baselineHr);
  const sHr = clamp(1 - Math.max(0, dHr) / 12, 0, 1);
  const sDoms = clamp((5 - doms) / 4, 0, 1);
  const score = Math.round((sSleep * 0.35 + sQual * 0.2 + sHr * 0.3 + sDoms * 0.15) * 100);
  const flags = [];
  if (sleep < 6) flags.push({ level: sleep < 5 ? 'crit' : 'warn', text: `Недосып: ${fmt(sleep, 1)} ч при норме 8–9 ч для набора массы` });
  if (dHr >= 7) flags.push({ level: dHr >= 10 ? 'crit' : 'warn', text: `Пульс покоя выше базы на ${dHr} уд/мин — признак незавершённого восстановления` });
  if (doms >= 4) flags.push({ level: doms >= 5 ? 'crit' : 'warn', text: 'Выраженная мышечная боль — снизить объём back-off' });
  if (quality <= 2) flags.push({ level: 'warn', text: 'Низкое качество сна' });
  let zone = score >= 80 ? 'green' : score >= 60 ? 'work' : score >= 40 ? 'yellow' : 'red';
  const crit = flags.filter(f => f.level === 'crit').length;
  if (crit >= 1 && (zone === 'green' || zone === 'work')) zone = 'yellow';
  if (crit >= 2) zone = 'red';
  return { score, zone, flags, dHr, parts: { sSleep, sQual, sHr, sDoms } };
}

/* ------------------------------------------------------------------ DOTS */
export function dots(total, bw) {
  if (!total || !bw) return 0;
  const b = clamp(bw, 40, 210);
  const den = -0.000001093 * b ** 4 + 0.0007391293 * b ** 3 - 0.1918759221 * b ** 2 + 24.0900756 * b - 307.75076;
  return (total * 500) / den;
}

/* ----------------------------------------------------- Linear regression */
export function slopePerWeek(points) {
  // points: [{t: ms, v}]
  if (points.length < 2) return null;
  const day = 86400000;
  const xs = points.map(p => p.t / day), ys = points.map(p => p.v);
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length;
  const my = ys.reduce((a, b) => a + b, 0) / ys.length;
  let num = 0, den = 0;
  xs.forEach((x, i) => { num += (x - mx) * (ys[i] - my); den += (x - mx) ** 2; });
  if (!den) return null;
  return (num / den) * 7;
}

/* ------------------------------------------------------------ Dates */
export function dateKey(d = new Date()) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
export function parseKey(k) {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
}
export function addDays(k, n) {
  const d = parseKey(k); d.setDate(d.getDate() + n); return dateKey(d);
}
export function daysBetween(a, b) {
  return Math.round((parseKey(b) - parseKey(a)) / 86400000);
}
const DOW = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
const MON = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
export function humanDate(k) {
  const d = parseKey(k);
  return `${DOW[d.getDay()]} · ${d.getDate()} ${MON[d.getMonth()]}`;
}
export function shortDate(ts) {
  const d = new Date(ts);
  return `${d.getDate()} ${MON[d.getMonth()]}`;
}
export const dowShort = (k) => DOW[parseKey(k).getDay()];
