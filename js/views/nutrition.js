/* ==========================================================================
   IRON DIARY · views/nutrition.js — Вкладка 2: «Еда»
   "Ешь по кнопкам" hero card with gourmet bowl SVG & dual concentric ring,
   streak flame card, meal cards with dish illustrations, "КАК ЗАШЛО" 5-bar
   rating, water 4.0L tracker, and supplements/pharmacology checklist.
   ========================================================================== */
import * as S from '../store.js';
import { MEAL_FEEL, WATER_TARGET, SUPP_TIMES, SUPP_KINDS, TRAINING_DOW } from '../program.js';
import {
  dateKey, parseKey, addDays, daysBetween, humanDate, fmt, fmtInt, clamp,
} from '../engine.js';
import {
  icon, esc, on, openSheet, closeSheet, toast, dualRing, foodHeroSVG, mealArtSVG, signalBars,
} from '../ui.js';
import { dayNutritionStats, nutritionStreak } from '../session.js';
import * as T from '../timer.js';

let activeDate = null;
const openComment = new Set();
let draftSupp = null;

function curDate() {
  const today = dateKey();
  if (!activeDate) activeDate = today;
  return activeDate;
}

function dayEntry(st, k = curDate()) {
  return st.nutrition[k] || { meals: {}, mealFeel: {}, mealNotes: {}, water: 0, supps: {} };
}

function ensureEntry(st, k = curDate()) {
  if (!st.nutrition[k]) st.nutrition[k] = { meals: {}, mealFeel: {}, mealNotes: {}, water: 0, supps: {} };
  if (!st.nutrition[k].mealFeel) st.nutrition[k].mealFeel = {};
  if (!st.nutrition[k].mealNotes) st.nutrition[k].mealNotes = {};
  return st.nutrition[k];
}

export function isSuppDue(supp, k = dateKey()) {
  const sc = supp.sched || { type: 'daily' };
  const d = parseKey(k);
  const dow = d.getDay();
  if (sc.type === 'daily') return true;
  if (sc.type === 'training') return TRAINING_DOW.includes(dow);
  if (sc.type === 'eod') {
    const anchor = sc.anchor || '2026-01-01';
    return Math.abs(daysBetween(anchor, k)) % 2 === 0;
  }
  if (sc.type === 'days' && Array.isArray(sc.days)) return sc.days.includes(dow);
  return true;
}

function flameSVG(on) {
  const fill = on ? '#2CE56B' : '#27272A';
  return `<svg width="36" height="36" viewBox="0 0 36 36" class="shrink-0 block" aria-hidden="true">
    <path d="M19 4c4 6.5 10 10.5 10 18a10 10 0 0 1-20 0c0-4.6 2.5-8.5 5-11.2 0 3.5 2 5.2 3.5 5.2 1.8 0 2.8-2.5 1.5-12z" fill="${fill}"/>
  </svg>`;
}

