/* ==========================================================================
   IRON DIARY · views/protocols.js — Вкладка 5: «Неделя»
   Compact iPhone 15 Pro layout, Apple Liquid Glass cards, darkened barbell
   photo backdrop, 7-day ring calendar, 12 achievements, weekly review.
   ========================================================================== */
import * as S from '../store.js';
import { WEEKS, PROTOCOLS, WEEK_FEEL } from '../program.js';
import {
  dateKey, parseKey, addDays, fmt, fmtInt,
} from '../engine.js';
import {
  icon, esc, on, confirmSheet, toast, ring, achievementBadgeSVG, signalBars,
} from '../ui.js';
import {
  COMP, COMP_LABEL, dayCounts, weekTotals, bestSetsOfWeek, evaluateAchievements,
  applyWeekAutocalc, dayNutritionStats,
} from '../session.js';
import * as T from '../timer.js';

function getDayProto(st, k = dateKey()) {
  return st.protocols[k] || { pre: {}, post: {} };
}

function allItems(mode) {
  return PROTOCOLS[mode].groups.flatMap(g => g.items);
}

export function protoCompletion(st, mode, k = dateKey()) {
  const items = allItems(mode);
  const doneMap = getDayProto(st, k)[mode] || {};
  const done = items.filter(it => doneMap[it.id]).length;
  return { done, total: items.length, frac: items.length ? done / items.length : 0 };
}

function weekCalendarDates() {
  const now = parseKey(dateKey());
  const dow = now.getDay();
  const diffToMon = dow === 0 ? -6 : 1 - dow;
  const monKey = addDays(dateKey(now), diffToMon);
  const MON = ['ЯНВ', 'ФЕВ', 'МАР', 'АПР', 'МАЯ', 'ИЮН', 'ИЮЛ', 'АВГ', 'СЕН', 'ОКТ', 'НОЯ', 'ДЕК'];
  const sunKey = addDays(monKey, 6);
  const d1 = parseKey(monKey), d2 = parseKey(sunKey);
  const rangeLabel = `${d1.getDate()} ${MON[d1.getMonth()]} \u2013 ${d2.getDate()} ${MON[d2.getMonth()]}`;
  const days = Array.from({ length: 7 }, (_, i) => {
    const k = addDays(monKey, i);
    return { key: k, num: parseKey(k).getDate() };
  });
  return { rangeLabel, days };
}

function weeklyBioAverages(st) {
  const today = dateKey();
  let hrSum = 0, hrN = 0, sleepSum = 0, sleepN = 0, kcalSum = 0, kcalN = 0, bwSum = 0, bwN = 0;
  for (let i = 0; i < 7; i++) {
    const k = addDays(today, -i);
    const r = st.readiness[k];
    if (r && r.saved) {
      if (r.hr) { hrSum += r.hr; hrN++; }
      if (r.sleep) { sleepSum += r.sleep; sleepN++; }
      if (r.bw) { bwSum += r.bw; bwN++; }
    }
    const n = dayNutritionStats(st, k);
    if (n.kcal > 0) { kcalSum += n.kcal; kcalN++; }
  }
  return {
    avgBw: bwN ? bwSum / bwN : st.profile.bw,
    avgHr: hrN ? Math.round(hrSum / hrN) : null,
    avgSleep: sleepN ? sleepSum / sleepN : null,
    avgKcal: kcalN ? Math.round(kcalSum / kcalN) : null,
  };
}

