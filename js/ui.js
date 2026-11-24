/* ==========================================================================
   IRON DIARY · ui.js
   Icons, escaping, action registry, bottom sheets, confirm, toast,
   barbell SVG renderer, small chart primitives.
   ========================================================================== */
import { PLATE_SPEC, fmt } from './engine.js';

/* ------------------------------------------------------------ Icons */
const P = {
  train: '<path d="M3 9v6M6 6.5v11M18 6.5v11M21 9v6M6 12h12"/>',
  proto: '<path d="M10 6h10M10 12h10M10 18h10"/><path d="M3.5 6l1.4 1.4L7.5 4.8M3.5 12l1.4 1.4 2.6-2.6M3.5 18l1.4 1.4 2.6-2.6"/>',
  cns: '<path d="M2 12h4.2l2.4-6 4.6 12 2.6-6H22"/>',
  food: '<path d="M12 3.5c3.3 3.9 6 7.4 6 10.6a6 6 0 0 1-12 0c0-3.2 2.7-6.7 6-10.6z"/><path d="M9.2 14.5a2.9 2.9 0 0 0 2.6 2.6"/>',
  stats: '<path d="M4 20v-7M10 20V5M16 20v-10M21.5 20h-19"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.6v.2"/>',
  eye: '<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3"/><path d="M4 4l16 16"/>',
  check: '<path d="M5 12.5l4.2 4.2L19 7"/>',
  chevronDown: '<path d="M6 9l6 6 6-6"/>',
  chevronLeft: '<path d="M15 6l-6 6 6 6"/>',
  chevronRight: '<path d="M9 6l6 6-6 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  timer: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 10v3.5l2.4 2.4M9.5 2.8h5"/>',
  download: '<path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/>',
  upload: '<path d="M12 20V9M7 13.5l5-5 5 5M5 4h14"/>',
  trash: '<path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13"/>',
  disc: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="2.2"/><path d="M12 3.5v3M12 17.5v3"/>',
  reset: '<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4.5 4.5v4h4"/>',
  play: '<path d="M8 5.5v13l10-6.5z"/>',
  pencil: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0V4z"/><path d="M8 5.5H4.5v1.2A3.3 3.3 0 0 0 8 10M16 5.5h3.5v1.2A3.3 3.3 0 0 1 16 10M12 13v4M8.5 20h7M9.8 17h4.4"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z"/>',
  scale: '<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M8.5 9.5a5 5 0 0 1 7 0M12 9.5l1.5-1.5"/>',
  bolt: '<path d="M13 3L5 13.5h6L10 21l8-10.5h-6L13 3z"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/>',
  arrowUp: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  arrowDown: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  equal: '<path d="M6 9.5h12M6 14.5h12"/>',
  drop: '<path d="M12 3.5c3.3 3.9 6 7.4 6 10.6a6 6 0 0 1-12 0c0-3.2 2.7-6.7 6-10.6z"/>',
  pill: '<rect x="3" y="8.5" width="18" height="7" rx="3.5" transform="rotate(-35 12 12)"/><path d="M9.2 7.9l5.6 8.2" />',
  bed: '<path d="M3 18v-8M3 14h18v4M21 14v-2.5A2.5 2.5 0 0 0 18.5 9H11v5"/><circle cx="7" cy="11.5" r="1.6"/>',
};

export function icon(name, size = 22, cls = '') {
  return `<svg class="ico ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || ''}</svg>`;
}

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* -------------------------------------------------- Action registry */
export const actions = {};
export function on(name, fn) { actions[name] = fn; }

/* ------------------------------------------------------------ Sheet */
let sheet = null;
let sheetRoot = null;

export function mountSheet(node) {
  sheetRoot = node;
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && sheet) closeSheet(); });
}

export function openSheet(renderFn, opts = {}) {
  sheet = { renderFn, static: !!opts.static, onClose: opts.onClose || null, resolve: null };
  paintSheet(true);
  document.body.classList.add('sheet-open');
  return sheet;
}

