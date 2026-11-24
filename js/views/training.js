/* ==========================================================================
   IRON DIARY · views/training.js — Модуль 1: тренировочный день
   ========================================================================== */
import * as S from '../store.js';
import { WEEKS, DAYS, SCHEME_LABEL } from '../program.js';
import {
  fmt, fmtInt, fmtSigned, fmtDuration, warmupPyramid, plateBreakdown, groupPlates,
  SPEED, RIR_OPTIONS, ZONES, PLATE_SPEC, roundTo,
} from '../engine.js';
import { icon, esc, on, openSheet, closeSheet, confirmSheet, toast, barbellSVG, ring } from '../ui.js';
import * as T from '../timer.js';
import {
  getSession, planFor, ensureSession, setLog, effSet, effSets, previewDelta, finishSession,
  reopenSession, sessionStats, planStats, sessionPRs, dayCompletion, COMP_LABEL,
} from '../session.js';
import { todayReadiness } from './readiness.js';

/* transient UI state */
const openWarm = new Set();
const openCue = new Set();
let fbKey = null;
let editing = null;
let calcW = 100;

const cur = (st) => ({ w: st.ui.week, d: st.ui.day });

/* ---------------------------------------------------------- helpers */
const wText = (ex, w) => (ex.bw ? 'BW' : ex.bwPlus ? (w > 0 ? '+' : '') + fmt(w) : fmt(w));
const repsText = (ex, r) => (ex.unit === 'reps' ? `\u00D7${r}` : ex.unit === 'm' ? `${r}\u2009м` : `${r}\u2009с`);
const kindTone = (ex) => (ex.kind === 'main' ? 'ice' : ex.kind === 'acc' ? (ex.tag === 'strong' ? 'steel' : 'mute') : 'steel');

function setTag(ex, i) {
  const s = ex.sets[i];
  if (s.type === 'top') return 'ТОП';
  if (s.type === 'bo') return 'B' + (i);
  return String(i + 1);
}

function exSummary(ex) {
  const s0 = ex.sets[0];
  if (ex.kind === 'acc') {
    const reps = ex.lo === ex.hi ? `${ex.hi}` : `${ex.lo}–${ex.hi}`;
    const u = ex.unit === 'reps' ? '' : ex.unit === 'm' ? ' м' : ' с';
    return `${ex.sets.length} \u00D7 ${reps}${u}${ex.perSide ? ' · на сторону' : ''}`;
  }
  if (s0.type === 'top') {
    const bo = ex.sets.filter(s => s.type === 'bo');
    return `ТОП ${s0.r} @ RIR ${s0.rir} · сброс ${Math.round(ex.drop * 100)}% · ${bo.length}\u00D7${bo[0]?.r ?? ''}`;
  }
  return `${ex.sets.length}\u00D7${s0.r} · ${Math.round((s0.p || 0) * 100)}% · RIR ${s0.rir}`;
}

function nextSetInfo(plan, sess, exId, i) {
  const exIdx = plan.findIndex(e => e.id === exId);
  for (let k = exIdx; k < plan.length; k++) {
    const ex = plan[k];
    for (let j = (k === exIdx ? 0 : 0); j < ex.sets.length; j++) {
      if (k === exIdx && j === i) continue;
      const e = effSet(sess, ex, j);
      if (e.done || e.optional) continue;
      const w = ex.bw ? 'BW' : fmt(e.w) + (ex.bwPlus ? ' доп.' : ' кг');
      return `Далее: ${k === exIdx ? setTag(ex, j) : ex.name} · ${w} ${repsText(ex, e.r)}`;
    }
  }
  return null;
}

