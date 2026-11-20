// 1333 stilt house kit: blueprint sheets (SVG, 11 x 17 landscape) + materials estimate.
// Pure JS, no three.js: runs in the browser (guide.html, plans-print.html) and in Node
// (tools/build_downloads.py writes the SVG files). Every number comes from dims.js.
// Elevations and the section are an orthographic projection of simple solids drawn back to
// front (painter's order) with opaque fills, so hidden edges are covered.
// License: CC BY-SA 4.0 (drawings), MIT (code). Experimental, educational, not engineered.

import {
  FT, K, HW, HL, POSTS, POST_X, JOIST_OC, BRACE, WINDOWS, LOFT_WINDOW, DOORS, STOVE, CHIMNEY, TRAP,
  ISTAIR, LADDER, ROOF_SOLAR, PORCH, STAIR, TOWER, TOTE, TURBINE, SHED, PEN, ftin,
} from './dims.js?v=1';

export const REV = '2026-11';
const INK = '#1d1420', PLUM = '#322036', RIM = '#9B6CD8', LILAC = '#e0ccf8', MAUVE = '#96799c';
const FONT = "'MS UI Gothic', Arial, sans-serif";
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const n2 = v => (Math.round(v * 10) / 10).toString();

// ---------------------------------------------------------------------------------------------
// SVG writer. Page units: 0.01 in, so 1700 x 1100 = 17 x 11 in.
class Svg {
  constructor() { this.o = []; }
  raw(s) { this.o.push(s); return this; }
  line(x1, y1, x2, y2, c = 'm') { return this.raw(`<line class="${c}" x1="${n2(x1)}" y1="${n2(y1)}" x2="${n2(x2)}" y2="${n2(y2)}"/>`); }
  rect(x, y, w, h, c = 'm', extra = '') { return this.raw(`<rect class="${c}" x="${n2(Math.min(x, x + w))}" y="${n2(Math.min(y, y + h))}" width="${n2(Math.abs(w))}" height="${n2(Math.abs(h))}"${extra}/>`); }
  poly(pts, c = 'm', extra = '') { return this.raw(`<polygon class="${c}" points="${pts.map(p => n2(p[0]) + ',' + n2(p[1])).join(' ')}"${extra}/>`); }
  pline(pts, c = 'm') { return this.raw(`<polyline class="${c}" points="${pts.map(p => n2(p[0]) + ',' + n2(p[1])).join(' ')}"/>`); }
  circle(x, y, r, c = 'm') { return this.raw(`<circle class="${c}" cx="${n2(x)}" cy="${n2(y)}" r="${n2(r)}"/>`); }
  path(d, c = 'm') { return this.raw(`<path class="${c}" d="${d}"/>`); }
  text(x, y, s, { size = 13, anchor = 'start', weight = 'normal', fill = INK, rot = 0, ls = 0 } = {}) {
    const tr = rot ? ` transform="rotate(${rot} ${n2(x)} ${n2(y)})"` : '';
    return this.raw(`<text x="${n2(x)}" y="${n2(y)}" font-size="${size}" text-anchor="${anchor}" font-weight="${weight}" fill="${fill}"${ls ? ` letter-spacing="${ls}"` : ''}${tr}>${esc(s)}</text>`);
  }
  lines(x, y, arr, opt = {}, lh = (opt.size || 13) * 1.35) { arr.forEach((s, i) => this.text(x, y + i * lh, s, opt)); return this; }
  // horizontal dimension between page x1..x2 at page y (extension lines from yRef)
  dimH(x1, x2, y, label, yRef = null) {
    if (yRef !== null) { this.line(x1, yRef, x1, y + 6, 't'); this.line(x2, yRef, x2, y + 6, 't'); }
    this.line(x1, y, x2, y, 't');
    for (const x of [x1, x2]) this.line(x - 5, y + 5, x + 5, y - 5, 'm');
    return this.text((x1 + x2) / 2, y - 6, label, { size: 12, anchor: 'middle' });
  }
  dimV(y1, y2, x, label, xRef = null) {
    if (xRef !== null) { this.line(xRef, y1, x - 6, y1, 't'); this.line(xRef, y2, x - 6, y2, 't'); }
    this.line(x, y1, x, y2, 't');
    for (const y of [y1, y2]) this.line(x - 5, y + 5, x + 5, y - 5, 'm');
    return this.text(x - 7, (y1 + y2) / 2, label, { size: 12, anchor: 'middle', rot: -90 });
  }
  note(x, y, tx, ty, s, opt = {}) {
    this.line(x, y, tx, ty, 't'); this.circle(x, y, 2.5, 'dot');
    return this.text(tx + (tx >= x ? 4 : -4), ty + 4, s, { size: 12, anchor: tx >= x ? 'start' : 'end', ...opt });
  }
  toString() { return this.o.join('\n'); }
}

function wrap(str, max) {
  const out = []; let cur = '';
  for (const w of str.split(/\s+/)) {
    if ((cur + ' ' + w).trim().length > max) { out.push(cur); cur = w; } else cur = (cur + ' ' + w).trim();
  }
  if (cur) out.push(cur);
  return out;
}

const STYLE = `<style>
text{font-family:${FONT}}
.m{stroke:${INK};stroke-width:1.4;fill:none}
.h{stroke:${INK};stroke-width:2.6;fill:none}
.t{stroke:${INK};stroke-width:0.8;fill:none}
.d{stroke:${INK};stroke-width:1;fill:none;stroke-dasharray:8 5}
.c{stroke:${MAUVE};stroke-width:0.9;fill:none;stroke-dasharray:22 5 4 5}
.dot{fill:${INK}}
.wall{fill:#4a3a50;stroke:${INK};stroke-width:1.2}
.win{fill:#fff;stroke:${INK};stroke-width:0.9}
.fill{fill:#f3eefa;stroke:${INK};stroke-width:1.2}
.cut{fill:url(#hatch);stroke:${INK};stroke-width:2.2}
.wb{fill:#fff;stroke:none}
</style>
<defs><pattern id="hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="10" height="10" fill="#fff"/><line x1="0" y1="0" x2="0" y2="10" stroke="${INK}" stroke-width="1.6"/></pattern></defs>`;

// ---------------------------------------------------------------------------------------------
// Sheet frame: border, warning band, title block.
export const SHEETS_INDEX = [
  ['G-001', 'Cover, index, disclaimer, key specs'],
  ['C-101', 'Site plan'],
  ['S-101', 'Foundation and post plan'],
  ['S-102', 'Floor framing plan and brace detail'],
  ['A-101', 'Floor plans: floor 1, floor 2, loft + rain deck'],
  ['A-201', 'Elevations: south (porch) and north (tower)'],
  ['A-202', 'Elevations: west (loft gable) and east (deck end)'],
  ['A-301', 'Building section A-A'],
  ['A-401', 'Stair and porch detail'],
  ['P-101', 'Water, power and heat schematic'],
];

function frame(id, title, scale, body) {
  const s = new Svg();
  s.raw(`<rect x="0" y="0" width="1700" height="1100" fill="#fff"/>`);
  s.rect(30, 30, 1640, 1040, 'h');
  // warning band
  s.raw(`<rect x="30" y="930" width="1640" height="30" fill="${PLUM}"/>`);
  s.text(850, 951, 'EXPERIMENTAL · EDUCATIONAL · NOT FOR CONSTRUCTION WITHOUT LICENSED ENGINEER REVIEW AND PERMITS · BUILD AT YOUR OWN RISK', { size: 14, anchor: 'middle', fill: LILAC, ls: 1 });
  // title block
  s.rect(30, 960, 1640, 110, 'h');
  for (const x of [470, 1000, 1400]) s.line(x, 960, x, 1070, 'm');
  s.text(48, 996, '13 <33 COVENANT', { size: 24, weight: 'bold', fill: PLUM, ls: 3 });
  s.text(48, 1022, '1333 Stilt House Kit · 16 x 20 on stilts', { size: 14 });
  s.text(48, 1044, 'Devised by Kaiotei. Math + research support: AI.', { size: 12, fill: '#4a3a50' });
  s.text(488, 996, title.toUpperCase(), { size: 18, weight: 'bold', ls: 1 });
  s.text(488, 1022, `Scale: ${scale}`, { size: 13 });
  s.text(488, 1044, `Rev ${REV} · dimensions in feet-inches unless noted`, { size: 12, fill: '#4a3a50' });
  s.text(1018, 990, 'CC BY-SA 4.0 · Kaiotei / 13 <33 Covenant', { size: 13, weight: 'bold' });
  s.text(1018, 1012, 'Share and adapt with credit, under the same license.', { size: 12 });
  s.text(1018, 1032, 'creativecommons.org/licenses/by-sa/4.0', { size: 12 });
  s.text(1018, 1052, '1333covenant.com/irl/house', { size: 12 });
  s.text(1535, 1018, id, { size: 40, weight: 'bold', anchor: 'middle', fill: PLUM });
  s.text(1535, 1048, `Sheet ${SHEETS_INDEX.findIndex(r => r[0] === id) + 1} of ${SHEETS_INDEX.length}`, { size: 13, anchor: 'middle' });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1700 1100" width="17in" height="11in">\n${STYLE}\n${s}\n${body}\n</svg>`;
}

function label(s, x, y, t, sub) {
  s.text(x, y, t, { size: 15, weight: 'bold', ls: 1 });
  s.line(x, y + 5, x + Math.max(160, t.length * 9), y + 5, 'm');
  if (sub) s.text(x, y + 22, sub, { size: 12 });
}

// ---------------------------------------------------------------------------------------------
// 3D solids (feet) for elevations + section. Each = 8+ corner points, a fill, an id.
const F = { wall: '#fff', bat: '#fff', glass: '#dfe8ee', trim: '#fff', timber: '#f6f1ea', metal: '#eef0f2', concrete: '#e8e5df',
  solar: '#5a6682', dark: '#77777c', pvc: '#fff', tote: '#f8f8f3', car: '#dde1e6', tire: '#55555a', floor: '#efe6d8' };

