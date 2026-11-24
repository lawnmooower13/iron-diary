/* ==========================================================================
   IRON DIARY · engine.js
   Pure calculation layer: rounding, plates, warm-up pyramid, e1RM,
   autoregulation, CNS readiness, DOTS, nutrition scaling, dates.
   ========================================================================== */

export const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];

/* Competition plate geometry (mm) + rich calibrated Olympic colours */
export const PLATE_SPEC = {
  25:   { d: 450, t: 28, fill: '#D9262E', dark: '#8F161C', ink: '#FFF5F5', dot: '#E02E36' },
  20:   { d: 450, t: 24, fill: '#2563EB', dark: '#173E94', ink: '#EFF6FF', dot: '#2E6FF2' },
  15:   { d: 400, t: 22, fill: '#EAB308', dark: '#9A7304', ink: '#1C1603', dot: '#F2BE1A' },
  10:   { d: 325, t: 19, fill: '#16A34A', dark: '#0E6930', ink: '#ECFDF5', dot: '#22C55E' },
  5:    { d: 230, t: 16, fill: '#E5E7EB', dark: '#9CA3AF', ink: '#111827', dot: '#E5E7EB' },
  2.5:  { d: 190, t: 13, fill: '#374151', dark: '#1F2937', ink: '#F3F4F6', dot: '#4B5563' },
  1.25: { d: 160, t: 11, fill: '#9CA3AF', dark: '#6B7280', ink: '#111827', dot: '#9CA3AF' },
};

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const roundTo = (w, step = 2.5) => Math.round((w + 1e-9) / step) * step;
export const floorTo = (w, step = 2.5) => Math.floor((w + 1e-9) / step) * step;

export function fmt(n, digits = 2) {
  if (n == null || Number.isNaN(n)) return '—';
  const p = Math.pow(10, digits);
  return String(Math.round(n * p) / p).replace('.', ',');
}
export function fmtInt(n) {
  if (n == null || Number.isNaN(n)) return '—';
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
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
export function e1rm(w, reps, rir = 0) {
  if (!w || !reps) return 0;
  const n = Math.min(reps + (rir || 0), 15);
  return n <= 1 ? w : w * (1 + n / 30);
}

/* -------------------------------------------------------- Autoregulation */
/* 5-step effort/velocity scale matching reference UI ("КАК ПОШЁЛ") */
export const SPEED_LIST = [
  { key: 'struggle', label: 'Еле',    bars: 1, mod: -1.5, score5: 1 },
  { key: 'grind',    label: 'Тяжко',  bars: 2, mod: -0.8, score5: 2 },
  { key: 'norm',     label: 'Норм',   bars: 3, mod: 0,    score5: 3 },
  { key: 'brisk',    label: 'Бодро',  bars: 4, mod: 0.6,  score5: 4 },
  { key: 'fly',      label: 'Летит',  bars: 5, mod: 1.1,  score5: 5 },
];

export const SPEED = Object.fromEntries(SPEED_LIST.map(s => [s.key, s]));
export const RIR_OPTIONS = [0, 1, 2, 3, 4];

export function autoregDelta({ sets, lower, reduced = false }) {
  let sum = 0, wsum = 0, missedTop = false, missed = false;
  for (const s of sets) {
    if (!s.done) continue;
    if ((s.r ?? 0) < (s.targetR ?? 0)) { missed = true; if (s.type === 'top') missedTop = true; }
    if (s.rir == null && s.speed == null) continue;
    const rirDiff = s.rir == null ? 0 : Math.min(s.rir, 3) - s.targetRir;
    const sp = s.speed && SPEED[s.speed] ? SPEED[s.speed].mod : 0;
    const score = clamp(rirDiff + sp, -3, 3);
    const k = s.type === 'top' ? 2 : 1;
    sum += score * k; wsum += k;
  }
  if (!wsum && !missed) return { delta: 0, score: null, verdict: 'nodata' };
  const avg = wsum ? sum / wsum : -1;
  let delta;
  if (lower) delta = avg >= 1.4 ? 5 : avg >= 0.45 ? 2.5 : avg > -0.5 ? 0 : avg > -1.5 ? -2.5 : -5;
  else delta = avg >= 0.9 ? 2.5 : avg > -0.75 ? 0 : avg > -1.75 ? -2.5 : -5;
  if (missed) delta = Math.min(delta, 0);
  if (missedTop) delta = Math.min(delta, -2.5);
  if (reduced) delta = Math.min(delta, 0);
  return { delta, score: avg, verdict: delta > 0 ? 'up' : delta < 0 ? 'down' : 'hold' };
}

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
            text: 'План без изменений. При скорости «Летит» топ-сет даст прибавку к расчётному максимуму.' },
  work:   { key: 'work',   label: 'РАБОЧИЙ',  title: 'Рабочая готовность',    mod: 0,      tone: 'ice',
            text: 'План без изменений, без форсирования: топ-сет строго по целевому запасу.' },
  yellow: { key: 'yellow', label: 'СНИЖЕНИЕ', title: 'Сниженная готовность',  mod: -0.075, tone: 'warn',
            text: 'Рекомендуется снизить рабочие веса на 7,5%, последний подход сделать опциональным.' },
  red:    { key: 'red',    label: 'ПЕРЕГРУЗ', title: 'ЦНС не восстановлена',  mod: -0.15,  tone: 'crit',
            text: 'Пульс выше нормы или острый недосып. Тяжёлую тягу лучше провести в техническом режиме (−15%).' },
};