/* ---------------------------------------------------------- blocks */
function selector(st) {
  const { w, d } = cur(st);
  const wk = WEEKS[w - 1];
  const weekBtns = WEEKS.map(x => {
    const prog = [1, 2, 3, 4].reduce((a, dd) => a + dayCompletion(st, x.n, dd), 0) / 4;
    const isPtr = st.cycle.week === x.n;
    return `
    <button class="wk ${x.n === w ? 'is-on' : ''}" data-act="tr:week" data-w="${x.n}" aria-label="Неделя ${x.n}">
      <span class="font-mono text-[15px] leading-none">${x.n}</span>
      <span class="wk-lbl">${x.short}</span>
      <span class="wk-bar"><i style="width:${Math.round(prog * 100)}%"></i></span>
      ${isPtr ? '<span class="wk-dot"></span>' : ''}
    </button>`;
  }).join('');
  const dayBtns = DAYS.map(x => {
    const c = dayCompletion(st, w, x.n);
    const isPtr = st.cycle.week === w && st.cycle.day === x.n;
    return `
    <button class="day-btn ${x.n === d ? 'is-on' : ''}" data-act="tr:day" data-d="${x.n}">
      <span class="flex items-center justify-between w-full">
        <span class="eyebrow ${x.n === d ? 'text-chrome-100' : ''}">${x.dow}</span>
        <span class="day-ring">${c >= 1 ? `<span class="text-ok">${icon('check', 14)}</span>` : ring(c, { size: 16, stroke: 2.2 })}</span>
      </span>
      <span class="text-[11px] leading-tight text-left mt-1.5 ${x.n === d ? 'text-chrome-200' : 'text-chrome-500'}">${x.title(w)}</span>
      ${isPtr ? '<span class="day-ptr">ТЕКУЩИЙ</span>' : ''}
    </button>`;
  }).join('');
  return `
  <section class="glass card p-3">
    <div class="flex items-center justify-between px-1 pt-0.5">
      <div>
        <div class="eyebrow">Цикл ${st.cycle.n} · ${wk.wave ? 'Волна ' + wk.wave : 'Финиш цикла'}</div>
        <div class="font-display text-[15px] mt-1 tracking-tight">Неделя ${w} · ${wk.phase}</div>
      </div>
      <span class="tag tag-${wk.wave ? 'steel' : 'warn'}">${wk.short}</span>
    </div>
    <div class="week-strip mt-3">${weekBtns}</div>
    <div class="grid grid-cols-4 gap-1.5 mt-2">${dayBtns}</div>
    <p class="text-[12px] text-chrome-500 mt-3 px-1 leading-relaxed">${wk.note}</p>
  </section>`;
}

function readinessBanner(st, sess, plan) {
  if (sess?.finishedAt) return '';
  const R = todayReadiness(st);
  if (!R) {
    return `
    <button class="glass card p-3.5 w-full flex items-center gap-3 text-left" data-act="nav" data-tab="cns">
      <span class="metric-ico">${icon('cns', 18)}</span>
      <span class="flex-1">
        <span class="block text-[13px] text-chrome-200">Готовность ЦНС не замерена</span>
        <span class="block text-[11.5px] text-chrome-500 mt-0.5">Сон, пульс покоя и DOMS — 20 секунд до первого подхода</span>
      </span>
      <span class="text-chrome-500">${icon('chevronRight', 18)}</span>
    </button>`;
  }
  const Z = ZONES[R.zone];
  const heavyPull = plan.some(e => (e.id === 'dl' || e.id === 'dl_block') && e.sets[0]?.type === 'top');
  const mod = sess?.mod || 0;
  let action = '';
  if (Z.mod < 0) {
    action = mod === Z.mod
      ? `<button class="btn btn-ghost btn-sm" data-act="tr:mod" data-v="0">Коррекция ${fmt(Z.mod * 100, 1)}% · отменить</button>`
      : `<button class="btn btn-sm btn-${Z.tone}" data-act="tr:mod" data-v="${Z.mod}">Применить ${fmt(Z.mod * 100, 1)}%</button>`;
  } else if (mod < 0) {
    action = `<button class="btn btn-ghost btn-sm" data-act="tr:mod" data-v="0">Снять коррекцию ${fmt(mod * 100, 1)}%</button>`;
  }
  return `
  <section class="glass card p-4 zone-${Z.tone}">
    <div class="flex items-center gap-3">
      <div class="font-mono text-[30px] leading-none w-12">${R.score}</div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2"><span class="tag tag-${Z.tone}">${Z.label}</span><span class="text-[13px] text-chrome-200 truncate">${Z.title}</span></div>
        <p class="text-[12px] text-chrome-400 mt-1.5 leading-snug">${Z.text}</p>
      </div>
    </div>
    ${R.zone === 'red' && heavyPull ? `<div class="flag flag-crit mt-3"><span class="flag-bar"></span><span>В плане тяжёлая тяга. Рекомендация: перенести день или выполнить технично с коррекцией −15%.</span></div>` : ''}
    ${action ? `<div class="mt-3 flex justify-end">${action}</div>` : ''}
  </section>`;
}

