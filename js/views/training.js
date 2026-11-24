/* ==========================================================================
   IRON DIARY · views/training.js — Вкладка 1: «Зал»
   Hero card with custom barbell SVG, 4-day red pills, visual ТОП-СЕТ & ПОТОМ
   plate cards, green completed set cards with 5-bar "КАК ПОШЁЛ" & RIR 0..4+,
   warm-up pyramid, and inline warm-up/decompression checklist.
   ========================================================================== */
import * as S from '../store.js';
import { WEEKS, DAYS, SCHEME_LABEL, PROTOCOLS } from '../program.js';
import {
  fmt, fmtSigned, warmupPyramid, plateBreakdown, groupPlates,
  SPEED_LIST, RIR_OPTIONS, PLATE_SPEC, roundTo, dateKey,
} from '../engine.js';
import {
  icon, esc, on, openSheet, closeSheet, toast, barbellSVG, ring, signalBars, exerciseIcon,
} from '../ui.js';
import * as T from '../timer.js';
import {
  getSession, planFor, ensureSession, setLog, effSet, effSets, previewDelta,
  dayCounts,
} from '../session.js';
import { todayReadiness } from './readiness.js';
import { protoCompletion } from './protocols.js';

const openWarm = new Set();
const openCue = new Set();
let protoBannerOpen = false;
let editing = null;
let calcW = 167.5;

const cur = (st) => ({ w: st.ui.week, d: st.ui.day });
const wText = (ex, w) => (ex.bw ? 'Свой вес' : ex.bwPlus ? '+' + fmt(w) : fmt(w));

function platePillsHTML(st, weight) {
  const P = st.profile;
  const pb = plateBreakdown(weight, P.bar, P.collar);
  const groups = groupPlates(pb.plates);
  if (pb.underBar || !groups.length) {
    return `<div class="flex flex-wrap items-center gap-1.5 mt-3">
      <span class="plate-pill-label">На сторону</span>
      <span class="plate-pill"><span class="text-zinc-400">Пустой гриф ${P.bar} кг</span></span>
    </div>`;
  }
  return `
    <div class="flex flex-wrap items-center gap-1.5 mt-3">
      <span class="plate-pill-label">На сторону</span>
      ${groups.map(g => `
        <span class="plate-pill">
          <i class="plate-dot" style="background:${PLATE_SPEC[g.w].dot}"></i>
          <span>${fmt(g.w)}${g.n > 1 ? ` \u00D7 ${g.n}` : ''}</span>
        </span>`).join('')}
    </div>`;
}

/* ----------------------------------------------------- Hero Card of Day */
function heroCard(st, sess, plan, w, d) {
  const wk = WEEKS[w - 1];
  const day = DAYS[d - 1];
  const counts = dayCounts(st, w, d);
  const pct = Math.round(counts.frac * 100);

  // Heaviest primary exercise of the day
  const mainEx = plan[0];
  const mainSets = effSets(sess, mainEx);
  const heaviest = mainSets.reduce((best, s) => (s.w > best.w ? s : best), mainSets[0]);
  const pb = plateBreakdown(heaviest.w, st.profile.bar, st.profile.collar);

  const R = todayReadiness(st);
  const pulsePill = R
    ? `<button class="hero-pulse-pill" data-act="nav" data-tab="body">
        <span class="w-2.5 h-2.5 rounded-full ${R.zone === 'red' ? 'bg-red-500' : R.zone === 'yellow' ? 'bg-amber-400' : 'bg-emerald-400'}"></span>
        <span>Пульс ${R.entry.hr} · ЦНС ${R.score}% · ${R.entry.sleep} ч сна</span>
      </button>`
    : `<button class="hero-pulse-pill" data-act="nav" data-tab="body">
        <span class="w-2.5 h-2.5 rounded-full bg-zinc-500"></span>
        <span>Запиши утренний пульс</span>
      </button>`;

  return `
  <section class="ref-card ref-hero hero-gym">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <div class="ref-eyebrow text-accent">${day.dowFull} &middot; НЕДЕЛЯ ${w} &middot; ${wk.phase.toUpperCase()}</div>
        <h1 class="ref-hero-title mt-1.5">${day.title(w)}</h1>
      </div>
      <div class="relative shrink-0 grid place-items-center">
        ${ring(counts.frac, { size: 74, stroke: 6.5, color: '#EF233C' })}
        <span class="absolute font-mono text-[15px] font-bold text-white">${pct}%</span>
      </div>
    </div>

    <div class="grid grid-cols-12 items-center gap-2 mt-3">
      <div class="col-span-7 min-w-0">
        <div class="text-accent">${exerciseIcon(mainEx.ico, 42)}</div>
        <div class="ref-sublabel mt-2">САМОЕ ТЯЖЁЛОЕ &middot; ${mainEx.name.toUpperCase()}</div>
        <div class="flex items-baseline gap-1.5 mt-0.5">
          <span class="ref-giant-num">${fmt(heaviest.w)}</span>
          <span class="text-[20px] font-bold text-zinc-400">кг</span>
        </div>
      </div>
      <button class="col-span-5 cursor-pointer text-right" data-act="tr:calcWeight" data-w="${heaviest.w}" aria-label="Открыть калькулятор дисков">
        ${barbellSVG(pb.plates, { collar: st.profile.collar > 0, compact: true })}
      </button>
    </div>

    <div class="mt-3 flex items-center justify-between gap-2 flex-wrap">
      ${pulsePill}
      ${R && R.zone !== 'green' && R.zone !== 'work' ? `
        <button class="chip-btn ${sess?.mod ? 'is-on' : ''}" data-act="tr:mod" data-v="${sess?.mod ? 0 : -0.075}">
          ${sess?.mod ? 'Снять −7,5%' : 'Снизить −7,5%'}
        </button>` : ''}
    </div>
  </section>`;
}

