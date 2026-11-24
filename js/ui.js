/* ==========================================================================
   IRON DIARY · ui.js
   Vector icons, signal bars, custom Barbell SVG, Gourmet Food SVG art,
   Parametric Anatomical Physique SVG, Gamification Badges, Sheets & Charts.
   ========================================================================== */
import { PLATE_SPEC, fmt, clamp } from './engine.js';

/* ------------------------------------------------------------ Core Icons */
const P = {
  gym: '<path d="M3 10v4M6.5 7v10M17.5 7v10M21 10v4M6.5 12h11"/>',
  food: '<path d="M7 3v7a2.5 2.5 0 0 0 5 0V3M9.5 3v18M16.5 3c0 4-2 6-2 9h2v9"/>',
  body: '<circle cx="12" cy="4.5" r="2"/><path d="M6 9.5h12M12 9.5v5.5M12 15l-3 6M12 15l3 6"/>',
  strength: '<path d="M3.5 17.5l5.5-5.5 4 4 7.5-7.5"/><path d="M15 8.5h5.5V14"/>',
  week: '<rect x="4" y="5" width="16" height="16" rx="3"/><path d="M8 3v4M16 3v4M4 10h16M8 14h4M8 17.5h7"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.6v.2"/>',
  eye: '<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3"/><path d="M4 4l16 16"/>',
  check: '<path d="M5 12.5l4.5 4.5L19.5 7"/>',
  chevronDown: '<path d="M6 9l6 6 6-6"/>',
  chevronLeft: '<path d="M14.5 6.5L9 12l5.5 5.5"/>',
  chevronRight: '<path d="M9.5 6.5L15 12l-5.5 5.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  timer: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 10v3.5l2.4 2.4M9.5 2.8h5"/>',
  download: '<path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/>',
  upload: '<path d="M12 20V9M7 13.5l5-5 5 5M5 4h14"/>',
  trash: '<path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13"/>',
  disc: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="2.2"/>',
  reset: '<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4.5 4.5v4h4"/>',
  pencil: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0V4z"/><path d="M8 5.5H4.5v1.2A3.3 3.3 0 0 0 8 10M16 5.5h3.5v1.2A3.3 3.3 0 0 1 16 10M12 13v4M8.5 20h7"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
};

export function icon(name, size = 22, cls = '') {
  return `<svg class="ico ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || ''}</svg>`;
}

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ------------------------------------------- 5-Bar Signal Indicator */
export function signalBars(level = 3) {
  const heights = [4, 7, 10, 13, 16];
  return `<svg class="sig-bars" width="26" height="18" viewBox="0 0 26 18" aria-hidden="true">
    ${heights.map((h, idx) => {
      const on = idx < level;
      return `<rect x="${idx * 5 + 1}" y="${17 - h}" width="3.4" height="${h}" rx="1.4" class="${on ? 'sig-on' : 'sig-off'}"/>`;
    }).join('')}
  </svg>`;
}

/* ------------------------------------------- Exercise Vector Icons */
export function exerciseIcon(kind = 'exDeadlift', size = 44) {
  const paths = {
    exDeadlift: `
      <circle cx="24" cy="9" r="3.6" stroke="currentColor" stroke-width="2.4" fill="none"/>
      <path d="M24 13v13M24 18l-7 13M24 18l7 13M18 31l-3 5M30 31l3 5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
      <line x1="5" y1="31" x2="43" y2="31" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>
      <rect x="8" y="25" width="3.2" height="12" rx="1.2" fill="currentColor"/>
      <rect x="12.5" y="26.5" width="2.5" height="9" rx="1" fill="currentColor"/>
      <rect x="36.8" y="25" width="3.2" height="12" rx="1.2" fill="currentColor"/>
      <rect x="33" y="26.5" width="2.5" height="9" rx="1" fill="currentColor"/>`,
    exBench: `
      <line x1="7" y1="15" x2="41" y2="15" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>
      <rect x="10" y="9.5" width="3.2" height="11" rx="1.2" fill="currentColor"/>
      <rect x="34.8" y="9.5" width="3.2" height="11" rx="1.2" fill="currentColor"/>
      <path d="M16 15v13M32 15v13M11 28h26l3 4M14 28v7M34 28v7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="13" cy="24" r="3" stroke="currentColor" stroke-width="2.2" fill="none"/>`,
    exSquat: `
      <circle cx="24" cy="8.5" r="3.4" stroke="currentColor" stroke-width="2.3" fill="none"/>
      <line x1="5" y1="15" x2="43" y2="15" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>
      <rect x="8" y="9.5" width="3.2" height="11" rx="1.2" fill="currentColor"/>
      <rect x="36.8" y="9.5" width="3.2" height="11" rx="1.2" fill="currentColor"/>
      <path d="M24 12.5v10l-6 5 3 8M24 22.5l6 5-3 8" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`,
    exOhp: `
      <line x1="5" y1="9.5" x2="43" y2="9.5" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>
      <rect x="8" y="4.5" width="3" height="10" rx="1.2" fill="currentColor"/>
      <rect x="37" y="4.5" width="3" height="10" rx="1.2" fill="currentColor"/>
      <circle cx="24" cy="17" r="3.2" stroke="currentColor" stroke-width="2.2" fill="none"/>
      <path d="M16 9.5l4 10h8l4-10M24 20v9l-5 8M24 29l5 8" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>`,
    exRow: `
      <circle cx="32" cy="12" r="3.2" stroke="currentColor" stroke-width="2.2" fill="none"/>
      <path d="M30 15l-10 5-4 14M20 20l6 7v8M24 18l-2 11" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
      <line x1="10" y1="31" x2="38" y2="31" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
      <rect x="13" y="26" width="3" height="10" rx="1" fill="currentColor"/>
      <rect x="32" y="26" width="3" height="10" rx="1" fill="currentColor"/>`,
    exStrong: `
      <circle cx="24" cy="8.5" r="3.3" stroke="currentColor" stroke-width="2.3" fill="none"/>
      <path d="M17 15h14l2 11H15l2-11zM19 26l-2 10M29 26l2 10M15 16l-4 11M33 16l4 11" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="7.5" y="26" width="5" height="8" rx="1.5" fill="currentColor"/>
      <rect x="35.5" y="26" width="5" height="8" rx="1.5" fill="currentColor"/>`,
    exCore: `
      <line x1="6" y1="7" x2="42" y2="7" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>
      <circle cx="24" cy="15.5" r="3" stroke="currentColor" stroke-width="2.2" fill="none"/>
      <path d="M16 7l4 12h8L32 7M24 19v9l8 3" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`,
  };
  return `<svg width="${size}" height="${size}" viewBox="0 0 48 42" fill="none" class="ex-art" aria-hidden="true">${paths[kind] || paths.exDeadlift}</svg>`;
}