function dayHeader(st, sess, plan, w, d) {
  const day = DAYS[d - 1];
  const stats = sess ? sessionStats(sess) : null;
  const ps = planStats(plan);
  const done = stats?.done || 0;
  const total = stats?.total || ps.sets;
  const frac = total ? done / total : 0;
  const ton = stats && stats.done ? stats.tonnage : ps.tonnage;
  let timeTile;
  if (sess?.finishedAt) timeTile = `<span class="font-mono text-[17px]">${fmtDuration(sess.finishedAt - sess.startedAt)}</span>`;
  else if (sess?.startedAt) timeTile = `<span class="font-mono text-[17px] text-ice" data-elapsed="${sess.startedAt}">${fmtDuration(Date.now() - sess.startedAt)}</span>`;
  else timeTile = `<span class="font-mono text-[17px] text-chrome-500">—</span>`;

  let cta;
  if (sess?.finishedAt) {
    cta = `<div class="flex items-center gap-2">
      <div class="flex-1 done-strip">${icon('check', 16)}<span>Тренировка закрыта</span></div>
      <button class="btn btn-ghost btn-sm" data-act="tr:reopen">${icon('reset', 16)}<span>Открыть</span></button></div>`;
  } else if (sess?.startedAt) {
    cta = `<button class="btn btn-primary w-full" data-act="tr:finish">${icon('flag', 18)}<span>Завершить тренировку</span></button>`;
  } else {
    cta = `<button class="btn btn-primary w-full" data-act="tr:start">${icon('play', 16)}<span>Начать тренировку</span></button>`;
  }
  return `
  <section class="glass card p-4">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <div class="eyebrow">День ${d} · ${day.dow}${sess?.mod ? ` · <span class="text-warn">коррекция ${fmt(sess.mod * 100, 1)}%</span>` : ''}</div>
        <h2 class="font-display text-[22px] leading-tight mt-1.5 tracking-tight">${day.title(w)}</h2>
        <p class="text-chrome-400 text-[12.5px] mt-1.5 leading-snug">${day.focus}</p>
      </div>
      <div class="relative shrink-0 grid place-items-center">
        ${ring(frac, { size: 58, stroke: 4, color: frac >= 1 ? 'var(--ok)' : 'var(--ice)' })}
        <span class="absolute font-mono text-[12px]">${Math.round(frac * 100)}%</span>
      </div>
    </div>
    <div class="grid grid-cols-3 gap-2 mt-4">
      <div class="tile"><span class="eyebrow">Подходы</span><span class="font-mono text-[17px]">${done}<span class="text-chrome-500">/${total}</span></span></div>
      <div class="tile"><span class="eyebrow">${stats && stats.done ? 'Тоннаж' : 'План, кг'}</span><span class="font-mono text-[17px]">${fmtInt(ton)}</span></div>
      <div class="tile"><span class="eyebrow">Время</span>${timeTile}</div>
    </div>
    <div class="mt-3">${cta}</div>
  </section>`;
}

function warmBlock(st, sess, ex, sets) {
  if (ex.kind === 'acc' || !ex.bar) return '';
  const target = sets[0].w;
  const warm = warmupPyramid(target, { bar: st.profile.bar, pull: ex.pull });
  if (!warm.length) return '';
  const open = openWarm.has(ex.id);
  const doneArr = sess?.warm?.[ex.id] || [];
  const doneN = warm.filter((_, j) => doneArr[j]).length;
  const rows = open ? `
    <div class="warm-list anim-expand">
      ${warm.map((x, j) => {
        const pb = plateBreakdown(x.w, st.profile.bar, st.profile.collar);
        const pl = pb.plates.length ? pb.plates.map(p => fmt(p)).join(' · ') : 'без дисков';
        return `
        <button class="warm-row ${doneArr[j] ? 'is-done' : ''}" data-act="tr:warmcheck" data-ex="${ex.id}" data-j="${j}">
          <span class="font-mono text-[15px] w-[54px] text-left">${fmt(x.w)}</span>
          <span class="font-mono text-[13px] text-chrome-400 w-[30px] text-left">\u00D7${x.r}</span>
          <span class="flex-1 min-w-0 text-left">
            <span class="block text-[11px] text-chrome-500">${x.p ? Math.round(x.p * 100) + '% от рабочего' : x.note}</span>
            <span class="block text-[10.5px] text-chrome-600 font-mono truncate">${pl}</span>
          </span>
          <span class="mini-check">${icon('check', 14)}</span>
        </button>`;
      }).join('')}
    </div>` : '';
  return `
  <div class="warm">
    <button class="warm-toggle" data-act="tr:warm" data-ex="${ex.id}" aria-expanded="${open}">
      <span class="eyebrow">Разминка</span>
      <span class="text-[12px] text-chrome-400 flex-1 text-left">${warm.length} подх. до ${fmt(target)} кг</span>
      <span class="font-mono text-[11px] text-chrome-500">${doneN}/${warm.length}</span>
      <span class="chev ${open ? 'is-open' : ''}">${icon('chevronDown', 16)}</span>
    </button>
    ${rows}
  </div>`;
}

