/* ==========================================================================
   IRON DIARY · views/readiness.js — Вкладка 3: «Форма»
   60fps touch slider for target weight (updates SVG & tiles in-place without
   destroying DOM during iOS drag), biometric 3D physique scan, morning check.
   ========================================================================== */
import * as S from '../store.js';
import { MORNING_FEEL } from '../program.js';
import {
  readiness, bodyPlan, dateKey, addDays, humanDate, shortDate, fmt, fmtInt, clamp,
} from '../engine.js';
import {
  icon, esc, on, openSheet, toast, physiqueSVG, signalBars, lineChart,
} from '../ui.js';
import * as T from '../timer.js';

let activeDate = null;
let editMetric = null;

function curDate() {
  if (!activeDate) activeDate = dateKey();
  return activeDate;
}

export function baselineHr(st) {
  const today = dateKey();
  const vals = [];
  for (let i = 1; i <= 14 && vals.length < 7; i++) {
    const e = st.readiness[addDays(today, -i)];
    if (e && e.hr) vals.push(e.hr);
  }
  if (vals.length >= 3) return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  return st.profile.baselineHr || 58;
}

export function todayReadiness(st, k = dateKey()) {
  const e = st.readiness[k];
  if (!e || !e.saved) return null;
  return { ...readiness(e, baselineHr(st)), entry: e };
}

function entryFor(st, k = curDate()) {
  const e = st.readiness[k];
  if (e) return e;
  return {
    bw: st.profile.bw || 95,
    hr: st.profile.baselineHr || 62,
    sleep: 8,
    quality: 4,
    doms: 2,
    note: '',
    saved: false,
  };
}

function renderPlanTiles(plan) {
  return `
    <div class="ref-tile">
      <span class="ref-sublabel">ПЛАН ККАЛ</span>
      <div class="mt-1 flex items-baseline gap-1.5 flex-wrap">
        <span class="font-display text-[20px] font-bold text-white leading-none">${fmtInt(plan.kcal)}</span>
        <span class="text-[12px] text-zinc-400 font-semibold">${plan.deltaLabel}</span>
      </div>
    </div>
    <div class="ref-tile">
      <span class="ref-sublabel">БЕЛОК</span>
      <div class="mt-1 flex items-baseline gap-1.5">
        <span class="font-display text-[20px] font-bold text-white leading-none">${plan.protein}</span>
        <span class="text-[12px] text-zinc-400 font-semibold">г/день</span>
      </div>
    </div>
    <div class="ref-tile">
      <span class="ref-sublabel">СРОК</span>
      <div class="mt-1 flex items-baseline gap-1.5">
        <span class="font-display text-[20px] font-bold text-white leading-none">${plan.weeks ? plan.weeks : '—'}</span>
        ${plan.weeks ? `<span class="text-[12px] text-zinc-400 font-semibold">${plan.weeks < 5 ? 'нед.' : 'недель'}</span>` : ''}
      </div>
    </div>
    <div class="ref-tile">
      <span class="ref-sublabel">К ДАТЕ</span>
      <div class="mt-1">
        <span class="font-display text-[19px] font-bold text-white leading-none">${plan.targetDate ? shortDate(plan.targetDate) : '—'}</span>
      </div>
    </div>`;
}