function solids() {
  const L = [];
  const B = (x0, y0, z0, x1, y1, z1, c) => {
    const p = [];
    for (const x of [x0, x1]) for (const y of [y0, y1]) for (const z of [z0, z1]) p.push([x, y, z]);
    L.push({ p, c, min: [Math.min(x0, x1), Math.min(y0, y1), Math.min(z0, z1)], max: [Math.max(x0, x1), Math.max(y0, y1), Math.max(z0, z1)] });
  };
  const Q = (p, c) => {
    const min = [0, 1, 2].map(i => Math.min(...p.map(q => q[i]))), max = [0, 1, 2].map(i => Math.max(...p.map(q => q[i])));
    L.push({ p, c, min, max });
  };
  const beam = (a, b, t, c) => {
    const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], len = Math.hypot(...d), u = d.map(v => v / len);
    let p1 = [u[2], 0, -u[0]]; let l1 = Math.hypot(...p1);
    if (l1 < 1e-3) { p1 = [1, 0, 0]; l1 = 1; }
    p1 = p1.map(v => v / l1 * t / 2);
    const p2 = [u[1] * p1[2] - u[2] * p1[1], u[2] * p1[0] - u[0] * p1[2], u[0] * p1[1] - u[1] * p1[0]];
    const pts = [];
    for (const e of [a, b]) for (const s1 of [-1, 1]) for (const s2 of [-1, 1]) pts.push([0, 1, 2].map(i => e[i] + s1 * p1[i] + s2 * p2[i]));
    Q(pts, c);
  };
  const rz = (cx, cy, cz, sx, sy, sz, ang, c) => {          // box rotated about z
    const co = Math.cos(ang), si = Math.sin(ang), pts = [];
    for (const a of [-sx / 2, sx / 2]) for (const b of [-sy / 2, sy / 2]) for (const z of [cz - sz / 2, cz + sz / 2]) pts.push([cx + a * co - b * si, cy + a * si + b * co, z]);
    Q(pts, c);
  };
  const disc = (cx, cy, cz, r, w, c) => {                     // wheel: 12-gon prism along x
    const pts = [];
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; for (const x of [cx - w / 2, cx + w / 2]) pts.push([x, cy + Math.sin(a) * r, cz + Math.cos(a) * r]); }
    Q(pts, c);
  };
  const bTop = K.clear + K.beam, px = POST_X, t = K.wall;
  // piers, posts, beams, joists, braces, floor 1
  for (const [x, z] of POSTS) { B(x - 1, -0.2, z - 1, x + 1, 1, z + 1, 'concrete'); B(x - K.post / 2, 1, z - K.post / 2, x + K.post / 2, bTop, z + K.post / 2, 'timber'); }
  for (const x of [-px, px]) B(x - 0.34, K.clear, -HL, x + 0.34, bTop, HL, 'timber');
  for (const z of [-HL + 0.34, 0, HL - 0.34]) B(-HW, K.clear, z - 0.3, HW, bTop, z + 0.3, 'timber');
  for (const x of [-px, px]) {
    beam([x, K.clear - BRACE, -HL + 0.34], [x, K.clear, -HL + 0.34 + BRACE], 0.4, 'timber');
    beam([x, K.clear - BRACE, 0], [x, K.clear, -BRACE], 0.4, 'timber');
    beam([x, K.clear - BRACE, 0], [x, K.clear, BRACE], 0.4, 'timber');
    beam([x, K.clear - BRACE, HL - 0.34], [x, K.clear, HL - 0.34 - BRACE], 0.4, 'timber');
  }
  for (const z of [-HL + 0.34, HL - 0.34]) { beam([-px, K.clear - BRACE, z], [-px + BRACE, K.clear, z], 0.4, 'timber'); beam([px, K.clear - BRACE, z], [px - BRACE, K.clear, z], 0.4, 'timber'); }
  B(-HW, bTop, -HL, HW, K.f1, HL, 'floor');
  // car
  const cz = 1.4;
  B(-3.1, 1.2, cz - 7.75, 3.1, 4.1, cz + 7.75, 'car'); B(-2.85, 4.1, cz - 7.15, 2.85, 6.0, cz + 3.55, 'car');
  B(-2.9, 4.4, cz - 6.75, 2.9, 5.75, cz + 3.25, 'glass');
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) disc(sx * 2.75, 1.25, cz + sz * 4.9, 1.25, 0.9, 'tire');
  // walls, battens, trim, windows, door
  B(-HW, K.f1, -HL, -HW + t, K.top, HL, 'wall'); B(HW - t, K.f1, -HL, HW, K.top, HL, 'wall');
  B(-HW + t, K.f1, -HL, HW - t, K.top, -HL + t, 'wall'); B(-HW + t, K.f1, HL - t, HW - t, K.top, HL, 'wall');
  for (let z = -HL + 1; z < HL; z += 1.5) { B(-HW - 0.12, K.f1, z - 0.11, -HW, K.top, z + 0.11, 'bat'); B(HW, K.f1, z - 0.11, HW + 0.12, K.top, z + 0.11, 'bat'); }
  for (let x = -HW + 1; x < HW; x += 1.5) { B(x - 0.11, K.f1, -HL - 0.12, x + 0.11, K.top, -HL, 'bat'); B(x - 0.11, K.f1, HL, x + 0.11, K.top, HL + 0.12, 'bat'); }
  const win = (w) => {
    const o = 0.45, fr = 0.25;
    if (w.wall[1] === 'x') { const f = w.wall[0] === '-' ? -HW : HW; B(f - o - 0.05, w.y0 - fr, w.at - w.w / 2 - fr, f + o + 0.05, w.y0 + w.h + fr, w.at + w.w / 2 + fr, 'trim'); B(f - o - 0.1, w.y0, w.at - w.w / 2, f + o + 0.1, w.y0 + w.h, w.at + w.w / 2, 'glass'); }
    else { const f = w.wall[0] === '-' ? -HL : HL; B(w.at - w.w / 2 - fr, w.y0 - fr, f - o - 0.05, w.at + w.w / 2 + fr, w.y0 + w.h + fr, f + o + 0.05, 'trim'); B(w.at - w.w / 2, w.y0, f - o - 0.1, w.at + w.w / 2, w.y0 + w.h, f + o + 0.1, 'glass'); }
  };
  WINDOWS.forEach(win); win(LOFT_WINDOW);
  const D = DOORS.porch;
  B(HW - 0.1, D.y0, D.at - D.w / 2 - 0.3, HW + 0.5, D.y0 + D.h + 0.3, D.at + D.w / 2 + 0.3, 'trim');
  B(HW - 0.1, D.y0, D.at - D.w / 2, HW + 0.55, D.y0 + D.h, D.at + D.w / 2, 'timber');
  // floor 2, loft / deck floor, gables, roof, ridge, chimney, loft door
  B(-HW + t, K.f2 - 0.5, -HL + t, HW - t, K.f2, HL - t, 'floor');
  B(-HW, K.top, -HL, HW, K.top + 0.3, HL, 'floor');
  for (const z of [-HL, -0.5]) Q([[-HW, K.top, z], [HW, K.top, z], [0, K.ridge, z], [-HW, K.top, z + 0.5], [HW, K.top, z + 0.5], [0, K.ridge, z + 0.5]], 'wall');
  const s2 = Math.SQRT1_2, slope = K.pitch * Math.SQRT2 + 1.2;
  for (const side of [-1, 1]) rz(side * HW / 2 + side * 0.75 * s2, K.top + K.pitch / 2 - 0.45 * s2, -5.375, slope, 0.18, 11.25, -side * Math.PI / 4, 'metal');
  B(-0.4, K.ridge + 0.1, -HL - 1, 0.4, K.ridge + 0.4, 0.25, 'metal');
  for (const z of ROOF_SOLAR.z) rz(HW / 2 + 0.45 * s2, K.top + K.pitch / 2 + 0.45 * s2, z, ROOF_SOLAR.len, 0.15, ROOF_SOLAR.wid, -Math.PI / 4, 'solar');
  B(CHIMNEY.x - CHIMNEY.r, K.f1 + STOVE.h, CHIMNEY.z - CHIMNEY.r, CHIMNEY.x + CHIMNEY.r, CHIMNEY.cap - 0.5, CHIMNEY.z + CHIMNEY.r, 'dark');
  B(CHIMNEY.x - 0.55, CHIMNEY.cap - 0.6, CHIMNEY.z - 0.55, CHIMNEY.x + 0.55, CHIMNEY.cap - 0.35, CHIMNEY.z + 0.55, 'dark');
  B(CHIMNEY.x - 0.5, CHIMNEY.cap - 0.1, CHIMNEY.z - 0.5, CHIMNEY.x + 0.5, CHIMNEY.cap + 0.1, CHIMNEY.z + 0.5, 'dark');
  B(STOVE.x0, K.f1 + 0.9, STOVE.z0, STOVE.x1, K.f1 + STOVE.h, STOVE.z1, 'dark');
  B(-DOORS.loft.w / 2, DOORS.loft.y0, -0.6, DOORS.loft.w / 2, DOORS.loft.y0 + DOORS.loft.h, 0.1, 'timber');
  // interior stair + ladder (assumption)
  for (let i = 0; i < ISTAIR.n; i++) { const r = K.story / ISTAIR.n, rn = 8 / ISTAIR.n; B(ISTAIR.x0, K.f1 + i * r, ISTAIR.zLow - (i + 1) * rn, ISTAIR.x1, K.f1 + (i + 1) * r, ISTAIR.zLow - i * rn, 'timber'); }
  for (const x of [LADDER.x0, LADDER.x1]) B(x - 0.1, K.f2, LADDER.z - 0.12, x + 0.1, K.top, LADDER.z + 0.12, 'timber');
  // rain deck: surface, rails, gutters
  const dy = K.top + 0.3;
  B(-HW, dy, 0, HW, dy + 0.12, HL, 'metal');
  for (let z = 0.5; z <= HL; z += 3.2) { B(-HW, dy, Math.min(z, HL - 0.2) - 0.17, -HW + 0.33, dy + K.rail, Math.min(z, HL - 0.2) + 0.17, 'timber'); B(HW - 0.33, dy, Math.min(z, HL - 0.2) - 0.17, HW, dy + K.rail, Math.min(z, HL - 0.2) + 0.17, 'timber'); }
  for (let x = -HW + 0.2; x <= HW; x += 3.2) B(x - 0.17, dy, HL - 0.37, x + 0.17, dy + K.rail, HL - 0.03, 'timber');
  for (const h of [K.rail, K.rail / 2]) {
    B(-HW + 0.05, dy + h - 0.12, 0.3, -HW + 0.35, dy + h + 0.12, HL - 0.05, 'timber'); B(HW - 0.35, dy + h - 0.12, 0.3, HW - 0.05, dy + h + 0.12, HL - 0.05, 'timber');
    B(-HW + 0.05, dy + h - 0.12, HL - 0.35, HW - 0.05, dy + h + 0.12, HL - 0.05, 'timber');
  }
  B(-HW - 0.55, K.top - 0.45, 0, -HW - 0.05, K.top - 0.1, HL + 0.3, 'pvc'); B(HW + 0.05, K.top - 0.45, 0, HW + 0.55, K.top - 0.1, HL + 0.3, 'pvc');
  B(-HW - 0.55, K.top - 0.45, HL + 0.05, HW + 0.55, K.top - 0.1, HL + 0.55, 'pvc');
  // porch + stair
  const P = PORCH, S = STAIR, top = K.f1;
  B(P.x0, top - 0.25, P.z0, P.x1, top, P.z1, 'floor');
  B(P.x0, top - 0.95, P.z0, P.x1, top - 0.25, P.z0 + 0.4, 'timber'); B(P.x0, top - 0.95, P.z1 - 0.4, P.x1, top - 0.25, P.z1, 'timber');
  for (const z of [P.z0 + 0.3, P.z1 - 0.3]) { B(P.x1 - 1, -0.2, z - 0.7, P.x1 + 0.4, 1, z + 0.7, 'concrete'); B(P.x1 - 0.55, 1, z - 0.25, P.x1 - 0.05, top - 0.25, z + 0.25, 'timber'); }
  const zr = P.z0 + 0.15, xr = P.x1 - 0.2, sl = S.rise / S.run, railY = (z, h) => top + h + (z - zr) * sl;
  for (let z = zr; z < P.z1 - 0.3; z += 2.5) B(xr - 0.15, top, z - 0.15, xr + 0.15, top + P.rail + 0.15, z + 0.15, 'timber');
  B(xr - 0.15, top, P.z1 - 0.35, xr + 0.15, top + P.rail + 0.15, P.z1 - 0.05, 'timber');
  for (const h of [P.rail, P.rail / 2]) {
    B(xr - 0.15, top + h - 0.1, zr, xr + 0.15, top + h + 0.1, P.z1, 'timber');
    B(P.x0, top + h - 0.1, P.z1 - 0.35, P.x1, top + h + 0.1, P.z1 - 0.05, 'timber');
    B(S.x1, top + h - 0.1, zr - 0.15, xr, top + h + 0.1, zr + 0.15, 'timber');
  }
  for (let i = 0; i < S.n - 1; i++) B(S.x0, top - (i + 1) * S.rise - 0.15, P.z0 - (i + 1) * S.run - 0.05, S.x1, top - (i + 1) * S.rise, P.z0 - i * S.run + 0.05, 'timber');
  for (const x of [S.x0, S.x1]) {
    beam([x, top - 0.3, P.z0], [x, 0.2, S.zEnd - 0.4], 0.5, 'timber');
    B(x - 0.17, top - 1, zr - 0.17, x + 0.17, top + P.rail + 0.15, zr + 0.17, 'timber');
    for (const h of [P.rail, P.rail / 2]) beam([x, railY(zr, h), zr], [x, railY(S.zEnd, h), S.zEnd], 0.2, 'timber');
    const hb = railY(S.zEnd, P.rail) + 0.15; B(x - 0.15, 0, S.zEnd - 0.15, x + 0.15, hb, S.zEnd + 0.15, 'timber');
  }
  B(S.x0 - 0.4, -0.1, S.zEnd - 2.2, S.x1 + 0.4, 0.2, S.zEnd + 0.2, 'concrete');
  // water tower
  const T = TOWER, h = T.half;
  for (const [ax, az] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { B(T.x + ax * h - 0.8, -0.2, T.z + az * h - 0.8, T.x + ax * h + 0.8, 1, T.z + az * h + 0.8, 'concrete'); B(T.x + ax * h - 0.25, 1, T.z + az * h - 0.25, T.x + ax * h + 0.25, T.top, T.z + az * h + 0.25, 'timber'); }
  for (const ly of [...T.levels, T.top]) B(T.x - h - 0.25, ly - 0.6, T.z - h - 0.25, T.x + h + 0.25, ly, T.z + h + 0.25, 'timber');
  for (const [y0, y1] of [[1, T.levels[0] - 0.6], [T.levels[0], T.levels[1] - 0.6], [T.levels[1], T.top - 0.6]]) for (const s of [-1, 1]) {
    beam([T.x - h, y0, T.z + s * h], [T.x + h, y1, T.z + s * h], 0.3, 'timber'); beam([T.x + h, y0, T.z + s * h], [T.x - h, y1, T.z + s * h], 0.3, 'timber');
    beam([T.x + s * h, y0, T.z - h], [T.x + s * h, y1, T.z + h], 0.3, 'timber'); beam([T.x + s * h, y0, T.z + h], [T.x + s * h, y1, T.z - h], 0.3, 'timber');
  }
  for (const ly of T.levels) { B(T.x - TOTE.W / 2, ly, T.z - TOTE.D / 2, T.x + TOTE.W / 2, ly + 0.45, T.z + TOTE.D / 2, 'dark'); B(T.x - TOTE.W / 2, ly + 0.45, T.z - TOTE.D / 2, T.x + TOTE.W / 2, ly + TOTE.H, T.z + TOTE.D / 2, 'tote'); }
  rz(T.x, T.top + 1.2, T.z, 5.4, 0.12, 3.2, Math.PI / 6, 'solar');
  // rain line + supply
  const tx = T.x, tz = T.z;
  beam([-HW - 0.3, K.top - 0.4, 1.5], [tx + 4.4, 14.25, tz + 2.2], 0.36, 'pvc');
  beam([tx + 4.4, 14.25, tz + 2.2], [tx + 1.6, 14.25, tz + 1.4], 0.36, 'pvc');
  beam([-HW - 0.3, K.top - 0.45, 1], [-HW - 0.3, K.top - 4.1, 1], 0.44, 'pvc');
  beam([tx + 1.7, 5.7, tz - 1.2], [-HW - 0.4, 5.7, tz - 1.2], 0.24, 'dark');
  beam([-HW - 0.4, 5.7, tz - 1.2], [-HW - 0.4, K.clear + 0.2, tz - 1.2], 0.24, 'dark');
  return L;
}