function setRow(st, sess, ex, s, i) {
  const key = `${ex.id}:${i}`;
  const needRir = s.done && s.rir == null;
  const needSpeed = s.done && ex.kind !== 'acc' && s.speed == null;
  const showFb = s.done && (fbKey === key || needRir || needSpeed) && !sess?.finishedAt;
  let meta;
  if (s.done && (s.rir != null || s.speed)) {
    meta = `<button class="set-meta" data-act="tr:fb" data-key="${key}">
      ${s.rir != null ? `<span class="font-mono">RIR ${s.rir === 3 ? '3+' : s.rir}</span>` : ''}
      ${s.speed ? `<span class="speed-${s.speed}">${SPEED[s.speed].label}</span>` : ''}</button>`;
  } else if (s.optional) {
    meta = `<span class="set-meta"><span class="text-warn">ОПЦ.</span><span>можно пропустить</span></span>`;
  } else {
    meta = `<span class="set-meta"><span class="font-mono">RIR ${s.targetRir}</span><span>${s.type === 'top' ? `отдых ${Math.round(s.rest / 60)}′` : 'цель'}</span></span>`;
  }
  const fb = showFb ? `
    <div class="fb-panel anim-expand">
      <div class="fb-row">
        <span class="fb-lbl">RIR</span>
        <div class="seg seg-4 flex-1">
          ${RIR_OPTIONS.map(v => `<button class="seg-btn ${s.rir === v ? 'is-on' : ''}" data-act="tr:rir" data-key="${key}" data-v="${v}">${v === 3 ? '3+' : v}</button>`).join('')}
        </div>
      </div>
      ${ex.kind !== 'acc' ? `
      <div class="fb-row">
        <span class="fb-lbl">Темп</span>
        <div class="seg seg-3 flex-1">
          ${Object.entries(SPEED).map(([k, v]) => `<button class="seg-btn seg-speed-${k} ${s.speed === k ? 'is-on' : ''}" data-act="tr:speed" data-key="${key}" data-v="${k}">${v.label}</button>`).join('')}
        </div>
      </div>` : ''}
    </div>` : '';
  return `
  <div class="set-row ${s.done ? 'is-done' : ''} ${s.type === 'top' ? 'is-top' : ''} ${s.optional ? 'is-optional' : ''}">
    <span class="set-tag">${setTag(ex, i)}</span>
    <button class="set-weight" data-act="tr:edit" data-key="${key}" aria-label="Вес и калькулятор дисков">
      <span class="font-mono text-[21px] leading-none">${wText(ex, s.w)}</span>
      ${ex.bw ? '' : '<span class="text-[10px] text-chrome-500 ml-0.5 self-end mb-[2px]">кг</span>'}
      ${ex.bar ? `<span class="plate-ico">${icon('disc', 15)}</span>` : ''}
    </button>
    <button class="set-reps font-mono" data-act="tr:edit" data-key="${key}" aria-label="Повторения">${repsText(ex, s.r)}</button>
    ${meta}
    <button class="set-check" data-act="tr:toggle" data-key="${key}" aria-pressed="${s.done}" aria-label="Подход выполнен">${icon('check', 22)}</button>
  </div>
  ${fb}`;
}

function forecast(st, sess, ex) {
  if (sess?.finishedAt) {
    if (ex.kind === 'acc') {
      const a = sess.accApplied?.[ex.id];
      if (!a) return '';
      const txt = a.verdict === 'up' ? `следующая: ${fmt(a.to)} кг` : a.verdict === 'down' ? `снижено до ${fmt(a.to)} кг` : a.verdict === 'harder' ? 'усложнить вариант' : 'вес сохранён';
      return footer(a.verdict, txt, 'Прогрессия');
    }
    const dlt = sess.applied?.[ex.id];
    if (dlt == null) return '';
    return footer(dlt > 0 ? 'up' : dlt < 0 ? 'down' : 'hold', dlt ? `${fmtSigned(dlt)} кг применено` : 'вес удержан', 'Авторегуляция');
  }
  const r = previewDelta(st, sess, ex);
  if (r.verdict === 'nodata') return '';
  if (ex.kind === 'acc') {
    const txt = r.verdict === 'up' ? `в следующий раз ${fmt(r.w)} кг` : r.verdict === 'down' ? `снизить до ${fmt(r.w)} кг` : r.verdict === 'harder' ? 'диапазон закрыт — усложни вариант' : 'держать вес';
    return footer(r.verdict, txt, 'Прогрессия');
  }
  const txt = r.delta ? `${fmtSigned(r.delta)} кг на следующую` : 'держать вес';
  return footer(r.verdict, txt, 'Авторегуляция');
}
function footer(verdict, txt, lbl) {
  const ic = verdict === 'up' || verdict === 'harder' ? 'arrowUp' : verdict === 'down' ? 'arrowDown' : 'equal';
  return `<div class="forecast v-${verdict}"><span class="eyebrow">${lbl}</span><span class="flex items-center gap-1.5 font-mono text-[12.5px]">${icon(ic, 14)}${txt}</span></div>`;
}

