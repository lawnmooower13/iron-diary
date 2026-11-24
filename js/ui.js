/* ==========================================================================
   IRON DIARY · ui.js
   Precision Technical Barbell SVG (with diamond knurling & laser-etched
   weights), 3D Isometric Equipment Icons, Editorial Food Art, Biometric
   3D Anatomical Scan SVG, Gamification Medallions, Sheets & Charts.
   ========================================================================== */
import { PLATE_SPEC, fmt, clamp } from './engine.js';

/* ------------------------------------------------------------ Core Icons */
const P = {
  gym: '<path d="M2.5 10v4M6 6.5v11M18 6.5v11M21.5 10v4M6 12h12"/>',
  food: '<path d="M7 3.5v6.5a2.5 2.5 0 0 0 5 0V3.5M9.5 3.5v17M16.5 3.5c0 3.8-2 5.8-2 8.8h2v8.2"/>',
  body: '<circle cx="12" cy="4.5" r="2"/><path d="M6.5 9.2h11M12 9.2v5.6M12 14.8l-2.8 5.7M12 14.8l2.8 5.7"/>',
  strength: '<path d="M3.5 17.5l5.5-5.5 3.8 3.8 7.7-7.7"/><path d="M15 8h5.5v5.5"/>',
  week: '<rect x="3.5" y="4.5" width="17" height="16" rx="3"/><path d="M8 3v3M16 3v3M3.5 9.5h17M8 13.5h3.5M8 17h6.5"/>',
  info: '<circle cx="12" cy="12" r="8.8"/><path d="M12 11v5.2M12 7.8v.1"/>',
  eye: '<path d="M2.2 12s3.5-6.2 9.8-6.2 9.8 6.2 9.8 6.2-3.5 6.2-9.8 6.2S2.2 12 2.2 12z"/><circle cx="12" cy="12" r="2.8"/>',
  eyeOff: '<path d="M2.2 12s3.5-6.2 9.8-6.2 9.8 6.2 9.8 6.2-3.5 6.2-9.8 6.2S2.2 12 2.2 12z"/><circle cx="12" cy="12" r="2.8"/><path d="M4.2 4.2l15.6 15.6"/>',
  check: '<path d="M5 12.5l4.4 4.4L19.2 7"/>',
  chevronDown: '<path d="M6.5 9.5L12 15l5.5-5.5"/>',
  chevronLeft: '<path d="M14.5 6.5L9 12l5.5 5.5"/>',
  chevronRight: '<path d="M9.5 6.5L15 12l-5.5 5.5"/>',
  plus: '<path d="M12 5.5v13M5.5 12h13"/>',
  minus: '<path d="M5.5 12h13"/>',
  x: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  timer: '<circle cx="12" cy="13.2" r="7.2"/><path d="M12 9.8v3.4l2.3 2.3M9.5 3h5"/>',
  download: '<path d="M12 4v11M7.5 10.8L12 15.3l4.5-4.5M5 19.5h14"/>',
  upload: '<path d="M12 19.5V8.5M7.5 13L12 8.5l4.5 4.5M5 4.5h14"/>',
  trash: '<path d="M4.5 7h15M9.2 7V4.5h5.6V7M6.8 7l.9 12.5h8.6L17.2 7"/>',
  disc: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="2.3"/><path d="M12 3.5v2.5M12 18v2.5"/>',
  reset: '<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4.5 4.5v4h4"/>',
  pencil: '<path d="M4.5 19.5h3.8L18.8 9l-3.8-3.8L4.5 15.7v3.8z"/><path d="M13.2 6.8l3.8 3.8"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0V4z"/><path d="M8 5.5H4.8v1A3.2 3.2 0 0 0 8 9.8M16 5.5h3.2v1A3.2 3.2 0 0 1 16 9.8M12 13v3.8M8.5 19.8h7"/>',
  copy: '<rect x="8.2" y="8.2" width="11.5" height="11.5" rx="2.3"/><path d="M15.8 8.2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7.8a2 2 0 0 0 2 2h2.2"/>',
};

export function icon(name, size = 20, cls = '') {
  return `<svg class="ico ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || ''}</svg>`;
}

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ------------------------------------------- 5-Bar Signal Indicator */
export function signalBars(level = 3) {
  const heights = [4, 6.5, 9, 11.5, 14];
  return `<svg class="sig-bars" width="24" height="15" viewBox="0 0 24 15" aria-hidden="true">
    ${heights.map((h, idx) => {
      const on = idx < level;
      return `<rect x="${idx * 4.6 + 1}" y="${14.5 - h}" width="3.1" height="${h}" rx="1.2" class="${on ? 'sig-on' : 'sig-off'}"/>`;
    }).join('')}
  </svg>`;
}