// orthographic views: right vector R, forward F (into the page)
const VIEWS = {
  south: { R: [0, 0, -1], F: [-1, 0, 0] },
  north: { R: [0, 0, 1], F: [1, 0, 0] },
  west: { R: [-1, 0, 0], F: [0, 0, 1] },
  east: { R: [1, 0, 0], F: [0, 0, -1] },
};
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
function hull(pts) {
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}

// Draws a view into a box. Returns the mapping so callers can add dims and level tags.
function drawView(svg, view, box, scale, { cut = null, filter = null } = {}) {
  const V = VIEWS[view], all = solids();
  const keep = [], cutL = [];
  for (const e of all) {
    if (filter && !filter(e)) continue;
    if (cut) {
      const d0 = dot(e.min, V.F), d1 = dot(e.max, V.F), lo = Math.min(d0, d1), hi = Math.max(d0, d1);
      const c = dot(cut.at, V.F);
      if (hi <= c) continue;                    // in front of the cut: removed
      if (lo < c) { cutL.push(e); continue; }   // crosses the cut plane
    }
    keep.push(e);
  }
  const proj = e => e.p.map(q => [dot(q, V.R), q[1]]);
  let u0 = Infinity, u1 = -Infinity, v1 = 0;
  for (const e of [...keep, ...cutL]) for (const [u, v] of proj(e)) { u0 = Math.min(u0, u); u1 = Math.max(u1, u); v1 = Math.max(v1, v); }
  const ox = box.x + box.w / 2 - ((u0 + u1) / 2) * scale, oy = box.y + box.h;
  const X = u => ox + u * scale, Y = v => oy - v * scale;
  const depth = e => dot(e.p.reduce((a, q) => [a[0] + q[0], a[1] + q[1], a[2] + q[2]], [0, 0, 0]).map(v => v / e.p.length), V.F);
  keep.sort((a, b) => depth(b) - depth(a));
  const draw = (e, cls) => {
    const h = hull(proj(e)).map(([u, v]) => [X(u), Y(v)]);
    svg.poly(h, cls, cls === 'cut' ? '' : ` fill="${F[e.c] || '#fff'}" stroke="${INK}" stroke-width="${e.c === 'bat' ? 0.5 : 1}"`);
  };
  for (const e of keep) draw(e, '');
  for (const e of cutL) draw(e, ['glass', 'tote', 'car', 'tire'].includes(e.c) ? '' : 'cut');
  svg.line(X(u0) - 40, oy, X(u1) + 40, oy, 'h');                       // grade
  return { X, Y, u0, u1, v1, ox, oy };
}

function levelTags(svg, x, Y, list) {
  for (const [v, name] of list) {
    const y = Y(v);
    svg.line(x - 30, y, x + 140, y, 't');
    svg.poly([[x - 30, y], [x - 40, y - 9], [x - 20, y - 9]], 'm', ` fill="${PLUM}"`);
    svg.text(x - 14, y - 4, `${name} ${ftin(v)}`, { size: 12 });
  }
}
const LEVELS = [[0, 'GRADE'], [K.clear, 'CARPORT CLEAR'], [K.f1, 'FLOOR 1'], [K.f2, 'FLOOR 2'], [K.top, 'LOFT / DECK'], [K.ridge, 'RIDGE']];

// ---------------------------------------------------------------------------------------------
// Plan helpers: page x = z (west left, east right), page y = x (north up).
function planMap(ox, oy, s) { return { X: z => ox + z * s, Y: x => oy + x * s, s }; }

function planWalls(svg, m, floorY) {
  const { X, Y, s } = m, t = K.wall;
  svg.rect(X(-HL), Y(-HW), K.L * s, t * s, 'wall'); svg.rect(X(-HL), Y(HW - t), K.L * s, t * s, 'wall');
  svg.rect(X(-HL), Y(-HW), t * s, K.W * s, 'wall'); svg.rect(X(HL - t), Y(-HW), t * s, K.W * s, 'wall');
  const opening = (wall, at, w, kind) => {
    if (wall[1] === 'x') {
      const y = wall[0] === '-' ? Y(-HW) : Y(HW - t);
      svg.rect(X(at - w / 2), y, w * s, t * s, 'win');
      if (kind === 'win') { svg.line(X(at - w / 2), y + t * s / 2, X(at + w / 2), y + t * s / 2, 't'); }
    } else {
      const x = wall[0] === '-' ? X(-HL) : X(HL - t);
      svg.rect(x, Y(at - w / 2), t * s, w * s, 'win');
      if (kind === 'win') svg.line(x + t * s / 2, Y(at - w / 2), x + t * s / 2, Y(at + w / 2), 't');
    }
  };
  for (const w of WINDOWS) if (w.y0 > floorY && w.y0 < floorY + K.story) opening(w.wall, w.at, w.w, 'win');
  return opening;
}

function porchPlan(svg, m, withStair = true) {
  const { X, Y, s } = m, P = PORCH, S = STAIR;
  svg.rect(X(P.z0), Y(P.x0), (P.z1 - P.z0) * s, (P.x1 - P.x0) * s, 'fill');
  svg.line(X(P.z0 + 0.15), Y(P.x1 - 0.2), X(P.z1), Y(P.x1 - 0.2), 'm');
  svg.line(X(P.z1 - 0.2), Y(P.x0), X(P.z1 - 0.2), Y(P.x1), 'm');
  svg.line(X(P.z0 + 0.15), Y(S.x1), X(P.z0 + 0.15), Y(P.x1 - 0.2), 'm');
  if (!withStair) return;
  svg.rect(X(S.zEnd), Y(S.x0), (P.z0 - S.zEnd) * s, S.width * s, 'm');
  for (let i = 1; i < S.n - 1; i++) svg.line(X(P.z0 - i * S.run), Y(S.x0), X(P.z0 - i * S.run), Y(S.x1), 't');
  const ym = Y((S.x0 + S.x1) / 2);
  svg.line(X(P.z0 - 0.5), ym, X(S.zEnd + 0.8), ym, 'm');
  svg.poly([[X(S.zEnd + 0.4), ym], [X(S.zEnd + 1.1), ym - 6], [X(S.zEnd + 1.1), ym + 6]], 'm', ` fill="${INK}"`);
  svg.text(X(S.zEnd + 1.5), ym - 8, 'DN', { size: 12, weight: 'bold' });
}