export function render(st) {
  const P = st.profile;
  const k = curDate();
  const E = entryFor(st, k);
  const baseHr = baselineHr(st);
  const R = readiness(E, baseHr);
  const plan = bodyPlan(P.bw, P.targetBw);
  const sliderPct = ((clamp(P.targetBw, 85, 140) - 85) / 55 * 100).toFixed(1);

  const bwPoints = (st.bodyweight || []).map(b => ({
    v: b.kg,
    label: shortDate(b.date),
  }));

  const hrKeys = Object.keys(st.readiness || {}).filter(dk => st.readiness[dk]?.saved && st.readiness[dk]?.hr).sort();
  const hrPoints = hrKeys.slice(-14).map(dk => ({
    v: st.readiness[dk].hr,
    label: shortDate(dk),
  }));

  const pulseStatus = E.saved
    ? `<div class="hero-pulse-pill mt-3">
        <span class="w-2 h-2 rounded-full ${R.zone === 'red' ? 'bg-red-500' : R.zone === 'yellow' ? 'bg-amber-400' : 'bg-emerald-400'}"></span>
        <span>ЦНС ${R.score}% &middot; Пульс ${E.hr} уд/мин (норма ${baseHr})</span>
      </div>`
    : `<button class="hero-pulse-pill mt-3" data-act="bd:saveMorning">
        <span class="w-2 h-2 rounded-full bg-zinc-400"></span>
        <span>Запиши утренний пульс</span>
      </button>`;

  return `
  <!-- Card 1: МОЯ ФОРМА · Каким ты будешь -->
  <section class="ref-card ref-hero hero-body photo-card" style="--photo:url('./img/bg-physique.jpg')">
    <div class="ref-eyebrow text-accent">МОЯ ФОРМА &middot; БИОМЕТРИЯ</div>
    <h1 class="ref-hero-title mt-1">Каким ты будешь</h1>

    <div class="mt-1" id="physiqueStage">
      ${physiqueSVG(P.bw, P.targetBw)}
    </div>

    <div class="flex items-center justify-between font-mono text-[11px] tracking-wider uppercase mt-1">
      <span class="text-zinc-400">ПУНКТИР &mdash; СЕЙЧАС ${fmt(P.bw)} КГ</span>
      <span class="text-accent font-bold" id="targetBwLabel">ЗАЛИВКА &mdash; ЦЕЛЬ ${fmt(P.targetBw)} КГ</span>
    </div>

    <div class="mt-2.5 py-1">
      <input
        type="range"
        min="85"
        max="140"
        step="1"
        value="${Math.round(P.targetBw)}"
        style="--pct:${sliderPct}%"
        class="body-slider"
        data-change="bd:targetSlider"
        aria-label="Целевой вес тела"
      />
    </div>

    <div class="grid grid-cols-2 gap-2 mt-3" id="bodyPlanGrid">
      ${renderPlanTiles(plan)}
    </div>

    <p class="text-[12.5px] text-zinc-400 mt-3 leading-relaxed">
      Питание во вкладке «Еда» уже пересчитано под цель. Темп набора &mdash; 0,5–1 кг в неделю. Быстрее &mdash; это в основном жир.
    </p>
  </section>

  <!-- Date Nav -->
  <div class="flex items-center justify-between gap-2">
    <button class="ref-nav-arrow" data-act="bd:shiftDate" data-d="-1" aria-label="Предыдущий день">${icon('chevronLeft', 18)}</button>
    <div class="text-[16px] font-bold text-white tracking-tight">${humanDate(k)}</div>
    <button class="ref-nav-arrow" data-act="bd:shiftDate" data-d="1" aria-label="Следующий день">${icon('chevronRight', 18)}</button>
  </div>

  <!-- Card 2: Утренний замер · НАТОЩАК -->
  <section class="ref-card p-3.5">
    <div class="flex items-center justify-between">
      <h2 class="text-[18px] font-bold font-display text-white">Утренний замер</h2>
      <span class="ref-eyebrow text-accent">НАТОЩАК</span>
    </div>

    <div class="grid grid-cols-3 gap-2 mt-3">
      <button class="ref-metric-box" data-act="bd:editMetric" data-m="bw">
        <span class="ref-sublabel">ВЕС, КГ</span>
        <span class="ref-metric-num">${fmt(E.bw ?? P.bw, 1)}</span>
        <span class="text-[11px] text-zinc-400">после туалета</span>
      </button>
      <button class="ref-metric-box" data-act="bd:editMetric" data-m="hr">
        <span class="ref-sublabel">ПУЛЬС</span>
        <span class="ref-metric-num">${E.hr}</span>
        <span class="text-[11px] text-zinc-400">лёжа, 1 мин</span>
      </button>
      <button class="ref-metric-box" data-act="bd:editMetric" data-m="sleep">
        <span class="ref-sublabel">СОН, Ч</span>
        <span class="ref-metric-num">${fmt(E.sleep, 1)}</span>
        <span class="text-[11px] text-zinc-400">сколько спал</span>
      </button>
    </div>

    <div class="mt-3.5">
      <div class="ref-sublabel mb-1.5">КАК ТЫ УТРОМ</div>
      <div class="grid grid-cols-5 gap-1.5">
        ${MORNING_FEEL.map(f => `
          <button class="feel-btn feel-purple ${E.quality === f.key ? 'is-on' : ''}" data-act="bd:feel" data-v="${f.key}">
            ${signalBars(f.bars)}
            <span>${f.label}</span>
          </button>`).join('')}
      </div>
    </div>

    <input
      type="text"
      class="field mt-3"
      placeholder="Забитость, суставы, настроение — что угодно"
      value="${esc(E.note || '')}"
      data-change="bd:note"
    />

    ${pulseStatus}

    <p class="text-[12.5px] text-zinc-400 mt-3 leading-relaxed">
      Пульс меряй сразу после пробуждения, ещё в кровати. Если он на 7+ ударов выше нормы &mdash; организм не восстановился.
    </p>
  </section>

  <!-- Card 3: Вес тела -->
  <section class="ref-card p-3.5">
    <div class="flex items-center justify-between">
      <h2 class="text-[17px] font-bold font-display text-white">Вес тела</h2>
      <span class="font-mono text-[12px] text-zinc-400">${fmt(P.bw, 1)} кг</span>
    </div>
    ${bwPoints.length >= 2
      ? lineChart(bwPoints, { color: '#9D6BFF' })
      : `<p class="text-[12.5px] text-zinc-400 mt-2 leading-relaxed">Вписывай вес каждое утро &mdash; график появится со второго дня</p>`}
  </section>

  <!-- Card 4: Пульс покоя -->
  <section class="ref-card p-3.5">
    <div class="flex items-center justify-between">
      <h2 class="text-[17px] font-bold font-display text-white">Пульс покоя</h2>
      <span class="font-mono text-[12px] text-zinc-400">норма ${baseHr} уд/мин</span>
    </div>
    ${hrPoints.length >= 2
      ? lineChart(hrPoints, { color: '#C084FC', fmtY: (v) => Math.round(v) })
      : `<p class="text-[12.5px] text-zinc-400 mt-2 leading-relaxed">Появится со второго замера. Рост пульса &mdash; ранний признак перегруза</p>`}
  </section>

  <!-- Card 5: Рост и размах рук -->
  <section class="ref-card p-3.5 space-y-2.5">
    <div class="flex items-center justify-between">
      <div>
        <div class="text-[15px] font-bold text-white">Рост</div>
        <div class="text-[12px] text-zinc-400">для расчёта силуэта</div>
      </div>
      <div class="flex items-center gap-2">
        <button class="ref-val-box" data-act="bd:editMetric" data-m="height">${P.height}</button>
        <span class="font-mono text-[12px] text-zinc-400">СМ</span>
      </div>
    </div>
    <div class="flex items-center justify-between pt-2.5 border-t border-white/[0.06]">
      <div>
        <div class="text-[15px] font-bold text-white">Размах рук</div>
        <div class="text-[12px] text-zinc-400">рычаги классики (+${P.wingspan - P.height} см)</div>
      </div>
      <div class="flex items-center gap-2">
        <button class="ref-val-box" data-act="bd:editMetric" data-m="wingspan">${P.wingspan}</button>
        <span class="font-mono text-[12px] text-zinc-400">СМ</span>
      </div>
    </div>
  </section>`;
}