function exerciseCard(st, sess, ex, idx) {
  const sets = effSets(sess, ex);
  const counted = sets.filter(s => !s.optional || s.done);
  const doneN = counted.filter(s => s.done).length;
  const complete = doneN === counted.length && counted.length > 0;
  const label = ex.kind === 'acc' ? SCHEME_LABEL[ex.tag] : SCHEME_LABEL[ex.kind];
  const cueOpen = openCue.has(ex.id);
  return `
  <article class="glass card ex-card ${complete ? 'is-complete' : ''}" id="ex-${ex.id}">
    <header class="flex gap-3 px-4 pt-4 pb-2.5">
      <div class="ex-idx font-mono">${String(idx + 1).padStart(2, '0')}</div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-1.5 flex-wrap">
          <span class="tag tag-${kindTone(ex)}">${label}</span>
          ${ex.test ? '<span class="tag tag-warn">КОНТРОЛЬ</span>' : ''}
          ${ex.pull ? '<span class="tag tag-mute">ТЯГА</span>' : ''}
        </div>
        <h3 class="font-display text-[15px] leading-snug mt-2 tracking-tight">${ex.name}</h3>
        <p class="text-[12px] text-chrome-500 mt-0.5">${ex.sub}</p>
        <p class="text-[11px] text-chrome-400 font-mono mt-1.5">${exSummary(ex)}</p>
      </div>
      <div class="flex flex-col items-end gap-1 shrink-0">
        <span class="font-mono text-[13px] ${complete ? 'text-ok' : 'text-chrome-300'}">${doneN}/${counted.length}</span>
        <button class="icon-btn ${cueOpen ? 'is-on' : ''}" data-act="tr:cue" data-ex="${ex.id}" aria-label="Техника выполнения">${icon('info', 18)}</button>
      </div>
    </header>
    ${cueOpen ? `<div class="cue anim-expand">${ex.cue}</div>` : ''}
    ${warmBlock(st, sess, ex, sets)}
    <div class="sets">${sets.map((s, i) => setRow(st, sess, ex, s, i)).join('')}</div>
    ${forecast(st, sess, ex)}
  </article>`;
}

function footerBlock(st, sess) {
  return `
  <section class="glass card p-4">
    <label class="eyebrow" for="sessNote">Заметки к тренировке</label>
    <textarea id="sessNote" class="field mt-2" rows="3" data-change="tr:note" placeholder="Техника, самочувствие, что изменить в следующий раз">${esc(sess?.note || '')}</textarea>
    ${sess?.startedAt && !sess.finishedAt ? `<button class="btn btn-primary w-full mt-3" data-act="tr:finish">${icon('flag', 18)}<span>Завершить и применить авторегуляцию</span></button>` : ''}
    <button class="btn btn-ghost w-full mt-2" data-act="nav" data-tab="proto">${icon('proto', 18)}<span>Протокол разминки и заминки</span></button>
  </section>`;
}

function cycleBanner(st) {
  if (!st.cycle.complete) return '';
  return `
  <button class="glass card p-4 w-full text-left zone-warn flex items-center gap-3" data-act="nav" data-tab="stats">
    <span class="metric-ico">${icon('trophy', 18)}</span>
    <span class="flex-1"><span class="block text-[13px] text-chrome-100">Цикл ${st.cycle.n} завершён</span>
    <span class="block text-[12px] text-chrome-400 mt-0.5">Пересчитайте максимумы по e1RM и запустите следующий цикл в Аналитике</span></span>
    <span class="text-chrome-500">${icon('chevronRight', 18)}</span>
  </button>`;
}

export function render(st) {
  const { w, d } = cur(st);
  const sess = getSession(st, w, d);
  const plan = planFor(st, w, d);
  return `
    ${cycleBanner(st)}
    ${selector(st)}
    ${readinessBanner(st, sess, plan)}
    ${dayHeader(st, sess, plan, w, d)}
    ${plan.map((ex, i) => exerciseCard(st, sess, ex, i)).join('')}
    ${footerBlock(st, sess)}`;
}

/* ---------------------------------------------------------- actions */
function parseKey(key) { const [ex, i] = key.split(':'); return { exId: ex, i: +i }; }
const vibro = (p) => { if (S.get().profile.vibro) T.haptic(p); };

on('tr:week', (el) => S.update(st => { st.ui.week = +el.dataset.w; }));
on('tr:day', (el) => S.update(st => { st.ui.day = +el.dataset.d; }));
on('tr:cue', (el) => { const id = el.dataset.ex; openCue.has(id) ? openCue.delete(id) : openCue.add(id); S.update(() => {}); });
on('tr:warm', (el) => { const id = el.dataset.ex; openWarm.has(id) ? openWarm.delete(id) : openWarm.add(id); S.update(() => {}); });
on('tr:fb', (el) => { fbKey = fbKey === el.dataset.key ? null : el.dataset.key; S.update(() => {}); });

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

on('tr:start', () => {
  S.update(st => {
    const { w, d } = cur(st);
    const sess = ensureSession(st, w, d);
    sess.startedAt = Date.now();
  });
  document.dispatchEvent(new CustomEvent('iron:wake', { detail: true }));
  T.unlockAudio();
  toast('Сессия запущена. Экран не погаснет', 'ice');
});