// ---------------------------------------------------------------------------------------------
// Sheets
function G001() {
  const s = new Svg();
  s.text(70, 120, '1333 STILT HOUSE KIT', { size: 54, weight: 'bold', fill: PLUM, ls: 6 });
  s.text(72, 160, '16 x 20 ft plate on stilts · two floors + half loft · carport under · rooftop rain deck · gravity water tower', { size: 18 });
  s.text(72, 188, 'Open-source concept plans for off-grid and sustainable living. A basis to learn from and build on, not a finished design.', { size: 15 });
  // disclaimer
  s.raw(`<rect x="70" y="215" width="760" height="380" fill="#fff" stroke="${PLUM}" stroke-width="3"/>`);
  s.raw(`<rect x="70" y="215" width="760" height="40" fill="${PLUM}"/>`);
  s.text(90, 242, 'DISCLAIMER · READ BEFORE USING THESE PLANS', { size: 17, weight: 'bold', fill: LILAC, ls: 1 });
  s.lines(90, 282, wrap(DISCLAIMER, 92), { size: 14 }, 21);
  // license
  s.raw(`<rect x="70" y="615" width="760" height="150" fill="#f3eefa" stroke="${RIM}" stroke-width="1.5"/>`);
  s.text(90, 645, 'LICENSE', { size: 16, weight: 'bold', ls: 1 });
  s.lines(90, 672, wrap(LICENSE_TEXT, 92), { size: 13.5 }, 20);
  // index
  label(s, 880, 240, 'SHEET INDEX');
  SHEETS_INDEX.forEach(([id, t], i) => { s.text(880, 278 + i * 26, id, { size: 14, weight: 'bold' }); s.text(960, 278 + i * 26, t, { size: 14 }); });
  // key specs
  label(s, 880, 560, 'KEY SPECS (FROM THE PUBLISHED KIT)');
  SPECS.forEach(([k, v], i) => { s.text(880, 596 + i * 23, k, { size: 13, weight: 'bold' }); s.text(1060, 596 + i * 23, v, { size: 13 }); });
  s.text(70, 905, 'Generated from dims.js. Change a dimension there and regenerate: the 3D model, these sheets and the materials estimate all follow.', { size: 13, fill: '#4a3a50' });
  return frame('G-001', 'Cover, index, disclaimer', 'none', s.toString());
}

function C101() {
  const s = new Svg(), sc = 10, m = planMap(760, 470, sc), { X, Y } = m;
  label(s, 70, 80, 'SITE PLAN', 'Scale 1" = 10\'-0". Concept layout; adapt to your land, setbacks and utilities.');
  s.rect(X(-HL - 10), Y(-HW - 3), (K.L + 14) * sc, (K.W + 11) * sc, 'd');
  s.text(X(-HL - 9), Y(HW + 7.4), 'GRAVEL PAD', { size: 11 });
  s.rect(X(-HL), Y(-HW), K.L * sc, K.W * sc, 'cut');
  s.text(X(0), Y(-HW) - 10, 'HOUSE 16 x 20 ON STILTS', { size: 13, anchor: 'middle', weight: 'bold' });
  porchPlan(s, m);
  s.rect(X(TOWER.z - TOWER.half), Y(TOWER.x - TOWER.half), TOWER.size * sc - 5, TOWER.size * sc - 5, 'fill');
  s.line(X(TOWER.z - TOWER.half), Y(TOWER.x - TOWER.half), X(TOWER.z + TOWER.half), Y(TOWER.x + TOWER.half), 't');
  s.line(X(TOWER.z + TOWER.half), Y(TOWER.x - TOWER.half), X(TOWER.z - TOWER.half), Y(TOWER.x + TOWER.half), 't');
  s.text(X(TOWER.z + TOWER.half) + 8, Y(TOWER.x), 'WATER TOWER 8 x 8', { size: 12, weight: 'bold' });
  s.text(X(TOWER.z + TOWER.half) + 8, Y(TOWER.x) + 16, '2 x 275 gal IBC + PV', { size: 11 });
  s.pline([[X(1.5), Y(-HW)], [X(TOWER.z + 1.4), Y(TOWER.x + 1.6)]], 'd');
  s.text(X(3.5), Y(-HW - 2.5), 'RAIN LINE', { size: 11 });
  s.dimV(Y(TOWER.x + TOWER.half), Y(-HW), X(TOWER.z - TOWER.half) - 30, ftin(-HW - (TOWER.x + TOWER.half)));
  // shed, pen, turbine (concept)
  s.rect(X(SHED.z - SHED.d / 2), Y(SHED.x - SHED.w / 2), SHED.d * sc, SHED.w * sc, 'fill');
  s.text(X(SHED.z), Y(SHED.x) + 4, 'SHED 8 x 10', { size: 11, anchor: 'middle' });
  s.text(X(SHED.z), Y(SHED.x) + 18, '(concept)', { size: 10, anchor: 'middle' });
  s.pline([[X(PEN.z0 + 6), Y(PEN.x0)], [X(PEN.z1), Y(PEN.x0)], [X(PEN.z1), Y(PEN.x1)], [X(PEN.z0), Y(PEN.x1)], [X(PEN.z0), Y(PEN.x0)], [X(PEN.z0 + 2), Y(PEN.x0)]], 'm');
  s.text(X((PEN.z0 + PEN.z1) / 2), Y((PEN.x0 + PEN.x1) / 2), 'ANIMAL PEN (concept)', { size: 11, anchor: 'middle' });
  s.text(X(PEN.z0 + 4), Y(PEN.x0) - 6, 'GATE', { size: 10, anchor: 'middle' });
  s.rect(X(TURBINE.z - TURBINE.base), Y(TURBINE.x - TURBINE.base), TURBINE.base * 2 * sc, TURBINE.base * 2 * sc, 'm');
  s.line(X(TURBINE.z - 7.3), Y(TURBINE.x), X(TURBINE.z + 7.3), Y(TURBINE.x), 'd');
  s.text(X(TURBINE.z), Y(TURBINE.x + TURBINE.base) + 18, 'WIND TURBINE ~27 ft (concept)', { size: 11, anchor: 'middle' });
  // north arrow
  const na = [1500, 150];
  s.poly([[na[0], na[1] - 50], [na[0] - 18, na[1] + 10], [na[0], na[1]], [na[0] + 18, na[1] + 10]], 'm', ` fill="${PLUM}"`);
  s.text(na[0], na[1] - 58, 'N', { size: 20, weight: 'bold', anchor: 'middle' });
  s.lines(1300, 760, ['NOTES', '1. South (+x) faces the porch and roof solar. Rotate the whole', '   plan to suit your sun path; keep solar on the sunny side.', '2. Keep the tower close so the rain line stays short and falls', '   toward the upper tote.', '3. Turbine, shed and pen are concept extras, not in the kit spec.', '4. Check setbacks, easements, flood zone and septic / well', '   locations with your local authority.'], { size: 12 }, 17);
  return frame('C-101', 'Site plan', '1" = 10\'-0"', s.toString());
}

function S101() {
  const s = new Svg(), sc = 25, m = planMap(560, 440, sc), { X, Y } = m;
  label(s, 70, 80, 'FOUNDATION + POST PLAN', 'Scale 1/4" = 1\'-0". Pier size and depth by engineer for your soil, frost and flood line.');
  const gx = [-POST_X, POST_X], gz = [POSTS[0][1], 0, POSTS[4][1]];
  gx.forEach((x, i) => { s.line(X(-HL - 3), Y(x), X(HL + 2), Y(x), 'c'); s.circle(X(-HL - 3.8), Y(x), 13, 'm'); s.text(X(-HL - 3.8), Y(x) + 5, 'AB'[i], { size: 14, anchor: 'middle', weight: 'bold' }); });
  gz.forEach((z, i) => { s.line(X(z), Y(-HW - 4), X(z), Y(HW + 2), 'c'); s.circle(X(z), Y(-HW - 4.6), 13, 'm'); s.text(X(z), Y(-HW - 4.6) + 5, String(i + 1), { size: 14, anchor: 'middle', weight: 'bold' }); });
  s.rect(X(-HL), Y(-HW), K.L * sc, K.W * sc, 'd');
  for (const [x, z] of POSTS) { s.circle(X(z), Y(x), sc, 'fill'); s.rect(X(z) - K.post * sc / 2, Y(x) - K.post * sc / 2, K.post * sc, K.post * sc, 'h'); }
  s.dimH(X(gz[0]), X(gz[1]), Y(-HW - 1.6), ftin(gz[1] - gz[0]), Y(-HW)); s.dimH(X(gz[1]), X(gz[2]), Y(-HW - 1.6), ftin(gz[2] - gz[1]), Y(-HW));
  s.dimH(X(-HL), X(HL), Y(-HW - 3), `${ftin(K.L)} PLATE`, Y(-HW));
  s.dimV(Y(gx[0]), Y(gx[1]), X(-HL - 6), ftin(gx[1] - gx[0]), X(-HL - 4));
  s.dimV(Y(-HW), Y(HW), X(-HL - 8), `${ftin(K.W)} PLATE`, X(-HL));
  // porch + stair supports
  porchPlan(s, m);
  for (const z of [PORCH.z0 + 0.3, PORCH.z1 - 0.3]) { s.circle(X(z), Y(PORCH.x1 - 0.3), 0.7 * sc, 'fill'); s.rect(X(z) - 6, Y(PORCH.x1 - 0.3) - 6, 12, 12, 'h'); }
  s.rect(X(STAIR.zEnd - 2.2), Y(STAIR.x0 - 0.4), 2.4 * sc, (STAIR.width + 0.8) * sc, 'cut');
  s.note(X(STAIR.zEnd - 1), Y(STAIR.x1 + 0.4), X(STAIR.zEnd - 4), Y(STAIR.x1 + 3), 'STAIR LANDING PAD');
  s.note(X(PORCH.z1 - 0.3), Y(PORCH.x1 - 0.3), X(PORCH.z1 + 3), Y(PORCH.x1 + 1.5), 'PORCH PIER + POST (2)');
  s.note(X(gz[0]), Y(gx[0]), X(-5), Y(-3.5), 'PIER + 8x8 POST (6), BELOW FROST / FLOOD');
  // tower foundation inset
  const tm = planMap(1330, 300, sc), ts = TOWER.half;
  label(s, 1200, 130, 'WATER TOWER FOUNDATION', '4 piers on an 8 ft square. Centre ' + ftin(-TOWER.x - HW) + ' north of the house wall.');
  s.rect(tm.X(-TOWER.size / 2), tm.Y(-TOWER.size / 2), TOWER.size * sc, TOWER.size * sc, 'd');
  for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { s.circle(tm.X(b * ts), tm.Y(a * ts), 0.8 * sc, 'fill'); s.rect(tm.X(b * ts) - 6, tm.Y(a * ts) - 6, 12, 12, 'h'); }
  s.dimH(tm.X(-ts), tm.X(ts), tm.Y(TOWER.size / 2 + 1.5), ftin(2 * ts), tm.Y(ts));
  s.dimV(tm.Y(-ts), tm.Y(ts), tm.X(-TOWER.size / 2 - 1.5), ftin(2 * ts), tm.X(-ts));
  s.lines(1200, 620, ['NOTES', '1. Posts: 8x8 or larger (spec). Grade, species, treatment and', '   connections by engineer.', '2. Piers: concrete, below frost depth and flood line. Diameter,', '   depth and reinforcing by engineer for your soil.', '3. Post bases must resist uplift and lateral load (wind / flood).', '4. Keep the carport footprint clear: 16 x 20, 9 ft clear height.'], { size: 12 }, 17);
  return frame('S-101', 'Foundation and post plan', '1/4" = 1\'-0"', s.toString());
}