/* ----------------------------------------------------- 4-Day Switcher */
function daySwitcher(st, w, d) {
  return `
  <div class="grid grid-cols-4 gap-2">
    ${DAYS.map(day => {
      const c = dayCounts(st, w, day.n);
      const on = day.n === d;
      return `
      <button class="ref-day-pill ${on ? 'is-on' : ''}" data-act="tr:day" data-d="${day.n}">
        <span class="text-[18px] font-extrabold leading-tight">${day.dow}</span>
        <span class="font-mono text-[13px] mt-1 ${on ? 'text-white/90' : 'text-zinc-400'}">${c.done}/${c.total}</span>
      </button>`;
    }).join('')}
  </div>`;
}

/* --------------------------------------- Inline Warm-up / Cool-down Box */
function protocolAccordion(st) {
  const today = dateKey();
  const pre = protoCompletion(st, 'pre', today);
  const post = protoCompletion(st, 'post', today);
  const mode = st.ui.proto || 'pre';
  const P = PROTOCOLS[mode];
  const map = st.protocols[today]?.[mode] || {};

  return `
  <section class="ref-card p-3.5">
    <div class="flex items-center justify-between gap-2">
      <button class="flex items-center gap-2.5 text-left flex-1 min-w-0" data-act="tr:toggleProto">
        <span class="w-2 h-2 rounded-full ${pre.done === pre.total ? 'bg-emerald-400' : 'bg-red-500'}"></span>
        <span class="text-[13.5px] font-bold text-zinc-200 truncate">Разминка ${pre.done}/${pre.total} &middot; Заминка ${post.done}/${post.total}</span>
      </button>
      <button class="chip-btn text-[11px]" data-act="tr:toggleProto">${protoBannerOpen ? 'Скрыть' : 'Чек-лист'}</button>
    </div>
    ${protoBannerOpen ? `
      <div class="mt-3 pt-3 border-t border-white/[0.07] anim-expand">
        <div class="grid grid-cols-2 gap-1.5 mb-3">
          <button class="chip-btn ${mode === 'pre' ? 'is-on' : ''}" data-act="pr:mode" data-m="pre">Мобилизация до (${pre.done}/${pre.total})</button>
          <button class="chip-btn ${mode === 'post' ? 'is-on' : ''}" data-act="pr:mode" data-m="post">Декомпрессия после (${post.done}/${post.total})</button>
        </div>
        <div class="divide-y divide-white/[0.06]">
          ${P.groups.flatMap(g => g.items).map(it => {
            const done = !!map[it.id];
            return `
            <div class="py-2 flex items-center justify-between gap-2">
              <button class="flex items-center gap-2.5 text-left flex-1 min-w-0" data-act="pr:toggle" data-id="${it.id}">
                <span class="w-6 h-6 rounded-lg grid place-items-center border ${done ? 'bg-emerald-500 border-emerald-400 text-black' : 'border-white/15 text-transparent'}">${icon('check', 14)}</span>
                <span class="min-w-0 flex-1">
                  <span class="block text-[13px] font-semibold ${done ? 'line-through text-zinc-500' : 'text-zinc-100'}">${it.title} <span class="font-mono text-[11px] text-zinc-400">· ${it.dose}</span></span>
                  <span class="block text-[11.5px] text-zinc-400">${it.cue}</span>
                </span>
              </button>
              ${it.sec ? `<button class="chip-btn text-[11px]" data-act="pr:timer" data-sec="${it.sec}" data-title="${it.title}" data-cue="${it.cue}">${it.sec >= 60 ? Math.round(it.sec / 60) + 'м' : it.sec + 'с'}</button>` : ''}
            </div>`;
          }).join('')}
        </div>
      </div>` : ''}
  </section>`;
}

