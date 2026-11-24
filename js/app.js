/* ==========================================================================
   IRON DIARY · app.js
   Application shell matching reference UI:
   - Header: "ЖЕЛЕЗНЫЙ ДНЕВНИК" (with dynamic tab accent color on "ДНЕВНИК"),
     green status dot "СОХРАНЕНО · ОФЛАЙН", week switcher "< НЕД 1/8 >",
     and Wake Lock API toggle.
   - Bottom Dock: 5 tabs ("Зал", "Еда", "Форма", "Сила", "Неделя") with
     dynamic per-tab accent glow (Red, Green, Purple, Orange, Blue).
   ========================================================================== */
import * as S from './store.js';
import { fmt, clamp } from './engine.js';
import { WEEKS, methodSections } from './program.js';
import {
  icon, actions, on, mountSheet, mountToast, openSheet, closeSheet, refreshSheet, toast,
} from './ui.js';
import * as T from './timer.js';
import * as Gym from './views/training.js';
import * as Food from './views/nutrition.js';
import * as Body from './views/readiness.js';
import * as Strength from './views/analytics.js';
import * as Week from './views/protocols.js';

const VIEWS = {
  gym:      { title: 'Зал',    ico: 'gym',      render: Gym.render },
  food:     { title: 'Еда',    ico: 'food',     render: Food.render },
  body:     { title: 'Форма',  ico: 'body',     render: Body.render },
  strength: { title: 'Сила',   ico: 'strength', render: Strength.render },
  week:     { title: 'Неделя', ico: 'week',     render: Week.render },
};

/* ----------------------------------------------------------- Wake Lock */
let wakeWanted = false;
let wakeSentinel = null;

async function applyWakeLock(want, silent = false) {
  wakeWanted = want;
  if (!('wakeLock' in navigator)) {
    if (want && !silent) toast('Wake Lock не поддерживается браузером', 'warn');
    paintHeader();
    return;
  }
  try {
    if (want && !wakeSentinel) {
      wakeSentinel = await navigator.wakeLock.request('screen');
      wakeSentinel.addEventListener('release', () => {
        wakeSentinel = null;
        paintHeader();
      });
      if (!silent) toast('Экран не будет гаснуть во время отдыха', 'ok');
    } else if (!want && wakeSentinel) {
      await wakeSentinel.release();
      wakeSentinel = null;
      if (!silent) toast('Блокировка экрана разрешена', 'neutral');
    }
  } catch (e) {
    wakeSentinel = null;
  }
  paintHeader();
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && wakeWanted && !wakeSentinel) {
    applyWakeLock(true, true);
  }
});

/* ----------------------------------------------------- Methodology Sheet */
let methodIdx = 0;

function openMethodSheet() {
  openSheet(() => {
    const st = S.get();
    const P = st.profile;
    const secs = methodSections(P);
    const cur = secs[methodIdx] || secs[0];
    return `
    <div class="pt-1">
      <div class="flex items-start justify-between gap-2">
        <div>
          <div class="ref-eyebrow text-accent">МЕТОДИКА &middot; ${P.height} СМ / РАЗМАХ ${P.wingspan} СМ</div>
          <h3 class="text-[20px] font-extrabold text-white mt-1">Архитектура цикла и рычаги</h3>
        </div>
        <button class="icon-btn" data-act="sheet:close" aria-label="Закрыть">${icon('x', 20)}</button>
      </div>
      <div class="flex gap-1.5 overflow-x-auto no-scrollbar mt-3 pb-1">
        ${secs.map((s, i) => `
          <button class="chip-btn whitespace-nowrap ${i === methodIdx ? 'is-on' : ''}" data-act="app:methodTab" data-i="${i}">${s.title}</button>`).join('')}
      </div>
      <div class="prose-lab mt-3">${cur.body}</div>
      <div class="grid grid-cols-2 gap-2 mt-4">
        <button class="btn btn-ghost" data-act="app:plates">${icon('disc', 17)}<span>Калькулятор блинов</span></button>
        <button class="btn btn-primary" data-act="sheet:close">Понятно</button>
      </div>
    </div>`;
  });
}

on('app:method', () => openMethodSheet());
on('app:methodTab', (el) => { methodIdx = +el.dataset.i; refreshSheet(); });
on('app:plates', () => { closeSheet(); setTimeout(() => Gym.openPlateCalc(), 230); });
on('app:wake', () => applyWakeLock(!wakeWanted));
on('app:weekStep', (el) => {
  const d = +el.dataset.d;
  S.update(st => {
    st.ui.week = clamp((st.ui.week || 1) + d, 1, WEEKS.length);
  });
});

