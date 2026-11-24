/* ==========================================================================
   IRON DIARY · views/nutrition.js — Модуль 4: питание, вода, протокол добавок
   ========================================================================== */
import * as S from '../store.js';
import { MEALS, WATER_TARGET, SUPP_TIMES, SUPP_KINDS, TRAINING_DOW } from '../program.js';
import {
  dateKey, parseKey, addDays, daysBetween, humanDate, dowShort, fmt, clamp,
} from '../engine.js';
import { icon, esc, on, openSheet, closeSheet, toast, ring } from '../ui.js';
import * as T from '../timer.js';

let activeDate = null;
let showAllSupps = false;
let draftSupp = null;

function curDate() {
  const today = dateKey();
  if (!activeDate || daysBetween(activeDate, today) < 0) activeDate = today;
  return activeDate;
}

function dayEntry(st, k = curDate()) {
  return st.nutrition[k] || { meals: {}, water: 0, supps: {} };
}

function ensureEntry(st, k = curDate()) {
  if (!st.nutrition[k]) st.nutrition[k] = { meals: {}, water: 0, supps: {} };
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

function schedLabel(supp) {
  const sc = supp.sched || { type: 'daily' };
  const names = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
  if (sc.type === 'daily') return 'Ежедневно';
  if (sc.type === 'training') return 'Дни тренировок';
  if (sc.type === 'eod') return 'Через день';
  if (sc.type === 'days' && Array.isArray(sc.days)) return sc.days.map(i => names[i]).join(' · ');
  return 'Ежедневно';
}

function kindTone(kind) {
  if (kind === 'ИНЪЕКЦИЯ') return 'warn';
  if (kind === 'ПРЕПАРАТ') return 'ice';
  if (kind === 'ВИТАМИН') return 'ok';
  return 'steel';
}

export function render(st) {
  const k = curDate();
  const today = dateKey();
  const E = dayEntry(st, k);
  const mealsDone = MEALS.filter(m => E.meals?.[m.id]).length;
  const water = E.water || 0;
  const waterFrac = Math.min(1, water / WATER_TARGET);
  const dueSupps = st.supps.filter(s => isSuppDue(s, k));
  const suppsDone = dueSupps.filter(s => E.supps?.[s.id]).length;

  const strip = Array.from({ length: 7 }, (_, i) => {
    const dk = addDays(today, i - 6);
    const de = dayEntry(st, dk);
    const mFrac = MEALS.filter(m => de.meals?.[m.id]).length / MEALS.length;
    const wFrac = Math.min(1, (de.water || 0) / WATER_TARGET);
    const on = dk === k;
    return `
      <button class="day-pill ${on ? 'is-on' : ''}" data-act="nu:date" data-k="${dk}">
        <span class="text-[10px] font-mono ${on ? 'text-chrome-100' : 'text-chrome-500'}">${dowShort(dk)}</span>
        <span class="font-mono text-[13px] mt-0.5">${parseKey(dk).getDate()}</span>
        <span class="flex gap-1 mt-1">
          <i class="w-1.5 h-1.5 rounded-full ${mFrac >= 1 ? 'bg-ok' : mFrac > 0 ? 'bg-ice' : 'bg-white/10'}"></i>
          <i class="w-1.5 h-1.5 rounded-full ${wFrac >= 1 ? 'bg-ok' : wFrac > 0 ? 'bg-ice' : 'bg-white/10'}"></i>
        </span>
      </button>`;
  }).join('');

  const listSupps = showAllSupps ? st.supps : dueSupps;
  const groupedSupps = SUPP_TIMES.map(t => ({
    time: t,
    items: listSupps.filter(s => s.time === t),
  })).filter(g => g.items.length > 0);

  const bwProgress = clamp((st.profile.bw - 95) / (st.profile.targetBw - 95), 0, 1);

  return `
  <section class="glass card p-4">
    <div class="flex items-center justify-between">
      <div>
        <div class="eyebrow">Массонабор · категория ${st.profile.targetBw}+ кг</div>
        <h2 class="font-display text-[19px] tracking-tight mt-1">${humanDate(k)}${k === today ? ' · сегодня' : ''}</h2>
      </div>
      <div class="text-right">
        <div class="font-mono text-[20px] leading-none">${fmt(st.profile.bw, 1)} <span class="text-[11px] text-chrome-500">кг</span></div>
        <div class="text-[11px] text-chrome-500 font-mono mt-1">цель ${st.profile.targetBw}+ кг</div>
      </div>
    </div>
    <div class="grid grid-cols-7 gap-1.5 mt-3">${strip}</div>
    <div class="grid grid-cols-3 gap-2 mt-3">
      <div class="tile"><span class="eyebrow">Приёмы пищи</span><span class="font-mono text-[17px] ${mealsDone === MEALS.length ? 'text-ok' : ''}">${mealsDone}<span class="text-chrome-500">/${MEALS.length}</span></span></div>
      <div class="tile"><span class="eyebrow">Вода, л</span><span class="font-mono text-[17px] ${water >= WATER_TARGET ? 'text-ok' : 'text-ice'}">${fmt(water / 1000, 2)}<span class="text-chrome-500">/4,0</span></span></div>
      <div class="tile"><span class="eyebrow">Протокол</span><span class="font-mono text-[17px] ${suppsDone === dueSupps.length && dueSupps.length ? 'text-ok' : ''}">${suppsDone}<span class="text-chrome-500">/${dueSupps.length}</span></span></div>
    </div>
  </section>

  <!-- Водный баланс -->
  <section class="glass card p-4">
    <div class="flex items-center justify-between">
      <div>
        <div class="eyebrow">Гидратация · норма 4,0 л</div>
        <div class="flex items-baseline gap-2 mt-1">
          <span class="font-mono text-[32px] leading-none">${fmt(water / 1000, 2)}</span>
          <span class="text-[12px] text-chrome-400">л (${water} мл)</span>
        </div>
      </div>
      <div class="relative grid place-items-center">
        ${ring(waterFrac, { size: 56, stroke: 4.5, color: water >= WATER_TARGET ? 'var(--ok)' : 'var(--ice)' })}
        <span class="absolute font-mono text-[11px]">${Math.round(waterFrac * 100)}%</span>
      </div>
    </div>
    <div class="water-meter mt-3">
      ${Array.from({ length: 8 }, (_, i) => {
        const segFill = clamp((water - i * 500) / 500, 0, 1);
        return `<span class="water-seg"><i style="width:${Math.round(segFill * 100)}%"></i></span>`;
      }).join('')}
    </div>
    <div class="flex justify-between text-[10px] font-mono text-chrome-500 mt-1">
      <span>0 л</span><span>1,0 л</span><span>2,0 л</span><span>3,0 л</span><span>4,0 л</span>
    </div>
    <div class="grid grid-cols-5 gap-1.5 mt-3">
      <button class="step-lg text-chrome-400" data-act="nu:water" data-ml="-250">\u2212250</button>
      <button class="step-lg" data-act="nu:water" data-ml="250">+250</button>
      <button class="step-lg" data-act="nu:water" data-ml="500">+500</button>
      <button class="step-lg" data-act="nu:water" data-ml="750">+750</button>
      <button class="step-lg" data-act="nu:water" data-ml="1000">+1000</button>
    </div>
  </section>

  <!-- 6 приёмов пищи без подсчёта калорий -->
  <section class="glass card p-4">
    <div class="flex items-center justify-between mb-2">
      <div>
        <div class="eyebrow">Режим питания · 6 приёмов</div>
        <p class="text-[11.5px] text-chrome-500 mt-0.5">3 основных + 3 перекуса · правило ладони и кулака без весов</p>
      </div>
      <span class="font-mono text-[12px] ${mealsDone === MEALS.length ? 'text-ok' : 'text-chrome-400'}">${mealsDone}/${MEALS.length}</span>
    </div>
    <div class="divide-y divide-white/[0.05]">
      ${MEALS.map(m => {
        const doneAt = E.meals?.[m.id];
        const done = !!doneAt;
        return `
        <button class="meal-row ${done ? 'is-done' : ''}" data-act="nu:meal" data-id="${m.id}" aria-pressed="${done}">
          <span class="proto-check">${icon('check', 18)}</span>
          <span class="flex-1 min-w-0 text-left">
            <span class="flex items-center gap-2 flex-wrap">
              <span class="font-mono text-[12px] text-chrome-400">${m.time}</span>
              <span class="text-[14px] font-medium text-chrome-100 meal-title">${m.title}</span>
              <span class="tag ${m.type === 'ОСНОВНОЙ' ? 'tag-ice' : 'tag-mute'}">${m.type}</span>
            </span>
            <span class="block text-[12px] text-chrome-400 mt-1 leading-snug">${m.guide}</span>
          </span>
        </button>`;
      }).join('')}
    </div>
  </section>

  <!-- Протокол фармакологии и спортивных добавок -->
  <section class="glass card p-4">
    <div class="flex items-center justify-between gap-2">
      <div>
        <div class="eyebrow">Фармакология, витамины и БАД</div>
        <p class="text-[11.5px] text-chrome-500 mt-0.5">${showAllSupps ? 'Все позиции протокола' : `По расписанию на день (${dueSupps.length})`}</p>
      </div>
      <div class="flex items-center gap-1.5">
        <button class="chip-btn ${showAllSupps ? 'is-on' : ''}" data-act="nu:toggleAllSupps">${showAllSupps ? 'По дню' : 'Все'}</button>
        <button class="btn btn-ghost btn-sm" data-act="nu:addSuppSheet">${icon('plus', 15)}<span>Добавить</span></button>
      </div>
    </div>

    ${groupedSupps.length ? groupedSupps.map(g => `
      <div class="mt-3 pt-3 border-t border-white/[0.05]">
        <div class="eyebrow mb-1.5">${g.time}</div>
        <div class="divide-y divide-white/[0.04]">
          ${g.items.map(s => {
            const done = !!E.supps?.[s.id];
            const due = isSuppDue(s, k);
            return `
            <div class="supp-row ${done ? 'is-done' : ''} ${!due ? 'opacity-60' : ''}">
              <button class="supp-main" data-act="nu:supp" data-id="${s.id}" aria-pressed="${done}">
                <span class="proto-check">${icon('check', 18)}</span>
                <span class="flex-1 min-w-0 text-left">
                  <span class="flex items-center gap-1.5 flex-wrap">
                    <span class="text-[13.5px] text-chrome-100 font-medium supp-title">${esc(s.name)}</span>
                    <span class="tag tag-${kindTone(s.kind)}">${s.kind}</span>
                  </span>
                  <span class="block text-[11.5px] text-chrome-400 font-mono mt-0.5">${esc(s.dose)} · ${schedLabel(s)}</span>
                </span>
              </button>
              <button class="icon-btn text-chrome-500" data-act="nu:delSupp" data-id="${s.id}" aria-label="Удалить">${icon('trash', 16)}</button>
            </div>`;
          }).join('')}
        </div>
      </div>`).join('')
    : '<p class="text-[12.5px] text-chrome-500 mt-3">На этот день приёмов нет. Нажмите «Добавить», чтобы внести препарат или добавку.</p>'}
  </section>

  <!-- Взвешивание атлета -->
  <section class="glass card p-4">
    <div class="flex items-center justify-between">
      <div>
        <div class="eyebrow">Масса тела · путь 95 → ${st.profile.targetBw}+ кг</div>
        <div class="text-[12px] text-chrome-400 mt-0.5">Осталось набрать <span class="font-mono text-chrome-200">${fmt(Math.max(0, st.profile.targetBw - st.profile.bw), 1)} кг</span></div>
      </div>
      <span class="font-mono text-[22px]">${fmt(st.profile.bw, 1)} кг</span>
    </div>
    <div class="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden mt-3">
      <div class="h-full bg-ice rounded-full transition-all" style="width:${Math.round(bwProgress * 100)}%"></div>
    </div>
    <div class="grid grid-cols-4 gap-2 mt-3">
      <button class="step-lg" data-act="nu:bw" data-d="-0.5">\u22120,5</button>
      <button class="step-lg" data-act="nu:bw" data-d="-0.1">\u22120,1</button>
      <button class="step-lg" data-act="nu:bw" data-d="0.1">+0,1</button>
      <button class="step-lg" data-act="nu:bw" data-d="0.5">+0,5</button>
    </div>
  </section>`;
}

on('nu:date', (el) => { activeDate = el.dataset.k; S.update(() => {}); });

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
  if (crossed) toast('Дневная норма 4,0 л закрыта', 'ok');
});

