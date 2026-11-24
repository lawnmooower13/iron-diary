/* ==========================================================================
   IRON DIARY · views/analytics.js — Вкладка 4: «Сила»
   Compact iPhone 15 Pro layout, Apple Liquid Glass cards, darkened squat
   photo backdrop, total milestone ring, 2x2 e1RM cards, autocalc & maxes.
   ========================================================================== */
import * as S from '../store.js';
import {
  fmt, fmtSigned, dots, roundTo, clamp,
} from '../engine.js';
import {
  COMP, COMP_LABEL, e1rmHistory, personalRecords, weekAutocalc, applyWeekAutocalc,
} from '../session.js';
import {
  on, toast, ring, lineChart,
} from '../ui.js';
import * as T from '../timer.js';

let selectedLift = null;

export function render(st) {
  const P = st.profile;
  const prs = personalRecords(st);
  const curVal = (lift) => Math.round((prs[lift]?.e1rm?.v || P.maxes[lift] || 0) * 10) / 10;

  const sq = curVal('sq');
  const bp = curVal('bp');
  const dl = curVal('dl');
  const total = Math.round((sq + bp + dl) * 10) / 10;
  const nextMilestone = total < 550 ? 550 : total < 575 ? 575 : total < 600 ? 600 : Math.ceil((total + 1) / 25) * 25;
  const prevMilestone = nextMilestone - 75;
  const toNext = Math.max(0, Math.round((nextMilestone - total) * 10) / 10);
  const milestoneFrac = clamp((total - prevMilestone) / (nextMilestone - prevMilestone), 0.08, 1);
  const dotsScore = dots(total, P.bw);

  const autocalc = weekAutocalc(st, st.ui.week);

  return `
  <!-- Card 1: СУММА ТРОЕБОРЬЯ -->
  <section class="ref-card ref-hero hero-strength photo-card" style="--photo:url('./img/bg-squat.jpg')">
    <div class="flex items-start justify-between gap-2.5">
      <div class="min-w-0">
        <div class="ref-eyebrow text-accent">СУММА ТРОЕБОРЬЯ &middot; DOTS ${fmt(dotsScore, 0)}</div>
        <div class="flex items-baseline gap-1.5 mt-1">
          <span class="ref-giant-num">${fmt(total)}</span>
          <span class="text-[17px] font-bold text-zinc-400">кг</span>
        </div>
        <div class="text-[13px] text-zinc-300 mt-1">
          Присед ${fmt(sq)} &middot; жим ${fmt(bp)} &middot; тяга ${fmt(dl)}
        </div>
      </div>

      <div class="relative shrink-0 grid place-items-center">
        ${ring(milestoneFrac, { size: 78, stroke: 6, color: '#F97316' })}
        <div class="absolute text-center">
          <div class="font-mono text-[9px] text-zinc-400 uppercase">ДО ${nextMilestone}</div>
          <div class="font-display text-[17px] font-bold text-white leading-tight">${fmt(toNext)}</div>
        </div>
      </div>
    </div>

    <p class="text-[12.5px] text-zinc-400 mt-3 leading-relaxed">
      Лучшая сумма с сумо &mdash; ${P.maxes.sq + P.maxes.bp + P.maxes.dlSumo} кг (${P.maxes.sq} + ${P.maxes.bp} + ${P.maxes.dlSumo}). Следующая отметка &mdash; ${nextMilestone} кг.
    </p>
  </section>

  <!-- Card 2: Как растёт сила -->
  <section class="ref-card p-3.5">
    <div class="flex items-center justify-between gap-2 flex-wrap">
      <h2 class="text-[18px] font-display font-bold text-white">Как растёт сила</h2>
      <span class="ref-eyebrow text-accent">РАСЧЁТНЫЙ МАКСИМУМ</span>
    </div>
    <p class="text-[12.5px] text-zinc-400 mt-1.5 leading-relaxed">
      Каждая точка &mdash; лучший подход тренировки, пересчитанный в разовый максимум. Тесты не нужны: рост видно по обычной работе.
    </p>

    <div class="grid grid-cols-2 gap-2 mt-3">
      ${COMP.map(lift => {
        const pts = e1rmHistory(st, lift);
        const val = curVal(lift);
        const base = P.maxes[lift];
        const diff = Math.round((val - base) * 10) / 10;
        const active = selectedLift === lift;
        return `
        <button class="ref-tile text-left ${active ? 'border-orange-500/50' : ''}" data-act="st:selectLift" data-lift="${lift}">
          <div class="text-[13.5px] font-bold text-zinc-200">${COMP_LABEL[lift]}</div>
          <div class="font-display text-[25px] font-bold text-white leading-none mt-1">${fmt(val)}</div>
          ${pts.length ? `
            <div class="mt-1.5 font-mono text-[11px] ${diff >= 0 ? 'text-emerald-400' : 'text-amber-400'}">
              ${diff ? `${fmtSigned(diff)} кг к базе` : `Лучший: ${fmt(pts[pts.length - 1].v)} кг`}
            </div>
            ${pts.length >= 2 ? lineChart(pts.map(p => ({ v: p.v, label: 'Н' + p.week })), { h: 68, color: '#F97316' }) : ''}
          ` : `
            <p class="text-[11.5px] text-zinc-400 mt-2 leading-snug">
              Отметь «Как пошёл» на подходах &mdash; тут появится рост
            </p>
          `}
        </button>`;
      }).join('')}
    </div>
  </section>

  <!-- Card 3: Саморасчёт, неделя N -->
  <section class="ref-card p-3.5">
    <div class="flex items-center justify-between">
      <h2 class="text-[17px] font-display font-bold text-white">Саморасчёт, неделя ${st.ui.week}</h2>
      <span class="ref-eyebrow text-accent">АВТОРЕГУЛЯЦИЯ</span>
    </div>
    <p class="text-[12.5px] text-zinc-400 mt-1.5 leading-relaxed">
      Беру лучший отмеченный подход за неделю. Поднимаю максимум не больше чем на 5% за раз.
    </p>

    <div class="mt-3 space-y-2">
      ${COMP.map(lift => {
        const item = autocalc.lifts[lift];
        const b = item.best;
        return `
        <div class="flex items-center justify-between text-[14px] py-0.5">
          <span class="text-zinc-200 font-semibold">${COMP_LABEL[lift]}</span>
          ${b
            ? `<span class="font-mono text-zinc-300">${fmt(b.w)}&times;${b.r} &rarr; <b class="text-white font-bold">${fmt(item.next)}</b></span>`
            : `<span class="font-mono text-zinc-400">нет данных &rarr; <b class="text-white font-bold">${fmt(item.cur)}</b></span>`
          }
        </div>`;
      }).join('')}
    </div>

    ${autocalc.hasChange ? `
      <button class="btn btn-accent w-full mt-3.5" data-act="st:applyAutocalc">Применить новые максимумы</button>
    ` : `
      <p class="text-[12.5px] text-zinc-400 mt-3 leading-relaxed">
        Пока менять нечего. Отмечай «Как пошёл» на подходах &mdash; предложение появится здесь.
      </p>
    `}
  </section>

  <!-- Card 4: Максимумы -->
  <section class="ref-card p-3.5">
    <h2 class="text-[18px] font-display font-bold text-white">Максимумы</h2>

    <div class="mt-2.5 p-3 rounded-xl bg-orange-950/30 border border-orange-500/25 text-[12.5px] text-zinc-200 leading-relaxed">
      Сейчас стоят твои рабочие цифры по анкете. Поставь реальные цифры или оставь &mdash; программа подстроится за 1–2 недели.
    </div>

    <div class="mt-3 space-y-3">
      ${[
        ['sq', 'Присед', 'от этого считаются веса'],
        ['bp', 'Жим лёжа', 'от этого считаются веса'],
        ['dl', 'Тяга классикой', 'основная тяга цикла и вариаций'],
        ['dlSumo', 'Тяга сумо', 'лучший соревновательный ориентир'],
        ['ohp', 'Жим стоя', 'от этого считаются веса'],
      ].map(([k, title, sub]) => `
        <div class="flex items-center justify-between gap-2">
          <div class="min-w-0">
            <div class="text-[15px] font-bold text-white leading-tight">${title}</div>
            <div class="text-[11.5px] text-zinc-400">${sub}</div>
          </div>
          <div class="flex items-center gap-1.5 shrink-0">
            <button class="ref-step-btn" data-act="st:max" data-k="${k}" data-d="-2.5">&minus;</button>
            <div class="ref-max-box">${fmt(P.maxes[k])}</div>
            <button class="ref-step-btn" data-act="st:max" data-k="${k}" data-d="2.5">+</button>
          </div>
        </div>`).join('')}
    </div>
  </section>

  <!-- Card 5: Гриф -->
  <section class="ref-card p-3.5 flex items-center justify-between gap-3">
    <div>
      <div class="text-[15px] font-bold text-white">Гриф</div>
      <div class="text-[12px] text-zinc-400">под него считаются блины</div>
    </div>
    <div class="flex items-center gap-1.5">
      <button class="ref-bar-pill ${P.bar === 20 ? 'is-on' : ''}" data-act="st:bar" data-v="20">20</button>
      <button class="ref-bar-pill ${P.bar === 15 ? 'is-on' : ''}" data-act="st:bar" data-v="15">15</button>
    </div>
  </section>`;
}

on('st:selectLift', (el) => {
  selectedLift = selectedLift === el.dataset.lift ? null : el.dataset.lift;
  S.update(() => {});
});

on('st:max', (el) => {
  const k = el.dataset.k;
  const d = +el.dataset.d;
  S.update(st => {
    st.profile.maxes[k] = Math.max(20, roundTo((st.profile.maxes[k] || 100) + d, 2.5));
  });
  if (S.get().profile.vibro) T.haptic(8);
});

on('st:bar', (el) => {
  const v = +el.dataset.v;
  S.update(st => { st.profile.bar = v; });
  if (S.get().profile.vibro) T.haptic(8);
});

on('st:applyAutocalc', () => {
  S.update(st => {
    applyWeekAutocalc(st, st.ui.week);
  });
  toast('Максимумы обновлены по лучшим подходам недели', 'ok');
});