on('nav', (el) => {
  const tab = el.dataset.tab;
  const proto = el.dataset.proto;
  if (!VIEWS[tab]) return;
  S.update(st => {
    st.ui.tab = tab;
    if (proto) st.ui.proto = proto;
  });
  closeSheet();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ----------------------------------------------------------- Rendering */
let headerEl = null;
let mainEl = null;
let dockEl = null;

function paintHeader() {
  if (!headerEl) return;
  const st = S.get();
  const tab = st.ui.tab || 'gym';
  document.body.dataset.theme = tab;
  const wakeActive = !!(wakeSentinel || wakeWanted);

  headerEl.innerHTML = `
    <div class="max-w-[480px] mx-auto px-3.5 h-[66px] flex items-center justify-between gap-2">
      <div class="min-w-0 flex-1">
        <button class="text-left block truncate" data-act="app:method" title="Методика и биомеханика">
          <span class="brand-title">ЖЕЛЕЗНЫЙ <span class="text-accent">ДНЕВНИК</span></span>
        </button>
        <div class="flex items-center gap-2 mt-1">
          <span class="save-dot"></span>
          <span class="save-text">СОХРАНЕНО &middot; ОФЛАЙН</span>
          <button class="wake-chip ${wakeActive ? 'is-on' : ''}" data-act="app:wake" title="Удерживать экран включённым">
            ${icon(wakeActive ? 'eye' : 'eyeOff', 13)}
            <span>${wakeActive ? 'ЭКРАН ВКЛ' : 'ЭКРАН'}</span>
          </button>
        </div>
      </div>

      <div class="week-pill shrink-0">
        <button class="week-pill-arrow" data-act="app:weekStep" data-d="-1" aria-label="Предыдущая неделя">${icon('chevronLeft', 16)}</button>
        <button class="week-pill-label" data-act="nav" data-tab="week">НЕД ${st.ui.week}/${WEEKS.length}</button>
        <button class="week-pill-arrow" data-act="app:weekStep" data-d="1" aria-label="Следующая неделя">${icon('chevronRight', 16)}</button>
      </div>
    </div>`;
}

function paintDock() {
  if (!dockEl) return;
  const st = S.get();
  const cur = st.ui.tab || 'gym';
  dockEl.innerHTML = `
    <div class="dock-bar">
      ${Object.entries(VIEWS).map(([k, v]) => `
        <button class="dock-item ${cur === k ? 'is-on' : ''}" data-act="nav" data-tab="${k}" aria-current="${cur === k ? 'page' : 'false'}">
          ${icon(v.ico, 22)}
          <span>${v.title}</span>
        </button>`).join('')}
    </div>`;
}

function paintMain() {
  if (!mainEl) return;
  const st = S.get();
  const v = VIEWS[st.ui.tab] || VIEWS.gym;
  const active = document.activeElement;
  if (active && (active.tagName === 'TEXTAREA' || (active.tagName === 'INPUT' && active.type !== 'range')) && mainEl.contains(active)) {
    return;
  }
  mainEl.innerHTML = v.render(st);
}

function renderAll() {
  paintHeader();
  paintMain();
  paintDock();
  refreshSheet();
}

/* ----------------------------------------------------------- Bootstrap */
function init() {
  const st = S.load();
  st.ui.week = st.cycle.week || 1;
  st.ui.day = st.cycle.day || 1;

  headerEl = document.getElementById('appHeader');
  mainEl = document.getElementById('appMain');
  dockEl = document.getElementById('appDock');
  mountSheet(document.getElementById('sheetHost'));
  mountToast(document.getElementById('toastHost'));

  T.configure(() => ({
    sound: S.get().profile.sound,
    vibro: S.get().profile.vibro,
  }));
  T.mount(document.getElementById('timerHost'));

  S.subscribe(renderAll);
  renderAll();

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el || el.disabled) return;
    const act = el.dataset.act;
    const fn = actions[act];
    if (fn) {
      e.preventDefault();
      fn(el, e);
    }
  });

  document.addEventListener('change', (e) => {
    const el = e.target.closest('[data-change]');
    if (!el) return;
    const fn = actions[el.dataset.change];
    if (fn) fn(el, e);
  });

  document.addEventListener('input', (e) => {
    const el = e.target.closest('[data-change]');
    if (!el || el.type === 'file') return;
    const fn = actions[el.dataset.change];
    if (fn) fn(el, e);
  });

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