function S102() {
  const s = new Svg(), sc = 25, m = planMap(470, 420, sc), { X, Y } = m;
  label(s, 70, 80, 'FLOOR 1 FRAMING PLAN', 'Scale 1/4" = 1\'-0". Member sizes by engineer / local span tables.');
  s.rect(X(-HL), Y(-HW), K.L * sc, K.W * sc, 'm');
  for (const x of [-POST_X, POST_X]) s.rect(X(-HL), Y(x - 0.34), K.L * sc, 0.68 * sc, 'cut');
  for (const z of [POSTS[0][1], 0, POSTS[4][1]]) s.rect(X(z - 0.3), Y(-HW), 0.6 * sc, K.W * sc, 'fill');
  for (let z = -HL + JOIST_OC; z < HL - 1; z += JOIST_OC) s.line(X(z), Y(-POST_X + 0.34), X(z), Y(POST_X - 0.34), 'm');
  s.rect(X(TRAP.z0 - 0.2), Y(TRAP.x0 - 0.2), (TRAP.z1 - TRAP.z0 + 0.4) * sc, (TRAP.x1 - TRAP.x0 + 0.4) * sc, 'h');
  s.line(X(TRAP.z0), Y(TRAP.x0), X(TRAP.z1), Y(TRAP.x1), 't'); s.line(X(TRAP.z1), Y(TRAP.x0), X(TRAP.z0), Y(TRAP.x1), 't');
  for (const [x, z] of POSTS) s.rect(X(z) - K.post * sc / 2, Y(x) - K.post * sc / 2, K.post * sc, K.post * sc, 'h');
  s.note(X(-6), Y(-POST_X), X(-8), Y(-HW - 3), 'DOUBLED BEAM, 20 FT SIDES (size per engineer)');
  s.note(X(0), Y(-4), X(3), Y(-HW - 1.6), 'CROSSBEAM AT ENDS + MIDSPAN');
  s.note(X(-7), Y(3), X(-10.5), Y(HW + 2.5), `JOISTS @ ${JOIST_OC * 12}" O.C.`);
  s.note(X(TRAP.z1), Y(TRAP.x1), X(TRAP.z1 + 4), Y(HW + 2.5), 'TRAP DOOR 3 x 3, DOUBLED HEADERS + TRIMMERS');
  s.dimH(X(-HL), X(HL), Y(HW + 5), ftin(K.L), Y(HW));
  s.dimV(Y(-HW), Y(HW), X(-HL - 3), ftin(K.W), X(-HL));
  // brace detail at 1/2"
  const bs = 50, bx = 1180, by = 640;
  label(s, 1130, 130, 'KNEE BRACE DETAIL', 'Scale 1/2" = 1\'-0". Typical at posts, both directions.');
  s.rect(bx - K.post * bs / 2, by - 8 * bs, K.post * bs, 8 * bs, 'fill');
  s.rect(bx - K.post * bs / 2, by - 8 * bs - K.beam * bs, 6.5 * bs, K.beam * bs, 'cut');
  s.poly([[bx + K.post * bs / 2, by - (8 - BRACE) * bs], [bx + K.post * bs / 2, by - (8 - BRACE) * bs - 0.5 * bs], [bx + (BRACE) * bs, by - 8 * bs], [bx + (BRACE) * bs + 0.5 * bs, by - 8 * bs]], 'fill');
  s.dimH(bx + K.post * bs / 2, bx + BRACE * bs, by - 8 * bs - K.beam * bs - 30, `${ftin(BRACE)} LEG`);
  s.dimV(by - 8 * bs, by - (8 - BRACE) * bs, bx - 60, `${ftin(BRACE)} LEG`);
  s.text(bx + 95, by - (8 - BRACE / 2) * bs + 30, '45°', { size: 15, weight: 'bold' });
  s.text(bx - 25, by + 22, '8x8 POST', { size: 12 });
  s.text(bx + 60, by - 8 * bs - K.beam * bs - 8, 'BEAM', { size: 12 });
  s.lines(1130, 700, ['Through-bolt brace to post and beam. Bolt size,', 'count and edge distances per engineer.', 'Braces resist racking: do not omit any.'], { size: 12 }, 17);
  return frame('S-102', 'Floor framing plan and brace detail', '1/4" = 1\'-0", detail 1/2" = 1\'-0"', s.toString());
}

function A101() {
  const s = new Svg(), sc = 18.75;
  const plans = [
    { name: 'FLOOR 1 · 320 SF', y: K.f1, ox: 290, oy: 330 },
    { name: 'FLOOR 2 · 320 SF', y: K.f2, ox: 800, oy: 330 },
    { name: 'LOFT + RAIN DECK', y: K.top, ox: 1290, oy: 330 },
  ];
  for (const p of plans) {
    const m = planMap(p.ox, p.oy, sc), { X, Y } = m;
    label(s, X(-HL), Y(-HW) - 55, p.name);
    if (p.y === K.top) {
      s.rect(X(-HL), Y(-HW), (K.L / 2) * sc, K.W * sc, 'fill');
      s.line(X(-HL), Y(0), X(0), Y(0), 'd');
      s.text(X(-HL / 2), Y(0) - 8, 'RIDGE ABOVE', { size: 10, anchor: 'middle' });
      s.text(X(-HL / 2), Y(-HW / 2), 'LOFT 16 x 10', { size: 12, anchor: 'middle', weight: 'bold' });
      s.text(X(-HL / 2), Y(-HW / 2) + 16, 'under 45° metal roof', { size: 10, anchor: 'middle' });
      s.rect(X(0), Y(-HW), (K.L / 2) * sc, K.W * sc, 'm');
      for (let x = -HW + 0.6; x < HW; x += 1) s.line(X(0.1), Y(x), X(HL - 0.1), Y(x), 't');
      s.rect(X(0), Y(-HW), (K.L / 2) * sc, K.W * sc, 'm', ` fill-opacity="0"`);
      s.raw(`<rect x="${n2(X(1.5))}" y="${n2(Y(-2.6))}" width="${n2(7 * sc)}" height="${n2(5.2 * sc)}" fill="#fff" stroke="none"/>`);
      s.text(X(HL / 2), Y(-1), 'RAIN DECK 16 x 10', { size: 12, anchor: 'middle', weight: 'bold' });
      s.text(X(HL / 2), Y(-1) + 15, 'metal, to gutters', { size: 10, anchor: 'middle' });
      for (const x of [-HW, HW]) s.line(X(0.2), Y(x * 0.98), X(HL - 0.2), Y(x * 0.98), 'h');
      s.line(X(HL - 0.2), Y(-HW), X(HL - 0.2), Y(HW), 'h');
      s.rect(X(-0.6), Y(-DOORS.loft.w / 2), 0.6 * sc, DOORS.loft.w * sc, 'win');
      s.text(X(0.4), Y(DOORS.loft.w / 2) + 14, 'DOOR', { size: 10 });
      for (const z of ROOF_SOLAR.z) s.rect(X(z - ROOF_SOLAR.wid / 2), Y(2.4), ROOF_SOLAR.wid * sc, 3.8 * sc, 'd');
      s.text(X(-5), Y(6.8), 'PV ON SOUTH SLOPE', { size: 10, anchor: 'middle' });
      s.rect(X(0), Y(-HW - 0.55), (HL + 0.55) * sc, 0.5 * sc, 'd');
      s.rect(X(0), Y(HW + 0.05), (HL + 0.55) * sc, 0.5 * sc, 'd');
      s.rect(X(HL + 0.05), Y(-HW - 0.55), 0.5 * sc, (K.W + 1.1) * sc, 'd');
      s.circle(X(CHIMNEY.z), Y(CHIMNEY.x), CHIMNEY.r * sc, 'h');
      s.rect(X(LADDER.z - 0.6), Y(LADDER.x0), 1.2 * sc, (LADDER.x1 - LADDER.x0) * sc, 'd');
      s.text(X(LADDER.z) + 12, Y(LADDER.x0) - 4, 'HATCH', { size: 9 });
      s.text(X(HL / 2), Y(-HW) - 10, 'GUTTER + DOWNSPOUT TO TOWER (NORTH)', { size: 10, anchor: 'middle' });
    } else {
      const op = planWalls(s, m, p.y);
      s.circle(X(CHIMNEY.z), Y(CHIMNEY.x), CHIMNEY.r * sc, 'h');
      if (p.y === K.f1) {
        op(DOORS.porch.wall, DOORS.porch.at, DOORS.porch.w, 'door');
        const dz0 = DOORS.porch.at - DOORS.porch.w / 2, dz1 = DOORS.porch.at + DOORS.porch.w / 2;
        s.line(X(dz1), Y(HW - K.wall), X(dz1), Y(HW - K.wall - 3), 'm');
        s.path(`M ${n2(X(dz0))} ${n2(Y(HW - K.wall))} A ${n2(3 * sc)} ${n2(3 * sc)} 0 0 1 ${n2(X(dz1))} ${n2(Y(HW - K.wall - 3))}`, 't');
        s.rect(X(STOVE.hearth[2]), Y(STOVE.hearth[0]), (STOVE.hearth[3] - STOVE.hearth[2]) * sc, (STOVE.hearth[1] - STOVE.hearth[0]) * sc, 'd');
        s.rect(X(STOVE.z0), Y(STOVE.x0), (STOVE.z1 - STOVE.z0) * sc, (STOVE.x1 - STOVE.x0) * sc, 'fill');
        s.text(X(-8.6), Y(-1.4), 'WOOD STOVE', { size: 10 });
        s.text(X(-8.6), Y(-1.4) + 12, '+ HEARTH', { size: 10 });
        s.rect(X(TRAP.z0), Y(TRAP.x0), (TRAP.z1 - TRAP.z0) * sc, (TRAP.x1 - TRAP.x0) * sc, 'd');
        s.text(X((TRAP.z0 + TRAP.z1) / 2), Y(TRAP.x1) + 14, 'TRAP DOOR', { size: 10, anchor: 'middle' });
        porchPlan(s, m);
        s.text(X((PORCH.z0 + PORCH.z1) / 2), Y(PORCH.x1) + 16, 'PORCH', { size: 11, anchor: 'middle', weight: 'bold' });
      } else {
        s.rect(X(ISTAIR.zHigh), Y(ISTAIR.x0), (ISTAIR.zLow - ISTAIR.zHigh) * sc, (ISTAIR.x1 - ISTAIR.x0) * sc, 'd');
        s.text(X(-5), Y(6) + 4, 'OPEN TO BELOW', { size: 9, anchor: 'middle' });
        for (let i = 0; i < 9; i++) s.line(X(LADDER.z - 0.5), Y(LADDER.x0 + i * 0.2), X(LADDER.z + 0.5), Y(LADDER.x0 + i * 0.2), 't');
        s.text(X(LADDER.z) + 2, Y(LADDER.x0) - 6, 'LADDER UP', { size: 10, anchor: 'middle' });
      }
      // inner stair (assumption) on both floors
      const r = (ISTAIR.zLow - ISTAIR.zHigh) / ISTAIR.n;
      for (let i = 0; i <= ISTAIR.n; i++) s.line(X(ISTAIR.zLow - i * r), Y(ISTAIR.x0), X(ISTAIR.zLow - i * r), Y(ISTAIR.x1), 't');
      s.text(X(-5), Y(ISTAIR.x0) - 4, p.y === K.f1 ? 'UP (stair placement assumed)' : 'DN', { size: 9, anchor: 'middle' });
      s.text(X(4), Y(-1), p.name.split(' ·')[0], { size: 12, anchor: 'middle', weight: 'bold' });
    }
    s.dimH(X(-HL), X(HL), Y(HW) + (p.y === K.f1 ? 140 : 40), ftin(K.L), Y(HW));
    s.dimV(Y(-HW), Y(HW), X(-HL) - 26, ftin(K.W), X(-HL));
  }
  s.lines(70, 760, ['NOTES', '1. Windows 3\'-0" x 4\'-0" rough, sills 3\'-0" above each floor (count + sizes in dims.js).', '2. Inner stair and loft ladder positions are a model assumption, not fixed by the kit spec. Place them to suit, keeping code headroom.', '3. Wood stove clearances, hearth size and chimney: follow the stove maker\'s listing and NFPA 211 / local code.', '4. Trap door sits over the carport, above a parked vehicle\'s sunroof.'], { size: 12 }, 18);
  return frame('A-101', 'Floor plans', '3/16" = 1\'-0"', s.toString());
}