on('nu:meal', (el) => {
  const id = el.dataset.id;
  let allDone = false;
  S.update(st => {
    const E = ensureEntry(st);
    if (!E.meals) E.meals = {};
    E.meals[id] = E.meals[id] ? null : Date.now();
    allDone = MEALS.every(m => E.meals[m.id]);
  });
  if (S.get().profile.vibro) T.haptic(10);
  if (allDone) toast('Все 6 приёмов пищи закрыты', 'ok');
});

on('nu:supp', (el) => {
  const id = el.dataset.id;
  S.update(st => {
    const E = ensureEntry(st);
    if (!E.supps) E.supps = {};
    E.supps[id] = !E.supps[id];
  });
  if (S.get().profile.vibro) T.haptic(8);
});

on('nu:toggleAllSupps', () => { showAllSupps = !showAllSupps; S.update(() => {}); });

on('nu:delSupp', (el) => {
  const id = el.dataset.id;
  S.update(st => { st.supps = st.supps.filter(s => s.id !== id); });
  toast('Позиция удалена', 'neutral');
});

on('nu:bw', (el) => {
  const d = +el.dataset.d;
  S.update(st => {
    const kg = Math.round(clamp(st.profile.bw + d, 50, 220) * 10) / 10;
    st.profile.bw = kg;
    const k = curDate();
    const hit = st.bodyweight.find(b => b.date === k);
    if (hit) hit.kg = kg;
    else st.bodyweight.push({ date: k, kg });
    st.bodyweight.sort((a, b) => a.date.localeCompare(b.date));
  });
});