export function render(st) {
  const k = curDate();
  const E = dayEntry(st, k);
  const N = dayNutritionStats(st, k);
  const streak = nutritionStreak(st);
  const water = E.water || 0;
  const waterFrac = clamp(water / WATER_TARGET, 0, 1);
  const dueSupps = st.supps.filter(s => isSuppDue(s, k));
  const suppsDone = dueSupps.filter(s => E.supps?.[s.id]).length;

  const streakTitle = streak > 0
    ? `${streak} ${streak === 1 ? 'день' : streak < 5 ? 'дня' : 'дней'} подряд по плану`
    : 'Серия ещё не началась';

  return `
  <!-- Hero Card: Ешь по кнопкам -->
  <section class="ref-card ref-hero hero-food">
    <div class="flex items-start justify-between gap-3">
      <div>
        <div class="ref-eyebrow text-accent">ПИТАНИЕ &middot; СЕГОДНЯ</div>
        <h1 class="ref-hero-title mt-1.5">Ешь по<br/>кнопкам</h1>
      </div>
      ${foodHeroSVG()}
    </div>

    <div class="flex items-center gap-5 mt-4">
      <div class="relative shrink-0 grid place-items-center">
        ${dualRing(N.kcal / N.targetKcal, N.prot / N.targetProt, { size: 146, outerColor: '#2CE56B', innerColor: '#E4E4E7' })}
        <div class="absolute text-center">
          <div class="font-display text-[30px] font-extrabold leading-none text-white">${N.pct}%</div>
          <div class="font-mono text-[10px] tracking-wider text-zinc-400 mt-1">ККАЛ &middot; БЕЛОК</div>
        </div>
      </div>

      <div class="min-w-0 flex-1 space-y-3">
        <div>
          <div class="ref-sublabel">КАЛОРИИ</div>
          <div class="flex items-baseline gap-1.5 mt-0.5 flex-wrap">
            <span class="font-display text-[32px] font-extrabold leading-none text-white">${fmtInt(N.kcal)}</span>
            <span class="font-display text-[17px] font-bold text-zinc-400">/ ${fmtInt(N.targetKcal)}</span>
          </div>
        </div>
        <div>
          <div class="ref-sublabel">БЕЛОК, Г</div>
          <div class="flex items-baseline gap-1.5 mt-0.5 flex-wrap">
            <span class="font-display text-[32px] font-extrabold leading-none text-white">${N.prot}</span>
            <span class="font-display text-[17px] font-bold text-zinc-400">/ ${N.targetProt}</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Date Nav -->
  <div class="flex items-center justify-between gap-2">
    <button class="ref-nav-arrow" data-act="nu:shiftDate" data-d="-1" aria-label="Предыдущий день">${icon('chevronLeft', 20)}</button>
    <div class="text-[20px] font-extrabold text-white tracking-tight">${humanDate(k)}</div>
    <button class="ref-nav-arrow" data-act="nu:shiftDate" data-d="1" aria-label="Следующий день">${icon('chevronRight', 20)}</button>
  </div>

  <!-- Streak Card -->
  <section class="ref-card p-4 flex items-center gap-3.5">
    ${flameSVG(streak > 0)}
    <div class="min-w-0 flex-1">
      <div class="text-[18px] font-extrabold text-white leading-snug">${streakTitle}</div>
      <p class="text-[13.5px] text-zinc-400 mt-1 leading-snug">День засчитывается, когда набрал 90% калорий. Порции подстроены под цель &times;${fmt(N.scale, 2)}.</p>
    </div>
  </section>

  <!-- Meals List -->
  <div class="space-y-4">
    ${N.scaledMeals.map(m => {
      const done = !!E.meals?.[m.id];
      const feel = E.mealFeel?.[m.id] || (done ? 'great' : null);
      const note = E.mealNotes?.[m.id] || '';
      const commentVisible = openComment.has(m.id) || !!note;
      return `
      <div>
        <div class="ref-meal-card ${done ? 'is-done' : ''}" data-act="nu:meal" data-id="${m.id}">
          <div class="flex items-start gap-3.5">
            <button class="ref-check ${done ? 'is-on' : ''} mt-0.5" data-act="nu:meal" data-id="${m.id}" aria-pressed="${done}">
              ${icon('check', 24)}
            </button>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-2">
                <h3 class="text-[20px] font-extrabold text-white leading-tight">${m.title}</h3>
                <div class="text-right font-mono text-[14px] text-zinc-400 shrink-0">
                  <div>${m.kcal}</div>
                  <div>${m.prot} г б</div>
                </div>
              </div>
              <div class="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[15px] text-zinc-300 leading-snug">
                ${m.items.map(it => `<span><span class="text-zinc-400">${it.name}</span> <b class="text-white font-bold">${it.val} ${it.unit}</b></span>`).join('')}
              </div>
            </div>
            ${mealArtSVG(m.art)}
          </div>
        </div>

        <div class="mt-2.5 px-1">
          <div class="ref-sublabel mb-2">КАК ЗАШЛО</div>
          <div class="grid grid-cols-5 gap-1.5">
            ${MEAL_FEEL.map(f => `
              <button class="feel-btn feel-green ${feel === f.key ? 'is-on' : ''}" data-act="nu:feel" data-id="${m.id}" data-v="${f.key}">
                ${signalBars(f.bars)}
                <span>${f.label}</span>
              </button>`).join('')}
          </div>
          ${commentVisible ? `
            <input type="text" class="field mt-2.5" placeholder="Комментарий к приёму (аппетит, ЖКТ, замена)" value="${esc(note)}" data-id="${m.id}" data-change="nu:note"/>
          ` : `
            <button class="text-[14px] text-zinc-400 hover:text-zinc-200 mt-2.5 inline-block" data-act="nu:openNote" data-id="${m.id}">+ комментарий к приёму</button>
          `}
        </div>
      </div>`;
    }).join('')}
  </div>

  <!-- Water Tracker (4.0 L) -->
  <section class="ref-card p-4">
    <div class="flex items-center justify-between">
      <div>
        <div class="ref-eyebrow text-accent">ВОДНЫЙ БАЛАНС &middot; НОРМА 4,0 Л</div>
        <div class="flex items-baseline gap-2 mt-1">
          <span class="font-display text-[32px] font-extrabold text-white leading-none">${fmt(water / 1000, 2)}</span>
          <span class="text-[15px] text-zinc-400 font-semibold">/ 4,0 л (${water} мл)</span>
        </div>
      </div>
      <span class="font-mono text-[15px] font-bold ${water >= WATER_TARGET ? 'text-emerald-400' : 'text-zinc-400'}">${Math.round(waterFrac * 100)}%</span>
    </div>
    <div class="water-meter mt-3">
      ${Array.from({ length: 8 }, (_, i) => {
        const segFill = clamp((water - i * 500) / 500, 0, 1);
        return `<span class="water-seg"><i style="width:${Math.round(segFill * 100)}%"></i></span>`;
      }).join('')}
    </div>
    <div class="grid grid-cols-4 gap-2 mt-3">
      <button class="step-lg text-zinc-400" data-act="nu:water" data-ml="-250">\u2212250</button>
      <button class="step-lg" data-act="nu:water" data-ml="250">+250 мл</button>
      <button class="step-lg" data-act="nu:water" data-ml="500">+500 мл</button>
      <button class="step-lg" data-act="nu:water" data-ml="1000">+1,0 л</button>
    </div>
  </section>

  <!-- Supplements & Pharmacology Stack -->
  <section class="ref-card p-4">
    <div class="flex items-center justify-between gap-2">
      <div>
        <div class="ref-eyebrow text-accent">ДОБАВКИ И ПРОТОКОЛ &middot; ${suppsDone}/${dueSupps.length}</div>
        <h3 class="text-[20px] font-extrabold text-white mt-0.5">Витамины, БАД и препараты</h3>
      </div>
      <button class="chip-btn" data-act="nu:addSuppSheet">+ Добавить</button>
    </div>
    <div class="mt-3 divide-y divide-white/[0.06]">
      ${dueSupps.map(s => {
        const done = !!E.supps?.[s.id];
        return `
        <div class="py-2.5 flex items-center justify-between gap-2">
          <button class="flex items-center gap-3 text-left flex-1 min-w-0" data-act="nu:supp" data-id="${s.id}">
            <span class="ref-check ref-check-sm ${done ? 'is-on' : ''}">${icon('check', 18)}</span>
            <span class="min-w-0 flex-1">
              <span class="block text-[15px] font-bold ${done ? 'line-through text-zinc-500' : 'text-white'}">${esc(s.name)}</span>
              <span class="block font-mono text-[12px] text-zinc-400">${esc(s.dose)} &middot; ${s.time} &middot; ${s.kind}</span>
            </span>
          </button>
          <button class="icon-btn text-zinc-500" data-act="nu:delSupp" data-id="${s.id}" aria-label="Удалить">${icon('trash', 16)}</button>
        </div>`;
      }).join('')}
    </div>
  </section>`;
}