/* ------------------------------------------- Warm-up Pyramid Accordion */
function warmBlock(st, sess, ex, sets) {
  if (ex.kind === 'acc' || !ex.bar) return '';
  const target = sets[0].w;
  const warm = warmupPyramid(target, { bar: st.profile.bar, pull: ex.pull });
  if (!warm.length) return '';
  const open = openWarm.has(ex.id);
  const doneArr = sess?.warm?.[ex.id] || [];
  const doneN = warm.filter((_, j) => doneArr[j]).length;
  return `
  <div class="mt-3 rounded-2xl bg-black/35 border border-white/[0.06] overflow-hidden">
    <button class="w-full min-h-[44px] px-3.5 py-2 flex items-center justify-between text-left" data-act="tr:warm" data-ex="${ex.id}">
      <span class="font-mono text-[11px] uppercase tracking-wider text-zinc-400">Разминочная пирамида &middot; ${warm.length} подх. до ${fmt(target)} кг</span>
      <span class="font-mono text-[12px] text-zinc-400 flex items-center gap-1.5">${doneN}/${warm.length} <span class="chev ${open ? 'is-open' : ''}">${icon('chevronDown', 16)}</span></span>
    </button>
    ${open ? `
      <div class="border-t border-white/[0.06] divide-y divide-white/[0.04] anim-expand">
        ${warm.map((x, j) => {
          const pb = plateBreakdown(x.w, st.profile.bar, st.profile.collar);
          const pl = pb.plates.length ? pb.plates.map(p => fmt(p)).join(' + ') : 'пустой гриф';
          return `
          <button class="w-full px-3.5 py-2.5 flex items-center justify-between text-left ${doneArr[j] ? 'opacity-50' : ''}" data-act="tr:warmcheck" data-ex="${ex.id}" data-j="${j}">
            <div>
              <span class="font-display text-[15px] font-bold text-white">${fmt(x.w)} кг &times; ${x.r}</span>
              <span class="block font-mono text-[11px] text-zinc-400">${x.p ? Math.round(x.p * 100) + '% · ' : ''}${pl} на сторону</span>
            </div>
            <span class="w-6 h-6 rounded-lg grid place-items-center border ${doneArr[j] ? 'bg-emerald-500 border-emerald-400 text-black' : 'border-white/15 text-transparent'}">${icon('check', 14)}</span>
          </button>`;
        }).join('')}
      </div>` : ''}
  </div>`;
}