/* -------------------------------------------------- Custom Barbell SVG */
/**
 * Preserves the user's favorite detailed metallic barbell + competition plates,
 * positioned exactly where the reference app places its barbell visual!
 */
export function barbellSVG(plates, { collar = false, compact = false } = {}) {
  const W = compact ? 230 : 340;
  const H = compact ? 132 : 176;
  const cy = H / 2 - 4;
  const scale = compact ? 0.68 : 0.92;
  const shaftEnd = compact ? 34 : 58;
  const stopEnd = shaftEnd + (compact ? 13 : 18);

  const thick = plates.reduce((a, p) => a + PLATE_SPEC[p].t * scale + 1.5, 0);
  const avail = W - stopEnd - 34;
  const k = thick > avail ? avail / thick : 1;

  let x = stopEnd + 2;
  let platesHtml = '';
  const uid = Math.random().toString(36).slice(2, 7);

  plates.forEach((p, i) => {
    const s = PLATE_SPEC[p];
    const t = Math.max(compact ? 6 : 7, s.t * scale * k);
    const h = (s.d / 450) * (compact ? 104 : 146);
    const y = cy - h / 2;
    const rx = Math.min(5, t * 0.28);
    platesHtml += `
    <g class="plate-g" style="animation-delay:${i * 35}ms">
      <!-- Plate body with 3D bevel -->
      <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${t.toFixed(1)}" height="${h.toFixed(1)}" rx="${rx.toFixed(1)}" fill="${s.fill}"/>
      <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${t.toFixed(1)}" height="${h.toFixed(1)}" rx="${rx.toFixed(1)}" fill="url(#plSheen_${uid})"/>
      <!-- Side rim highlight -->
      <line x1="${(x + 1.2).toFixed(1)}" y1="${(y + 3).toFixed(1)}" x2="${(x + 1.2).toFixed(1)}" y2="${(y + h - 3).toFixed(1)}" stroke="rgba(255,255,255,0.32)" stroke-width="1" stroke-linecap="round"/>
      <rect x="${(x + 0.5).toFixed(1)}" y="${(y + 0.5).toFixed(1)}" width="${(t - 1).toFixed(1)}" height="${(h - 1).toFixed(1)}" rx="${rx.toFixed(1)}" fill="none" stroke="rgba(0,0,0,0.38)" stroke-width="1"/>
      ${!compact && t >= 12 ? `<text x="${(x + t / 2).toFixed(1)}" y="${cy}" fill="${s.ink}" font-family="JetBrains Mono, monospace" font-size="9" font-weight="700" text-anchor="middle" dominant-baseline="central" transform="rotate(-90 ${(x + t / 2).toFixed(1)} ${cy})" opacity=".92">${fmt(p)}</text>` : ''}
    </g>`;
    x += t + 1.4;
  });

  /* Competition collar clamp + outer sleeve tip */
  const collarW = compact ? 13 : 17;
  const collarH = compact ? 34 : 46;
  const collarHtml = `
    <g>
      <rect x="${(x + 0.5).toFixed(1)}" y="${(cy - collarH / 2).toFixed(1)}" width="${collarW}" height="${collarH}" rx="4" fill="#272A30" stroke="rgba(255,255,255,0.16)" stroke-width="1"/>
      <rect x="${(x + collarW - 4).toFixed(1)}" y="${(cy - collarH * 0.34).toFixed(1)}" width="6" height="${(collarH * 0.68).toFixed(1)}" rx="2.5" fill="url(#barSteel_${uid})"/>
    </g>`;

  const sleeveLen = Math.max(16, Math.min(34, W - (x + collarW) - 6));
  const sleeveTipX = x + collarW + 1;

  return `
  <svg viewBox="0 0 ${W} ${H}" class="w-full h-auto block barbell-svg" role="img" aria-label="Схема загрузки грифа">
    <defs>
      <linearGradient id="plSheen_${uid}" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stop-color="#ffffff" stop-opacity="0.28"/>
        <stop offset="0.18" stop-color="#ffffff" stop-opacity="0.06"/>
        <stop offset="0.55" stop-color="#000000" stop-opacity="0.05"/>
        <stop offset="1" stop-color="#000000" stop-opacity="0.46"/>
      </linearGradient>
      <linearGradient id="barSteel_${uid}" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stop-color="#F1F4F9"/>
        <stop offset="0.4" stop-color="#9CA3AF"/>
        <stop offset="0.8" stop-color="#4B5563"/>
        <stop offset="1" stop-color="#1F242D"/>
      </linearGradient>
      <radialGradient id="dropShadow_${uid}" cx="50%" cy="50%" r="50%">
        <stop offset="0" stop-color="#000000" stop-opacity="0.65"/>
        <stop offset="1" stop-color="#000000" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <!-- Floor shadow -->
    <ellipse cx="${(stopEnd + (x - stopEnd) / 2 + 8).toFixed(1)}" cy="${H - 7}" rx="${Math.max(36, (x - stopEnd) * 0.72 + 22).toFixed(1)}" ry="5.5" fill="url(#dropShadow_${uid})"/>
    <!-- Inner shaft -->
    <rect x="6" y="${cy - 4}" width="${shaftEnd - 6}" height="8" rx="2" fill="url(#barSteel_${uid})"/>
    <!-- Sleeve Flange -->
    <rect x="${shaftEnd}" y="${cy - (compact ? 14 : 19)}" width="${stopEnd - shaftEnd}" height="${compact ? 28 : 38}" rx="3" fill="url(#barSteel_${uid})"/>
    <!-- Outer Sleeve -->
    <rect x="${stopEnd}" y="${cy - (compact ? 6.5 : 8.5)}" width="${(sleeveTipX + sleeveLen - stopEnd).toFixed(1)}" height="${compact ? 13 : 17}" rx="2.5" fill="url(#barSteel_${uid})"/>
    ${platesHtml}
    ${collarHtml}
  </svg>`;
}