export function render(st) {
  const w = st.ui.week;
  const wk = WEEKS[w - 1];
  const totals = weekTotals(st, w);
  const cal = weekCalendarDates();
  const bio = weeklyBioAverages(st);
  const bests = bestSetsOfWeek(st, w);
  const ach = evaluateAchievements(st);
  const revKey = `c${st.cycle.n}-w${w}`;
  const rev = st.weekReviews?.[revKey] || { state: null, note: '' };

  const calSlots = [
    { lbl: 'ПН', trainDay: 1, num: cal.days[0].num },
    { lbl: 'ВТ', trainDay: 2, num: cal.days[1].num },
    { lbl: 'СР', trainDay: null, num: cal.days[2].num },
    { lbl: 'ЧТ', trainDay: 3, num: cal.days[3].num },
    { lbl: 'ПТ', trainDay: null, num: cal.days[4].num },
    { lbl: 'СБ', trainDay: 4, num: cal.days[5].num },
    { lbl: 'ВС', trainDay: null, num: cal.days[6].num },
  ];

  const tonnageTons = totals.tonnage ? fmt(totals.tonnage / 1000, 1) : '0';

  return `
  <!-- Card 1: Неделя N Hero -->
  <section class="ref-card ref-hero hero-week photo-card" style="--photo:url('./img/bg-barbell.jpg')">
    <div class="flex items-start justify-between gap-2.5">
      <div>
        <div class="ref-eyebrow text-accent">${cal.rangeLabel}</div>
        <h1 class="ref-hero-title mt-1">Неделя ${w}</h1>
        <div class="text-[13.5px] text-zinc-300 mt-0.5">${wk.phase}</div>
      </div>
      <div class="relative shrink-0 grid place-items-center">
        ${ring(totals.total ? totals.done / totals.total : 0, { size: 68, stroke: 5.5, color: '#3B82F6' })}
        <span class="absolute font-mono text-[12.5px] font-bold text-white">${totals.done}/${totals.total}</span>
      </div>
    </div>

    <div class="grid grid-cols-7 gap-1 mt-4 text-center">
      ${calSlots.map(slot => {
        if (!slot.trainDay) {
          return `
          <div class="flex flex-col items-center justify-between py-0.5">
            <span class="font-mono text-[10px] text-zinc-400">${slot.lbl}</span>
            <div class="h-9 grid place-items-center">
              <span class="w-2.5 h-2.5 rounded-full bg-white/15"></span>
            </div>
            <span class="font-mono text-[8.5px] text-zinc-500">ОТДЫХ</span>
          </div>`;
        }
        const c = dayCounts(st, w, slot.trainDay);
        return `
        <button class="flex flex-col items-center justify-between py-0.5 cursor-pointer" data-act="wk:goDay" data-d="${slot.trainDay}">
          <span class="font-mono text-[10px] text-zinc-300">${slot.lbl}</span>
          <div class="h-9 grid place-items-center">
            ${ring(c.frac, { size: 34, stroke: 3.6, color: '#3B82F6' })}
          </div>
          <span class="font-mono text-[10.5px] text-zinc-300">${slot.num}</span>
        </button>`;
      }).join('')}
    </div>
  </section>

  <!-- 2x3 Summary Tiles -->
  <section class="grid grid-cols-2 gap-2">
    <div class="ref-tile">
      <span class="ref-sublabel">ТОННАЖ</span>
      <div class="mt-1 flex items-baseline gap-1">
        <span class="font-display text-[21px] font-bold text-white leading-none">${tonnageTons}</span>
        <span class="text-[12.5px] text-zinc-400 font-semibold">т</span>
      </div>
    </div>
    <div class="ref-tile">
      <span class="ref-sublabel">ОЩУЩЕНИЕ</span>
      <div class="mt-1 flex items-baseline gap-1">
        <span class="font-display text-[20px] font-bold text-white leading-none">${totals.feelLabel || '—'}</span>
        ${totals.avgScore ? `<span class="text-[12.5px] text-zinc-400 font-semibold">${totals.avgScore}/5</span>` : ''}
      </div>
    </div>
    <div class="ref-tile">
      <span class="ref-sublabel">ВЕС СРЕДНИЙ</span>
      <div class="mt-1 flex items-baseline gap-1">
        <span class="font-display text-[20px] font-bold text-white leading-none">${bio.avgBw ? fmt(bio.avgBw, 1) : '—'}</span>
        <span class="text-[12.5px] text-zinc-400 font-semibold">кг</span>
      </div>
    </div>
    <div class="ref-tile">
      <span class="ref-sublabel">ПУЛЬС</span>
      <div class="mt-1 flex items-baseline gap-1">
        <span class="font-display text-[20px] font-bold text-white leading-none">${bio.avgHr || '—'}</span>
        <span class="text-[12.5px] text-zinc-400 font-semibold">уд/мин</span>
      </div>
    </div>
    <div class="ref-tile">
      <span class="ref-sublabel">ККАЛ В ДЕНЬ</span>
      <div class="mt-1">
        <span class="font-display text-[20px] font-bold text-white leading-none">${bio.avgKcal ? fmtInt(bio.avgKcal) : '—'}</span>
      </div>
    </div>
    <div class="ref-tile">
      <span class="ref-sublabel">СОН</span>
      <div class="mt-1 flex items-baseline gap-1">
        <span class="font-display text-[20px] font-bold text-white leading-none">${bio.avgSleep ? fmt(bio.avgSleep, 1) : '—'}</span>
        <span class="text-[12.5px] text-zinc-400 font-semibold">ч</span>
      </div>
    </div>
  </section>

  <!-- Card 3: Лучшие подходы -->
  <section class="ref-card p-3.5">
    <h2 class="text-[18px] font-display font-bold text-white">Лучшие подходы</h2>
    <div class="mt-2.5 overflow-x-auto">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="border-b border-white/[0.08] font-mono text-[10px] text-zinc-400 uppercase">
            <th class="py-2 pr-2">ДВИЖЕНИЕ</th>
            <th class="py-2 px-2">ПОДХОД</th>
            <th class="py-2 px-2">КАК ПОШЁЛ</th>
            <th class="py-2 pl-2 text-right">&approx; МАКС</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-white/[0.06] text-[13.5px]">
          ${COMP.map(lift => {
            const b = bests[lift];
            return `
            <tr>
              <td class="py-2.5 pr-2 font-semibold text-zinc-100">${COMP_LABEL[lift]}</td>
              <td class="py-2.5 px-2 font-mono text-zinc-200">${b ? `${fmt(b.w)} &times; ${b.r}` : '—'}</td>
              <td class="py-2.5 px-2 text-zinc-200">${b ? b.speedLabel : '—'}</td>
              <td class="py-2.5 pl-2 text-right font-mono font-bold text-white">${b ? b.est : '—'}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  </section>

  <!-- Card 4: Достижения (Геймификация) -->
  <section class="ref-card p-3.5">
    <div class="flex items-center justify-between">
      <h2 class="text-[18px] font-display font-bold text-white">Достижения</h2>
      <span class="font-mono text-[12px] font-bold text-accent">${ach.unlockedCount} ИЗ ${ach.totalCount}</span>
    </div>

    <div class="grid grid-cols-3 gap-2 mt-3">
      ${ach.list.map(a => `
        <div class="ach-card ${a.unlocked ? 'is-unlocked' : ''}">
          ${achievementBadgeSVG(a.art, a.unlocked)}
          <div class="text-[12.5px] font-bold leading-tight mt-2 ${a.unlocked ? 'text-white' : 'text-zinc-400'}">${a.title}</div>
          <div class="text-[10.5px] leading-snug mt-0.5 ${a.unlocked ? 'text-zinc-300' : 'text-zinc-500'}">${a.desc}</div>
        </div>`).join('')}
    </div>
  </section>

  <!-- Card 5: Как прошла неделя -->
  <section class="ref-card p-3.5">
    <div class="flex items-center justify-between">
      <h2 class="text-[17px] font-display font-bold text-white">Как прошла неделя</h2>
      <span class="ref-eyebrow text-accent">ДЛЯ РАЗБОРА</span>
    </div>

    <div class="mt-2.5">
      <div class="ref-sublabel mb-1.5">ОБЩЕЕ СОСТОЯНИЕ</div>
      <div class="grid grid-cols-5 gap-1">
        ${WEEK_FEEL.map(f => `
          <button class="feel-btn feel-blue ${rev.state === f.key ? 'is-on' : ''}" data-act="wk:feel" data-v="${f.key}">
            ${signalBars(f.bars)}
            <span>${f.label}</span>
          </button>`).join('')}
      </div>
    </div>

    <textarea
      class="field mt-2.5"
      rows="3"
      placeholder="Что шло хорошо, что болело, где выпадал режим, сколько было сил."
      data-change="wk:note"
    >${esc(rev.note || '')}</textarea>
  </section>

  <!-- Card 6: Закрыть неделю & Бэкап -->
  <section class="ref-card p-3.5">
    <h2 class="text-[18px] font-display font-bold text-white">Закрыть неделю</h2>
    <p class="text-[12.5px] text-zinc-400 mt-1.5 leading-relaxed">
      Применю новые максимумы по саморасчёту и переключу на неделю ${w < 8 ? w + 1 : 1}. Веса пересчитаются сами.
    </p>

    <button class="btn-close-week w-full mt-3.5" data-act="wk:closeWeek">
      Закрыть неделю ${w}
    </button>

    <div class="grid grid-cols-3 gap-1.5 mt-3.5 pt-3.5 border-t border-white/[0.06]">
      <button class="btn btn-ghost btn-sm" data-act="wk:copyReport">${icon('copy', 14)}<span>Отчёт</span></button>
      <button class="btn btn-ghost btn-sm" data-act="wk:export">${icon('download', 14)}<span>JSON</span></button>
      <button class="btn btn-ghost btn-sm" data-act="wk:importTrigger">${icon('upload', 14)}<span>Импорт</span></button>
    </div>
    <input id="backupFileInput" type="file" accept="application/json,.json" class="hidden" data-change="wk:importFile"/>
  </section>`;
}

on('pr:mode', (el) => S.update(st => { st.ui.proto = el.dataset.m; }));

on('pr:toggle', (el) => {
  const id = el.dataset.id;
  S.update(st => {
    const mode = st.ui.proto || 'pre';
    const k = dateKey();
    if (!st.protocols[k]) st.protocols[k] = { pre: {}, post: {} };
    if (!st.protocols[k][mode]) st.protocols[k][mode] = {};
    st.protocols[k][mode][id] = !st.protocols[k][mode][id];
  });
  if (S.get().profile.vibro) T.haptic(10);
});

on('pr:timer', (el) => {
  T.start(+el.dataset.sec, el.dataset.title, el.dataset.cue);
});

on('wk:goDay', (el) => {
  const d = +el.dataset.d;
  S.update(st => {
    st.ui.day = d;
    st.ui.tab = 'gym';
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

on('wk:feel', (el) => {
  const v = +el.dataset.v;
  S.update(st => {
    const k = `c${st.cycle.n}-w${st.ui.week}`;
    if (!st.weekReviews) st.weekReviews = {};
    if (!st.weekReviews[k]) st.weekReviews[k] = { state: null, note: '' };
    st.weekReviews[k].state = v;
  });
  if (S.get().profile.vibro) T.haptic(8);
});

on('wk:note', (el) => {
  S.update(st => {
    const k = `c${st.cycle.n}-w${st.ui.week}`;
    if (!st.weekReviews) st.weekReviews = {};
    if (!st.weekReviews[k]) st.weekReviews[k] = { state: null, note: '' };
    st.weekReviews[k].note = el.value.slice(0, 1500);
  }, { silent: true });
});

on('wk:closeWeek', () => {
  let nextW = 1;
  S.update(st => {
    const w = st.ui.week;
    applyWeekAutocalc(st, w);
    const k = `c${st.cycle.n}-w${w}`;
    if (!st.weekReviews) st.weekReviews = {};
    if (!st.weekReviews[k]) st.weekReviews[k] = {};
    st.weekReviews[k].closed = true;
    nextW = w < 8 ? w + 1 : 1;
    if (w === 8) st.cycle.n += 1;
    st.cycle.week = nextW;
    st.cycle.day = 1;
    st.ui.week = nextW;
    st.ui.day = 1;
  });
  toast(`Неделя закрыта · переход к неделе ${nextW}`, 'ok');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

on('wk:copyReport', async () => {
  const st = S.get();
  const w = st.ui.week;
  const totals = weekTotals(st, w);
  const bests = bestSetsOfWeek(st, w);
  const lines = [
    `ЖЕЛЕЗНЫЙ ДНЕВНИК · Цикл ${st.cycle.n}, Неделя ${w}`,
    `Подходы: ${totals.done}/${totals.total} · Тоннаж: ${fmt(totals.tonnage / 1000, 1)} т`,
    `Вес тела: ${fmt(st.profile.bw, 1)} кг (цель ${fmt(st.profile.targetBw)} кг)`,
    ...COMP.map(l => {
      const b = bests[l];
      return `${COMP_LABEL[l]}: ${b ? `${fmt(b.w)}×${b.r} (${b.speedLabel}) ≈ ${b.est} кг` : `база ${st.profile.maxes[l]} кг`}`;
    }),
  ];
  try {
    await navigator.clipboard.writeText(lines.join('\n'));
    toast('Отчёт скопирован в буфер обмена', 'ok');
  } catch (e) {
    toast('Отчёт сформирован', 'ok');
  }
});

on('wk:export', () => {
  const fn = S.exportJSON();
  toast(`Сохранено: ${fn}`, 'ok');
});

on('wk:importTrigger', () => {
  const inp = document.getElementById('backupFileInput');
  if (inp) { inp.value = ''; inp.click(); }
});

on('wk:importFile', async (el) => {
  const file = el.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const parsed = S.parseBackup(text);
    const ok = await confirmSheet({
      title: 'Восстановить базу данных?',
      text: `Найдена копия (${parsed.sessions} тренировок). Текущие данные будут заменены.`,
      ok: 'Восстановить',
    });
    if (!ok) return;
    S.importData(parsed.data);
    toast('Данные успешно восстановлены', 'ok');
  } catch (e) {
    toast(e.message || 'Ошибка чтения JSON', 'crit');
  }
});
