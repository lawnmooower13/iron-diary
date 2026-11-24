/* ==========================================================================
   IRON DIARY · views/readiness.js — Модуль 3: готовность ЦНС
   ========================================================================== */
import * as S from '../store.js';
import { readiness, ZONES, dateKey, addDays, fmt, dowShort, clamp } from '../engine.js';
import { icon, on, barChart, esc } from '../ui.js';

const DEFAULT_ENTRY = { sleep: 8, quality: 4, hr: 58, doms: 2 };

export function baselineHr(st) {
  const today = dateKey();
  const vals = [];
  for (let i = 1; i <= 14 && vals.length < 7; i++) {
    const e = st.readiness[addDays(today, -i)];
    if (e && e.hr) vals.push(e.hr);
  }
  if (vals.length >= 3) return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  return st.profile.baselineHr;
}

export function todayReadiness(st) {
  const e = st.readiness[dateKey()];
  if (!e || !e.saved) return null;
  return { ...readiness(e, baselineHr(st)), entry: e };
}

function draft(st) {
  const e = st.readiness[dateKey()];
  if (e) return e;
  const last = Object.keys(st.readiness).sort().pop();
  const base = last ? st.readiness[last] : null;
  return { ...DEFAULT_ENTRY, hr: base?.hr || st.profile.baselineHr, saved: false };
}

