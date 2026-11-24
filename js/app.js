/* ==========================================================================
   IRON DIARY · app.js
   Application shell, Wake Lock API, methodology dossier, event delegation,
   bottom dock navigation, Service Worker registration.
   ========================================================================== */
import * as S from './store.js';
import { fmtDuration, fmt } from './engine.js';
import { methodSections } from './program.js';
import {
  icon, actions, on, mountSheet, mountToast, openSheet, closeSheet, refreshSheet, toast,
} from './ui.js';
import * as T from './timer.js';
import * as Train from './views/training.js';
import * as Proto from './views/protocols.js';
import * as Cns from './views/readiness.js';
import * as Food from './views/nutrition.js';
import * as Stats from './views/analytics.js';

const VIEWS = {
  train: { title: 'Тренировка', sub: 'Тренировочный день', render: Train.render, ico: 'train' },
  proto: { title: 'Протоколы',  sub: 'Разминка и декомпрессия', render: Proto.render, ico: 'proto' },
  cns:   { title: 'ЦНС',        sub: 'Мониторинг восстановления', render: Cns.render, ico: 'cns' },
  food:  { title: 'Режим',      sub: 'Питание, вода и добавки', render: Food.render, ico: 'food' },
  stats: { title: 'Аналитика',  sub: 'Рекорды, тоннаж и бэкап', render: Stats.render, ico: 'stats' },
};

/* ----------------------------------------------------------- Wake Lock */
let wakeWanted = false;
let wakeSentinel = null;

async function applyWakeLock(want, silent = false) {
  wakeWanted = want;
  if (!('wakeLock' in navigator)) {
    if (want && !silent) toast('Wake Lock API не поддерживается браузером', 'warn');
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
      if (!silent) toast('Экран удерживается включённым', 'ice');
    } else if (!want && wakeSentinel) {
      await wakeSentinel.release();
      wakeSentinel = null;
      if (!silent) toast('Блокировка экрана разрешена', 'neutral');
    }
  } catch (e) {
    wakeSentinel = null;
    if (want && !silent) toast('Не удалось активировать Wake Lock', 'warn');
  }
  paintHeader();
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && wakeWanted && !wakeSentinel) {
    applyWakeLock(true, true);
  }
});

document.addEventListener('iron:wake', (e) => {
  applyWakeLock(!!e.detail, true);
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
          <div class="eyebrow">Методическое досье · ${P.height} см / ${fmt(P.bw, 1)} кг / размах ${P.wingspan} см</div>
          <h3 class="font-display text-[18px] tracking-tight mt-1">Архитектура цикла и биомеханика</h3>
        </div>
        <button class="icon-btn" data-act="sheet:close" aria-label="Закрыть">${icon('x', 20)}</button>
      </div>
      <div class="flex gap-1.5 overflow-x-auto no-scrollbar mt-3 pb-1">
        ${secs.map((s, i) => `
          <button class="chip-btn whitespace-nowrap ${i === methodIdx ? 'is-on' : ''}" data-act="app:methodTab" data-i="${i}">${s.title}</button>`).join('')}
      </div>
      <div class="prose-lab mt-3">${cur.body}</div>
      <button class="btn btn-primary w-full mt-5" data-act="sheet:close">Понятно</button>
    </div>`;
  });
}

on('app:method', () => openMethodSheet());
on('app:methodTab', (el) => { methodIdx = +el.dataset.i; refreshSheet(); });
on('app:plates', () => Train.openPlateCalc());
on('app:wake', () => applyWakeLock(!wakeWanted));

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
  const v = VIEWS[st.ui.tab] || VIEWS.train;
  const wakeActive = !!(wakeSentinel || wakeWanted);
  headerEl.innerHTML = `
    <div class="max-w-[480px] mx-auto px-4 h-[60px] flex items-center justify-between gap-2">
      <div class="flex items-center gap-2.5 min-w-0">
        <div class="brand-mark"><span>ID</span></div>
        <div class="min-w-0">
          <div class="flex items-center gap-1.5">
            <span class="font-display text-[13px] tracking-tight text-chrome-100">ЖЕЛЕЗНЫЙ ДНЕВНИК</span>
            <span class="offline-dot" title="Автономный режим PWA"></span>
          </div>
          <div class="text-[11px] text-chrome-500 truncate">${v.sub} · Ц${st.cycle.n}Н${st.ui.week}Д${st.ui.day}</div>
        </div>
      </div>
      <div class="flex items-center gap-1.5 shrink-0">
        <button class="hdr-btn" data-act="app:plates" aria-label="Калькулятор дисков" title="Калькулятор дисков">
          ${icon('disc', 18)}
        </button>
        <button class="hdr-btn" data-act="app:method" aria-label="Методика и анализ рычагов" title="Методика и биомеханика">
          ${icon('info', 18)}
        </button>
        <button class="hdr-btn ${wakeActive ? 'is-wake' : ''}" data-act="app:wake" aria-pressed="${wakeActive}" aria-label="Не гасить экран">
          ${icon(wakeActive ? 'eye' : 'eyeOff', 18)}
          <span class="font-mono text-[10px] hidden xs:inline">${wakeActive ? 'ЭКРАН' : 'СОН'}</span>
        </button>
      </div>
    </div>`;
}

function paintDock() {
  if (!dockEl) return;
  const st = S.get();
  const cur = st.ui.tab || 'train';
  dockEl.innerHTML = `
    <div class="dock-inner glass-strong">
      ${Object.entries(VIEWS).map(([k, v]) => `
        <button class="dock-btn ${cur === k ? 'is-on' : ''}" data-act="nav" data-tab="${k}" aria-current="${cur === k ? 'page' : 'false'}">
          ${icon(v.ico, 21)}
          <span>${v.title}</span>
        </button>`).join('')}
    </div>`;
}

function paintMain() {
  if (!mainEl) return;
  const st = S.get();
  const v = VIEWS[st.ui.tab] || VIEWS.train;
  const active = document.activeElement;
  if (active && (active.tagName === 'TEXTAREA' || active.tagName === 'INPUT') && mainEl.contains(active)) {
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

  /* Global click delegation */
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

  /* Global input / change delegation */
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

  /* Live session stopwatch ticker */
  setInterval(() => {
    const node = document.querySelector('[data-elapsed]');
    if (node) {
      const started = +node.dataset.elapsed;
      if (started) node.textContent = fmtDuration(Date.now() - started);
    }
  }, 1000);

  /* Register Service Worker for 100% offline work */
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