/* ------------------------------- Visual Barbell Cards: ТОП-СЕТ & ПОТОМ */
function visualBarbellCards(st, ex, sets) {
  if (!ex.bar || !sets.length) return '';
  const s0 = sets[0];
  const pb0 = plateBreakdown(s0.w, st.profile.bar, st.profile.collar);
  const boSets = sets.filter(s => s.type === 'bo');
  const topTitle = s0.type === 'top' ? 'ТОП-СЕТ' : `РАБОЧИЕ · ${sets.length} ПОДХ.`;
  const topRepsText = s0.type === 'top' ? `кг \u00D7 ${s0.r}` : `кг \u00D7 ${s0.r} &middot; ${sets.length} подх.`;

  let html = `
  <div class="ref-subcard mt-3" data-act="tr:calcWeight" data-w="${s0.w}">
    <div class="ref-eyebrow text-accent">${topTitle}</div>
    <div class="flex items-baseline gap-2 mt-1">
      <span class="font-display text-[36px] font-extrabold leading-none tracking-tight text-white">${fmt(s0.w)}</span>
      <span class="text-[18px] font-semibold text-zinc-400">${topRepsText}</span>
    </div>
    ${platePillsHTML(st, s0.w)}
    <div class="max-w-[235px] mx-auto mt-2">
      ${barbellSVG(pb0.plates, { collar: st.profile.collar > 0, compact: true })}
    </div>
  </div>`;

  if (boSets.length) {
    const b0 = boSets[0];
    const pbBo = plateBreakdown(b0.w, st.profile.bar, st.profile.collar);
    html += `
    <div class="ref-subcard mt-2.5" data-act="tr:calcWeight" data-w="${b0.w}">
      <div class="ref-eyebrow text-accent">ПОТОМ</div>
      <div class="flex items-baseline gap-2 mt-1">
        <span class="font-display text-[36px] font-extrabold leading-none tracking-tight text-white">${fmt(b0.w)}</span>
        <span class="text-[18px] font-semibold text-zinc-400">кг \u00D7 ${b0.r} &middot; ${boSets.length} подх.</span>
      </div>
      ${platePillsHTML(st, b0.w)}
      <div class="max-w-[235px] mx-auto mt-2">
        ${barbellSVG(pbBo.plates, { collar: st.profile.collar > 0, compact: true })}
      </div>
    </div>`;
  }
  return html;
}

/* ----------------------------------------------------- Set Row & Feedback */
function setRowHTML(st, sess, ex, s, i) {
  const key = `${ex.id}:${i}`;
  const isTop = s.type === 'top';
  const tagText = isTop ? 'ТОП' : String(s.type === 'bo' ? i : i + 1);
  const unitSuffix = ex.unit === 'm' ? ' м' : ex.unit === 's' ? ' с' : '';

  return `
  <div class="ref-set-card ${s.done ? 'is-done' : ''}">
    <div class="flex items-center gap-2.5">
      <button class="ref-check ${s.done ? 'is-on' : ''}" data-act="tr:toggle" data-key="${key}" aria-pressed="${s.done}" aria-label="Отметить подход">
        ${icon('check', 24)}
      </button>
      <span class="font-mono text-[14px] font-bold w-9 ${isTop ? 'text-accent' : 'text-zinc-400'}">${tagText}</span>
      <button class="ref-val-box" data-act="tr:edit" data-key="${key}">
        <span>${wText(ex, s.w)}</span>
      </button>
      <span class="text-zinc-500 font-mono text-sm">&times;</span>
      <button class="ref-val-box ref-val-reps" data-act="tr:edit" data-key="${key}">
        <span>${s.r}${unitSuffix}</span>
      </button>
      <div class="flex-1"></div>
      <button class="ref-edit-btn" data-act="tr:edit" data-key="${key}" aria-label="Изменить вес и повторы">
        ${icon('pencil', 17)}
      </button>
    </div>

    ${s.done ? `
    <div class="mt-3.5 pt-3 border-t border-white/[0.07] anim-expand">
      <div class="ref-sublabel mb-2">КАК ПОШЁЛ</div>
      <div class="grid grid-cols-5 gap-1.5">
        ${SPEED_LIST.map(sp => `
          <button class="feel-btn ${s.speed === sp.key ? 'is-on' : ''}" data-act="tr:speed" data-key="${key}" data-v="${sp.key}">
            ${signalBars(sp.bars)}
            <span>${sp.label}</span>
          </button>`).join('')}
      </div>

      <div class="ref-sublabel mt-3 mb-2">ЕЩЁ МОГ ПОВТОРОВ &middot; ЕСЛИ ЗНАЕШЬ</div>
      <div class="grid grid-cols-5 gap-1.5">
        ${RIR_OPTIONS.map(v => `
          <button class="rir-btn ${s.rir === v ? 'is-on' : ''}" data-act="tr:rir" data-key="${key}" data-v="${v}">
            ${v === 4 ? '4+' : v}
          </button>`).join('')}
      </div>
    </div>` : ''}
  </div>`;
}