on('tr:toggle', (el) => {
  const { exId, i } = parseKey(el.dataset.key);
  let timer = null, finished = false, allDone = false;
  S.update(st => {
    const { w, d } = cur(st);
    const sess = ensureSession(st, w, d);
    if (sess.finishedAt) { finished = true; return; }
    if (!sess.startedAt) sess.startedAt = Date.now();
    const ex = sess.plan.find(e => e.id === exId);
    const e = effSet(sess, ex, i);
    const L = setLog(sess, exId, i);
    if (!e.done) {
      L.done = true; L.at = Date.now(); L.w = e.w; L.r = e.r;
      fbKey = `${exId}:${i}`;
      const next = nextSetInfo(sess.plan, sess, exId, i);
      if (next) timer = { sec: e.rest, label: `${e.type === 'top' ? 'Топ-сет' : 'Отдых'} · ${ex.name}`, next };
      else allDone = true;
    } else {
      L.done = false;
      if (fbKey === `${exId}:${i}`) fbKey = null;
    }
  });
  if (finished) { toast('Тренировка закрыта. Нажмите «Открыть», чтобы изменить', 'warn'); return; }
  vibro(14);
  T.unlockAudio();
  if (timer && S.get().profile.autoTimer) T.start(timer.sec, timer.label, timer.next);
  if (allDone) toast('Все подходы выполнены. Заминка и завершение', 'ok');
});