/* ---------------------------------------------------------- Actions */
on('nu:shiftDate', (el) => {
  activeDate = addDays(curDate(), +el.dataset.d);
  S.update(() => {});
});

on('nu:meal', (el) => {
  const id = el.dataset.id;
  S.update(st => {
    const E = ensureEntry(st);
    E.meals[id] = E.meals[id] ? null : Date.now();
    if (E.meals[id] && !E.mealFeel[id]) E.mealFeel[id] = 'great';
  });
  if (S.get().profile.vibro) T.haptic(12);
});

on('nu:feel', (el) => {
  const id = el.dataset.id;
  const v = el.dataset.v;
  S.update(st => {
    const E = ensureEntry(st);
    E.mealFeel[id] = v;
    if (!E.meals[id]) E.meals[id] = Date.now();
  });
  if (S.get().profile.vibro) T.haptic(8);
});

on('nu:openNote', (el) => {
  openComment.add(el.dataset.id);
  S.update(() => {});
});

on('nu:note', (el) => {
  const id = el.dataset.id;
  S.update(st => {
    const E = ensureEntry(st);
    E.mealNotes[id] = el.value.slice(0, 300);
  }, { silent: true });
});

on('nu:water', (el) => {
  const delta = +el.dataset.ml;
  let crossed = false;
  S.update(st => {
    const E = ensureEntry(st);
    const prev = E.water || 0;
    E.water = clamp(prev + delta, 0, 10000);
    crossed = prev < WATER_TARGET && E.water >= WATER_TARGET;
  });
  if (S.get().profile.vibro) T.haptic(10);
  if (crossed) toast('Дневная норма 4,0 л воды выполнена', 'ok');
});

