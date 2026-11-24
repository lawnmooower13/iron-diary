/* ==========================================================================
   IRON DIARY · store.js
   Single source of truth persisted in localStorage. Schema migration,
   subscribe/emit, JSON backup / restore.
   ========================================================================== */
import { DEFAULT_SUPPS } from './program.js';
import { dateKey } from './engine.js';

const KEY = 'ironDiary.v3';
export const SCHEMA = 3;

export function defaults() {
  return {
    schema: SCHEMA,
    createdAt: Date.now(),
    profile: {
      name: 'Атлет',
      height: 190, wingspan: 203, bw: 95, targetBw: 125,
      maxes: { sq: 190, bp: 140, dl: 200, dlSumo: 230, ohp: 85 },
      baselineHr: 58,
      bar: 20, collar: 0,
      restTop: 300, restMain: 180,
      sound: true, vibro: true, autoTimer: true,
    },
    cycle: { n: 1, week: 1, day: 1, startedAt: Date.now(), history: [] },
    ui: { tab: 'train', week: 1, day: 1, proto: 'pre' },
    adj: {},
    accW: {},
    log: {},
    protocols: {},
    readiness: {},
    nutrition: {},
    supps: DEFAULT_SUPPS.map(s => ({ ...s })),
    bodyweight: [{ date: dateKey(), kg: 95 }],
  };
}

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
function merge(base, incoming) {
  if (!isObj(base) || !isObj(incoming)) return incoming === undefined ? base : incoming;
  const out = { ...base };
  for (const k of Object.keys(incoming)) {
    out[k] = isObj(base[k]) && isObj(incoming[k]) ? merge(base[k], incoming[k]) : incoming[k];
  }
  return out;
}

let state = null;
const listeners = new Set();
let saveError = null;

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    state = raw ? merge(defaults(), JSON.parse(raw)) : defaults();
  } catch (e) {
    console.error('[store] load failed', e);
    state = defaults();
  }
  state.schema = SCHEMA;
  return state;
}

export const get = () => state;

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    saveError = null;
  } catch (e) {
    saveError = e;
    console.error('[store] save failed', e);
  }
}
export const lastSaveError = () => saveError;

export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function emit() { listeners.forEach(fn => { try { fn(state); } catch (e) { console.error(e); } }); }

/** Mutate state, persist, re-render. */
export function update(mutator, { silent = false } = {}) {
  mutator(state);
  save();
  if (!silent) emit();
}

/* ------------------------------------------------------------ Backup */
export function exportJSON() {
  const payload = {
    app: 'iron-diary',
    schema: SCHEMA,
    exportedAt: new Date().toISOString(),
    data: state,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `iron-diary-backup-${dateKey()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  return a.download;
}

export function parseBackup(text) {
  const obj = JSON.parse(text);
  const data = obj && obj.app === 'iron-diary' ? obj.data : obj;
  if (!isObj(data) || !isObj(data.profile) || !isObj(data.log)) {
    throw new Error('Файл не похож на резервную копию Iron Diary');
  }
  return { data, exportedAt: obj.exportedAt || null, sessions: Object.keys(data.log).length };
}

export function importData(data) {
  state = merge(defaults(), data);
  state.schema = SCHEMA;
  save();
  emit();
}

export function resetAll() {
  state = defaults();
  save();
  emit();
}