/* ------------------------------------------- Gourmet Food Illustrations */
export function foodHeroSVG() {
  return `
  <svg viewBox="0 0 130 130" class="w-[106px] h-[106px] shrink-0 block" aria-hidden="true">
    <defs>
      <radialGradient id="plateRim" cx="38%" cy="32%" r="70%">
        <stop offset="0" stop-color="#2D323B"/>
        <stop offset="0.7" stop-color="#181A20"/>
        <stop offset="1" stop-color="#0D0E12"/>
      </radialGradient>
      <radialGradient id="plateWell" cx="45%" cy="40%" r="65%">
        <stop offset="0" stop-color="#1E222A"/>
        <stop offset="1" stop-color="#111318"/>
      </radialGradient>
      <linearGradient id="steakGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#B4532A"/>
        <stop offset="0.5" stop-color="#8C3718"/>
        <stop offset="1" stop-color="#591E0B"/>
      </linearGradient>
      <radialGradient id="yolkGrad" cx="38%" cy="35%" r="60%">
        <stop offset="0" stop-color="#FFE066"/>
        <stop offset="0.55" stop-color="#F59E0B"/>
        <stop offset="1" stop-color="#D97706"/>
      </radialGradient>
    </defs>
    <!-- Drop shadow -->
    <circle cx="67" cy="70" r="56" fill="rgba(0,0,0,0.55)"/>
    <!-- Ceramic Plate Rim -->
    <circle cx="65" cy="65" r="56" fill="url(#plateRim)" stroke="rgba(255,255,255,0.12)" stroke-width="1.5"/>
    <circle cx="65" cy="65" r="46" fill="url(#plateWell)" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>

    <!-- Jasmine Rice cluster (bottom-left) -->
    <g fill="#F3F4F6" opacity="0.95">
      <ellipse cx="42" cy="58" rx="4.2" ry="1.9" transform="rotate(-25 42 58)"/>
      <ellipse cx="50" cy="54" rx="4.2" ry="1.9" transform="rotate(15 50 54)"/>
      <ellipse cx="36" cy="65" rx="4.2" ry="1.9" transform="rotate(30 36 65)"/>
      <ellipse cx="46" cy="64" rx="4.4" ry="2" transform="rotate(-10 46 64)"/>
      <ellipse cx="55" cy="62" rx="4.2" ry="1.9" transform="rotate(40 55 62)"/>
      <ellipse cx="40" cy="73" rx="4.2" ry="1.9" transform="rotate(-35 40 73)"/>
      <ellipse cx="49" cy="72" rx="4.2" ry="1.9" transform="rotate(22 49 72)"/>
      <ellipse cx="58" cy="70" rx="4.1" ry="1.8" transform="rotate(-15 58 70)"/>
      <ellipse cx="44" cy="80" rx="4.1" ry="1.8" transform="rotate(12 44 80)"/>
      <ellipse cx="53" cy="79" rx="4.1" ry="1.8" transform="rotate(-28 53 79)"/>
    </g>
    <!-- Black & gold sesame seeds on rice -->
    <circle cx="45" cy="61" r="1.1" fill="#1F2937"/>
    <circle cx="51" cy="67" r="1.1" fill="#F59E0B"/>
    <circle cx="42" cy="70" r="1.1" fill="#1F2937"/>
    <circle cx="54" cy="74" r="1.1" fill="#22C55E"/>

    <!-- Sunny-side-up Egg (top-left) -->
    <path d="M35 37c6-5 17-4 21 2 4 5 2 15-5 18-7 3-16 1-19-6-3-5-2-10 3-14z" fill="#F9FAFB"/>
    <circle cx="46" cy="45" r="7.5" fill="url(#yolkGrad)"/>
    <circle cx="43.8" cy="42.6" r="2.1" fill="#FFFBEB" opacity="0.85"/>

    <!-- Sear-marked Ribeye / Chicken Steak Slices (right side) -->
    <g>
      <rect x="68" y="34" width="26" height="12" rx="5.5" transform="rotate(-8 68 34)" fill="url(#steakGrad)" stroke="#3E1407" stroke-width="1"/>
      <line x1="74" y1="36" x2="71" y2="43" stroke="#2B0D04" stroke-width="1.6" stroke-linecap="round"/>
      <line x1="81" y1="35" x2="78" y2="42" stroke="#2B0D04" stroke-width="1.6" stroke-linecap="round"/>
      <line x1="88" y1="35" x2="85" y2="41" stroke="#2B0D04" stroke-width="1.6" stroke-linecap="round"/>

      <rect x="71" y="49" width="28" height="12.5" rx="6" transform="rotate(-4 71 49)" fill="url(#steakGrad)" stroke="#3E1407" stroke-width="1"/>
      <line x1="77" y1="51" x2="74" y2="59" stroke="#2B0D04" stroke-width="1.6" stroke-linecap="round"/>
      <line x1="85" y1="51" x2="82" y2="59" stroke="#2B0D04" stroke-width="1.6" stroke-linecap="round"/>
      <line x1="92" y1="50" x2="89" y2="58" stroke="#2B0D04" stroke-width="1.6" stroke-linecap="round"/>

      <rect x="69" y="65" width="27" height="12" rx="5.5" transform="rotate(3 69 65)" fill="url(#steakGrad)" stroke="#3E1407" stroke-width="1"/>
      <line x1="76" y1="67" x2="73" y2="75" stroke="#2B0D04" stroke-width="1.6" stroke-linecap="round"/>
      <line x1="84" y1="68" x2="81" y2="76" stroke="#2B0D04" stroke-width="1.6" stroke-linecap="round"/>
    </g>

    <!-- Avocado & fresh basil leaves (bottom) -->
    <g>
      <path d="M56 89c6-4 15-3 19 3-6 5-15 4-19-3z" fill="#16A34A"/>
      <path d="M58 89c5-2.5 11-2 14 2-4 3-10 2.5-14-2z" fill="#86EFAC"/>
      <path d="M77 86c5-5 12-4 14 2-5 5-12 4-14-2z" fill="#22C55E"/>
      <circle cx="66" cy="82" r="4.5" fill="#EF4444"/>
      <circle cx="64.5" cy="80.6" r="1.2" fill="#FECACA"/>
    </g>
  </svg>`;
}

