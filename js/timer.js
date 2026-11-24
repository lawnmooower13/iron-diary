/* ==========================================================================
   IRON DIARY · timer.js
   Rest timer matching the reference pill design ("ОТДЫХ 2:58  [+30 с] [Стоп]")
   with bottom progress bar, expandable ring modal, Web Audio API & haptics.
   ========================================================================== */
import { fmtDuration } from './engine.js';
import { icon } from './ui.js';

const LS = 'ironDiary.timer';
let ctx = null;
let st = null;
let el = null;
let expanded = false;
let hideTO = null;
let getSettings = () => ({ sound: true, vibro: true });

/* ------------------------------------------------------------ Audio */
export function unlockAudio() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!ctx) ctx = new AC();
    if (ctx.state === 'suspended') ctx.resume();
    const b = ctx.createBuffer(1, 1, 22050);
    const s = ctx.createBufferSource();
    s.buffer = b; s.connect(ctx.destination); s.start(0);
  } catch (e) { /* audio unavailable */ }
}

function tone(freq, start, dur, gain = 0.25, type = 'sine') {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, start);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(gain, start + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g).connect(ctx.destination);
  o.start(start);
  o.stop(start + dur + 0.05);
}

export function beepTick() {
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();
  tone(1175, ctx.currentTime, 0.08, 0.12, 'triangle');
}

export function beepDone() {
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();
  const t = ctx.currentTime + 0.02;
  [[784, 0], [988, 0.16], [1319, 0.32]].forEach(([f, d]) => {
    tone(f, t + d, 0.24, 0.28, 'sine');
    tone(f * 2, t + d, 0.12, 0.05, 'triangle');
  });
  tone(1319, t + 0.58, 0.9, 0.22, 'sine');
}

export function haptic(pattern) {
  try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (e) { /* noop */ }
}

/* ------------------------------------------------------------ Engine */
export function configure(fn) { getSettings = fn; }

export function mount(node) {
  el = node;
  try {
    const saved = JSON.parse(localStorage.getItem(LS) || 'null');
    if (saved && saved.endAt && Date.now() - saved.endAt < 30000) st = saved;
    else localStorage.removeItem(LS);
  } catch (e) { localStorage.removeItem(LS); }
  el.addEventListener('click', onClick);
  setInterval(tick, 200);
  document.addEventListener('visibilitychange', tick);
  render();
}

function persist() {
  if (st) localStorage.setItem(LS, JSON.stringify(st));
  else localStorage.removeItem(LS);
}

export function start(sec, label = 'ОТДЫХ', next = '') {
  unlockAudio();
  clearTimeout(hideTO);
  st = { endAt: Date.now() + sec * 1000, total: sec * 1000, label, next, fired: false, lastTick: null };
  persist();
  render();
}

export function add(sec) {
  if (!st) return;
  const now = Date.now();
  if (st.fired) {
    if (sec <= 0) return;
    clearTimeout(hideTO);
    st.endAt = now + sec * 1000; st.total = sec * 1000; st.fired = false; st.lastTick = null;
  } else {
    st.endAt = Math.max(now + 1000, st.endAt + sec * 1000);
    st.total = Math.max(st.total + sec * 1000, st.endAt - now);
  }
  persist();
  render();
}

export function stop() {
  clearTimeout(hideTO);
  st = null; expanded = false;
  persist();
  render();
}

export const isActive = () => !!st;

function tick() {
  if (!st) return;
  const rem = st.endAt - Date.now();
  if (!st.fired) {
    if (rem <= 0) { fire(); return; }
    const s = Math.ceil(rem / 1000);
    if (s <= 3 && st.lastTick !== s && !document.hidden) {
      st.lastTick = s;
      if (getSettings().sound) beepTick();
      if (getSettings().vibro) haptic(25);
    }
  }
  paint();
}

function fire() {
  st.fired = true;
  persist();
  const S = getSettings();
  if (S.sound) beepDone();
  if (S.vibro) haptic([320, 120, 320, 120, 640]);
  render();
  hideTO = setTimeout(() => { if (st && st.fired) stop(); }, 20000);
}