/* --------------------------------- 60fps In-Place Slider Update Handler */
on('bd:targetSlider', (el) => {
  const val = clamp(+el.value, 85, 140);
  const pct = ((val - 85) / 55 * 100).toFixed(1);
  el.style.setProperty('--pct', `${pct}%`);

  // Save state silently without destroying the active range input DOM element!
  S.update(st => {
    st.profile.targetBw = val;
  }, { silent: true });

  const st = S.get();
  const stage = document.getElementById('physiqueStage');
  const lbl = document.getElementById('targetBwLabel');
  const grid = document.getElementById('bodyPlanGrid');
  if (stage) stage.innerHTML = physiqueSVG(st.profile.bw, val);
  if (lbl) lbl.textContent = `ЗАЛИВКА — ЦЕЛЬ ${fmt(val)} КГ`;
  if (grid) grid.innerHTML = renderPlanTiles(bodyPlan(st.profile.bw, val));
});

on('bd:shiftDate', (el) => {
  activeDate = addDays(curDate(), +el.dataset.d);
  S.update(() => {});
});

function mutateMorning(fn) {
  S.update(st => {
    const k = curDate();
    const cur = st.readiness[k] || entryFor(st, k);
    fn(cur, st);
    cur.saved = true;
    cur.at = Date.now();
    st.readiness[k] = cur;
  });
}