/* ----------------------------------------------------- Exercise Card */
function exerciseCard(st, sess, ex, idx) {
  const sets = effSets(sess, ex);
  const label = ex.kind === 'acc' ? SCHEME_LABEL[ex.tag] : SCHEME_LABEL[ex.kind];
  const numStr = String(idx + 1).padStart(2, '0') + '/';
  const cueOpen = openCue.has(ex.id);
  const delta = previewDelta(st, sess, ex);

  let deltaBadge = '';
  if (delta.verdict !== 'nodata') {
    if (ex.kind === 'acc') {
      deltaBadge = delta.verdict === 'up'
        ? `<div class="mt-3 text-[12.5px] font-mono text-emerald-400">Следующая тренировка: ${fmt(delta.w)} кг</div>`
        : '';
    } else if (delta.delta) {
      deltaBadge = `<div class="mt-3 text-[12.5px] font-mono ${delta.delta > 0 ? 'text-emerald-400' : 'text-amber-400'}">Саморасчёт на следующую: ${fmtSigned(delta.delta)} кг</div>`;
    }
  }

  return `
  <article class="ref-card p-4" id="ex-${ex.id}">
    <div class="flex items-start justify-between gap-2">
      <div class="text-accent">${exerciseIcon(ex.ico, 42)}</div>
      <div class="flex items-center gap-1.5">
        ${ex.baseMax ? `<span class="ref-meta-pill">${ex.pct}% &middot; ${ex.baseMax}</span>` : `<span class="ref-meta-pill">${ex.sets.length} подх.</span>`}
        <button class="ref-edit-btn ${cueOpen ? 'border-white/30 text-white' : ''}" data-act="tr:cue" data-ex="${ex.id}" aria-label="Техника выполнения">${icon('info', 17)}</button>
      </div>
    </div>

    <div class="mt-2.5">
      <div class="font-mono text-[13px] tracking-wider uppercase">
        <span class="text-accent font-bold">${numStr}</span>
        <span class="text-zinc-400 ml-1">${label}</span>
      </div>
      <h2 class="text-[24px] font-extrabold leading-tight text-white mt-0.5">${ex.name}</h2>
      <p class="text-[13px] text-zinc-400 mt-0.5">${ex.sub}</p>
    </div>

    ${cueOpen ? `<div class="mt-3 p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-[13px] text-zinc-300 leading-relaxed anim-expand">${ex.cue}</div>` : ''}

    ${warmBlock(st, sess, ex, sets)}
    ${visualBarbellCards(st, ex, sets)}

    <div class="mt-3 space-y-2.5">
      ${sets.map((s, i) => setRowHTML(st, sess, ex, s, i)).join('')}
    </div>
    ${deltaBadge}
  </article>`;
}

export function render(st) {
  const { w, d } = cur(st);
  const sess = getSession(st, w, d);
  const plan = planFor(st, w, d);
  return `
    ${heroCard(st, sess, plan, w, d)}
    ${daySwitcher(st, w, d)}
    ${protocolAccordion(st)}
    ${plan.map((ex, i) => exerciseCard(st, sess, ex, i)).join('')}
  `;
}

/* ---------------------------------------------------------- Actions */
function parseKey(key) { const [ex, i] = key.split(':'); return { exId: ex, i: +i }; }
const vibro = (p) => { if (S.get().profile.vibro) T.haptic(p); };

on('tr:week', (el) => S.update(st => { st.ui.week = +el.dataset.w; }));
on('tr:day', (el) => S.update(st => { st.ui.day = +el.dataset.d; }));
on('tr:cue', (el) => { const id = el.dataset.ex; openCue.has(id) ? openCue.delete(id) : openCue.add(id); S.update(() => {}); });
on('tr:warm', (el) => { const id = el.dataset.ex; openWarm.has(id) ? openWarm.delete(id) : openWarm.add(id); S.update(() => {}); });
on('tr:toggleProto', () => { protoBannerOpen = !protoBannerOpen; S.update(() => {}); });

on('tr:warmcheck', (el) => {
  S.update(st => {
    const { w, d } = cur(st);
    const sess = ensureSession(st, w, d);
    if (!sess.startedAt) sess.startedAt = Date.now();
    const arr = sess.warm[el.dataset.ex] || (sess.warm[el.dataset.ex] = []);
    arr[+el.dataset.j] = !arr[+el.dataset.j];
  });
  vibro(10);
});