on('nu:supp', (el) => {
  const id = el.dataset.id;
  S.update(st => {
    const E = ensureEntry(st);
    E.supps[id] = !E.supps[id];
  });
  if (S.get().profile.vibro) T.haptic(8);
});

on('nu:delSupp', (el) => {
  const id = el.dataset.id;
  S.update(st => { st.supps = st.supps.filter(s => s.id !== id); });
});

function renderSuppSheet() {
  const d = draftSupp;
  return `
  <div class="pt-1">
    <div class="flex items-start justify-between">
      <div>
        <div class="ref-eyebrow text-accent">ПРОТОКОЛ ДОБАВОК</div>
        <h3 class="text-[20px] font-extrabold text-white mt-1">Новая позиция</h3>
      </div>
      <button class="icon-btn" data-act="sheet:close" aria-label="Закрыть">${icon('x', 20)}</button>
    </div>
    <div class="mt-4">
      <label class="ref-sublabel" for="spName">НАЗВАНИЕ</label>
      <input id="spName" class="field mt-1.5" type="text" placeholder="Например: Цинк / Витамин B12" value="${esc(d.name)}" data-change="sp:name"/>
    </div>
    <div class="mt-3">
      <label class="ref-sublabel" for="spDose">ДОЗИРОВКА</label>
      <input id="spDose" class="field mt-1.5" type="text" placeholder="Например: 25 мг / 1 капсула" value="${esc(d.dose)}" data-change="sp:dose"/>
    </div>
    <div class="mt-3">
      <div class="ref-sublabel mb-1.5">КАТЕГОРИЯ</div>
      <div class="grid grid-cols-2 gap-1.5">
        ${SUPP_KINDS.map(k => `<button class="chip-btn ${d.kind === k ? 'is-on' : ''}" data-act="sp:kind" data-v="${k}">${k}</button>`).join('')}
      </div>
    </div>
    <div class="mt-3">
      <div class="ref-sublabel mb-1.5">ВРЕМЯ ПРИЁМА</div>
      <div class="grid grid-cols-3 gap-1.5">
        ${SUPP_TIMES.map(t => `<button class="chip-btn ${d.time === t ? 'is-on' : ''}" data-act="sp:time" data-v="${t}">${t}</button>`).join('')}
      </div>
    </div>
    <div class="grid grid-cols-2 gap-2.5 mt-5">
      <button class="btn btn-ghost" data-act="sheet:close">Отмена</button>
      <button class="btn btn-primary" data-act="sp:save">Добавить</button>
    </div>
  </div>`;
}

on('nu:addSuppSheet', () => {
  draftSupp = { name: '', dose: '', kind: 'ДОБАВКА', time: 'Утро' };
  openSheet(renderSuppSheet);
});
on('sp:name', (el) => { if (draftSupp) draftSupp.name = el.value; });
on('sp:dose', (el) => { if (draftSupp) draftSupp.dose = el.value; });
on('sp:kind', (el) => { draftSupp.kind = el.dataset.v; S.update(() => {}); });
on('sp:time', (el) => { draftSupp.time = el.dataset.v; S.update(() => {}); });
on('sp:save', () => {
  const nameInput = document.getElementById('spName');
  const doseInput = document.getElementById('spDose');
  if (nameInput) draftSupp.name = nameInput.value.trim();
  if (doseInput) draftSupp.dose = doseInput.value.trim();
  if (!draftSupp.name) { toast('Введите название позиции', 'warn'); return; }
  S.update(st => {
    st.supps.push({
      id: 'sp_' + Date.now().toString(36),
      name: draftSupp.name,
      dose: draftSupp.dose || '1 порция',
      kind: draftSupp.kind,
      time: draftSupp.time,
      sched: { type: 'daily' },
    });
  });
  closeSheet();
  toast('Добавлено в протокол', 'ok');
});