on('bd:feel', (el) => {
  const v = +el.dataset.v;
  mutateMorning(e => { e.quality = v; });
  if (S.get().profile.vibro) T.haptic(10);
});

on('bd:note', (el) => {
  S.update(st => {
    const k = curDate();
    const cur = st.readiness[k] || entryFor(st, k);
    cur.note = el.value.slice(0, 300);
    st.readiness[k] = cur;
  }, { silent: true });
});

on('bd:saveMorning', () => {
  mutateMorning((e, st) => {
    if (!e.bw) e.bw = st.profile.bw;
  });
  toast('Утренний замер сохранён', 'ok');
});

/* ------------------------------------------- Metric Editor Sheet */
function renderMetricSheet() {
  const st = S.get();
  const k = curDate();
  const E = entryFor(st, k);
  const P = st.profile;
  const cfg = {
    bw:       { title: 'Утренний вес тела', unit: 'кг', val: E.bw ?? P.bw, stepA: 0.1, stepB: 0.5 },
    hr:       { title: 'Пульс покоя лёжа',  unit: 'уд/мин', val: E.hr, stepA: 1, stepB: 5 },
    sleep:    { title: 'Продолжительность сна', unit: 'ч', val: E.sleep, stepA: 0.5, stepB: 1 },
    height:   { title: 'Рост атлета', unit: 'см', val: P.height, stepA: 1, stepB: 5 },
    wingspan: { title: 'Размах рук', unit: 'см', val: P.wingspan, stepA: 1, stepB: 5 },
  }[editMetric];

  return `
  <div class="pt-1">
    <div class="flex items-start justify-between">
      <div>
        <div class="ref-eyebrow text-accent">УТРЕННИЙ ЗАМЕР</div>
        <h3 class="text-[18px] font-bold font-display text-white mt-1">${cfg.title}</h3>
      </div>
      <button class="icon-btn" data-act="sheet:close" aria-label="Закрыть">${icon('x', 18)}</button>
    </div>
    <div class="flex items-end justify-center gap-2 mt-4">
      <span class="font-display text-[44px] font-bold leading-none text-white">${fmt(cfg.val, 1)}</span>
      <span class="text-zinc-400 mb-1.5 font-semibold">${cfg.unit}</span>
    </div>
    <div class="grid grid-cols-4 gap-2 mt-4">
      <button class="step-lg" data-act="bd:stepMetric" data-d="${-cfg.stepB}">\u2212${fmt(cfg.stepB)}</button>
      <button class="step-lg" data-act="bd:stepMetric" data-d="${-cfg.stepA}">\u2212${fmt(cfg.stepA)}</button>
      <button class="step-lg" data-act="bd:stepMetric" data-d="${cfg.stepA}">+${fmt(cfg.stepA)}</button>
      <button class="step-lg" data-act="bd:stepMetric" data-d="${cfg.stepB}">+${fmt(cfg.stepB)}</button>
    </div>
    <button class="btn btn-primary w-full mt-5" data-act="sheet:close">Готово</button>
  </div>`;
}

on('bd:editMetric', (el) => {
  editMetric = el.dataset.m;
  openSheet(renderMetricSheet);
});

on('bd:stepMetric', (el) => {
  const d = +el.dataset.d;
  const k = curDate();
  if (editMetric === 'height' || editMetric === 'wingspan') {
    S.update(st => {
      st.profile[editMetric] = clamp(Math.round(st.profile[editMetric] + d), 140, 240);
    });
    return;
  }
  mutateMorning((e, st) => {
    if (editMetric === 'bw') {
      const kg = Math.round(clamp((e.bw ?? st.profile.bw) + d, 50, 220) * 10) / 10;
      e.bw = kg;
      st.profile.bw = kg;
      const hit = st.bodyweight.find(b => b.date === k);
      if (hit) hit.kg = kg;
      else st.bodyweight.push({ date: k, kg });
      st.bodyweight.sort((a, b) => a.date.localeCompare(b.date));
    } else if (editMetric === 'hr') {
      e.hr = clamp(Math.round(e.hr + d), 32, 140);
    } else if (editMetric === 'sleep') {
      e.sleep = clamp(Math.round((e.sleep + d) * 2) / 2, 1, 14);
    }
  });
  if (S.get().profile.vibro) T.haptic(6);
});
