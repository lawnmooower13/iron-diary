/* ==========================================================================
   IRON DIARY · views/protocols.js — Модуль 2: протоколы разминки и заминки
   ========================================================================== */
import * as S from '../store.js';
import { PROTOCOLS } from '../program.js';
import { dateKey, addDays, humanDate, dowShort } from '../engine.js';
import { icon, on, ring, toast } from '../ui.js';
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

export function render(st) {
  const mode = st.ui.proto || 'pre';
  const P = PROTOCOLS[mode];
  const today = dateKey();
  const preC = protoCompletion(st, 'pre', today);
  const postC = protoCompletion(st, 'post', today);
  const curC = mode === 'pre' ? preC : postC;
  const doneMap = getDayProto(st, today)[mode] || {};

  const weekStrip = Array.from({ length: 7 }, (_, idx) => {
    const k = addDays(today, idx - 6);
    const a = protoCompletion(st, 'pre', k).frac;
    const b = protoCompletion(st, 'post', k).frac;
    const isToday = k === today;
    return `
      <div class=" tile flex flex-col items-center py-2 ${isToday ? 'border-white/20' : ''}">
        <span class="text-[10px] font-mono ${isToday ? 'text-chrome-100' : 'text-chrome-500'}">${dowShort(k)}</span>
        <div class="flex gap-1 mt-1.5">
          <span class="w-2 h-2 rounded-full ${a >= 1 ? 'bg-ok' : a > 0 ? 'bg-ice' : 'bg-white/10'}" title="Разминка"></span>
          <span class="w-2 h-2 rounded-full ${b >= 1 ? 'bg-ok' : b > 0 ? 'bg-ice' : 'bg-white/10'}" title="Заминка"></span>
        </div>
      </div>`;
  }).join('');

  return `
  <section class="glass card p-4">
    <div class="flex items-center justify-between">
      <div class="eyebrow">Регламент безопасности · ${humanDate(today)}</div>
      <span class="font-mono text-[11px] text-chrome-400">${curC.done}/${curC.total}</span>
    </div>
    <div class="seg seg-2 mt-3">
      <button class="seg-btn ${mode === 'pre' ? 'is-on' : ''}" data-act="pr:mode" data-m="pre">
        <span>До тренировки</span>
        <span class="font-mono text-[11px] ml-1.5 opacity-75">${preC.done}/${preC.total}</span>
      </button>
      <button class="seg-btn ${mode === 'post' ? 'is-on' : ''}" data-act="pr:mode" data-m="post">
        <span>Декомпрессия</span>
        <span class="font-mono text-[11px] ml-1.5 opacity-75">${postC.done}/${postC.total}</span>
      </button>
    </div>

    <div class="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-white/[0.06]">
      <div class="min-w-0">
        <h2 class="font-display text-[18px] tracking-tight leading-snug">${P.title}</h2>
        <p class="text-[12px] text-chrome-400 mt-1">${P.sub}</p>
      </div>
      <div class="relative shrink-0 grid place-items-center">
        ${ring(curC.frac, { size: 54, stroke: 4, color: curC.frac >= 1 ? 'var(--ok)' : 'var(--ice)' })}
        <span class="absolute font-mono text-[11px]">${Math.round(curC.frac * 100)}%</span>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-2 mt-3">
      <button class="btn btn-ghost btn-sm" data-act="pr:all">${icon('check', 15)}<span>Отметить всё</span></button>
      <button class="btn btn-ghost btn-sm" data-act="pr:reset">${icon('reset', 15)}<span>Сбросить</span></button>
    </div>
  </section>

  ${P.groups.map((g, gi) => {
    const gDone = g.items.filter(it => doneMap[it.id]).length;
    return `
    <section class="glass card p-4">
      <div class="flex items-center justify-between mb-2.5">
        <div class="flex items-center gap-2">
          <span class="font-mono text-[11px] text-chrome-500">0${gi + 1}</span>
          <span class="eyebrow text-chrome-200">${g.title}</span>
        </div>
        <span class="font-mono text-[11px] ${gDone === g.items.length ? 'text-ok' : 'text-chrome-500'}">${gDone}/${g.items.length}</span>
      </div>
      <div class="divide-y divide-white/[0.05]">
        ${g.items.map(it => {
          const done = !!doneMap[it.id];
          return `
          <div class="proto-row ${done ? 'is-done' : ''}">
            <button class="proto-main" data-act="pr:toggle" data-id="${it.id}" aria-pressed="${done}">
              <span class="proto-check">${icon('check', 18)}</span>
              <span class="flex-1 min-w-0 text-left">
                <span class="flex items-center gap-2 flex-wrap">
                  <span class="text-[14px] text-chrome-100 font-medium leading-snug proto-title">${it.title}</span>
                  <span class="tag tag-steel">${it.dose}</span>
                </span>
                <span class="block text-[12px] text-chrome-400 mt-1 leading-snug">${it.cue}</span>
              </span>
            </button>
            ${it.sec ? `
            <button class="proto-timer" data-act="pr:timer" data-sec="${it.sec}" data-title="${it.title}" data-cue="${it.cue}" aria-label="Таймер ${it.sec} секунд">
              ${icon('timer', 16)}
              <span class="font-mono text-[11px]">${it.sec >= 60 ? Math.round(it.sec / 60) + 'м' : it.sec + 'с'}</span>
            </button>` : ''}
          </div>`;
        }).join('')}
      </div>
    </section>`;
  }).join('')}

  <section class="glass card p-4">
    <div class="flex items-center justify-between mb-2.5">
      <span class="eyebrow">Дисциплина · 7 дней</span>
      <span class="text-[11px] text-chrome-500">разминка · заминка</span>
    </div>
    <div class="grid grid-cols-7 gap-1.5">${weekStrip}</div>
    ${curC.frac >= 1 ? `
      <button class="btn btn-primary w-full mt-4" data-act="nav" data-tab="${mode === 'pre' ? 'train' : 'food'}">
        ${icon(mode === 'pre' ? 'train' : 'food', 18)}
        <span>${mode === 'pre' ? 'Протокол закрыт · к штанге' : 'Заминка закрыта · к приёму пищи'}</span>
      </button>` : ''}
  </section>`;
}