export function refreshSheet() {
  if (sheet && !sheet.static) paintSheet(false);
}

function paintSheet(first) {
  if (!sheetRoot || !sheet) return;
  const body = sheet.renderFn();
  if (first) {
    sheetRoot.innerHTML = `
      <div class="sheet-backdrop anim-fade" data-act="sheet:close"></div>
      <div class="sheet-panel glass-strong anim-sheet" role="dialog" aria-modal="true">
        <div class="sheet-grip"></div>
        <div class="sheet-body">${body}</div>
      </div>`;
  } else {
    const b = sheetRoot.querySelector('.sheet-body');
    if (b) b.innerHTML = body;
  }
}

export function closeSheet(result) {
  if (!sheet || !sheetRoot) return;
  const s = sheet;
  sheet = null;
  document.body.classList.remove('sheet-open');
  const panel = sheetRoot.querySelector('.sheet-panel');
  const back = sheetRoot.querySelector('.sheet-backdrop');
  if (panel) panel.classList.add('anim-sheet-out');
  if (back) back.classList.add('anim-fade-out');
  setTimeout(() => { if (!sheet) sheetRoot.innerHTML = ''; }, 220);
  if (s.resolve) s.resolve(result ?? false);
  if (s.onClose) s.onClose();
}

export const sheetOpen = () => !!sheet;

on('sheet:close', () => closeSheet(false));
on('sheet:confirm', () => closeSheet(true));

export function confirmSheet({ title, text, ok = 'Подтвердить', cancel = 'Отмена', danger = false }) {
  return new Promise((resolve) => {
    const s = openSheet(() => `
      <div class="pt-1 pb-2">
        <h3 class="font-display text-lg tracking-tight">${title}</h3>
        <div class="text-chrome-400 text-sm mt-3 leading-relaxed">${text}</div>
        <div class="grid grid-cols-2 gap-2 mt-6">
          <button class="btn btn-ghost" data-act="sheet:close">${cancel}</button>
          <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-act="sheet:confirm">${ok}</button>
        </div>
      </div>`, { static: true });
    s.resolve = resolve;
  });
}

/* ------------------------------------------------------------ Toast */
let toastRoot = null;
export function mountToast(node) { toastRoot = node; }
export function toast(text, tone = 'neutral') {
  if (!toastRoot) return;
  const t = document.createElement('div');
  t.className = `toast glass-strong anim-toast tone-${tone}`;
  t.innerHTML = `<span class="toast-dot"></span><span>${esc(text)}</span>`;
  toastRoot.appendChild(t);
  setTimeout(() => { t.classList.add('anim-toast-out'); setTimeout(() => t.remove(), 260); }, 2600);
}