function elevationSheet(id, title, a, b, sc = 18.75, scaleText = '3/16" = 1\'-0"') {
  const s = new Svg();
  const boxes = [{ x: 60, y: 110, w: 760, h: 760 }, { x: 860, y: 110, w: 760, h: 760 }];
  [a, b].forEach(([view, name], i) => {
    const r = drawView(s, view, boxes[i], sc);
    label(s, boxes[i].x + 10, 90, name);
    levelTags(s, Math.min(r.X(r.u1) + 60, boxes[i].x + boxes[i].w - 150), r.Y, LEVELS);
    const span = view === 'south' || view === 'north' ? K.L : K.W;
    s.dimH(r.X(-span / 2), r.X(span / 2), r.oy + 40, ftin(span), r.oy + 4);
  });
  return frame(id, title, scaleText, s.toString());
}
const A201 = () => elevationSheet('A-201', 'Elevations: south + north', ['south', 'SOUTH ELEVATION (PORCH SIDE)'], ['north', 'NORTH ELEVATION (TOWER SIDE)']);
const A202 = () => elevationSheet('A-202', 'Elevations: west + east', ['west', 'WEST ELEVATION (LOFT GABLE)'], ['east', 'EAST ELEVATION (DECK END)'], 12.5, '1/8" = 1\'-0"');

function A301() {
  const s = new Svg(), sc = 18.75, box = { x: 120, y: 110, w: 820, h: 760 };
  const cutZ = CHIMNEY.z;
  const r = drawView(s, 'east', box, sc, { cut: { at: [0, 0, cutZ] }, filter: e => e.max[0] > -12 && e.min[0] < 14.5 });
  label(s, 100, 90, 'SECTION A-A', `Cut through the stove + chimney, ${ftin(cutZ + HL)} from the west wall, looking west.`);
  levelTags(s, r.X(HW) + 210, r.Y, LEVELS);
  s.dimV(r.Y(0), r.Y(K.clear), r.X(-HW) - 40, `${ftin(K.clear)} CLEAR`, r.X(-HW));
  s.dimV(r.Y(K.f1), r.Y(K.f2), r.X(-HW) - 40, ftin(K.story), r.X(-HW));
  s.dimV(r.Y(K.f2), r.Y(K.top), r.X(-HW) - 40, ftin(K.top - K.f2), r.X(-HW));
  s.dimV(r.Y(K.top), r.Y(K.ridge), r.X(-HW) - 40, `${ftin(K.pitch)} (45°)`, r.X(-HW));
  s.dimH(r.X(-HW), r.X(HW), r.oy + 40, ftin(K.W), r.oy + 4);
  s.lines(1080, 160, ['SECTION NOTES',
    '1. Hatched = cut by the section plane.',
    '2. Roof: 45° metal over the loft half. Rafters, ties and',
    '   uplift connections by engineer for your wind and snow.',
    '3. Loft: 16 x 10 ft under the roof. The other half of the',
    '   top is the metal rain deck with 3\'-6" guards.',
    '4. Envelope (pick one, same outside size): stucco foam',
    '   walls, wood frame + drywall, or a 20 ft crate pair.',
    '5. Floor 2 and loft framing by engineer / span tables.',
    '6. Chimney: listed class-A pipe through every level,',
    '   clearances + height above the roof per the maker and',
    '   NFPA 211 / local code. Smoke + CO alarms every level.',
    '7. Carport: 9 ft clear (8 ft minimum). Keep vehicles',
    '   and fuel away from the stair and piers.',
    '8. Inner stair shown is a model assumption.'], { size: 13 }, 21);
  return frame('A-301', 'Building section A-A', '3/16" = 1\'-0"', s.toString());
}

function A401() {
  const s = new Svg(), sc = 37.5, P = PORCH, S = STAIR, top = K.f1;
  label(s, 70, 80, 'STAIR + PORCH: SIDE VIEW', 'Scale 3/8" = 1\'-0". Porch on the right, stair running down to the left.');
  const ox = 140, oy = 760, X = z => ox + (z - S.zEnd + 2.5) * sc, Y = y => oy - y * sc;
  // ground, porch deck, stringer, treads, rails
  s.line(X(S.zEnd - 3), Y(0), X(P.z0 + 4), Y(0), 'h');
  s.rect(X(P.z0), Y(top), 4 * sc, 0.25 * sc, 'fill');
  s.poly([[X(P.z0), Y(top - 0.3)], [X(P.z0), Y(top - 1.2)], [X(S.zEnd - 0.4), Y(0.2) + 0.9 * sc * 0.6], [X(S.zEnd - 0.4), Y(0.2)]], 'fill');
  const pts = [[X(P.z0), Y(top)]];
  for (let i = 0; i < S.n - 1; i++) { const y = top - (i + 1) * S.rise; pts.push([X(P.z0 - i * S.run), Y(y)], [X(P.z0 - (i + 1) * S.run), Y(y)]); }
  pts.push([X(S.zEnd), Y(0)]);
  s.pline(pts, 'h');
  const zr = P.z0 + 0.15, sl = S.rise / S.run, railY = (z, h) => top + h + (z - zr) * sl;
  for (const h of [P.rail, P.rail / 2]) { s.line(X(zr), Y(railY(zr, h)), X(S.zEnd), Y(railY(S.zEnd, h)), 'h'); s.line(X(zr), Y(top + h), X(P.z0 + 4), Y(top + h), 'h'); }
  s.rect(X(zr) - 6, Y(top + P.rail + 0.15), 12, (P.rail + 1.15) * sc, 'fill');
  s.rect(X(S.zEnd) - 6, Y(railY(S.zEnd, P.rail) + 0.15), 12, (railY(S.zEnd, P.rail) + 0.15) * sc, 'fill');
  s.rect(X(S.zEnd + 0.2), Y(0.2), -2.4 * sc, 0.3 * sc, 'cut');
  s.dimV(Y(0), Y(top), X(P.z0 + 4) + 40, `${ftin(top)} TOTAL RISE`, X(P.z0 + 4));
  s.dimH(X(P.z0), X(S.zEnd), Y(0) + 40, `${ftin((S.n - 1) * S.run)} TOTAL RUN`, Y(0));
  s.dimV(Y(top), Y(top + P.rail), X(P.z0 + 4) + 80, `${ftin(P.rail)} GUARD`, X(P.z0 + 4));
  s.note(X(zr), Y(top + P.rail + 0.2), X(zr) + 60, Y(top + P.rail + 2), 'TOP NEWEL: porch guard + stair rails meet here');
  s.note(X(P.z0 - 3 * S.run), Y(top - 3 * S.rise), X(P.z0 - 3 * S.run) + 120, Y(top - 6), 'TREAD + RISER, see table');
  // table
  const tx = 1130, ty = 160;
  label(s, tx, ty - 30, 'STAIR TABLE');
  const rows = [['Risers', `${S.n} @ ${Math.round(S.rise * 12 * 10) / 10}"`], ['Treads', `${S.n - 1} @ ${Math.round(S.run * 12)}" run`], ['Width', ftin(S.width)], ['Total rise', ftin(top)], ['Total run', ftin((S.n - 1) * S.run)], ['Porch guard', `${ftin(P.rail)} (36")`], ['Stair rails', 'top + mid, parallel to the nosing line'], ['Structure', 'detached: own posts, piers + landing pad'], ['Porch', `${ftin(P.x1 - P.x0)} x ${ftin(P.z1 - P.z0)}`]];
  rows.forEach(([k, v], i) => { s.rect(tx, ty + i * 32, 170, 32, 'm'); s.rect(tx + 170, ty + i * 32, 330, 32, 'm'); s.text(tx + 10, ty + i * 32 + 21, k, { size: 13, weight: 'bold' }); s.text(tx + 180, ty + i * 32 + 21, v, { size: 13 }); });
  s.lines(tx, ty + rows.length * 32 + 40, ['NOTES', '1. Riser, tread, guard and handrail limits vary by code.', '   Check yours before cutting stringers.', '2. Stair can be unhooked from the porch for security (spec).', '   Design that connection with your engineer.', '3. Handrails must be graspable and continuous.'], { size: 12 }, 17);
  // plan
  const pm = planMap(1300, 755, 12.5);
  label(s, 1130, 630, 'PLAN (1/8" = 1\'-0")');
  s.rect(pm.X(-HL), pm.Y(-HW), K.L * 12.5, K.W * 12.5, 'd');
  porchPlan(s, pm);
  return frame('A-401', 'Stair and porch detail', '3/8" = 1\'-0", plan 1/8" = 1\'-0"', s.toString());
}