/* ------------------------------------------------ Add supplement sheet */
function renderSuppSheet() {
  const d = draftSupp;
  const dowNames = [
    [1, 'ПН'], [2, 'ВТ'], [3, 'СР'], [4, 'ЧТ'], [5, 'ПТ'], [6, 'СБ'], [0, 'ВС'],
  ];
  return `
  <div class="pt-1">
    <div class="flex items-start justify-between">
      <div>
        <div class="eyebrow">Протокол</div>
        <h3 class="font-display text-[18px] tracking-tight mt-1">Новая позиция</h3>
      </div>
      <button class="icon-btn" data-act="sheet:close" aria-label="Закрыть">${icon('x', 20)}</button>
    </div>

    <div class="mt-4">
      <label class="eyebrow" for="spName">Название</label>
      <input id="spName" class="field mt-1.5" type="text" placeholder="Например: Цинк пиколинат / B12" value="${esc(d.name)}" data-change="sp:name"/>
    </div>

    <div class="mt-3">
      <label class="eyebrow" for="spDose">Дозировка</label>
      <input id="spDose" class="field mt-1.5" type="text" placeholder="Например: 25 мг / 1 мл" value="${esc(d.dose)}" data-change="sp:dose"/>
    </div>

    <div class="mt-3">
      <div class="eyebrow mb-1.5">Категория</div>
      <div class="seg seg-4">
        ${SUPP_KINDS.map(k => `<button class="seg-btn text-[11px] ${d.kind === k ? 'is-on' : ''}" data-act="sp:kind" data-v="${k}">${k}</button>`).join('')}
      </div>
    </div>

    <div class="mt-3">
      <div class="eyebrow mb-1.5">Время приёма</div>
      <div class="grid grid-cols-3 gap-1.5">
        ${SUPP_TIMES.map(t => `<button class="chip-btn ${d.time === t ? 'is-on' : ''}" data-act="sp:time" data-v="${t}">${t}</button>`).join('')}
      </div>
    </div>

    <div class="mt-3">
      <div class="eyebrow mb-1.5">Расписание</div>
      <div class="grid grid-cols-2 gap-1.5">
        ${[['daily', 'Ежедневно'], ['training', 'Дни тренировок'], ['eod', 'Через день (EOD)'], ['days', 'Дни недели']].map(([k, l]) => `
          <button class="chip-btn ${d.schedType === k ? 'is-on' : ''}" data-act="sp:sched" data-v="${k}">${l}</button>`).join('')}
      </div>
      ${d.schedType === 'days' ? `
      <div class="grid grid-cols-7 gap-1 mt-2">
        ${dowNames.map(([idx, lbl]) => `
          <button class="chip-btn ${d.days.includes(idx) ? 'is-on' : ''}" data-act="sp:dow" data-v="${idx}">${lbl}</button>`).join('')}
      </div>` : ''}
    </div>

    <div class="grid grid-cols-2 gap-2 mt-5">
      <button class="btn btn-ghost" data-act="sheet:close">Отмена</button>
      <button class="btn btn-primary" data-act="sp:save">${icon('check', 16)}<span>Добавить</span></button>
    </div>
  </div>`;
}