export function mealArtSVG(kind = 'mealBreakfast') {
  const art = {
    mealBreakfast: `
      <circle cx="24" cy="24" r="21" fill="#181C22" stroke="rgba(255,255,255,0.1)" stroke-width="1.2"/>
      <!-- Oats bowl & berries -->
      <path d="M12 24c1-7 11-9 15-4 4 4 2 12-4 14-6 2-12-3-11-10z" fill="#E5DEC9"/>
      <circle cx="20" cy="22" r="5" fill="#F59E0B"/>
      <circle cx="18.6" cy="20.6" r="1.5" fill="#FEF3C7"/>
      <!-- Banana slices & berries -->
      <circle cx="31" cy="19" r="3.8" fill="#FDE047" stroke="#CA8A04" stroke-width="1"/>
      <circle cx="34" cy="25" r="3.8" fill="#FDE047" stroke="#CA8A04" stroke-width="1"/>
      <circle cx="28" cy="31" r="2.2" fill="#EF4444"/>
      <circle cx="33" cy="32" r="2" fill="#3B82F6"/>`,
    mealLunch: `
      <circle cx="24" cy="24" r="21" fill="#181C22" stroke="rgba(255,255,255,0.1)" stroke-width="1.2"/>
      <!-- Rice mound -->
      <circle cx="18" cy="25" r="8.5" fill="#F3F4F6"/>
      <circle cx="17" cy="23" r="1" fill="#22C55E"/>
      <circle cx="20" cy="26" r="1" fill="#1F2937"/>
      <!-- Grilled steak -->
      <rect x="24" y="15" width="13" height="7" rx="3.2" fill="#9A3412"/>
      <rect x="24" y="24" width="14" height="7" rx="3.2" fill="#B45309"/>
      <line x1="28" y1="16" x2="26" y2="21" stroke="#431407" stroke-width="1.3"/>
      <line x1="32" y1="16" x2="30" y2="21" stroke="#431407" stroke-width="1.3"/>
      <!-- Greens -->
      <circle cx="23" cy="34" r="3.2" fill="#22C55E"/>
      <circle cx="28" cy="35" r="2.8" fill="#16A34A"/>`,
    mealShake: `
      <circle cx="24" cy="24" r="21" fill="#181C22" stroke="rgba(255,255,255,0.1)" stroke-width="1.2"/>
      <!-- Shaker cup -->
      <path d="M17 15h14l-1.8 20a2.5 2.5 0 0 1-2.5 2.2h-5.4a2.5 2.5 0 0 1-2.5-2.2L17 15z" fill="#252A34" stroke="rgba(255,255,255,0.2)" stroke-width="1.2"/>
      <path d="M18.2 21h11.6l-1.1 13.5H19.3L18.2 21z" fill="#D97706" opacity="0.85"/>
      <rect x="15.5" y="12" width="17" height="3.5" rx="1.6" fill="#22C55E"/>
      <rect x="21" y="9.5" width="6" height="3" rx="1.2" fill="#16A34A"/>`,
    mealDinner: `
      <circle cx="24" cy="24" r="21" fill="#181C22" stroke="rgba(255,255,255,0.1)" stroke-width="1.2"/>
      <!-- Pasta swirls -->
      <circle cx="24" cy="24" r="12.5" fill="#F59E0B" opacity="0.9"/>
      <path d="M16 22c3-4 13-4 16 0M15 26c4 4 14 4 18 0" stroke="#FDE047" stroke-width="2" stroke-linecap="round" fill="none"/>
      <!-- Bolognese meat sauce & basil -->
      <circle cx="24" cy="24" r="6.5" fill="#991B1B"/>
      <circle cx="22" cy="23" r="1.4" fill="#7F1D1D"/>
      <circle cx="26" cy="25" r="1.4" fill="#7F1D1D"/>
      <path d="M23 19c2-2 5-1 5 2-2 2-5 1-5-2z" fill="#22C55E"/>`,
    mealNight: `
      <circle cx="24" cy="24" r="21" fill="#181C22" stroke="rgba(255,255,255,0.1)" stroke-width="1.2"/>
      <!-- Cottage cheese & almonds -->
      <circle cx="23" cy="25" r="11" fill="#F3F4F6"/>
      <circle cx="20" cy="22" r="3" fill="#FFFFFF"/>
      <circle cx="26" cy="23" r="3.2" fill="#FFFFFF"/>
      <circle cx="22" cy="28" r="3" fill="#FFFFFF"/>
      <ellipse cx="29" cy="28" rx="3.2" ry="1.8" transform="rotate(-30 29 28)" fill="#B45309"/>
      <ellipse cx="18" cy="27" rx="3" ry="1.7" transform="rotate(25 18 27)" fill="#B45309"/>
      <circle cx="24" cy="20" r="2" fill="#6366F1"/>`,
  };
  return `<svg width="46" height="46" viewBox="0 0 48 48" class="shrink-0 block" aria-hidden="true">${art[kind] || art.mealBreakfast}</svg>`;
}