on('tr:toggle', (el) => {
  const { exId, i } = parseKey(el.dataset.key);
  let timer = null;
  S.update(st => {
    const { w, d } = cur(st);
    const sess = ensureSession(st, w, d);
    if (!sess.startedAt) sess.startedAt = Date.now();
    const ex = sess.plan.find(e => e.id === exId);
    const e = effSet(sess, ex, i);
    const L = setLog(sess, exId, i);
    if (!e.done) {
      L.done = true; L.at = Date.now(); L.w = e.w; L.r = e.r;
      if (!L.speed) L.speed = 'fly';
      if (L.rir == null) L.rir = e.targetRir ?? 2;
      timer = { sec: e.rest || 180, label: 'ОТДЫХ', next: `${ex.name} · подход ${i + 1}` };
    } else {
      L.done = false;
    }
  });
  vibro(14);
  T.unlockAudio();
  if (timer && S.get().profile.autoTimer) T.start(timer.sec, timer.label, timer.next);
});

function setFeedback(key, field, value) {
  const { exId, i } = parseKey(key);
  S.update(st => {
    const { w, d } = cur(st);
    const sess = ensureSession(st, w, d);
    const L = setLog(sess, exId, i);
    L[field] = value;
  });
  vibro(8);
}
on('tr:rir', (el) => setFeedback(el.dataset.key, 'rir', +el.dataset.v));
on('tr:speed', (el) => setFeedback(el.dataset.key, 'speed', el.dataset.v));

on('tr:mod', (el) => {
  const v = +el.dataset.v;
  S.update(st => {
    const { w, d } = cur(st);
    const sess = ensureSession(st, w, d);
    sess.mod = v;
  });
  toast(v ? `Веса снижены на ${fmt(Math.abs(v) * 100, 1)}%` : 'Коррекция снята', v ? 'warn' : 'neutral');
});

/* ------------------------------------------------ Set Editor & Plate Calc */
function plateBlock(st, weight) {
  const P = st.profile;
  const pb = plateBreakdown(weight, P.bar, P.collar);
  return `
    <div class="ref-subcard mt-3">
      ${platePillsHTML(st, weight)}
      <div class="mt-3">
        ${barbellSVG(pb.plates, { collar: P.collar > 0, compact: false })}
      </div>
    </div>`;
}

function renderEditor() {
  const st = S.get();
  const { w, d } = cur(st);
  const sess = getSession(st, w, d);
  const plan = sess?.plan || planFor(st, w, d);
  const ex = plan.find(e => e.id === editing.exId);
  const s = ex ? effSet(sess, ex, editing.i) : null;
  if (!ex || !s) return '<p class="text-zinc-500">Подход не найден</p>';
  const stepA = ex.kind === 'acc' ? (ex.step || 2.5) : 2.5;
  const stepB = stepA * 2;
  return `
  <div class="pt-1">
    <div class="flex items-start justify-between gap-3">
      <div>
        <div class="ref-eyebrow text-accent">${ex.name}</div>
        <h3 class="text-[20px] font-extrabold text-white mt-1">Настройка подхода #${editing.i + 1}</h3>
      </div>
      <button class="icon-btn" data-act="sheet:close" aria-label="Закрыть">${icon('x', 20)}</button>
    </div>
    ${ex.bw ? '' : `
    <div class="flex items-end justify-center gap-2 mt-4">
      <span class="font-display text-[52px] font-extrabold leading-none text-white">${wText(ex, s.w)}</span>
      <span class="text-zinc-400 mb-2 font-bold">кг</span>
    </div>
    <div class="grid grid-cols-4 gap-2 mt-3">
      <button class="step-lg" data-act="ed:w" data-d="${-stepB}">\u2212${fmt(stepB)}</button>
      <button class="step-lg" data-act="ed:w" data-d="${-stepA}">\u2212${fmt(stepA)}</button>
      <button class="step-lg" data-act="ed:w" data-d="${stepA}">+${fmt(stepA)}</button>
      <button class="step-lg" data-act="ed:w" data-d="${stepB}">+${fmt(stepB)}</button>
    </div>
    ${ex.bar ? plateBlock(st, s.w) : ''}`}
    <div class="metric-row mt-4">
      <span class="text-[14px] font-bold text-zinc-200">${ex.unit === 'reps' ? 'Повторения' : ex.unit === 'm' ? 'Дистанция, м' : 'Время, с'}</span>
      <div class="flex items-center gap-2">
        <button class="step-btn" data-act="ed:r" data-d="${ex.unit === 'reps' ? -1 : -5}">${icon('minus', 18)}</button>
        <span class="font-display text-[24px] font-extrabold w-[60px] text-center">${s.r}</span>
        <button class="step-btn" data-act="ed:r" data-d="${ex.unit === 'reps' ? 1 : 5}">${icon('plus', 18)}</button>
      </div>
    </div>
    <div class="grid grid-cols-2 gap-2.5 mt-5">
      <button class="btn btn-ghost" data-act="ed:reset">${icon('reset', 16)}<span>По плану</span></button>
      <button class="btn btn-primary" data-act="sheet:close">Готово</button>
    </div>
  </div>`;
}