function P101() {
  const s = new Svg();
  label(s, 70, 80, 'WATER SYSTEM (SCHEMATIC, NOT TO SCALE)', 'Rain and well water stored high, gravity down into the house.');
  const box = (x, y, w, h, t1, t2) => { s.rect(x, y, w, h, 'fill'); s.text(x + w / 2, y + h / 2 - (t2 ? 3 : -5), t1, { size: 13, anchor: 'middle', weight: 'bold' }); if (t2) s.text(x + w / 2, y + h / 2 + 15, t2, { size: 11, anchor: 'middle' }); };
  const arrow = (x1, y1, x2, y2) => { s.line(x1, y1, x2, y2, 'h'); const a = Math.atan2(y2 - y1, x2 - x1); s.poly([[x2, y2], [x2 - 12 * Math.cos(a - 0.4), y2 - 12 * Math.sin(a - 0.4)], [x2 - 12 * Math.cos(a + 0.4), y2 - 12 * Math.sin(a + 0.4)]], 'm', ` fill="${INK}"`); };
  const W = 190, H = 64, y1 = 140, y2 = 300, y3 = 460;
  box(80, y1, W, H, 'RAIN DECK', '16 x 10 metal, 160 sf');
  box(330, y1, W, H, 'GUTTERS', 'own gutters, deck edges');
  box(580, y1, W, H, 'FIRST-FLUSH', 'dumps the dirty first rain');
  box(830, y1, W, H, 'FILTER', 'screen / sediment');
  box(830, y2, W, H, 'UPPER TOTE', `${TOTE.gal} gal IBC`);
  box(580, y2, W, H, 'LOWER TOTE', `${TOTE.gal} gal IBC (overflow)`);
  box(330, y2, W, H, 'HOUSE SUPPLY', 'gravity, downhill run');
  box(80, y2, W, H, 'FIXTURES', 'sink, shower, washdown');
  box(1080, y2, W, H, 'FILL WITHOUT GRID', 'ram pump / hand / solar pump');
  arrow(80 + W, y1 + H / 2, 330, y1 + H / 2); arrow(330 + W, y1 + H / 2, 580, y1 + H / 2); arrow(580 + W, y1 + H / 2, 830, y1 + H / 2);
  arrow(830 + W / 2, y1 + H, 830 + W / 2, y2); arrow(830, y2 + H / 2, 580 + W, y2 + H / 2); arrow(580, y2 + H / 2, 330 + W, y2 + H / 2); arrow(330, y2 + H / 2, 80 + W, y2 + H / 2);
  arrow(1080, y2 + H / 2, 830 + W, y2 + H / 2);
  s.lines(80, y3, ['RAIN MATH (from the spec)',
    `Whole roof 16 x 20 = 320 sf. One inch of rain is about 200 gallons on the whole roof.`,
    `The deck half (160 sf) yields about 100 gallons per inch after first-flush.`,
    `Storage: 2 x ${TOTE.gal} gal = ${2 * TOTE.gal} gal in the tower.`,
    'A closed rain loop does not run a free perpetual pump. Lift water with a ram pump (stream with fall),',
    'a hand pump, or a small solar pump, then let gravity do the daily work.',
    'Treat all stored water before drinking: filter + disinfect (see the Emergency section on /irl/).'], { size: 13 }, 21);
  label(s, 1180, 480, 'POWER + HEAT');
  s.lines(1180, 520, ['PV: 3 panels on the south roof slope + 1 on the tower.', 'Charge controller + battery bank sized to your loads.', 'All wiring, disconnects and grounding per NEC /', 'local code and a licensed electrician.', '', 'Heat: floor-1 wood stove, chimney through all levels.', 'Cook and heat water on it. Radiant on all three levels.', 'Finish the envelope and the stove before buying', 'more panels (spec).', '', 'Smoke + CO alarms on every level and the loft.', 'Generators outside only, away from doors and windows.'], { size: 12.5 }, 19);
  return frame('P-101', 'Water, power and heat schematic', 'not to scale', s.toString());
}

// ---------------------------------------------------------------------------------------------
export const DISCLAIMER = 'Experimental design, published for educational purposes as a starting point for off-grid and sustainable living. These plans are not engineered, stamped, or approved for construction in any jurisdiction, and have not been reviewed by a licensed architect or engineer. Before building, have a licensed engineer design the foundations, posts, beams, connections and roof for your site\'s soil, frost depth, flood, wind, snow, seismic and fire conditions, and obtain every permit your jurisdiction requires. Anyone who builds, modifies or occupies a structure based on these plans does so entirely at their own risk. The plans are provided as-is, without warranty of any kind, and the authors and 13 <33 Covenant accept no liability for injury, death, property damage or any other loss arising from their use.';
export const LICENSE_TEXT = 'Plans, drawings and guide: Creative Commons Attribution-ShareAlike 4.0 (CC BY-SA 4.0). You may copy, adapt, build from and share them, including commercially, if you credit "Kaiotei / 13 <33 Covenant", link the license, say what you changed, and release your adapted plans under the same license. Code (model.js, plans.js, dims.js, viewer): MIT.';
export const SPECS = [
  ['Footprint', '16 x 20 ft (two 8 x 20 crates, or wood / foam)'],
  ['Floors 1 + 2', '320 sf each, two ~8 ft stories, 16 ft wall'],
  ['Loft', '16 x 10 ft (160 sf) under a 45° metal roof'],
  ['Rain deck', '16 x 10 ft metal, own gutters'],
  ['Living total', 'about 800 sf'],
  ['Carport', '16 x 20, 9 ft clear (8 ft min)'],
  ['Posts', '8x8 or larger, 6-post grid, 45° braces'],
  ['Stairs', 'detached, to a small porch, unhook for security'],
  ['Water tower', '8 x 8, ~16 ft, two 275 gal IBC totes'],
  ['Heat / power', 'floor-1 wood stove; PV on roof + tower'],
];

export const SHEETS = [
  { id: 'G-001', svg: G001 }, { id: 'C-101', svg: C101 }, { id: 'S-101', svg: S101 }, { id: 'S-102', svg: S102 },
  { id: 'A-101', svg: A101 }, { id: 'A-201', svg: A201 }, { id: 'A-202', svg: A202 }, { id: 'A-301', svg: A301 },
  { id: 'A-401', svg: A401 }, { id: 'P-101', svg: P101 },
].map(o => ({ ...o, title: SHEETS_INDEX.find(r => r[0] === o.id)[1] }));

// ---------------------------------------------------------------------------------------------
// Materials estimate. Quantities follow dims.js; sizes the spec does not fix say so.
function areas() {
  const joists = Math.floor((K.L - 2) / JOIST_OC);
  const sheets = sf => Math.ceil((sf * 1.1) / 32);                       // 4x8 sheets incl. 10% waste
  const openSf = WINDOWS.reduce((a, w) => a + w.w * w.h, 0) + DOORS.porch.w * DOORS.porch.h;
  const wallSf = 2 * (K.W + K.L) * K.box;
  const slope = K.pitch * Math.SQRT2 + 1.2, roofSf = Math.round(2 * slope * (K.L / 2 + 1.25));
  const gableSf = 2 * (K.W * K.pitch / 2);
  return { joists, sheets, openSf, wallSf, slope, roofSf, gableSf, perim: 2 * (K.W + K.L) };
}

export function bom() {
  const { joists, sheets, openSf, wallSf, roofSf } = areas();
  const stringer = Math.hypot(K.f1, (STAIR.n - 1) * STAIR.run + 0.4);
  const towerBrace = Math.hypot(TOWER.half * 2, 4.4);
  return [
    ['Foundation', 'Concrete piers: house', `${POSTS.length}`, 'below frost + flood line, size per engineer'],
    ['Foundation', 'Concrete piers: porch + tower', `2 + 4`, 'size per engineer'],
    ['Foundation', 'Stair landing pad', '1', `about ${ftin(STAIR.width + 0.8)} x ${ftin(2.4)}`],
    ['Structure', 'Posts 8x8 (or larger)', `${POSTS.length}`, `about ${ftin(K.clear + K.beam - 1.2)} above pier, plus connection`],
    ['Structure', 'Beams, doubled, 20 ft sides', '2 (4 plies)', 'size per engineer'],
    ['Structure', 'Crossbeams, 16 ft', '3', 'ends + midspan, size per engineer'],
    ['Structure', 'Knee braces, 45°', '12', `about ${ftin(BRACE * Math.SQRT2)} each`],
    ['Floors', 'Joists @ 24" o.c., 16 ft', `${joists} per level x 3 levels`, 'floor 1, floor 2, loft / deck; size per span tables'],
    ['Floors', 'Subfloor / decking 4x8 sheets', `${sheets(K.W * K.L)} per level x 3`, 'includes 10% waste'],
    ['Envelope', 'Wall area (gross / net of openings)', `${wallSf} / ${Math.round(wallSf - openSf)} sf`, 'crate pair, wood frame or stucco foam'],
    ['Envelope', 'Sheathing or siding 4x8 sheets', `${sheets(wallSf - openSf)}`, 'plus gable ends ~128 sf'],
    ['Envelope', 'Windows 3\'-0" x 4\'-0"', `${WINDOWS.length}`, '+1 loft window 2\'-6" square'],
    ['Envelope', 'Doors', '2', 'porch door 3\'-0" x 7\'-0", loft-to-deck door'],
    ['Roof', 'Metal roofing, 45° slopes', `about ${roofSf} sf`, 'plus ridge cap, trim, fasteners'],
    ['Roof', 'Metal rain deck surface', `${K.W * K.L / 2} sf`, 'pitched to its own gutters'],
    ['Roof', 'Deck guard rail', `${HL + K.W + HL} ft`, `${ftin(K.rail)} high`],
    ['Access', 'Stair stringers', '2 (3 recommended)', `about ${ftin(stringer)} each`],
    ['Access', 'Treads', `${STAIR.n - 1}`, `${ftin(STAIR.width)} wide`],
    ['Access', 'Porch deck', `${(PORCH.x1 - PORCH.x0) * (PORCH.z1 - PORCH.z0)} sf`, `${ftin(PORCH.x1 - PORCH.x0)} x ${ftin(PORCH.z1 - PORCH.z0)}, 2 posts`],
    ['Access', 'Porch guard + stair rails', `about ${Math.round((PORCH.z1 - PORCH.z0) + (PORCH.x1 - PORCH.x0) + 2 * stringer)} ft`, 'top + mid rails'],
    ['Water', 'IBC totes', '2', `${TOTE.gal} gal each, food-grade, opaque or covered`],
    ['Water', 'Tower posts + platforms', '4 posts ~16 ft, 2 decks 8 x 8', 'size per engineer'],
    ['Water', 'Tower X braces', '24', `about ${ftin(towerBrace)} each`],
    ['Water', 'Gutters', `${HL * 2 + K.W} ft`, 'deck edges'],
    ['Water', 'First-flush diverter + filter', '1 + 1', ''],
    ['Water', 'Rain line + supply pipe', 'about 18 ft + 13 ft', 'route to suit'],
    ['Heat', 'Wood stove (listed)', '1', 'with hearth per the maker'],
    ['Heat', 'Chimney, listed class-A', `about ${ftin(CHIMNEY.cap - K.f1 - STOVE.h)}`, 'through floor 2, loft and roof'],
    ['Power', 'PV panels', '3 roof + 1 tower', 'about 5\'-5" x 3\'-1" each; controller + battery to suit'],
    ['Safety', 'Smoke + CO alarms', '4+', 'every level + loft'],
    ['Hardware', 'Post bases, hangers, ties, bolts', 'as designed', 'per engineer'],
  ];
}