/* ------------------------------------------- Anatomical Physique SVG */
/**
 * Parametric anatomical athlete figure for 190 cm / 203 cm wingspan.
 * Renders both the target physique (3D shaded muscular body) and the current
 * 95 kg dashed reference contour, plus dynamic muscle group morphing!
 */
export function physiqueSVG(currentKg = 95, targetKg = 125, heightCm = 190) {
  const buildPath = (kg) => {
    // Hypertrophy factor: 0 at 85 kg, 0.22 at 95 kg, 0.88 at 125 kg, 1.2 at 140 kg
    const m = clamp((kg - 85) / 45, -0.1, 1.25);
    const sh = 42 + m * 14;       // shoulder half-width
    const trap = 16 + m * 6;      // neck/trap base
    const lat = 31 + m * 13.5;    // upper lat flare
    const waist = 22.5 + m * 6.8; // waist half-width
    const hip = 26 + m * 7.5;     // hip/glute flare
    const quad = 31 + m * 12.5;   // outer quad sweep
    const knee = 18.5 + m * 3.8;  // knee outer
    const calf = 21 + m * 6.2;    // outer calf
    const ankle = 12.5 + m * 1.6; // outer ankle
    const armOut = sh + 7 + m * 7.5; // outer arm/bicep/tricep
    const foreOut = sh + 5 + m * 5.8; // outer forearm
    const armIn = sh - 5 - m * 1.5;

    // Symmetrical full-body contour around X = 150
    const cx = 150;
    const outer = `
      M ${cx} 22
      C ${cx + 12} 22, ${cx + 15} 31, ${cx + 14} 42
      C ${cx + 13} 49, ${cx + 11} 54, ${cx + 11} 58
      L ${cx + trap} 63
      C ${cx + sh * 0.72} 66, ${cx + sh} 70, ${cx + sh + 3} 79
      C ${cx + armOut + 1} 92, ${cx + armOut} 109, ${cx + armOut - 2} 124
      C ${cx + foreOut + 1} 138, ${cx + foreOut} 154, ${cx + foreOut - 4} 171
      C ${cx + foreOut - 2} 178, ${cx + foreOut - 5} 187, ${cx + foreOut - 10} 187
      C ${cx + armIn - 2} 186, ${cx + armIn - 3} 176, ${cx + armIn - 1} 168
      C ${cx + armIn + 1} 151, ${cx + armIn + 1} 135, ${cx + armIn} 118
      L ${cx + lat} 104
      C ${cx + lat - 1} 122, ${cx + waist + 2} 138, ${cx + waist} 154
      C ${cx + hip} 168, ${cx + quad + 1} 192, ${cx + quad} 218
      C ${cx + quad - 1} 236, ${cx + knee + 3} 252, ${cx + knee} 264
      C ${cx + calf + 2} 280, ${cx + calf} 299, ${cx + ankle + 2} 320
      L ${cx + ankle + 5} 334
      C ${cx + ankle + 6} 339, ${cx + 6} 340, ${cx + 5} 334
      L ${cx + 6} 319
      C ${cx + 5} 298, ${cx + 5} 280, ${cx + 6} 264
      C ${cx + 4} 246, ${cx + 3} 215, ${cx + 2} 186
      L ${cx} 183
      L ${cx - 2} 186
      C ${cx - 3} 215, ${cx - 4} 246, ${cx - 6} 264
      C ${cx - 5} 280, ${cx - 5} 298, ${cx - 6} 319
      L ${cx - 5} 334
      C ${cx - 6} 340, ${cx - ankle - 6} 339, ${cx - ankle - 5} 334
      L ${cx - ankle - 2} 320
      C ${cx - calf} 299, ${cx - calf - 2} 280, ${cx - knee} 264
      C ${cx - knee - 3} 252, ${cx - quad + 1} 236, ${cx - quad} 218
      C ${cx - quad - 1} 192, ${cx - hip} 168, ${cx - waist} 154
      C ${cx - waist - 2} 138, ${cx - lat + 1} 122, ${cx - lat} 104
      L ${cx - armIn} 118
      C ${cx - armIn - 1} 135, ${cx - armIn - 1} 151, ${cx - armIn + 1} 168
      C ${cx - armIn + 3} 176, ${cx - armIn + 2} 186, ${cx - foreOut + 10} 187
      C ${cx - foreOut + 5} 187, ${cx - foreOut + 2} 178, ${cx - foreOut + 4} 171
      C ${cx - foreOut} 154, ${cx - foreOut - 1} 138, ${cx - armOut + 2} 124
      C ${cx - armOut} 109, ${cx - armOut - 1} 92, ${cx - sh - 3} 79
      C ${cx - sh} 70, ${cx - sh * 0.72} 66, ${cx - trap} 63
      L ${cx - 11} 58
      C ${cx - 11} 54, ${cx - 13} 49, ${cx - 14} 42
      C ${cx - 15} 31, ${cx - 12} 22, ${cx} 22
      Z`;

    return { outer, m, sh, lat, waist, quad, calf, armOut };
  };

  const cur = buildPath(currentKg);
  const tgt = buildPath(targetKg);
  const cx = 150;
  const m = tgt.m;

  // Dynamic anthropological tape measurements for 190 cm athlete
  const chestCm = Math.round(107 + (targetKg - 95) * 0.72);
  const armCm = Math.round((39.5 + (targetKg - 95) * 0.31) * 10) / 10;
  const thighCm = Math.round(62 + (targetKg - 95) * 0.48);
  const waistCm = Math.round(84 + (targetKg - 95) * 0.42);

  return `
  <svg viewBox="0 0 300 356" class="w-full max-w-[330px] mx-auto h-auto block select-none" role="img" aria-label="Визуализация трансформации тела">
    <defs>
      <radialGradient id="bodyGlow" cx="50%" cy="44%" r="52%">
        <stop offset="0" stop-color="#A855F7" stop-opacity="0.32"/>
        <stop offset="0.6" stop-color="#7E22CE" stop-opacity="0.1"/>
        <stop offset="1" stop-color="#000000" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="bodyFill" x1="0.2" y1="0" x2="0.8" y2="1">
        <stop offset="0" stop-color="#C084FC"/>
        <stop offset="0.38" stop-color="#9333EA"/>
        <stop offset="0.78" stop-color="#6B21A8"/>
        <stop offset="1" stop-color="#4C1D95"/>
      </linearGradient>
      <linearGradient id="muscleLight" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#F3E8FF" stop-opacity="0.36"/>
        <stop offset="1" stop-color="#C084FC" stop-opacity="0.02"/>
      </linearGradient>
    </defs>

    <!-- Background aura & shadow -->
    <circle cx="150" cy="166" r="142" fill="url(#bodyGlow)"/>
    <ellipse cx="150" cy="340" rx="${42 + m * 14}" ry="6" fill="rgba(0,0,0,0.65)"/>

    <!-- TARGET WEIGHT SOLID ANATOMICAL SILHOUETTE -->
    <path d="${tgt.outer}" fill="url(#bodyFill)" stroke="#D8B4FE" stroke-width="1.3" stroke-opacity="0.65"/>

    <!-- 3D Muscle Highlights (Pecs, Delts, Quads, Abs) -->
    <g fill="url(#muscleLight)">
      <!-- Left & Right Pectoral Plates -->
      <path d="M ${cx - 3} 76 C ${cx - 16 - m * 5} 75, ${cx - tgt.lat + 2} 84, ${cx - tgt.lat + 3} 99 C ${cx - 22 - m * 4} 106, ${cx - 7} 104, ${cx - 3} 98 Z"/>
      <path d="M ${cx + 3} 76 C ${cx + 16 + m * 5} 75, ${cx + tgt.lat - 2} 84, ${cx + tgt.lat - 3} 99 C ${cx + 22 + m * 4} 106, ${cx + 7} 104, ${cx + 3} 98 Z"/>
      <!-- Deltoid caps -->
      <ellipse cx="${cx - tgt.sh + 1}" cy="86" rx="${7 + m * 2.5}" ry="14" transform="rotate(10 ${cx - tgt.sh} 86)"/>
      <ellipse cx="${cx + tgt.sh - 1}" cy="86" rx="${7 + m * 2.5}" ry="14" transform="rotate(-10 ${cx + tgt.sh} 86)"/>
      <!-- Quad sweep highlights -->
      <ellipse cx="${cx - tgt.quad * 0.58}" cy="214" rx="${7 + m * 3.5}" ry="27" transform="rotate(6 ${cx - tgt.quad * 0.58} 214)"/>
      <ellipse cx="${cx + tgt.quad * 0.58}" cy="214" rx="${7 + m * 3.5}" ry="27" transform="rotate(-6 ${cx + tgt.quad * 0.58} 214)"/>
    </g>

    <!-- Anatomical muscle separation lines -->
    <g stroke="#3B0764" stroke-opacity="0.58" stroke-width="1.5" stroke-linecap="round" fill="none">
      <!-- Clavicles & Sternum -->
      <path d="M ${cx - 26 - m * 4} 69 Q ${cx - 12} 73 ${cx - 2} 71"/>
      <path d="M ${cx + 26 + m * 4} 69 Q ${cx + 12} 73 ${cx + 2} 71"/>
      <line x1="${cx}" y1="74" x2="${cx}" y2="156"/>
      <!-- Pec lower contour -->
      <path d="M ${cx - tgt.lat + 3} 98 Q ${cx - 18 - m * 4} 108 ${cx - 2} 99"/>
      <path d="M ${cx + tgt.lat - 3} 98 Q ${cx + 18 + m * 4} 108 ${cx + 2} 99"/>
      <!-- Abdominal 6-pack & obliques -->
      <path d="M ${cx - 14 - m * 2} 112 Q ${cx} 115 ${cx + 14 + m * 2} 112"/>
      <path d="M ${cx - 15 - m * 2} 126 Q ${cx} 129 ${cx + 15 + m * 2} 126"/>
      <path d="M ${cx - 13 - m * 2} 140 Q ${cx} 143 ${cx + 13 + m * 2} 140"/>
      <path d="M ${cx - 15 - m * 2.5} 104 C ${cx - 18 - m * 2.5} 124, ${cx - 16 - m * 2} 144, ${cx - 7} 166"/>
      <path d="M ${cx + 15 + m * 2.5} 104 C ${cx + 18 + m * 2.5} 124, ${cx + 16 + m * 2} 144, ${cx + 7} 166"/>
      <!-- V-taper iliac crest -->
      <path d="M ${cx - tgt.waist + 3} 154 L ${cx - 8} 175"/>
      <path d="M ${cx + tgt.waist - 3} 154 L ${cx + 8} 175"/>
      <!-- Quadriceps teardrop (VMO) & sweep separation -->
      <path d="M ${cx - 14 - m * 3} 186 C ${cx - 20 - m * 4} 212, ${cx - 18 - m * 3} 238, ${cx - 11} 254"/>
      <path d="M ${cx + 14 + m * 3} 186 C ${cx + 20 + m * 4} 212, ${cx + 18 + m * 3} 238, ${cx + 11} 254"/>
      <path d="M ${cx - 8} 230 Q ${cx - 13 - m * 2} 245 ${cx - 7} 256"/>
      <path d="M ${cx + 8} 230 Q ${cx + 13 + m * 2} 245 ${cx + 7} 256"/>
      <!-- Calf gastrocnemius separation -->
      <path d="M ${cx - 13 - m * 2} 274 Q ${cx - 16 - m * 3} 292 ${cx - 12} 306"/>
      <path d="M ${cx + 13 + m * 2} 274 Q ${cx + 16 + m * 3} 292 ${cx + 12} 306"/>
    </g>

    <!-- CURRENT WEIGHT (95 KG) DASHED OVERLAY CONTOUR -->
    <path d="${cur.outer}" fill="none" stroke="#F3E8FF" stroke-width="1.6" stroke-dasharray="4 4" opacity="0.9"/>

    <!-- Live Anthropometric Callout Badges -->
    <g font-family="JetBrains Mono, monospace" font-size="9.5" fill="#D8B4FE" opacity="0.88">
      <line x1="12" y1="92" x2="${(cx - tgt.lat - 4).toFixed(1)}" y2="92" stroke="rgba(216,180,254,0.28)" stroke-dasharray="2 2"/>
      <text x="12" y="88" font-weight="600">ГРУДЬ ${chestCm} СМ</text>

      <line x1="${(cx + tgt.armOut + 4).toFixed(1)}" y1="112" x2="288" y2="112" stroke="rgba(216,180,254,0.28)" stroke-dasharray="2 2"/>
      <text x="288" y="108" text-anchor="end" font-weight="600">РУКА ${fmt(armCm, 1)} СМ</text>

      <line x1="12" y1="152" x2="${(cx - tgt.waist - 4).toFixed(1)}" y2="152" stroke="rgba(216,180,254,0.28)" stroke-dasharray="2 2"/>
      <text x="12" y="148" font-weight="600">ТАЛИЯ ${waistCm} СМ</text>

      <line x1="${(cx + tgt.quad + 4).toFixed(1)}" y1="214" x2="288" y2="214" stroke="rgba(216,180,254,0.28)" stroke-dasharray="2 2"/>
      <text x="288" y="210" text-anchor="end" font-weight="600">БЕДРО ${thighCm} СМ</text>
    </g>
  </svg>`;
}