/* ---------------------------- 3D Technical Equipment Badges (No Stick Figures) */
export function exerciseIcon(kind = 'exDeadlift', size = 40) {
  const uid = Math.random().toString(36).slice(2, 6);
  const defs = `
    <defs>
      <linearGradient id="eqBg_${uid}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="rgba(255,255,255,0.11)"/>
        <stop offset="1" stop-color="rgba(255,255,255,0.02)"/>
      </linearGradient>
      <linearGradient id="eqSteel_${uid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#F3F4F6"/>
        <stop offset="0.5" stop-color="#9CA3AF"/>
        <stop offset="1" stop-color="#4B5563"/>
      </linearGradient>
      <linearGradient id="eqRed_${uid}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#FF3B4E"/>
        <stop offset="1" stop-color="#B81426"/>
      </linearGradient>
    </defs>
    <rect x="1" y="1" width="42" height="42" rx="12" fill="url(#eqBg_${uid})" stroke="rgba(255,255,255,0.14)" stroke-width="1"/>`;

  const art = {
    /* Loaded flexing competition deadlift bar + upward force vector */
    exDeadlift: `
      <line x1="7" y1="34" x2="37" y2="34" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
      <path d="M6 25 Q22 21.5 38 25" stroke="url(#eqSteel_${uid})" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <rect x="8.5" y="16" width="3.8" height="17" rx="1.3" fill="url(#eqRed_${uid})" stroke="rgba(255,255,255,0.25)" stroke-width="0.6"/>
      <rect x="13" y="17.5" width="3" height="14" rx="1" fill="#2563EB"/>
      <rect x="31.7" y="16" width="3.8" height="17" rx="1.3" fill="url(#eqRed_${uid})" stroke="rgba(255,255,255,0.25)" stroke-width="0.6"/>
      <rect x="28" y="17.5" width="3" height="14" rx="1" fill="#2563EB"/>
      <path d="M22 18V9M18.5 12.2L22 8.7l3.5 3.5" stroke="#FF3B4E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,

    /* Power Rack + Loaded Squat Bar + Depth Vector */
    exSquat: `
      <path d="M13 8v27M31 8v27M10 35h24" stroke="rgba(255,255,255,0.28)" stroke-width="1.8" stroke-linecap="round"/>
      <line x1="5.5" y1="16" x2="38.5" y2="16" stroke="url(#eqSteel_${uid})" stroke-width="2.4" stroke-linecap="round"/>
      <rect x="8" y="9.5" width="3.6" height="13" rx="1.2" fill="url(#eqRed_${uid})" stroke="rgba(255,255,255,0.25)" stroke-width="0.6"/>
      <rect x="32.4" y="9.5" width="3.6" height="13" rx="1.2" fill="url(#eqRed_${uid})" stroke="rgba(255,255,255,0.25)" stroke-width="0.6"/>
      <path d="M22 21v10M19 27.8l3 3.2 3-3.2" stroke="#FF3B4E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,

    /* Competition Bench Press Station with Loaded Barbell */
    exBench: `
      <path d="M14 10v16M30 10v16" stroke="rgba(255,255,255,0.26)" stroke-width="1.8" stroke-linecap="round"/>
      <line x1="6" y1="15" x2="38" y2="15" stroke="url(#eqSteel_${uid})" stroke-width="2.4" stroke-linecap="round"/>
      <rect x="8.5" y="8.5" width="3.8" height="13" rx="1.2" fill="url(#eqRed_${uid})" stroke="rgba(255,255,255,0.25)" stroke-width="0.6"/>
      <rect x="31.7" y="8.5" width="3.8" height="13" rx="1.2" fill="url(#eqRed_${uid})" stroke="rgba(255,255,255,0.25)" stroke-width="0.6"/>
      <rect x="13" y="26" width="18" height="4.2" rx="2" fill="url(#eqRed_${uid})"/>
      <path d="M16 30.2v4.8M28 30.2v4.8" stroke="url(#eqSteel_${uid})" stroke-width="2" stroke-linecap="round"/>`,

    /* Overhead Press / Push Press Dual Drive Vectors */
    exOhp: `
      <line x1="6" y1="13.5" x2="38" y2="13.5" stroke="url(#eqSteel_${uid})" stroke-width="2.4" stroke-linecap="round"/>
      <rect x="8.5" y="7.5" width="3.5" height="12" rx="1.2" fill="url(#eqRed_${uid})" stroke="rgba(255,255,255,0.25)" stroke-width="0.6"/>
      <rect x="12.6" y="9" width="2.6" height="9" rx="0.9" fill="#EAB308"/>
      <rect x="32" y="7.5" width="3.5" height="12" rx="1.2" fill="url(#eqRed_${uid})" stroke="rgba(255,255,255,0.25)" stroke-width="0.6"/>
      <rect x="28.8" y="9" width="2.6" height="9" rx="0.9" fill="#EAB308"/>
      <path d="M18 33V20M15 23l3-3 3 3M26 33V20M23 23l3-3 3 3" stroke="#FF3B4E" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>`,

    /* Heavy Row / T-Bar Leverage Mechanism */
    exRow: `
      <circle cx="11" cy="31" r="3" fill="url(#eqSteel_${uid})"/>
      <line x1="11" y1="31" x2="34" y2="13" stroke="url(#eqSteel_${uid})" stroke-width="2.6" stroke-linecap="round"/>
      <g transform="rotate(-38 28 17.5)">
        <rect x="24" y="9" width="3.8" height="17" rx="1.2" fill="url(#eqRed_${uid})" stroke="rgba(255,255,255,0.25)" stroke-width="0.6"/>
        <rect x="28.5" y="10.5" width="3" height="14" rx="1" fill="#2563EB"/>
      </g>
      <path d="M16 19l5-4M15.5 14.5h5.5v5.5" stroke="#FF3B4E" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,

    /* Strongman Heavy Dumbbell / Farmer Implement */
    exStrong: `
      <rect x="15" y="20.5" width="14" height="3.2" rx="1.2" fill="url(#eqSteel_${uid})"/>
      <rect x="8" y="13" width="4.2" height="18" rx="1.4" fill="url(#eqRed_${uid})" stroke="rgba(255,255,255,0.25)" stroke-width="0.6"/>
      <rect x="12.6" y="14.5" width="3.2" height="15" rx="1.1" fill="#374151" stroke="rgba(255,255,255,0.18)" stroke-width="0.5"/>
      <rect x="31.8" y="13" width="4.2" height="18" rx="1.4" fill="url(#eqRed_${uid})" stroke="rgba(255,255,255,0.25)" stroke-width="0.6"/>
      <rect x="28.2" y="14.5" width="3.2" height="15" rx="1.1" fill="#374151" stroke="rgba(255,255,255,0.18)" stroke-width="0.5"/>`,

    /* Core / Weighted Pull-up / Ab Wheel */
    exCore: `
      <circle cx="22" cy="22" r="10.5" stroke="url(#eqRed_${uid})" stroke-width="3" fill="none"/>
      <circle cx="22" cy="22" r="4" fill="url(#eqSteel_${uid})"/>
      <line x1="9" y1="22" x2="35" y2="22" stroke="url(#eqSteel_${uid})" stroke-width="2.6" stroke-linecap="round"/>`,
  };

  return `<svg width="${size}" height="${size}" viewBox="0 0 44 44" fill="none" class="ex-art shrink-0" aria-hidden="true">${defs}${art[kind] || art.exDeadlift}</svg>`;
}

/* ------------------------------ Signature Technical Barbell Visualizer */
/**
 * The user's favorite precision-engineered Eleiko/Rogue blueprint barbell:
 * - Diamond knurling pattern on the steel bar shaft
 * - Brushed chrome sleeve flange & machined outer sleeve
 * - Calibrated Olympic plates with horizontal cylindrical sheen, recessed inner
 *   rims, and vertical laser-etched JetBrains Mono weight numbers
 * - Competition lock collar with lever clamp
 */
export function barbellSVG(plates, { collar = false, compact = false } = {}) {
  const W = compact ? 260 : 360;
  const H = compact ? 136 : 186;
  const cy = Math.round(H / 2);
  const maxPlateH = compact ? 116 : 164;
  const shaftEnd = compact ? 42 : 64;
  const stopEnd = shaftEnd + (compact ? 14 : 20);
  const scale = compact ? 0.72 : 0.86;

  const thick = plates.reduce((a, p) => a + PLATE_SPEC[p].t * scale + 1.5, 0);
  const avail = W - stopEnd - 30;
  const k = thick > avail ? avail / thick : 1;

  const uid = Math.random().toString(36).slice(2, 7);
  let x = stopEnd + 1.8;
  let body = '';

  plates.forEach((p, i) => {
    const s = PLATE_SPEC[p];
    const t = Math.max(compact ? 7.5 : 8.5, s.t * scale * k);
    const h = (s.d / 450) * maxPlateH;
    const y = cy - h / 2;
    const labelSize = compact ? (t >= 11 ? 7.8 : 6.8) : (t >= 12 ? 9.5 : 8);

    body += `
    <g class="plate-g" style="animation-delay:${i * 38}ms">
      <!-- Calibrated Plate Cylinder -->
      <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${t.toFixed(1)}" height="${h.toFixed(1)}" rx="2.6" fill="${s.fill}"/>
      <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${t.toFixed(1)}" height="${h.toFixed(1)}" rx="2.6" fill="url(#plSheen_${uid})"/>
      <!-- Specular Chamfer & Calibration Groove -->
      <rect x="${(x + 0.5).toFixed(1)}" y="${(y + 0.5).toFixed(1)}" width="${(t - 1).toFixed(1)}" height="${(h - 1).toFixed(1)}" rx="2.2" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="0.9"/>
      <line x1="${(x + 1.4).toFixed(1)}" y1="${(y + 4).toFixed(1)}" x2="${(x + 1.4).toFixed(1)}" y2="${(y + h - 4).toFixed(1)}" stroke="rgba(255,255,255,0.28)" stroke-width="0.8" stroke-linecap="round"/>
      ${t >= 8.5 ? `<text x="${(x + t / 2 + 0.3).toFixed(1)}" y="${cy}" fill="${s.ink}" font-family="JetBrains Mono, monospace" font-size="${labelSize}" font-weight="700" text-anchor="middle" dominant-baseline="central" transform="rotate(-90 ${(x + t / 2 + 0.3).toFixed(1)} ${cy})" opacity="0.94">${fmt(p)}</text>` : ''}
    </g>`;
    x += t + 1.5;
  });

  /* Machined competition lock collar */
  const cw = compact ? 11 : 15;
  const ch = compact ? 26 : 34;
  const collarSvg = `
    <g>
      <rect x="${(x + 0.6).toFixed(1)}" y="${(cy - ch / 2).toFixed(1)}" width="${cw}" height="${ch}" rx="2.5" fill="url(#collarSteel_${uid})" stroke="rgba(255,255,255,0.25)" stroke-width="0.8"/>
      <line x1="${(x + cw / 2 + 0.6).toFixed(1)}" y1="${(cy - ch / 2 + 3).toFixed(1)}" x2="${(x + cw / 2 + 0.6).toFixed(1)}" y2="${(cy + ch / 2 - 3).toFixed(1)}" stroke="rgba(0,0,0,0.45)" stroke-width="1.2"/>
      ${collar ? `<rect x="${(x + 2).toFixed(1)}" y="${(cy - ch / 2 - 4).toFixed(1)}" width="${cw - 3}" height="3.5" rx="1.2" fill="#EF233C"/>` : ''}
    </g>`;

  const shaftH = compact ? 8.5 : 10.5;
  const sleeveH = compact ? 15 : 20;
  const flangeH = compact ? 32 : 42;

  return `
  <svg viewBox="0 0 ${W} ${H}" class="w-full h-auto block barbell-svg" role="img" aria-label="Схема загрузки грифа">
    <defs>
      <linearGradient id="plSheen_${uid}" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stop-color="#ffffff" stop-opacity="0.26"/>
        <stop offset="0.32" stop-color="#ffffff" stop-opacity="0.05"/>
        <stop offset="0.68" stop-color="#000000" stop-opacity="0.12"/>
        <stop offset="1" stop-color="#000000" stop-opacity="0.42"/>
      </linearGradient>
      <linearGradient id="barSteel_${uid}" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stop-color="#F1F4F9"/>
        <stop offset="0.25" stop-color="#C8CFD9"/>
        <stop offset="0.55" stop-color="#8B93A1"/>
        <stop offset="0.85" stop-color="#3E444E"/>
        <stop offset="1" stop-color="#5B6270"/>
      </linearGradient>
      <linearGradient id="collarSteel_${uid}" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stop-color="#D5DBE3"/>
        <stop offset="0.5" stop-color="#7B8391"/>
        <stop offset="1" stop-color="#323741"/>
      </linearGradient>
      <pattern id="knurl_${uid}" width="3.2" height="3.2" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="3.2" height="3.2" fill="url(#barSteel_${uid})"/>
        <path d="M0 0v3.2" stroke="rgba(0,0,0,0.42)" stroke-width="1.1"/>
      </pattern>
    </defs>

    <!-- Technical Axis Baseline -->
    <line x1="4" y1="${cy}" x2="${W - 4}" y2="${cy}" stroke="rgba(255,255,255,0.04)" stroke-dasharray="3 3"/>
    <line x1="8" y1="${H - 6}" x2="${W - 8}" y2="${H - 6}" stroke="rgba(255,255,255,0.05)"/>

    <!-- Knurled Bar Shaft -->
    <rect x="4" y="${(cy - shaftH / 2).toFixed(1)}" width="${shaftEnd - 4}" height="${shaftH}" rx="1.5" fill="url(#barSteel_${uid})"/>
    <rect x="10" y="${(cy - shaftH / 2).toFixed(1)}" width="${shaftEnd - 16}" height="${shaftH}" fill="url(#knurl_${uid})" opacity="0.88"/>

    <!-- Machined Sleeve Flange -->
    <rect x="${shaftEnd}" y="${(cy - flangeH / 2).toFixed(1)}" width="${stopEnd - shaftEnd}" height="${flangeH}" rx="2.8" fill="url(#barSteel_${uid})" stroke="rgba(255,255,255,0.22)" stroke-width="0.7"/>

    <!-- Loadable Olympic Sleeve -->
    <rect x="${stopEnd}" y="${(cy - sleeveH / 2).toFixed(1)}" width="${W - stopEnd - 6}" height="${sleeveH}" rx="2.2" fill="url(#barSteel_${uid})" opacity="0.94"/>
    <line x1="${stopEnd}" y1="${(cy - sleeveH * 0.24).toFixed(1)}" x2="${W - 8}" y2="${(cy - sleeveH * 0.24).toFixed(1)}" stroke="rgba(255,255,255,0.35)" stroke-width="1"/>

    <!-- Competition Plates Stack -->
    ${body}
    ${collarSvg}
  </svg>`;
}

/* ------------------------------------------- Gourmet Food Illustrations */
export function foodHeroSVG() {
  return `
  <svg viewBox="0 0 120 120" class="w-[88px] h-[88px] shrink-0 block" aria-hidden="true">
    <defs>
      <radialGradient id="plateRim" cx="35%" cy="30%" r="70%">
        <stop offset="0" stop-color="#323844"/>
        <stop offset="0.7" stop-color="#171A21"/>
        <stop offset="1" stop-color="#0B0D11"/>
      </radialGradient>
      <radialGradient id="plateWell" cx="45%" cy="40%" r="65%">
        <stop offset="0" stop-color="#20252F"/>
        <stop offset="1" stop-color="#101318"/>
      </radialGradient>
      <linearGradient id="steakGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#C85A28"/>
        <stop offset="0.55" stop-color="#8F3514"/>
        <stop offset="1" stop-color="#4E1806"/>
      </linearGradient>
      <radialGradient id="yolkGrad" cx="36%" cy="36%" r="60%">
        <stop offset="0" stop-color="#FFE680"/>
        <stop offset="0.55" stop-color="#F59E0B"/>
        <stop offset="1" stop-color="#D97706"/>
      </radialGradient>
    </defs>
    <circle cx="62" cy="64" r="52" fill="rgba(0,0,0,0.5)"/>
    <circle cx="60" cy="60" r="52" fill="url(#plateRim)" stroke="rgba(255,255,255,0.16)" stroke-width="1.2"/>
    <circle cx="60" cy="60" r="42" fill="url(#plateWell)" stroke="rgba(255,255,255,0.07)" stroke-width="0.8"/>

    <!-- Jasmine Rice & Sesame -->
    <g fill="#F4F6F9" opacity="0.94">
      <ellipse cx="39" cy="54" rx="3.8" ry="1.7" transform="rotate(-25 39 54)"/>
      <ellipse cx="47" cy="51" rx="3.8" ry="1.7" transform="rotate(15 47 51)"/>
      <ellipse cx="34" cy="61" rx="3.8" ry="1.7" transform="rotate(30 34 61)"/>
      <ellipse cx="43" cy="60" rx="4" ry="1.8" transform="rotate(-10 43 60)"/>
      <ellipse cx="51" cy="58" rx="3.8" ry="1.7" transform="rotate(40 51 58)"/>
      <ellipse cx="38" cy="68" rx="3.8" ry="1.7" transform="rotate(-35 38 68)"/>
      <ellipse cx="46" cy="67" rx="3.8" ry="1.7" transform="rotate(22 46 67)"/>
      <ellipse cx="42" cy="74" rx="3.8" ry="1.7" transform="rotate(12 42 74)"/>
      <ellipse cx="50" cy="73" rx="3.8" ry="1.7" transform="rotate(-28 50 73)"/>
    </g>
    <circle cx="42" cy="57" r="1" fill="#111827"/>
    <circle cx="47" cy="63" r="1" fill="#F59E0B"/>
    <circle cx="49" cy="69" r="1" fill="#22C55E"/>

    <!-- Egg -->
    <path d="M33 35c5-4.5 15-3.5 19 2 3.5 4.5 1.8 13-4.5 16-6.5 2.5-14.5 1-17-5.5-2.5-4.5-1.8-9 2.5-12.5z" fill="#F9FAFB"/>
    <circle cx="43" cy="42" r="6.8" fill="url(#yolkGrad)"/>
    <circle cx="41" cy="39.8" r="1.9" fill="#FFFBEB" opacity="0.9"/>

    <!-- Seared Steak Medallions -->
    <g>
      <rect x="62" y="32" width="24" height="10.5" rx="5" transform="rotate(-7 62 32)" fill="url(#steakGrad)" stroke="#3B1206" stroke-width="0.8"/>
      <line x1="68" y1="34" x2="65" y2="40" stroke="#280B03" stroke-width="1.4" stroke-linecap="round"/>
      <line x1="75" y1="33" x2="72" y2="39" stroke="#280B03" stroke-width="1.4" stroke-linecap="round"/>

      <rect x="65" y="45" width="26" height="11" rx="5" transform="rotate(-3 65 45)" fill="url(#steakGrad)" stroke="#3B1206" stroke-width="0.8"/>
      <line x1="71" y1="47" x2="68" y2="54" stroke="#280B03" stroke-width="1.4" stroke-linecap="round"/>
      <line x1="78" y1="47" x2="75" y2="54" stroke="#280B03" stroke-width="1.4" stroke-linecap="round"/>

      <rect x="63" y="59" width="25" height="10.5" rx="5" transform="rotate(4 63 59)" fill="url(#steakGrad)" stroke="#3B1206" stroke-width="0.8"/>
      <line x1="70" y1="61" x2="67" y2="68" stroke="#280B03" stroke-width="1.4" stroke-linecap="round"/>
      <line x1="77" y1="62" x2="74" y2="69" stroke="#280B03" stroke-width="1.4" stroke-linecap="round"/>
    </g>

    <!-- Avocado & Greens -->
    <path d="M52 81c5.5-3.5 13.5-2.5 17 2.8-5.5 4.5-13.5 3.5-17-2.8z" fill="#16A34A"/>
    <path d="M54 81c4.5-2 10-1.5 12.5 1.8-3.5 2.5-9 2-12.5-1.8z" fill="#86EFAC"/>
    <circle cx="61" cy="75" r="4" fill="#EF4444"/>
    <circle cx="59.8" cy="73.8" r="1.1" fill="#FECACA"/>
  </svg>`;
}

export function mealArtSVG(kind = 'mealBreakfast') {
  const art = {
    mealBreakfast: `
      <rect x="2" y="2" width="40" height="40" rx="12" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
      <circle cx="22" cy="22" r="14" fill="#161920" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
      <path d="M13 21c1-5.5 9-7 12.5-3 3 3.5 1.5 10-3.5 11.5-5 1.5-10-2.5-9-8.5z" fill="#F3F4F6"/>
      <circle cx="19.5" cy="20" r="4.2" fill="#F59E0B"/>
      <circle cx="18.3" cy="18.8" r="1.2" fill="#FEF3C7"/>
      <circle cx="28.5" cy="17.5" r="3" fill="#FDE047" stroke="#CA8A04" stroke-width="0.8"/>
      <circle cx="30.5" cy="23" r="3" fill="#FDE047" stroke="#CA8A04" stroke-width="0.8"/>
      <circle cx="25.5" cy="28.5" r="1.9" fill="#EF4444"/>`,
    mealLunch: `
      <rect x="2" y="2" width="40" height="40" rx="12" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
      <circle cx="22" cy="22" r="14" fill="#161920" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
      <circle cx="16.5" cy="22.5" r="6.8" fill="#F3F4F6"/>
      <rect x="22" y="14" width="11" height="5.8" rx="2.8" fill="#B45309"/>
      <rect x="22" y="21.5" width="11.5" height="5.8" rx="2.8" fill="#9A3412"/>
      <circle cx="21" cy="30" r="2.6" fill="#22C55E"/>
      <circle cx="25.5" cy="30.5" r="2.2" fill="#16A34A"/>`,
    mealShake: `
      <rect x="2" y="2" width="40" height="40" rx="12" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
      <path d="M16 14h12l-1.5 18a2 2 0 0 1-2 1.8h-5a2 2 0 0 1-2-1.8L16 14z" fill="#252A34" stroke="rgba(255,255,255,0.22)" stroke-width="1.1"/>
      <path d="M17.2 19.5h9.6l-.9 11.5h-7.8l-.9-11.5z" fill="#D97706" opacity="0.88"/>
      <rect x="14.5" y="11" width="15" height="3" rx="1.4" fill="#2CE56B"/>
      <rect x="19.5" y="8.8" width="5" height="2.4" rx="1" fill="#16A34A"/>`,
    mealDinner: `
      <rect x="2" y="2" width="40" height="40" rx="12" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
      <circle cx="22" cy="22" r="14" fill="#161920" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
      <circle cx="22" cy="22" r="10.5" fill="#F59E0B" opacity="0.9"/>
      <path d="M15 20c2.5-3 11.5-3 14 0M14.5 24c3 3 12 3 15 0" stroke="#FEF08A" stroke-width="1.6" stroke-linecap="round" fill="none"/>
      <circle cx="22" cy="22" r="5.5" fill="#991B1B"/>
      <circle cx="22" cy="18" r="2" fill="#22C55E"/>`,
    mealNight: `
      <rect x="2" y="2" width="40" height="40" rx="12" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
      <circle cx="22" cy="22" r="14" fill="#161920" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
      <circle cx="21.5" cy="22.5" r="9.5" fill="#F3F4F6"/>
      <ellipse cx="26" cy="25" rx="2.8" ry="1.5" transform="rotate(-28 26 25)" fill="#B45309"/>
      <ellipse cx="17" cy="24" rx="2.6" ry="1.4" transform="rotate(24 17 24)" fill="#B45309"/>
      <circle cx="22" cy="18.5" r="1.8" fill="#6366F1"/>`,
  };
  return `<svg width="42" height="42" viewBox="0 0 44 44" class="shrink-0 block" aria-hidden="true">${art[kind] || art.mealBreakfast}</svg>`;
}

/* ---------------------------- Biometric 3D Anatomical Physique Visualizer */
export function physiqueSVG(currentKg = 95, targetKg = 125) {
  const buildPath = (kg) => {
    const m = clamp((kg - 85) / 45, -0.1, 1.25);
    const sh = 41 + m * 14.5;
    const trap = 15.5 + m * 6.2;
    const lat = 30.5 + m * 13.8;
    const waist = 22 + m * 6.5;
    const hip = 25.5 + m * 7.5;
    const quad = 30.5 + m * 12.8;
    const knee = 18 + m * 3.8;
    const calf = 20.5 + m * 6.4;
    const ankle = 12 + m * 1.5;
    const armOut = sh + 7 + m * 7.8;
    const foreOut = sh + 5 + m * 5.8;
    const armIn = sh - 5 - m * 1.4;

    const cx = 150;
    const outer = `
      M ${cx} 20
      C ${cx + 11.5} 20, ${cx + 14.5} 29, ${cx + 13.5} 40
      C ${cx + 12.5} 47, ${cx + 11} 52, ${cx + 11} 56
      L ${cx + trap} 61
      C ${cx + sh * 0.72} 64, ${cx + sh} 68, ${cx + sh + 3} 77
      C ${cx + armOut + 1.5} 90, ${cx + armOut} 107, ${cx + armOut - 2} 122
      C ${cx + foreOut + 1} 136, ${cx + foreOut} 152, ${cx + foreOut - 4} 169
      C ${cx + foreOut - 2} 176, ${cx + foreOut - 5} 185, ${cx + foreOut - 10} 185
      C ${cx + armIn - 2} 184, ${cx + armIn - 3} 174, ${cx + armIn - 1} 166
      C ${cx + armIn + 1} 149, ${cx + armIn + 1} 133, ${cx + armIn} 116
      L ${cx + lat} 102
      C ${cx + lat - 1} 120, ${cx + waist + 2} 136, ${cx + waist} 152
      C ${cx + hip} 166, ${cx + quad + 1.5} 190, ${cx + quad} 216
      C ${cx + quad - 1} 234, ${cx + knee + 3} 250, ${cx + knee} 262
      C ${cx + calf + 2} 278, ${cx + calf} 297, ${cx + ankle + 2} 318
      L ${cx + ankle + 5} 332
      C ${cx + ankle + 6} 337, ${cx + 6} 338, ${cx + 5} 332
      L ${cx + 6} 317
      C ${cx + 5} 296, ${cx + 5} 278, ${cx + 6} 262
      C ${cx + 4} 244, ${cx + 3} 213, ${cx + 2} 184
      L ${cx} 181
      L ${cx - 2} 184
      C ${cx - 3} 213, ${cx - 4} 244, ${cx - 6} 262
      C ${cx - 5} 278, ${cx - 5} 296, ${cx - 6} 317
      L ${cx - 5} 332
      C ${cx - 6} 338, ${cx - ankle - 6} 337, ${cx - ankle - 5} 332
      L ${cx - ankle - 2} 318
      C ${cx - calf} 297, ${cx - calf - 2} 278, ${cx - knee} 262
      C ${cx - knee - 3} 250, ${cx - quad + 1} 234, ${cx - quad} 216
      C ${cx - quad - 1.5} 190, ${cx - hip} 166, ${cx - waist} 152
      C ${cx - waist - 2} 136, ${cx - lat + 1} 120, ${cx - lat} 102
      L ${cx - armIn} 116
      C ${cx - armIn - 1} 133, ${cx - armIn - 1} 149, ${cx - armIn + 1} 166
      C ${cx - armIn + 3} 174, ${cx - armIn + 2} 184, ${cx - foreOut + 10} 185
      C ${cx - foreOut + 5} 185, ${cx - foreOut + 2} 176, ${cx - foreOut + 4} 169
      C ${cx - foreOut} 152, ${cx - foreOut - 1} 136, ${cx - armOut + 2} 122
      C ${cx - armOut} 107, ${cx - armOut - 1.5} 90, ${cx - sh - 3} 77
      C ${cx - sh} 68, ${cx - sh * 0.72} 64, ${cx - trap} 61
      L ${cx - 11} 56
      C ${cx - 11} 52, ${cx - 12.5} 47, ${cx - 13.5} 40
      C ${cx - 14.5} 29, ${cx - 11.5} 20, ${cx} 20
      Z`;
    return { outer, m, sh, lat, waist, quad, calf, armOut };
  };

  const cur = buildPath(currentKg);
  const tgt = buildPath(targetKg);
  const cx = 150;
  const m = tgt.m;

  const chestCm = Math.round(107 + (targetKg - 95) * 0.72);
  const armCm = Math.round((39.5 + (targetKg - 95) * 0.31) * 10) / 10;
  const thighCm = Math.round(62 + (targetKg - 95) * 0.48);
  const waistCm = Math.round(84 + (targetKg - 95) * 0.42);

  return `
  <svg viewBox="0 0 300 348" class="w-full max-w-[290px] mx-auto h-auto block select-none" role="img" aria-label="Биометрическая 3D-модель атлета">
    <defs>
      <radialGradient id="bodyGlow" cx="50%" cy="44%" r="52%">
        <stop offset="0" stop-color="#A855F7" stop-opacity="0.34"/>
        <stop offset="0.6" stop-color="#6B21A8" stop-opacity="0.1"/>
        <stop offset="1" stop-color="#000000" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="bodyFill" x1="0.2" y1="0" x2="0.8" y2="1">
        <stop offset="0" stop-color="#D8B4FE"/>
        <stop offset="0.32" stop-color="#A855F7"/>
        <stop offset="0.72" stop-color="#7E22CE"/>
        <stop offset="1" stop-color="#4C1D95"/>
      </linearGradient>
      <linearGradient id="muscleLight" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#FAF5FF" stop-opacity="0.4"/>
        <stop offset="1" stop-color="#C084FC" stop-opacity="0.02"/>
      </linearGradient>
    </defs>

    <!-- Biometric Radar Circles -->
    <circle cx="150" cy="162" r="134" fill="url(#bodyGlow)"/>
    <circle cx="150" cy="162" r="110" fill="none" stroke="rgba(192,132,252,0.08)" stroke-dasharray="2 4"/>
    <ellipse cx="150" cy="336" rx="${42 + m * 14}" ry="5.5" fill="rgba(0,0,0,0.6)"/>

    <!-- Target Physique 3D Silhouette -->
    <path d="${tgt.outer}" fill="url(#bodyFill)" stroke="#E9D5FF" stroke-width="1.3" stroke-opacity="0.75"/>

    <!-- Volumetric Muscle Bellies -->
    <g fill="url(#muscleLight)">
      <path d="M ${cx - 2.5} 74 C ${cx - 16 - m * 5} 73, ${cx - tgt.lat + 2} 82, ${cx - tgt.lat + 3} 97 C ${cx - 22 - m * 4} 104, ${cx - 7} 102, ${cx - 2.5} 96 Z"/>
      <path d="M ${cx + 2.5} 74 C ${cx + 16 + m * 5} 73, ${cx + tgt.lat - 2} 82, ${cx + tgt.lat - 3} 97 C ${cx + 22 + m * 4} 104, ${cx + 7} 102, ${cx + 2.5} 96 Z"/>
      <ellipse cx="${cx - tgt.sh + 1}" cy="84" rx="${7 + m * 2.5}" ry="13.5" transform="rotate(10 ${cx - tgt.sh} 84)"/>
      <ellipse cx="${cx + tgt.sh - 1}" cy="84" rx="${7 + m * 2.5}" ry="13.5" transform="rotate(-10 ${cx + tgt.sh} 84)"/>
      <ellipse cx="${cx - tgt.quad * 0.58}" cy="212" rx="${7 + m * 3.5}" ry="26" transform="rotate(6 ${cx - tgt.quad * 0.58} 212)"/>
      <ellipse cx="${cx + tgt.quad * 0.58}" cy="212" rx="${7 + m * 3.5}" ry="26" transform="rotate(-6 ${cx + tgt.quad * 0.58} 212)"/>
    </g>

    <!-- Anatomical Striations & Separation -->
    <g stroke="#3B0764" stroke-opacity="0.6" stroke-width="1.4" stroke-linecap="round" fill="none">
      <path d="M ${cx - 25 - m * 4} 67 Q ${cx - 12} 71 ${cx - 2} 69"/>
      <path d="M ${cx + 25 + m * 4} 67 Q ${cx + 12} 71 ${cx + 2} 69"/>
      <line x1="${cx}" y1="72" x2="${cx}" y2="154"/>
      <path d="M ${cx - tgt.lat + 3} 96 Q ${cx - 18 - m * 4} 106 ${cx - 2} 97"/>
      <path d="M ${cx + tgt.lat - 3} 96 Q ${cx + 18 + m * 4} 106 ${cx + 2} 97"/>
      <path d="M ${cx - 13 - m * 2} 110 Q ${cx} 113 ${cx + 13 + m * 2} 110"/>
      <path d="M ${cx - 14 - m * 2} 124 Q ${cx} 127 ${cx + 14 + m * 2} 124"/>
      <path d="M ${cx - 12 - m * 2} 138 Q ${cx} 141 ${cx + 12 + m * 2} 138"/>
      <path d="M ${cx - 14 - m * 2.5} 102 C ${cx - 17 - m * 2.5} 122, ${cx - 15 - m * 2} 142, ${cx - 7} 164"/>
      <path d="M ${cx + 14 + m * 2.5} 102 C ${cx + 17 + m * 2.5} 122, ${cx + 15 + m * 2} 142, ${cx + 7} 164"/>
      <path d="M ${cx - tgt.waist + 3} 152 L ${cx - 8} 173"/>
      <path d="M ${cx + tgt.waist - 3} 152 L ${cx + 8} 173"/>
      <path d="M ${cx - 14 - m * 3} 184 C ${cx - 20 - m * 4} 210, ${cx - 18 - m * 3} 236, ${cx - 11} 252"/>
      <path d="M ${cx + 14 + m * 3} 184 C ${cx + 20 + m * 4} 210, ${cx + 18 + m * 3} 236, ${cx + 11} 252"/>
    </g>

    <!-- Baseline 95 kg Dashed Contour -->
    <path d="${cur.outer}" fill="none" stroke="#FAF5FF" stroke-width="1.5" stroke-dasharray="3.5 3.5" opacity="0.88"/>

    <!-- Live Biometric Callouts -->
    <g font-family="JetBrains Mono, monospace" font-size="9" fill="#E9D5FF" opacity="0.9">
      <line x1="8" y1="90" x2="${(cx - tgt.lat - 4).toFixed(1)}" y2="90" stroke="rgba(233,213,255,0.3)" stroke-dasharray="2 2"/>
      <text x="8" y="86" font-weight="700">ГРУДЬ ${chestCm} СМ</text>

      <line x1="${(cx + tgt.armOut + 4).toFixed(1)}" y1="110" x2="292" y2="110" stroke="rgba(233,213,255,0.3)" stroke-dasharray="2 2"/>
      <text x="292" y="106" text-anchor="end" font-weight="700">БИЦЕПС ${fmt(armCm, 1)} СМ</text>

      <line x1="8" y1="150" x2="${(cx - tgt.waist - 4).toFixed(1)}" y2="150" stroke="rgba(233,213,255,0.3)" stroke-dasharray="2 2"/>
      <text x="8" y="146" font-weight="700">ТАЛИЯ ${waistCm} СМ</text>

      <line x1="${(cx + tgt.quad + 4).toFixed(1)}" y1="212" x2="292" y2="212" stroke="rgba(233,213,255,0.3)" stroke-dasharray="2 2"/>
      <text x="292" y="208" text-anchor="end" font-weight="700">БЕДРО ${thighCm} СМ</text>
    </g>
  </svg>`;
}

/* ------------------------------------------- Gamification Badges SVG */
export function achievementBadgeSVG(art = 'achFirst', unlocked = false) {
  const stroke = unlocked ? '#60A5FA' : '#525866';
  const ringFill = unlocked ? 'rgba(59, 130, 246, 0.16)' : 'rgba(255, 255, 255, 0.025)';
  const ringBorder = unlocked ? 'rgba(96, 165, 250, 0.7)' : 'rgba(255, 255, 255, 0.12)';
  const shapes = {
    achFirst: `<path d="M16 25h20M19 25v6M33 25v6M21 21h10M26 16v5" stroke="${stroke}" stroke-width="2" stroke-linecap="round"/>`,
    achDay: `<path d="M18 26.5l5.2 5.2L34.5 20" stroke="${stroke}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`,
    achWeek: `<rect x="17" y="17" width="18" height="18" rx="4" stroke="${stroke}" stroke-width="1.9"/><path d="M21 26l3.2 3.2L31 22.5" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
    achStar: `<path d="M26 15.5l3.1 6.3 7 1-5 4.9 1.2 6.9-6.3-3.3-6.3 3.3 1.2-6.9-5-4.9 7-1z" stroke="${stroke}" stroke-width="1.9" stroke-linejoin="round"/>`,
    achFork: `<path d="M21 16v7a2.5 2.5 0 0 0 5 0v-7M23.5 16v20M31 16c0 4-2 6.5-2 9.5h2V36" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
    achFlame: `<path d="M26 15c3 5 7 8 7 13.5a7 7 0 0 1-14 0c0-3.2 1.8-6 3.5-8 0 2.5 1.5 3.8 2.5 3.8 1.2 0 2-1.8 1-9.3z" stroke="${stroke}" stroke-width="1.9" stroke-linejoin="round"/>`,
    ach100: `<text x="26" y="27" fill="${stroke}" font-family="JetBrains Mono, monospace" font-size="13" font-weight="700" text-anchor="middle" dominant-baseline="central">100</text>`,
    achBench: `<path d="M16 22h20M20 19v6M32 19v6M17 29h18M20 29v6M32 29v6" stroke="${stroke}" stroke-width="2" stroke-linecap="round"/>`,
    achTotal: `<path d="M14 26h24M18 20v12M21 22v8M34 20v12M31 22v8" stroke="${stroke}" stroke-width="2" stroke-linecap="round"/>`,
    achDeadlift: `<circle cx="26" cy="18" r="2.8" stroke="${stroke}" stroke-width="1.9"/><path d="M26 21v8M16 32h20M19 28v8M33 28v8" stroke="${stroke}" stroke-width="2" stroke-linecap="round"/>`,
    achGrip: `<path d="M28 15l-8 12h6l-2 10 8-12h-6l2-10z" stroke="${stroke}" stroke-width="1.9" stroke-linejoin="round"/>`,
    achTitan: `<path d="M26 15l9 5.2v11.6L26 37l-9-5.2V20.2L26 15z" stroke="${stroke}" stroke-width="1.9" stroke-linejoin="round"/><circle cx="26" cy="26" r="3.5" stroke="${stroke}" stroke-width="1.9"/>`,
  };
  return `
  <svg width="46" height="46" viewBox="0 0 52 52" fill="none" class="mx-auto block" aria-hidden="true">
    <circle cx="26" cy="26" r="23" fill="${ringFill}" stroke="${ringBorder}" stroke-width="1.6"/>
    ${shapes[art] || shapes.achFirst}
  </svg>`;
}

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
      <div class="sheet-panel anim-sheet" role="dialog" aria-modal="true">
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
        <h3 class="font-display text-base tracking-tight">${title}</h3>
        <div class="text-zinc-400 text-xs mt-2.5 leading-relaxed">${text}</div>
        <div class="grid grid-cols-2 gap-2 mt-5">
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
  t.className = `toast anim-toast tone-${tone}`;
  t.innerHTML = `<span class="toast-dot"></span><span>${esc(text)}</span>`;
  toastRoot.appendChild(t);
  setTimeout(() => { t.classList.add('anim-toast-out'); setTimeout(() => t.remove(), 260); }, 2600);
}