function setFeedback(key, field, value) {
  const { exId, i } = parseKey(key);
  S.update(st => {
    const { w, d } = cur(st);
    const sess = getSession(st, w, d);
    if (!sess) return;
    const L = setLog(sess, exId, i);
    L[field] = L[field] === value ? null : value;
    const ex = sess.plan.find(e => e.id === exId);
    const complete = L.rir != null && (ex.kind === 'acc' || L.speed != null);
    if (complete && fbKey === key) fbKey = null;
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

on('tr:note', (el) => S.update(st => {
  const { w, d } = cur(st);
  const sess = ensureSession(st, w, d);
  sess.note = el.value.slice(0, 2000);
}, { silent: true }));

on('tr:finish', async () => {
  const st0 = S.get();
  const { w, d } = cur(st0);
  const sess0 = getSession(st0, w, d);
  if (!sess0) return;
  const x = sessionStats(sess0);
  if (x.done < x.total) {
    const ok = await confirmSheet({
      title: 'Завершить тренировку?',
      text: `Выполнено ${x.done} из ${x.total} подходов. Невыполненные подходы не влияют на авторегуляцию.`,
      ok: 'Завершить',
    });
    if (!ok) return;
  }
  let result = null, prs = [];
  S.update(st => {
    const sess = getSession(st, w, d);
    prs = sessionPRs(st, sess);
    result = finishSession(st, sess);
  });
  T.stop();
  vibro([40, 60, 40]);
  openSummary(w, d, result, prs);
});

on('tr:reopen', async () => {
  const ok = await confirmSheet({
    title: 'Открыть тренировку заново?',
    text: 'Применённые корректировки весов будут отменены и пересчитаны при повторном завершении.',
    ok: 'Открыть',
  });
  if (!ok) return;
  S.update(st => { const { w, d } = cur(st); reopenSession(st, getSession(st, w, d)); });
});

on('tr:goPointer', () => {
  S.update(st => { st.ui.week = st.cycle.week; st.ui.day = st.cycle.day; st.ui.tab = 'train'; });
  closeSheet();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ---------------------------------------------------------- summary */
function openSummary(w, d, result, prs) {
  openSheet(() => {
    const st = S.get();
    const sess = getSession(st, w, d);
    const x = sessionStats(sess);
    const adj = Object.entries(result?.applied || {});
    const acc = Object.entries(result?.accApplied || {}).filter(([, a]) => a.verdict === 'up' || a.verdict === 'down');
    const name = (id) => sess.plan.find(e => e.id === id)?.name || id;
    return `
    <div class="pt-1">
      <div class="eyebrow">Неделя ${w} · День ${d}</div>
      <h3 class="font-display text-[22px] tracking-tight mt-1.5">Тренировка закрыта</h3>
      <div class="grid grid-cols-3 gap-2 mt-4">
        <div class="tile"><span class="eyebrow">Время</span><span class="font-mono text-[17px]">${fmtDuration(sess.finishedAt - sess.startedAt)}</span></div>
        <div class="tile"><span class="eyebrow">Тоннаж</span><span class="font-mono text-[17px]">${fmtInt(x.tonnage)}</span></div>
        <div class="tile"><span class="eyebrow">Повторы</span><span class="font-mono text-[17px]">${x.reps}</span></div>
      </div>
      ${prs.length ? `
      <div class="mt-5">
        <div class="eyebrow mb-2">Новые рекорды e1RM</div>
        ${prs.map(p => `<div class="pr-row"><span class="text-ice">${icon('trophy', 18)}</span><span class="flex-1 text-[13px]">${COMP_LABEL[p.lift]}</span><span class="font-mono text-[15px]">${fmt(p.v, 1)}</span><span class="font-mono text-[11px] text-ok">+${fmt(p.v - p.prev, 1)}</span></div>`).join('')}
      </div>` : ''}
      <div class="mt-5">
        <div class="eyebrow mb-2">Авторегуляция на следующую сессию</div>
        ${adj.length ? adj.map(([id, dl]) => `
          <div class="adj-row"><span class="flex-1 text-[13px] text-chrome-200">${name(id)}</span>
          <span class="font-mono text-[13px] ${dl > 0 ? 'text-ok' : dl < 0 ? 'text-warn' : 'text-chrome-400'}">${dl ? fmtSigned(dl) + ' кг' : 'держать'}</span></div>`).join('')
        : '<p class="text-[12.5px] text-chrome-500">Нет оценок RIR и темпа — веса сохранены.</p>'}
        ${acc.map(([id, a]) => `
          <div class="adj-row"><span class="flex-1 text-[13px] text-chrome-200">${name(id)}</span>
          <span class="font-mono text-[13px] ${a.verdict === 'up' ? 'text-ok' : 'text-warn'}">${fmt(a.to)} кг</span></div>`).join('')}
      </div>
      <div class="grid gap-2 mt-6">
        <button class="btn btn-ghost" data-act="nav" data-tab="proto" data-proto="post">${icon('proto', 18)}<span>Декомпрессия после тренировки</span></button>
        <button class="btn btn-primary" data-act="tr:goPointer">${icon('chevronRight', 18)}<span>К следующей тренировке</span></button>
      </div>
    </div>`;
  }, { static: true });
}

/* ---------------------------------------------------------- set editor */
function editorCtx() {
  const st = S.get();
  const { w, d } = cur(st);
  const sess = getSession(st, w, d);
  const plan = sess?.plan || planFor(st, w, d);
  const ex = plan.find(e => e.id === editing.exId);
  return { st, sess, ex, s: ex ? effSet(sess, ex, editing.i) : null };
}

function plateBlock(st, weight) {
  const P = st.profile;
  const pb = plateBreakdown(weight, P.bar, P.collar);
  const groups = groupPlates(pb.plates);
  return `
    <div class="plate-stage mt-3">
      ${barbellSVG(pb.plates, { collar: P.collar > 0 })}
    </div>
    <div class="flex items-center justify-between mt-3">
      <span class="eyebrow">На каждую сторону</span>
      <span class="font-mono text-[12px] text-chrome-400">${fmt(pb.perSide)} кг</span>
    </div>
    <div class="flex flex-wrap gap-1.5 mt-2 min-h-[38px]">
      ${pb.underBar ? `<span class="text-[12.5px] text-warn">Вес меньше грифа${P.collar ? ' с замками' : ''}</span>` :
        groups.length ? groups.map(g => `
        <span class="plate-chip"><span class="plate-dot" style="background:${PLATE_SPEC[g.w].fill}"></span>
        <span class="font-mono text-[14px]">${fmt(g.w)}</span><span class="font-mono text-[11px] text-chrome-500">\u00D7${g.n}</span></span>`).join('')
        : '<span class="text-[12.5px] text-chrome-500">Только гриф</span>'}
    </div>
    ${pb.remainder > 0 ? `<p class="text-[12px] text-warn mt-2">Точно не собрать: не хватает ${fmt(pb.remainder * 2)} кг. Ближайший вес — ${fmt(pb.achieved)} кг.</p>` : ''}
    <div class="grid grid-cols-2 gap-2 mt-3">
      <button class="opt-btn" data-act="ed:bar"><span class="eyebrow">Гриф</span><span class="font-mono text-[14px]">${P.bar} кг</span></button>
      <button class="opt-btn ${P.collar ? 'is-on' : ''}" data-act="ed:collar"><span class="eyebrow">Замки</span><span class="font-mono text-[14px]">${P.collar ? '2 × 2,5 кг' : 'нет'}</span></button>
    </div>`;
}

function renderEditor() {
  const { st, ex, s, sess } = editorCtx();
  if (!ex || !s) return '<p class="text-chrome-500">Подход не найден</p>';
  const stepA = ex.kind === 'acc' ? (ex.step || 2.5) : 2.5;
  const stepB = stepA * 2;
  const locked = !!sess?.finishedAt;
  return `
  <div class="pt-1">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <div class="eyebrow">${setTag(ex, editing.i) === 'ТОП' ? 'Топ-сет' : 'Подход ' + setTag(ex, editing.i)} · план ${wText(ex, ex.sets[editing.i].w)}${ex.bw ? '' : ' кг'} ${repsText(ex, ex.sets[editing.i].r)}</div>
        <h3 class="font-display text-[17px] tracking-tight mt-1.5 leading-snug">${ex.name}</h3>
      </div>
      <button class="icon-btn" data-act="sheet:close" aria-label="Закрыть">${icon('x', 20)}</button>
    </div>
    ${ex.bw ? '' : `
    <div class="flex items-end justify-center gap-2 mt-5">
      <span class="font-mono text-[56px] leading-none tracking-tight">${wText(ex, s.w)}</span>
      <span class="text-chrome-500 mb-2">кг${ex.perSide ? ' / рука' : ''}</span>
    </div>
    <div class="grid grid-cols-4 gap-2 mt-4">
      <button class="step-lg" data-act="ed:w" data-d="${-stepB}" ${locked ? 'disabled' : ''}>\u2212${fmt(stepB)}</button>
      <button class="step-lg" data-act="ed:w" data-d="${-stepA}" ${locked ? 'disabled' : ''}>\u2212${fmt(stepA)}</button>
      <button class="step-lg" data-act="ed:w" data-d="${stepA}" ${locked ? 'disabled' : ''}>+${fmt(stepA)}</button>
      <button class="step-lg" data-act="ed:w" data-d="${stepB}" ${locked ? 'disabled' : ''}>+${fmt(stepB)}</button>
    </div>
    ${ex.bar ? plateBlock(st, s.w) : ''}`}
    <div class="metric-row mt-4">
      <span class="text-[13px] text-chrome-300">${ex.unit === 'reps' ? 'Повторения' : ex.unit === 'm' ? 'Дистанция, м' : 'Время, с'}</span>
      <div class="flex items-center gap-1.5">
        <button class="step-btn" data-act="ed:r" data-d="${ex.unit === 'reps' ? -1 : -5}" ${locked ? 'disabled' : ''}>${icon('minus', 18)}</button>
        <span class="font-mono text-[24px] w-[60px] text-center">${s.r}</span>
        <button class="step-btn" data-act="ed:r" data-d="${ex.unit === 'reps' ? 1 : 5}" ${locked ? 'disabled' : ''}>${icon('plus', 18)}</button>
      </div>
    </div>
    ${locked ? '<p class="text-[12px] text-warn mt-3">Тренировка закрыта — изменения недоступны.</p>' : `<p class="text-[11.5px] text-chrome-500 mt-3 leading-relaxed">Изменение веса переносится на следующие невыполненные подходы этого упражнения.${s.type === 'top' ? ' Back-off пересчитываются от фактического топ-сета автоматически.' : ''}</p>`}
    <div class="grid grid-cols-2 gap-2 mt-5">
      <button class="btn btn-ghost" data-act="ed:reset" ${locked ? 'disabled' : ''}>${icon('reset', 16)}<span>К плану</span></button>
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
    if (sess.finishedAt) return;
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
    const type = ex.sets[i].type;
    for (let j = i + 1; j < ex.sets.length; j++) {
      const Lj = setLog(sess, ex.id, j);
      if (ex.sets[j].type === type && !Lj.done) delete Lj.w;
    }
  });
});

on('ed:bar', () => S.update(st => { st.profile.bar = st.profile.bar === 20 ? 15 : 20; }));
on('ed:collar', () => S.update(st => { st.profile.collar = st.profile.collar ? 0 : 2.5; }));

/* ---------------------------------------------------------- free plate calculator */
function renderCalc() {
  const st = S.get();
  return `
  <div class="pt-1">
    <div class="flex items-start justify-between">
      <div><div class="eyebrow">Калькулятор дисков</div><h3 class="font-display text-[17px] tracking-tight mt-1.5">Загрузка грифа</h3></div>
      <button class="icon-btn" data-act="sheet:close" aria-label="Закрыть">${icon('x', 20)}</button>
    </div>
    <div class="flex items-end justify-center gap-2 mt-5">
      <span class="font-mono text-[56px] leading-none tracking-tight">${fmt(calcW)}</span><span class="text-chrome-500 mb-2">кг</span>
    </div>
    <div class="grid grid-cols-4 gap-2 mt-4">
      ${[-10, -2.5, 2.5, 10].map(v => `<button class="step-lg" data-act="calc:w" data-d="${v}">${v > 0 ? '+' : '\u2212'}${fmt(Math.abs(v))}</button>`).join('')}
    </div>
    <div class="grid grid-cols-6 gap-1.5 mt-2">
      ${[60, 100, 140, 180, 200, 250].map(v => `<button class="chip-btn ${calcW === v ? 'is-on' : ''}" data-act="calc:set" data-v="${v}">${v}</button>`).join('')}
    </div>
    ${plateBlock(st, calcW)}
  </div>`;
}
export function openPlateCalc() { openSheet(renderCalc); }
on('calc:w', (el) => { calcW = Math.max(0, Math.min(500, roundTo(calcW + +el.dataset.d, 1.25))); S.update(() => {}); vibro(6); });
on('calc:set', (el) => { calcW = +el.dataset.v; S.update(() => {}); });