on('pr:mode', (el) => S.update(st => { st.ui.proto = el.dataset.m; }));

on('pr:toggle', (el) => {
  const id = el.dataset.id;
  let completedAll = false;
  S.update(st => {
    const mode = st.ui.proto || 'pre';
    const k = dateKey();
    if (!st.protocols[k]) st.protocols[k] = { pre: {}, post: {} };
    if (!st.protocols[k][mode]) st.protocols[k][mode] = {};
    st.protocols[k][mode][id] = !st.protocols[k][mode][id];
    const c = protoCompletion(st, mode, k);
    completedAll = st.protocols[k][mode][id] && c.done === c.total;
  });
  if (S.get().profile.vibro) T.haptic(10);
  if (completedAll) toast('Протокол полностью закрыт', 'ok');
});

on('pr:all', () => {
  S.update(st => {
    const mode = st.ui.proto || 'pre';
    const k = dateKey();
    if (!st.protocols[k]) st.protocols[k] = { pre: {}, post: {} };
    const map = {};
    allItems(mode).forEach(it => { map[it.id] = true; });
    st.protocols[k][mode] = map;
  });
  toast('Все шаги отмечены', 'ok');
});

on('pr:reset', () => {
  S.update(st => {
    const mode = st.ui.proto || 'pre';
    const k = dateKey();
    if (st.protocols[k]) st.protocols[k][mode] = {};
  });
});

on('pr:timer', (el) => {
  const sec = +el.dataset.sec;
  T.start(sec, el.dataset.title, el.dataset.cue);
});