/* ------------------------------------------- Gamification Badges SVG */
export function achievementBadgeSVG(art = 'achFirst', unlocked = false) {
  const stroke = unlocked ? '#3B82F6' : '#4B505E';
  const ringFill = unlocked ? 'rgba(59, 130, 246, 0.14)' : 'rgba(255, 255, 255, 0.02)';
  const ringBorder = unlocked ? '#3B82F6' : 'rgba(255, 255, 255, 0.13)';
  const shapes = {
    achFirst: `<path d="M16 25h20M19 25v6M33 25v6M21 21h10M26 16v5" stroke="${stroke}" stroke-width="2.2" stroke-linecap="round"/>`,
    achDay: `<path d="M18 26.5l5.2 5.2L34.5 20" stroke="${stroke}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`,
    achWeek: `<rect x="17" y="17" width="18" height="18" rx="4" stroke="${stroke}" stroke-width="2"/><path d="M21 26l3.2 3.2L31 22.5" stroke="${stroke}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`,
    achStar: `<path d="M26 15.5l3.1 6.3 7 1-5 4.9 1.2 6.9-6.3-3.3-6.3 3.3 1.2-6.9-5-4.9 7-1z" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>`,
    achFork: `<path d="M21 16v7a2.5 2.5 0 0 0 5 0v-7M23.5 16v20M31 16c0 4-2 6.5-2 9.5h2V36" stroke="${stroke}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`,
    achFlame: `<path d="M26 15c3 5 7 8 7 13.5a7 7 0 0 1-14 0c0-3.2 1.8-6 3.5-8 0 2.5 1.5 3.8 2.5 3.8 1.2 0 2-1.8 1-9.3z" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>`,
    ach100: `<text x="26" y="27" fill="${stroke}" font-family="JetBrains Mono, monospace" font-size="13.5" font-weight="700" text-anchor="middle" dominant-baseline="central">100</text>`,
    achBench: `<path d="M16 22h20M20 19v6M32 19v6M17 29h18M20 29v6M32 29v6" stroke="${stroke}" stroke-width="2.2" stroke-linecap="round"/>`,
    achTotal: `<path d="M14 26h24M18 20v12M21 22v8M34 20v12M31 22v8" stroke="${stroke}" stroke-width="2.2" stroke-linecap="round"/>`,
    achDeadlift: `<circle cx="26" cy="18" r="2.8" stroke="${stroke}" stroke-width="2"/><path d="M26 21v8M16 32h20M19 28v8M33 28v8" stroke="${stroke}" stroke-width="2.2" stroke-linecap="round"/>`,
    achGrip: `<path d="M28 15l-8 12h6l-2 10 8-12h-6l2-10z" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>`,
    achTitan: `<path d="M26 15l9 5.2v11.6L26 37l-9-5.2V20.2L26 15z" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/><circle cx="26" cy="26" r="3.5" stroke="${stroke}" stroke-width="2"/>`,
  };
  return `
  <svg width="54" height="54" viewBox="0 0 52 52" fill="none" class="mx-auto block" aria-hidden="true">
    <circle cx="26" cy="26" r="23" fill="${ringFill}" stroke="${ringBorder}" stroke-width="2"/>
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
        <h3 class="font-display text-lg tracking-tight">${title}</h3>
        <div class="text-zinc-400 text-sm mt-3 leading-relaxed">${text}</div>
        <div class="grid grid-cols-2 gap-2.5 mt-6">
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
export function lineChart(points, { h = 136, w = 340, color = '#9D6BFF', fmtY = (v) => fmt(v, 1), target = null } = {}) {
  if (!points || points.length < 2) {
    return '';
  }
  const pad = { l: 36, r: 10, t: 12, b: 22 };
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
      <text x="${pad.l - 6}" y="${Y(t).toFixed(1)}" fill="#71717A" font-size="9.5" font-family="JetBrains Mono" text-anchor="end" dominant-baseline="central">${fmtY(t)}</text>`).join('')}
    <path d="${area}" fill="url(#${gid})"/>
    <path d="${d}" fill="none" stroke="${color}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>
    ${points.map((p, i) => `<circle cx="${X(i).toFixed(1)}" cy="${Y(p.v).toFixed(1)}" r="${i === n - 1 ? 3.8 : 2.3}" fill="${i === n - 1 ? color : '#09090B'}" stroke="${color}" stroke-width="1.6"/>`).join('')}
    <text x="${X(0)}" y="${h - 5}" fill="#71717A" font-size="9.5" font-family="JetBrains Mono">${points[0].label || ''}</text>
    <text x="${X(n - 1)}" y="${h - 5}" fill="#71717A" font-size="9.5" font-family="JetBrains Mono" text-anchor="end">${points[n - 1].label || ''}</text>
  </svg>`;
}

export function ring(frac, { size = 72, stroke = 6.5, color = 'var(--accent)', track = 'rgba(255,255,255,.10)' } = {}) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const f = Math.max(0, Math.min(1, frac));
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="-rotate-90 block">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="${track}" stroke-width="${stroke}" fill="none"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="${color}" stroke-width="${stroke}" fill="none" stroke-linecap="round"
      stroke-dasharray="${c.toFixed(2)}" stroke-dashoffset="${(c * (1 - f)).toFixed(2)}" class="ring-anim"/>
  </svg>`;
}

export function dualRing(outerFrac, innerFrac, { size = 148, outerColor = '#2CE56B', innerColor = '#E4E4E7' } = {}) {
  const s1 = 11, s2 = 8.5;
  const r1 = (size - s1) / 2;
  const r2 = r1 - 15;
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