/* -------------------------------------------------- Barbell renderer */
export function barbellSVG(plates, { collar = false } = {}) {
  const W = 360, H = 190, cy = 95;
  const shaftEnd = 64, stopEnd = 84;
  const thick = plates.reduce((a, p) => a + PLATE_SPEC[p].t * 0.82 + 1.5, 0);
  const avail = W - stopEnd - (collar ? 22 : 8);
  const k = thick > avail ? avail / thick : 1;
  let x = stopEnd + 1.5;
  let body = '';
  plates.forEach((p, i) => {
    const s = PLATE_SPEC[p];
    const t = Math.max(5, s.t * 0.82 * k);
    const h = (s.d / 450) * 168;
    const y = cy - h / 2;
    body += `<g class="plate-g" style="animation-delay:${i * 45}ms">
      <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${t.toFixed(1)}" height="${h.toFixed(1)}" rx="2.6" fill="${s.fill}"/>
      <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${t.toFixed(1)}" height="${h.toFixed(1)}" rx="2.6" fill="url(#plSheen)"/>
      <rect x="${(x + 0.5).toFixed(1)}" y="${(y + 0.5).toFixed(1)}" width="${(t - 1).toFixed(1)}" height="${(h - 1).toFixed(1)}" rx="2.2" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="1"/>
      ${t >= 11 ? `<text x="${(x + t / 2).toFixed(1)}" y="${cy}" fill="${s.ink}" font-family="JetBrains Mono, monospace" font-size="9" font-weight="600" text-anchor="middle" dominant-baseline="central" transform="rotate(-90 ${(x + t / 2).toFixed(1)} ${cy})" opacity=".9">${fmt(p)}</text>` : ''}
    </g>`;
    x += t + 1.5;
  });
  const collarSvg = collar
    ? `<g><rect x="${(x + 1).toFixed(1)}" y="${cy - 17}" width="15" height="34" rx="3" fill="#8B929C"/><rect x="${(x + 1).toFixed(1)}" y="${cy - 17}" width="15" height="34" rx="3" fill="url(#plSheen)"/></g>`
    : '';
  return `
  <svg viewBox="0 0 ${W} ${H}" class="w-full h-auto block" role="img" aria-label="Схема загрузки одной стороны грифа">
    <defs>
      <linearGradient id="plSheen" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stop-color="#fff" stop-opacity=".22"/>
        <stop offset=".35" stop-color="#fff" stop-opacity=".04"/>
        <stop offset=".7" stop-color="#000" stop-opacity=".12"/>
        <stop offset="1" stop-color="#000" stop-opacity=".38"/>
      </linearGradient>
      <linearGradient id="barSteel" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stop-color="#E6E9EE"/>
        <stop offset=".45" stop-color="#9AA1AC"/>
        <stop offset="1" stop-color="#4A4F57"/>
      </linearGradient>
      <pattern id="knurl" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="3" height="3" fill="url(#barSteel)"/>
        <path d="M0 0v3" stroke="rgba(0,0,0,.35)" stroke-width="1"/>
      </pattern>
    </defs>
    <line x1="0" y1="${cy + 92}" x2="${W}" y2="${cy + 92}" stroke="rgba(255,255,255,.05)"/>
    <rect x="0" y="${cy - 5}" width="${shaftEnd}" height="10" fill="url(#knurl)"/>
    <rect x="${shaftEnd}" y="${cy - 21}" width="${stopEnd - shaftEnd}" height="42" rx="3" fill="url(#barSteel)"/>
    <rect x="${stopEnd}" y="${cy - 10}" width="${W - stopEnd}" height="20" rx="2" fill="url(#barSteel)" opacity=".9"/>
    ${body}
    ${collarSvg}
  </svg>`;
}