export function readiness({ sleep = 8, quality = 4, hr = 58, doms = 2 }, baselineHr = 58) {
  const sSleep = clamp((sleep - 4) / 4.5, 0, 1);
  const sQual = clamp((quality - 1) / 4, 0, 1);
  const dHr = Math.round(hr - baselineHr);
  const sHr = clamp(1 - Math.max(0, dHr) / 12, 0, 1);
  const sDoms = clamp((5 - doms) / 4, 0, 1);
  const score = Math.round((sSleep * 0.35 + sQual * 0.25 + sHr * 0.3 + sDoms * 0.1) * 100);
  const flags = [];
  if (sleep < 6) flags.push({ level: sleep < 5 ? 'crit' : 'warn', text: `Недосып: ${fmt(sleep, 1)} ч при норме 8–9 ч` });
  if (dHr >= 7) flags.push({ level: dHr >= 10 ? 'crit' : 'warn', text: `Пульс покоя на ${dHr} уд/мин выше нормы (${baselineHr})` });
  if (doms >= 4) flags.push({ level: doms >= 5 ? 'crit' : 'warn', text: 'Выраженная забитость мышц и связок' });
  if (quality <= 2) flags.push({ level: 'warn', text: 'Разбитое утреннее состояние' });
  let zone = score >= 80 ? 'green' : score >= 60 ? 'work' : score >= 40 ? 'yellow' : 'red';
  const crit = flags.filter(f => f.level === 'crit').length;
  if (crit >= 1 && (zone === 'green' || zone === 'work')) zone = 'yellow';
  if (crit >= 2) zone = 'red';
  return { score, zone, flags, dHr, parts: { sSleep, sQual, sHr, sDoms } };
}

/* ------------------------------------------- Body target & Calorie plan */
export function bodyPlan(bw = 95, targetBw = 125) {
  const maint = Math.round(bw * 34.5); // 95 kg -> 3278 (~3277)
  const diff = Math.round((targetBw - bw) * 10) / 10;
  let delta = 0;
  if (diff > 0.3) delta = 578; // 3277 + 578 = 3855 (exact match with video!)
  else if (diff < -0.3) delta = -386; // 3277 - 386 = 2891 (exact match with video!)
  const kcal = maint + delta;
  const protein = Math.max(200, Math.round(Math.max(bw, Math.min(targetBw, bw + 15)) * 2.1));
  let weeks = 0;
  if (diff > 0.3) weeks = Math.max(1, Math.round(diff / 0.735));
  else if (diff < -0.3) weeks = Math.max(1, Math.round(Math.abs(diff) / 0.5));
  const targetDate = weeks > 0 ? addDays(dateKey(), weeks * 7) : null;
  const scale = kcal / 3855; // base meal template totals 3855 kcal
  return {
    maint,
    kcal,
    deltaLabel: diff > 0.3 ? '+500' : diff < -0.3 ? '\u2212400' : 'поддержка',
    protein,
    weeks,
    targetDate,
    scale: Math.round(scale * 100) / 100,
  };
}

/* ------------------------------------------------------------------ DOTS */
export function dots(total, bw) {
  if (!total || !bw) return 0;
  const b = clamp(bw, 40, 210);
  const den = -0.000001093 * b ** 4 + 0.0007391293 * b ** 3 - 0.1918759221 * b ** 2 + 24.0900756 * b - 307.75076;
  return (total * 500) / den;
}

export function slopePerWeek(points) {
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
const DOW = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const MON = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
export function humanDate(k) {
  const d = parseKey(k);
  const today = dateKey();
  const prefix = k === today ? 'Сегодня, ' : '';
  return `${prefix}${DOW[d.getDay()]}, ${d.getDate()} ${MON[d.getMonth()]}`;
}
export function shortDate(ts) {
  const d = typeof ts === 'string' ? parseKey(ts) : new Date(ts);
  return `${d.getDate()} ${MON[d.getMonth()]}`;
}
export const dowShort = (k) => DOW[parseKey(k).getDay()].toUpperCase();