/* ------------------------------------------------------------ Charts */
export function lineChart(points, { h = 128, w = 340, color = '#9D6BFF', fmtY = (v) => fmt(v, 1), target = null } = {}) {
  if (!points || points.length < 2) return '';
  const pad = { l: 34, r: 10, t: 10, b: 20 };
  const vs = points.map(p => p.v).concat(target != null ? [target] : []);
  let min = Math.min(...vs), max = Math.max(...vs);
  if (max - min < 1) { min -= 1; max += 1; }
  const span = max - min;
  min -= span * 0.14; max += span * 0.14;
  const n = points.length;
  const X = (i) => pad.l + (i / (n - 1)) * (w - pad.l - pad.r);
  const Y = (v) => pad.t + (1 - (v - min) / (max - min)) * (h - pad.t - pad.b);
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(p.v).toFixed(1)}`).join(' ');
  const area = `${d} L${X(n - 1).toFixed(1)} ${h - pad.b} L${X(0).toFixed(1)} ${h - pad.b} Z`;
  const ticks = [max - (max - min) * 0.1, (max + min) / 2, min + (max - min) * 0.1];
  const gid = 'g' + Math.random().toString(36).slice(2, 8);
  return `
  <svg viewBox="0 0 ${w} ${h}" class="w-full h-auto block chart mt-2">
    <defs><linearGradient id="${gid}" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="${color}" stop-opacity=".28"/><stop offset="1" stop-color="${color}" stop-opacity="0"/>
    </linearGradient></defs>
    ${ticks.map(t => `<line x1="${pad.l}" x2="${w - pad.r}" y1="${Y(t).toFixed(1)}" y2="${Y(t).toFixed(1)}" stroke="rgba(255,255,255,.06)"/>
      <text x="${pad.l - 6}" y="${Y(t).toFixed(1)}" fill="#8A93A2" font-size="9" font-family="JetBrains Mono" text-anchor="end" dominant-baseline="central">${fmtY(t)}</text>`).join('')}
    <path d="${area}" fill="url(#${gid})"/>
    <path d="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    ${points.map((p, i) => `<circle cx="${X(i).toFixed(1)}" cy="${Y(p.v).toFixed(1)}" r="${i === n - 1 ? 3.5 : 2}" fill="${i === n - 1 ? color : '#09090B'}" stroke="${color}" stroke-width="1.5"/>`).join('')}
    <text x="${X(0)}" y="${h - 4}" fill="#8A93A2" font-size="9" font-family="JetBrains Mono">${points[0].label || ''}</text>
    <text x="${X(n - 1)}" y="${h - 4}" fill="#8A93A2" font-size="9" font-family="JetBrains Mono" text-anchor="end">${points[n - 1].label || ''}</text>
  </svg>`;
}

export function ring(frac, { size = 62, stroke = 5.5, color = 'var(--accent)', track = 'rgba(255,255,255,.10)' } = {}) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const f = Math.max(0, Math.min(1, frac));
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="-rotate-90 block">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="${track}" stroke-width="${stroke}" fill="none"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="${color}" stroke-width="${stroke}" fill="none" stroke-linecap="round"
      stroke-dasharray="${c.toFixed(2)}" stroke-dashoffset="${(c * (1 - f)).toFixed(2)}" class="ring-anim"/>
  </svg>`;
}

export function dualRing(outerFrac, innerFrac, { size = 128, outerColor = '#2CE56B', innerColor = '#E4E4E7' } = {}) {
  const s1 = 9.5, s2 = 7.5;
  const r1 = (size - s1) / 2;
  const r2 = r1 - 13;
  const c1 = 2 * Math.PI * r1;
  const c2 = 2 * Math.PI * r2;
  const f1 = clamp(outerFrac, 0, 1);
  const f2 = clamp(innerFrac, 0, 1);
  return `
  <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="-rotate-90 block">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r1}" stroke="rgba(255,255,255,0.09)" stroke-width="${s1}" fill="none"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r2}" stroke="rgba(255,255,255,0.08)" stroke-width="${s2}" fill="none"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r1}" stroke="${outerColor}" stroke-width="${s1}" fill="none" stroke-linecap="round"
      stroke-dasharray="${c1.toFixed(2)}" stroke-dashoffset="${(c1 * (1 - f1)).toFixed(2)}"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r2}" stroke="${innerColor}" stroke-width="${s2}" fill="none" stroke-linecap="round"
      stroke-dasharray="${c2.toFixed(2)}" stroke-dashoffset="${(c2 * (1 - f2)).toFixed(2)}"/>
  </svg>`;
}