/* ---------------------------------------------------------------- UI */
const R_L = 112, C_L = 2 * Math.PI * R_L;

function onClick(e) {
  const b = e.target.closest('[data-tact]');
  if (!b) return;
  e.stopPropagation();
  const a = b.dataset.tact;
  if (a === 'minus') add(-30);
  else if (a === 'plus') add(30);
  else if (a === 'stop') stop();
  else if (a === 'expand') { expanded = true; render(); }
  else if (a === 'collapse') { expanded = false; render(); }
}

function render() {
  if (!el) return;
  if (!st) {
    el.innerHTML = '';
    el.className = 'timer-host';
    document.body.classList.remove('timer-on');
    return;
  }
  document.body.classList.add('timer-on');
  el.className = 'timer-host' + (st.fired ? ' is-done' : '') + (expanded ? ' is-expanded' : '');

  if (expanded) {
    el.innerHTML = `
      <div class="t-overlay" data-tact="collapse"></div>
      <div class="t-full anim-sheet">
        <div class="flex items-center justify-between w-full mb-2">
          <span class="eyebrow t-label-js">ОТДЫХ</span>
          <button class="icon-btn" data-tact="collapse" aria-label="Свернуть">${icon('chevronDown', 20)}</button>
        </div>
        <div class="relative grid place-items-center my-2">
          <svg width="256" height="256" viewBox="0 0 256 256" class="-rotate-90">
            <circle cx="128" cy="128" r="${R_L}" class="t-track" stroke-width="7" fill="none"/>
            <circle cx="128" cy="128" r="${R_L}" class="t-prog t-prog-js" stroke-width="7" fill="none"
              stroke-dasharray="${C_L}" stroke-linecap="round"/>
          </svg>
          <div class="absolute text-center">
            <div class="t-state-js eyebrow mb-1">ОТДЫХ</div>
            <div class="font-display text-[56px] font-bold leading-none tracking-tight t-time-js">0:00</div>
          </div>
        </div>
        <div class="text-zinc-400 text-sm text-center min-h-[20px] t-next-js"></div>
        <div class="flex gap-2.5 mt-5 w-full justify-center">
          <button class="t-pill-btn" data-tact="minus">\u221230 с</button>
          <button class="t-pill-btn" data-tact="plus">+30 с</button>
          <button class="t-pill-btn t-pill-stop" data-tact="stop">Стоп</button>
        </div>
      </div>`;
  } else {
    el.innerHTML = `
      <div class="t-pill anim-rise" data-tact="expand">
        <div class="flex-1 min-w-0">
          <div class="t-eyebrow t-label-js">ОТДЫХ</div>
          <div class="t-digits t-time-js">0:00</div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button class="t-pill-btn" data-tact="plus">+30 с</button>
          <button class="t-pill-btn t-pill-stop" data-tact="stop">Стоп</button>
        </div>
        <div class="t-bar-wrap"><div class="t-bar-fill t-bar-js"></div></div>
      </div>`;
  }
  paint();
}

function paint() {
  if (!el || !st) return;
  const now = Date.now();
  const rem = st.endAt - now;
  const timeEl = el.querySelector('.t-time-js');
  const prog = el.querySelector('.t-prog-js');
  const bar = el.querySelector('.t-bar-js');
  const label = el.querySelector('.t-label-js');
  const next = el.querySelector('.t-next-js');
  const stateEl = el.querySelector('.t-state-js');
  if (label) label.textContent = st.fired ? 'ГОТОВО · К ШТАНГЕ' : 'ОТДЫХ';
  if (next) next.textContent = st.next || '';
  if (stateEl) stateEl.textContent = st.fired ? 'К ПОДХОДУ' : 'ОТДЫХ';
  if (timeEl) timeEl.textContent = st.fired ? '+' + fmtDuration(now - st.endAt) : fmtDuration(rem + 999);
  const frac = st.fired ? 1 : Math.max(0, Math.min(1, (st.total - rem) / st.total));
  if (prog) {
    prog.style.strokeDashoffset = String(C_L * (1 - frac));
  }
  if (bar) {
    bar.style.width = `${Math.round((1 - frac) * 100)}%`;
  }
}