on('nu:addSuppSheet', () => {
  draftSupp = { name: '', dose: '', kind: 'ДОБАВКА', time: 'Утро', schedType: 'daily', days: [1, 4] };
  openSheet(renderSuppSheet);
});

on('sp:name', (el) => { if (draftSupp) draftSupp.name = el.value; });
on('sp:dose', (el) => { if (draftSupp) draftSupp.dose = el.value; });
on('sp:kind', (el) => { draftSupp.kind = el.dataset.v; S.update(() => {}); });
on('sp:time', (el) => { draftSupp.time = el.dataset.v; S.update(() => {}); });
on('sp:sched', (el) => { draftSupp.schedType = el.dataset.v; S.update(() => {}); });
on('sp:dow', (el) => {
  const v = +el.dataset.v;
  const idx = draftSupp.days.indexOf(v);
  if (idx >= 0) draftSupp.days.splice(idx, 1);
  else draftSupp.days.push(v);
  S.update(() => {});
});
on('sp:save', () => {
  const nameInput = document.getElementById('spName');
  const doseInput = document.getElementById('spDose');
  if (nameInput) draftSupp.name = nameInput.value.trim();
  if (doseInput) draftSupp.dose = doseInput.value.trim();
  if (!draftSupp.name) { toast('Введите название препарата или добавки', 'warn'); return; }
  const sched = draftSupp.schedType === 'days'
    ? { type: 'days', days: draftSupp.days.length ? draftSupp.days.slice() : [1, 4] }
    : draftSupp.schedType === 'eod'
    ? { type: 'eod', anchor: curDate() }
    : { type: draftSupp.schedType };
  S.update(st => {
    st.supps.push({
      id: 'sp_' + Date.now().toString(36),
      name: draftSupp.name,
      dose: draftSupp.dose || '1 порция',
      kind: draftSupp.kind,
      time: draftSupp.time,
      sched,
    });
  });
  closeSheet();
  toast('Добавлено в протокол', 'ok');
});