on('tr:edit', (el) => {
  editing = parseKey(el.dataset.key);
  openSheet(renderEditor);
});

function editMutate(fn) {
  S.update(st => {
    const { w, d } = cur(st);
    const sess = ensureSession(st, w, d);
    const ex = sess.plan.find(e => e.id === editing.exId);
    fn(st, sess, ex);
  });
}

on('ed:w', (el) => {
  const delta = +el.dataset.d;
  editMutate((st, sess, ex) => {
    const i = editing.i;
    const base = effSet(sess, ex, i);
    const nw = Math.max(0, roundTo(base.w + delta, ex.kind === 'acc' ? (ex.step || 1.25) : 1.25));
    setLog(sess, ex.id, i).w = nw;
    const type = ex.sets[i].type;
    if (type !== 'top') {
      for (let j = i + 1; j < ex.sets.length; j++) {
        if (ex.sets[j].type !== type) continue;
        const L = setLog(sess, ex.id, j);
        if (!L.done) L.w = nw;
      }
    }
  });
  vibro(6);
});

on('ed:r', (el) => {
  const delta = +el.dataset.d;
  editMutate((st, sess, ex) => {
    const base = effSet(sess, ex, editing.i);
    setLog(sess, ex.id, editing.i).r = Math.max(0, base.r + delta);
  });
  vibro(6);
});

on('ed:reset', () => {
  editMutate((st, sess, ex) => {
    const i = editing.i;
    const L = setLog(sess, ex.id, i);
    delete L.w; delete L.r;
  });
});

function renderCalc() {
  const st = S.get();
  return `
  <div class="pt-1">
    <div class="flex items-start justify-between">
      <div>
        <div class="ref-eyebrow text-accent">ШТАНГА И БЛИНЫ</div>
        <h3 class="text-[20px] font-extrabold text-white mt-1">Калькулятор дисков</h3>
      </div>
      <button class="icon-btn" data-act="sheet:close" aria-label="Закрыть">${icon('x', 20)}</button>
    </div>
    <div class="flex items-end justify-center gap-2 mt-4">
      <span class="font-display text-[54px] font-extrabold leading-none text-white">${fmt(calcW)}</span>
      <span class="text-zinc-400 mb-2 font-bold">кг</span>
    </div>
    <div class="grid grid-cols-4 gap-2 mt-4">
      ${[-10, -2.5, 2.5, 10].map(v => `<button class="step-lg" data-act="calc:w" data-d="${v}">${v > 0 ? '+' : '\u2212'}${fmt(Math.abs(v))}</button>`).join('')}
    </div>
    <div class="grid grid-cols-6 gap-1.5 mt-2">
      ${[100, 140, 167.5, 190, 200, 230].map(v => `<button class="chip-btn ${calcW === v ? 'is-on' : ''}" data-act="calc:set" data-v="${v}">${fmt(v)}</button>`).join('')}
    </div>
    ${plateBlock(st, calcW)}
  </div>`;
}

export function openPlateCalc(w) {
  if (w) calcW = w;
  openSheet(renderCalc);
}
on('tr:calcWeight', (el) => openPlateCalc(+el.dataset.w || 167.5));
on('calc:w', (el) => { calcW = Math.max(20, Math.min(500, roundTo(calcW + +el.dataset.d, 1.25))); S.update(() => {}); vibro(6); });
on('calc:set', (el) => { calcW = +el.dataset.v; S.update(() => {}); });