// ---------------------------------------------------------------------------------------------
// Material cost estimate (no labor). Quantities follow dims.js through the same takeoff rules
// as bom(); member sizes are common residential sizes chosen for ESTIMATING ONLY (the kit spec
// leaves sizing to an engineer). Prices: US big-box / lumber-yard listings, East Coast typical.
// est: true = no listing at that exact size, priced from the nearest size per linear foot.
// Update PRICES_AS_OF and the prices together when re-pricing.
export const PRICES_AS_OF = 'November 2026';
export const PRICE_SOURCES = [
  ['Home Depot: 2x12x16 ground-contact PT', 'https://www.homedepot.com/p/2-in-x-12-in-x-16-ft-Prime-Ground-Contact-Pressure-Treated-Lumber-21216MGY2HD/206937122'],
  ['Stine: 8x8x10 treated, ground contact', 'https://www.stinehome.com/building-materials/lumber/treated-pine/8x8-treated/8-in.-x-8-in.-x-10-ft.-treated-ground-contact/8810TP.html'],
  ['Hamshaw Lumber: 8x8x10 treated SYP', 'https://hamshawlumber.com/p/treated-syp-rough-gc'],
  ['Home Depot: 10 ft pressure-treated lumber', 'https://www.homedepot.com/b/Lumber-Composites-Pressure-Treated-Lumber/10-ft/N-5yc1vZc3srZ1z1rkse'],
  ['Home Depot: 2x6 framing studs', 'https://www.homedepot.com/b/Lumber-Composites-Dimensional-Lumber-Framing-Studs/2x6/N-5yc1vZc562Z1z0ywy6'],
  ['Framing lumber price list 2026', 'https://framing-calculator.com/framing-lumber-prices'],
  ['Home Depot: 2x10 framing lumber', 'https://www.homedepot.com/b/Lumber-Composites-Dimensional-Lumber-Framing-Lumber/2x10/N-5yc1vZc55wZ1z0ywxp'],
  ['Home Depot: tongue-and-groove plywood', 'https://www.homedepot.com/b/Lumber-Composites-Plywood/Tongue-and-Groove/N-5yc1vZbqm7Z1z1tpte'],
  ['Plywood vs OSB prices 2026', 'https://cyanbuild.com/resources/plywood-osb-cost-guide'],
  ['Home Depot: 12 ft metal roofing', 'https://www.homedepot.com/b/Building-Materials-Roofing-Roof-Panels-Metal-Roofing/12-ft/N-5yc1vZapwhZ1z22wcp'],
  ['Home Depot: Quikrete 80 lb concrete', 'https://www.homedepot.com/project-seller/concrete-calculator/Quikrete-80-lb-Concrete-Mix-110180/100318511'],
  ['Lumber prices 2026 (market + tariff notes)', 'https://hammerio.com/blog/lumber-prices/'],
];

export function costs() {
  const { joists, sheets, openSf, wallSf, roofSf, gableSf, perim } = areas();
  const rows = [];
  let sec = '';
  const S = name => { sec = name; };
  // size = [thickness in, width in, length ft] nominal, for board feet; null for sheet goods
  const L = (item, qty, size, price, est = false) => rows.push({ sec, item, qty, size, price, est, total: qty * price, bf: size ? (qty * size[0] * size[1] * size[2]) / 12 : 0, sheet: !size });

  S('Stilts + floor 1');
  L('8x8x10 PT posts', POSTS.length, [8, 8, 10], 130);
  L('2x12x20 PT beams, doubled, 20 ft sides', 4, [2, 12, 20], 65, true);
  L('2x12x16 PT crossbeams, doubled', 6, [2, 12, 16], 46);
  L(`2x12x16 PT joists @ ${JOIST_OC * 12}" o.c.`, joists, [2, 12, 16], 46);
  L('4x6x12 PT knee braces (2 per board)', 6, [4, 6, 12], 35, true);
  S('Floor 2 + loft / deck');
  L('2x10x16 floor 2 joists', joists, [2, 10, 16], 25);
  L('2x10x20 floor 2 rims', 2, [2, 10, 20], 40, true);
  L('2x10x16 PT loft / deck joists', joists, [2, 10, 16], 30);
  L('2x10x20 PT loft / deck rims', 2, [2, 10, 20], 45, true);
  L('2x4x10 deck slope sleepers', 10, [2, 4, 10], 5.5, true);
  S('Walls, 2x6 @ 16"');
  L('2x6 precut studs, two stories', Math.round((perim * 12 / 16) * 1.3) * 2, [2, 6, 8], 6.25);
  L('2x6x16 plates (bottom + double top)', Math.ceil((3 * perim * 2) / 16), [2, 6, 16], 12);
  L('2x10x16 headers', Math.ceil(((WINDOWS.length + 2) * 8) / 16), [2, 10, 16], 25);
  L('2x6 precut gable studs', 16, [2, 6, 8], 6.25);
  L('2x6x16 gable plates', 2, [2, 6, 16], 12);
  S('Roof, loft half');
  L('2x8x14 rafters @ 24"', ((K.L / 2) / 2 + 1) * 2, [2, 8, 14], 16, true);
  L('2x10x12 ridge board', 1, [2, 10, 12], 20, true);
  L('2x6x10 collar ties', 6, [2, 6, 10], 8, true);
  S('Sheet goods (4x8)');
  L('3/4" T&G subfloor, 3 levels', 3 * sheets(K.W * K.L), null, 46);
  L('7/16" OSB wall + gable sheathing', sheets(wallSf - openSf) + sheets(gableSf), null, 15);
  L('7/16" OSB roof sheathing', sheets(roofSf), null, 15);
  S('Deck guard, porch, stair (PT)');
  L('4x4x8 deck guard posts (2 per board)', 4, [4, 4, 8], 11);
  L('2x6x12 deck guard cap', 3, [2, 6, 12], 12, true);
  L('2x4x12 deck guard rails', 6, [2, 4, 12], 9, true);
  L('2x2x42" balusters, deck', 80, [2, 2, 3.5], 1.5, true);
  L('6x6x12 porch posts', 2, [6, 6, 12], 60, true);
  L('2x8x8 porch framing', 10, [2, 8, 8], 11, true);
  L('5/4x6x8 porch decking', 12, [1.25, 6, 8], 9, true);
  L('4x4x8 porch braces', 2, [4, 4, 8], 11);
  L('2x12x16 stair stringers', 3, [2, 12, 16], 46);
  L('2x12x8 treads (2 per board)', Math.ceil((STAIR.n - 1) / 2), [2, 12, 8], 22, true);
  L('4x4x10 top newels', 2, [4, 4, 10], 19);
  L('4x4x8 bottom newels, supports, guard posts', 6, [4, 4, 8], 11);
  L('2x4x16 porch + stair rails', 6, [2, 4, 16], 14, true);
  L('2x2x42" balusters, porch + stair', 93, [2, 2, 3.5], 1.5, true);
  S('Water tower (PT)');
  L('6x6x16 posts', 4, [6, 6, 16], 85, true);
  L('2x8x8 platform framing', 20, [2, 8, 8], 11, true);
  L('2x6x8 platform decking', 36, [2, 6, 8], 8, true);
  L('2x6x10 X braces', 24, [2, 6, 10], 10, true);

  const sections = [];
  for (const r of rows) {
    let s = sections.find(x => x.name === r.sec);
    if (!s) { s = { name: r.sec, total: 0, bf: 0, sheets: 0 }; sections.push(s); }
    s.total += r.total; s.bf += r.bf; if (r.sheet) s.sheets += r.qty;
  }
  const lumber = rows.reduce((a, r) => a + r.total, 0);
  const bf = rows.reduce((a, r) => a + r.bf, 0);
  const sheetCount = rows.filter(r => r.sheet).reduce((a, r) => a + r.qty, 0);

  // concrete: 16" x 5 ft house piers, 12" x 4.5 ft porch + tower piers, stair pad 4" thick
  const cf = POSTS.length * Math.PI * (8 / 12) ** 2 * 5 + 6 * Math.PI * 0.5 ** 2 * 4.5 + (STAIR.width + 0.8) * 2.4 * 0.33;
  const bags = Math.ceil(cf / 0.6);
  const metalSf = roofSf + (K.W * K.L) / 2;
  const other = [
    { item: `Concrete, 80 lb bags (${Math.round(cf)} cu ft: piers + stair pad)`, qty: bags, unit: 'bags', price: 6.15, total: bags * 6.15 },
    { item: `29 ga ribbed metal, roof + rain deck (+25% for trim, ridge, screws)`, qty: metalSf, unit: 'sq ft', price: 1.6 * 1.25, total: metalSf * 1.6 * 1.25 },
  ];
  const allowances = [
    [`Windows (${WINDOWS.length} at 3x4 + loft)`, 2800, 4900],
    ['Exterior doors (2)', 600, 1200],
    [`Panel siding, T1-11 / LP SmartSide (${sheets(wallSf - openSf) + sheets(gableSf)} sheets)`, 2100, 2700],
    ['Housewrap, flashing, roof underlayment', 300, 500],
    ['Hardware: post bases, hangers, ties, bolts, fasteners', 800, 1500],
    ['Sonotubes / pier forms', 150, 150],
  ];
  const excluded = 'Insulation, interior finish, plumbing, electrical, wood stove + class-A chimney (roughly $2,500-5,000), solar, IBC totes (about $150-350 each), gutters + first-flush, delivery, tax, labor.';
  const otherTotal = other.reduce((a, o) => a + o.total, 0);
  const allowLo = allowances.reduce((a, x) => a + x[1], 0), allowHi = allowances.reduce((a, x) => a + x[2], 0);
  return {
    rows, sections, lumber, bf, sheetCount, other, otherTotal, allowances, allowLo, allowHi, excluded,
    contingency: lumber * 0.1, shellLo: lumber + otherTotal + allowLo, shellHi: lumber + otherTotal + allowHi,
  };
}