function gauge(score, tone) {
  const size = 220, stroke = 10, r = (size - stroke) / 2 - 4;
  const start = 135, sweep = 270;
  const polar = (a) => {
    const rad = (a - 90) * Math.PI / 180;
    return [size / 2 + r * Math.cos(rad), size / 2 + r * Math.sin(rad)];
  };
  const arc = (from, to) => {
    const [x1, y1] = polar(from), [x2, y2] = polar(to);
    const large = to - from > 180 ? 1 : 0;
    return `M${x1.toFixed(2)} ${y1.toFixed(2)} A${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
  };
  const end = start + sweep * clamp(score / 100, 0.001, 1);
  const ticks = Array.from({ length: 28 }, (_, i) => {
    const a = start + (sweep / 27) * i;
    const rad = (a - 90) * Math.PI / 180;
    const r1 = r - 14, r2 = r - (i % 3 === 0 ? 22 : 18);
    return `<line x1="${(size / 2 + r1 * Math.cos(rad)).toFixed(1)}" y1="${(size / 2 + r1 * Math.sin(rad)).toFixed(1)}" x2="${(size / 2 + r2 * Math.cos(rad)).toFixed(1)}" y2="${(size / 2 + r2 * Math.sin(rad)).toFixed(1)}" stroke="rgba(255,255,255,${i % 3 === 0 ? 0.18 : 0.07})" stroke-width="1"/>`;
  }).join('');
  return `
  <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="block mx-auto">
    <path d="${arc(start, start + sweep)}" stroke="rgba(255,255,255,.06)" stroke-width="${stroke}" fill="none" stroke-linecap="round"/>
    <path d="${arc(start, end)}" stroke="var(--${tone})" stroke-width="${stroke}" fill="none" stroke-linecap="round" class="gauge-arc" style="filter:drop-shadow(0 0 10px var(--${tone}-glow))"/>
    ${ticks}
  </svg>`;
}

function stepper(label, ico, valueHtml, act, unit = '') {
  return `
  <div class="metric-row">
    <div class="flex items-center gap-3 min-w-0">
      <span class="metric-ico">${icon(ico, 18)}</span>
      <span class="text-[13px] text-chrome-300">${label}</span>
    </div>
    <div class="flex items-center gap-1.5">
      <button class="step-btn" data-act="${act}" data-d="-1" aria-label="Уменьшить">${icon('minus', 18)}</button>
      <div class="w-[78px] text-center"><span class="font-mono text-[22px]">${valueHtml}</span><span class="text-[11px] text-chrome-500 ml-1">${unit}</span></div>
      <button class="step-btn" data-act="${act}" data-d="1" aria-label="Увеличить">${icon('plus', 18)}</button>
    </div>
  </div>`;
}

function scale(label, ico, value, act, hints) {
  return `
  <div class="py-3 border-t border-white/[0.05]">
    <div class="flex items-center justify-between mb-2.5">
      <div class="flex items-center gap-3"><span class="metric-ico">${icon(ico, 18)}</span><span class="text-[13px] text-chrome-300">${label}</span></div>
      <span class="text-[11px] text-chrome-500">${hints[value - 1]}</span>
    </div>
    <div class="seg seg-5">
      ${[1, 2, 3, 4, 5].map(v => `<button class="seg-btn ${v === value ? 'is-on' : ''}" data-act="${act}" data-v="${v}">${v}</button>`).join('')}
    </div>
  </div>`;
}

export function render(st) {
  const e = draft(st);
  const base = baselineHr(st);
  const R = readiness(e, base);
  const Z = ZONES[R.zone];
  const today = dateKey();
  const hist = Array.from({ length: 14 }, (_, i) => {
    const k = addDays(today, i - 13);
    const x = st.readiness[k];
    return { label: dowShort(k).slice(0, 2), v: x && x.saved ? readiness(x, base).score : 0 };
  });

  return `
  <section class="glass card p-5 text-center relative overflow-hidden">
    <div class="eyebrow">Индекс готовности ЦНС · сегодня</div>
    <div class="relative mt-2">
      ${gauge(R.score, Z.tone)}
      <div class="absolute inset-0 grid place-items-center">
        <div>
          <div class="font-mono text-[60px] leading-none tracking-tight">${R.score}</div>
          <div class="tag tag-${Z.tone} mt-3 mx-auto">${Z.label}</div>
        </div>
      </div>
    </div>
    <h3 class="font-display text-[16px] -mt-4">${Z.title}</h3>
    <p class="text-[13px] text-chrome-400 mt-2 leading-relaxed max-w-[320px] mx-auto">${Z.text}</p>
    ${e.saved ? `<div class="text-[11px] text-chrome-500 mt-3 font-mono">ЗАМЕР СОХРАНЁН · ${new Date(e.at || Date.now()).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</div>` : `<div class="text-[11px] text-warn mt-3">Черновик — сохраните замер, чтобы он учитывался в тренировке</div>`}
  </section>

  ${R.flags.length ? `
  <section class="glass card p-4 space-y-2.5">
    <div class="eyebrow">Предупреждения</div>
    ${R.flags.map(f => `<div class="flag flag-${f.level}"><span class="flag-bar"></span><span>${esc(f.text)}</span></div>`).join('')}
  </section>` : ''}

  <section class="glass card p-4">
    <div class="flex items-center justify-between mb-1">
      <div class="eyebrow">Утренний замер</div>
      <span class="text-[11px] text-chrome-500 font-mono">БАЗА ПУЛЬСА ${base}</span>
    </div>
    ${stepper('Сон', 'moon', fmt(e.sleep, 1), 'rd:sleep', 'ч')}
    ${stepper('Пульс покоя', 'heart', e.hr, 'rd:hr', 'уд/мин')}
    ${scale('Качество сна', 'bed', e.quality, 'rd:quality', ['ужасно', 'плохо', 'средне', 'хорошо', 'отлично'])}
    ${scale('Мышечная боль (DOMS)', 'bolt', e.doms, 'rd:doms', ['нет', 'лёгкая', 'умеренная', 'сильная', 'острая'])}
    <button class="btn btn-primary w-full mt-4" data-act="rd:save">${icon('check', 18)}<span>${e.saved ? 'Обновить замер' : 'Сохранить замер'}</span></button>
  </section>

  <section class="glass card p-4">
    <div class="flex items-center justify-between">
      <div class="eyebrow">Динамика · 14 дней</div>
      <span class="text-[11px] text-chrome-500">индекс 0–100</span>
    </div>
    <div class="mt-3">${barChart(hist, { active: 13 })}</div>
    <div class="grid grid-cols-4 gap-2 mt-3 text-center">
      ${[['≥80', 'ok', 'Готов'], ['60–79', 'ice', 'Рабочий'], ['40–59', 'warn', '−7,5%'], ['<40', 'crit', '−15%']].map(([r, t, l]) => `
        <div class="legend"><span class="legend-dot bg-${t}"></span><div class="font-mono text-[11px] text-chrome-300">${r}</div><div class="text-[10px] text-chrome-500">${l}</div></div>`).join('')}
    </div>
  </section>

  <section class="glass card p-4">
    <div class="eyebrow mb-2">Как считается индекс</div>
    <p class="text-[12.5px] text-chrome-400 leading-relaxed">Сон 35% (линейно от 4 до 8,5 ч) · пульс покоя 30% (каждый удар выше базы снижает балл, +12 — ноль) · качество сна 20% · DOMS 15%. База пульса — среднее последних 7 замеров. Недосып менее 5 ч или пульс +10 к базе автоматически ограничивают зону уровнем «Снижение».</p>
  </section>`;
}

function mutate(fn) {
  S.update(st => {
    const k = dateKey();
    const cur = st.readiness[k] || draft(st);
    fn(cur, st);
    st.readiness[k] = cur;
  });
}

on('rd:sleep', (el) => mutate(e => { e.sleep = clamp(Math.round((e.sleep + 0.5 * +el.dataset.d) * 2) / 2, 0, 14); }));
on('rd:hr', (el) => mutate(e => { e.hr = clamp(e.hr + +el.dataset.d, 30, 140); }));
on('rd:quality', (el) => mutate(e => { e.quality = +el.dataset.v; }));
on('rd:doms', (el) => mutate(e => { e.doms = +el.dataset.v; }));
on('rd:save', () => mutate(e => { e.saved = true; e.at = Date.now(); }));