/* ------------------------------------------------------------ Charts */
export function lineChart(points, { h = 140, w = 340, color = 'var(--ice)', fmtY = (v) => fmt(v, 1), target = null } = {}) {
  if (!points.length) return `<div class="empty-chart">Нет данных</div>`;
  const pad = { l: 34, r: 8, t: 12, b: 20 };
  const vs = points.map(p => p.v).concat(target != null ? [target] : []);
  let min = Math.min(...vs), max = Math.max(...vs);
  if (max - min < 1) { min -= 1; max += 1; }
  const span = max - min;
  min -= span * 0.12; max += span * 0.12;
  const n = points.length;
  const X = (i) => pad.l + (n === 1 ? (w - pad.l - pad.r) / 2 : (i / (n - 1)) * (w - pad.l - pad.r));
  const Y = (v) => pad.t + (1 - (v - min) / (max - min)) * (h - pad.t - pad.b);
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(p.v).toFixed(1)}`).join(' ');
  const area = `${d} L${X(n - 1).toFixed(1)} ${h - pad.b} L${X(0).toFixed(1)} ${h - pad.b} Z`;
  const ticks = [max - (max - min) * 0.1, (max + min) / 2, min + (max - min) * 0.1];
  const gid = 'g' + Math.random().toString(36).slice(2, 8);
  return `
  <svg viewBox="0 0 ${w} ${h}" class="w-full h-auto block chart">
    <defs><linearGradient id="${gid}" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="${color}" stop-opacity=".22"/><stop offset="1" stop-color="${color}" stop-opacity="0"/>
    </linearGradient></defs>
    ${ticks.map(t => `<line x1="${pad.l}" x2="${w - pad.r}" y1="${Y(t).toFixed(1)}" y2="${Y(t).toFixed(1)}" stroke="rgba(255,255,255,.05)"/>
      <text x="${pad.l - 6}" y="${Y(t).toFixed(1)}" fill="#6B7079" font-size="9" font-family="JetBrains Mono" text-anchor="end" dominant-baseline="central">${fmtY(t)}</text>`).join('')}
    ${target != null ? `<line x1="${pad.l}" x2="${w - pad.r}" y1="${Y(target).toFixed(1)}" y2="${Y(target).toFixed(1)}" stroke="rgba(242,181,81,.5)" stroke-dasharray="3 4"/>` : ''}
    <path d="${area}" fill="url(#${gid})"/>
    <path d="${d}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" class="chart-line"/>
    ${points.map((p, i) => `<circle cx="${X(i).toFixed(1)}" cy="${Y(p.v).toFixed(1)}" r="${i === n - 1 ? 3.4 : 2}" fill="${i === n - 1 ? color : '#0B0B0D'}" stroke="${color}" stroke-width="1.4"/>`).join('')}
    ${points.length > 1 ? `<text x="${X(0)}" y="${h - 5}" fill="#6B7079" font-size="9" font-family="JetBrains Mono">${points[0].label || ''}</text>
    <text x="${X(n - 1)}" y="${h - 5}" fill="#6B7079" font-size="9" font-family="JetBrains Mono" text-anchor="end">${points[n - 1].label || ''}</text>` : ''}
  </svg>`;
}

export function barChart(bars, { h = 130, w = 340, active = -1, fmtV = (v) => v } = {}) {
  const pad = { l: 6, r: 6, t: 18, b: 20 };
  const max = Math.max(1, ...bars.map(b => b.v));
  const bw = (w - pad.l - pad.r) / bars.length;
  return `
  <svg viewBox="0 0 ${w} ${h}" class="w-full h-auto block chart">
    ${bars.map((b, i) => {
      const bh = (b.v / max) * (h - pad.t - pad.b);
      const x = pad.l + i * bw + bw * 0.18;
      const y = h - pad.b - bh;
      const on = i === active;
      return `<rect x="${x.toFixed(1)}" y="${(h - pad.b - (h - pad.t - pad.b)).toFixed(1)}" width="${(bw * 0.64).toFixed(1)}" height="${(h - pad.t - pad.b).toFixed(1)}" rx="4" fill="rgba(255,255,255,.025)"/>
        <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(bw * 0.64).toFixed(1)}" height="${Math.max(0, bh).toFixed(1)}" rx="4" fill="${on ? 'var(--ice)' : 'rgba(196,200,207,.32)'}" class="bar-rise" style="animation-delay:${i * 40}ms"/>
        ${b.v ? `<text x="${(x + bw * 0.32).toFixed(1)}" y="${(y - 5).toFixed(1)}" fill="${on ? '#B9E6FF' : '#737985'}" font-size="8.5" font-family="JetBrains Mono" text-anchor="middle">${fmtV(b.v)}</text>` : ''}
        <text x="${(x + bw * 0.32).toFixed(1)}" y="${h - 6}" fill="${on ? '#E3E5E9' : '#6B7079'}" font-size="9" font-family="JetBrains Mono" text-anchor="middle">${b.label}</text>`;
    }).join('')}
  </svg>`;
}

export function ring(frac, { size = 56, stroke = 4, color = 'var(--ice)', track = 'rgba(255,255,255,.07)' } = {}) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const f = Math.max(0, Math.min(1, frac));
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="-rotate-90 block">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="${track}" stroke-width="${stroke}" fill="none"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="${color}" stroke-width="${stroke}" fill="none" stroke-linecap="round"
      stroke-dasharray="${c.toFixed(2)}" stroke-dashoffset="${(c * (1 - f)).toFixed(2)}" class="ring-anim"/>
  </svg>`;
}
