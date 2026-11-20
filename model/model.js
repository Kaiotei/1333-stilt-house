// 1333 stilt house kit (16 x 20) and site, built procedurally.
// Source of truth: the "Full kit specs" table on /irl/ (published kit). Kaiotei's sketch settles
// layout; the AI elevation drawing is used only for the turbine, shed and pen (marked concept).
// Authored in feet, baked to metres when merged, so the exported GLB opens at real size.
// One mesh per material per part keeps draw calls and the download small.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { FT, K, HW, HL, POSTS, WINDOWS, DOORS, TOWER, TURBINE, PORCH, STAIR } from './dims.js?v=1';
export { FT, K, TOWER, TURBINE };

const hw = HW, hl = HL;

// ---- Materials (named so they read cleanly in Blender / SketchUp) ----
function mats() {
  const m = (name, color, o = {}) => new THREE.MeshStandardMaterial({ name, color, roughness: 0.8, metalness: 0, ...o });
  return {
    siding:   m('wood_siding', 0x9c8a7a, { roughness: 0.9 }),
    timber:   m('timber', 0x8a6a4a, { roughness: 0.85 }),
    trim:     m('trim', 0xe8e0d4),
    floor:    m('floor_boards', 0xc4a27a),
    metal:    m('metal_roof', 0xa7adb3, { metalness: 0.6, roughness: 0.42 }),
    concrete: m('concrete', 0xb5b2ac, { roughness: 0.95 }),
    glass:    m('glass', 0x6f8fa3, { roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.8 }),
    dark:     m('black_steel', 0x2b2b2e, { roughness: 0.6, metalness: 0.3 }),
    steel:    m('steel', 0x7d838a, { metalness: 0.7, roughness: 0.4 }),
    pvc:      m('pvc_pipe', 0xdcdcd8, { roughness: 0.6 }),
    tote:     m('ibc_tote', 0xf1f1ec, { roughness: 0.5, transparent: true, opacity: 0.88 }),
    solar:    m('solar_cell', 0x1d2a44, { roughness: 0.3, metalness: 0.4 }),
    car:      m('car_paint', 0x4a5560, { roughness: 0.45, metalness: 0.4 }),
    carglass: m('car_glass', 0x20262c, { roughness: 0.15, metalness: 0.2 }),
    tire:     m('tire', 0x1e1e20, { roughness: 0.9 }),
    blade:    m('blade', 0xeeeeea, { roughness: 0.5 }),
    grass:    m('ground', 0xa9b78f, { roughness: 1 }),
    gravel:   m('gravel', 0xc9c3b8, { roughness: 1 }),
  };
}

// ---- Part builder: collect geometry per material (feet), merge + bake to metres ----
const Y = new THREE.Vector3(0, 1, 0);
function part(name, M) {
  const buckets = new Map();
  const put = (key, g) => { if (!buckets.has(key)) buckets.set(key, []); buckets.get(key).push(g); };
  const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), one = new THREE.Vector3(1, 1, 1);
  const P = {
    // box by size + centre, optional rotation (radians)
    box(key, sx, sy, sz, x, y, z, rx = 0, ry = 0, rz = 0) {
      const g = new THREE.BoxGeometry(sx, sy, sz);
      g.applyMatrix4(mtx.compose(new THREE.Vector3(x, y, z), q.setFromEuler(e.set(rx, ry, rz)), one));
      put(key, g); return P;
    },
    // box spanning floor-to-ceiling style: min/max corners
    span(key, x0, y0, z0, x1, y1, z1) {
      return P.box(key, Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0), (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    },
    // square member from point a to point b (braces, rails, stringers)
    beam(key, a, b, t = 0.33, t2 = t) {
      const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
      const d = B.clone().sub(A), len = d.length();
      const g = new THREE.BoxGeometry(t, len, t2);
      g.applyMatrix4(mtx.compose(A.add(B).multiplyScalar(0.5), q.setFromUnitVectors(Y, d.normalize()), one));
      put(key, g); return P;
    },
    // round member from a to b (pipes, posts, chimney)
    pipe(key, a, b, r = 0.15, seg = 10) {
      const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
      const d = B.clone().sub(A), len = d.length();
      const g = new THREE.CylinderGeometry(r, r, len, seg);
      g.applyMatrix4(mtx.compose(A.add(B).multiplyScalar(0.5), q.setFromUnitVectors(Y, d.normalize()), one));
      put(key, g); return P;
    },
    cyl(key, r, h, x, y, z, seg = 16, rx = 0, rz = 0) {
      const g = new THREE.CylinderGeometry(r, r, h, seg);
      g.applyMatrix4(mtx.compose(new THREE.Vector3(x, y, z), q.setFromEuler(e.set(rx, 0, rz)), one));
      put(key, g); return P;
    },
    geo(key, g) { put(key, g); return P; },
    build() {
      const grp = new THREE.Group(); grp.name = name;
      for (const [key, list] of buckets) {
        const geo = mergeGeometries(list.map(g => g.index ? g.toNonIndexed() : g), false);
        geo.scale(FT, FT, FT);
        geo.computeVertexNormals();
        const mesh = new THREE.Mesh(geo, M[key]);
        mesh.name = `${name}_${key}`;
        mesh.castShadow = key !== 'glass' && key !== 'grass' && key !== 'gravel';
        mesh.receiveShadow = true;
        grp.add(mesh);
      }
      return grp;
    },
  };
  return P;
}

// gable triangle, extruded along z
function gable(w, h, depth) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.closePath();
  return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false });
}

// ---------------------------------------------------------------------------------------------
function structure(M) {
  const P = part('structure', M);
  const px = hw - K.post / 2;                                  // post centre, inset to the plate edge
  const bTop = K.clear + K.beam;
  for (const [x, z] of POSTS) {
    P.cyl('concrete', 1.0, 1.4, x, 0.5, z, 20);                // pier, 1 ft above grade
    P.box('timber', K.post, bTop - 1.2, K.post, x, (1.2 + bTop) / 2, z);
  }
  // doubled beams along the 20 ft sides, crossbeams at the ends and midspan
  for (const x of [-px, px]) P.span('timber', x - 0.34, K.clear, -hl, x + 0.34, bTop, hl);
  for (const z of [-hl + 0.34, 0, hl - 0.34]) P.span('timber', -hw, K.clear, z - 0.3, hw, bTop, z + 0.3);
  // joists every 2 ft
  for (let z = -hl + 2; z < hl - 1; z += 2) P.span('timber', -px + 0.34, K.clear + 0.15, z - 0.08, px - 0.34, bTop, z + 0.08);
  // knee braces at 45 degrees, 4 ft legs
  const br = 4, yb = K.clear;
  for (const x of [-px, px]) {
    P.beam('timber', [x, yb - br, -hl + 0.34], [x, yb, -hl + 0.34 + br], 0.33, 0.5);
    P.beam('timber', [x, yb - br, 0], [x, yb, -br], 0.33, 0.5);
    P.beam('timber', [x, yb - br, 0], [x, yb, br], 0.33, 0.5);
    P.beam('timber', [x, yb - br, hl - 0.34], [x, yb, hl - 0.34 - br], 0.33, 0.5);
  }
  for (const z of [-hl + 0.34, hl - 0.34]) {
    P.beam('timber', [-px, yb - br, z], [-px + br, yb, z], 0.5, 0.33);
    P.beam('timber', [px, yb - br, z], [px - br, yb, z], 0.5, 0.33);
  }
  // floor 1 decking
  P.span('floor', -hw, bTop, -hl, hw, K.f1, hl);
  return P.build();
}

function windowAt(P, axis, face, along, y0, w = 3, h = 4) {
  // axis 'x' = wall on the x = face plane; 'z' = wall on the z = face plane
  const t = 0.9, fr = 0.25;
  if (axis === 'x') {
    P.box('glass', t, h, w, face, y0 + h / 2, along);
    P.box('trim', t + 0.1, fr, w + 2 * fr, face, y0 - fr / 2, along);
    P.box('trim', t + 0.1, fr, w + 2 * fr, face, y0 + h + fr / 2, along);
    P.box('trim', t + 0.1, h, fr, face, y0 + h / 2, along - w / 2 - fr / 2);
    P.box('trim', t + 0.1, h, fr, face, y0 + h / 2, along + w / 2 + fr / 2);
  } else {
    P.box('glass', w, h, t, along, y0 + h / 2, face);
    P.box('trim', w + 2 * fr, fr, t + 0.1, along, y0 - fr / 2, face);
    P.box('trim', w + 2 * fr, fr, t + 0.1, along, y0 + h + fr / 2, face);
    P.box('trim', fr, h, t + 0.1, along - w / 2 - fr / 2, y0 + h / 2, face);
    P.box('trim', fr, h, t + 0.1, along + w / 2 + fr / 2, y0 + h / 2, face);
  }
}

function envelope(M) {
  const P = part('envelope', M);
  const t = 0.5, y0 = K.f1, y1 = K.top;
  P.span('siding', -hw, y0, -hl, -hw + t, y1, hl);
  P.span('siding', hw - t, y0, -hl, hw, y1, hl);
  P.span('siding', -hw + t, y0, -hl, hw - t, y1, -hl + t);
  P.span('siding', -hw + t, y0, hl - t, hw - t, y1, hl);
  // board-and-batten
  const bat = (x, z, alongX) => alongX ? P.box('siding', 0.22, K.box, 0.12, x, (y0 + y1) / 2, z) : P.box('siding', 0.12, K.box, 0.22, x, (y0 + y1) / 2, z);
  for (let z = -hl + 1; z < hl; z += 1.5) { bat(-hw - 0.06, z, false); bat(hw + 0.06, z, false); }
  for (let x = -hw + 1; x < hw; x += 1.5) { bat(x, -hl - 0.06, true); bat(x, hl + 0.06, true); }
  // corner + band trim
  for (const x of [-hw, hw]) for (const z of [-hl, hl]) P.box('trim', 0.6, K.box, 0.6, x, (y0 + y1) / 2, z);
  for (const y of [K.f2]) { P.span('trim', -hw - 0.15, y - 0.2, -hl - 0.15, -hw + 0.1, y + 0.2, hl + 0.15); P.span('trim', hw - 0.1, y - 0.2, -hl - 0.15, hw + 0.15, y + 0.2, hl + 0.15); }
  // windows (dims.js WINDOWS)
  const face = { '-x': ['x', -hw], '+x': ['x', hw], '-z': ['z', -hl], '+z': ['z', hl] };
  for (const w of WINDOWS) windowAt(P, face[w.wall][0], face[w.wall][1], w.at, w.y0, w.w, w.h);
  // porch door on the +x wall, floor 1
  const D = DOORS.porch;
  P.box('timber', 0.8, D.h, D.w, hw, D.y0 + D.h / 2, D.at);
  P.box('trim', 0.9, 0.3, D.w + 0.6, hw, D.y0 + D.h + 0.15, D.at);
  P.box('steel', 0.95, 0.2, 0.2, hw, D.y0 + 3.4, D.at + 1.1);
  return P.build();
}

function interior(M) {
  const P = part('interior', M);
  const t = 0.5;
  // floor 2 slab with a stair opening (x 4.5..7.5, z -9..-1)
  P.span('floor', -hw + t, K.f2 - 0.5, -hl + t, 4.5, K.f2, hl - t);
  P.span('floor', 4.5, K.f2 - 0.5, -1, hw - t, K.f2, hl - t);
  // wood stove + hearth on floor 1
  P.span('concrete', -7.5, K.f1, -8, -3, K.f1 + 0.15, -4);
  P.span('dark', -5.1, K.f1 + 0.9, -7, -2.9, K.f1 + 2.9, -5);
  for (const [x, z] of [[-5, -6.9], [-3, -6.9], [-5, -5.1], [-3, -5.1]]) P.box('dark', 0.15, 0.9, 0.15, x, K.f1 + 0.45, z);
  // trap door in floor 1, over the car
  P.span('dark', -1.7, K.f1, 1.3, 1.7, K.f1 + 0.04, 4.7);
  P.span('timber', -1.5, K.f1 + 0.03, 1.5, 1.5, K.f1 + 0.07, 4.5);
  P.cyl('steel', 0.25, 0.06, 0, K.f1 + 0.1, 4.0, 12);
  // interior stair floor 1 -> 2 along the +x wall (assumption: not placed in the spec)
  const n = 12, rise = K.story / n, run = 8 / n;
  for (let i = 0; i < n; i++) P.span('timber', 4.6, K.f1 + i * rise, -1 - (i + 1) * run, 7.4, K.f1 + (i + 1) * rise, -1 - i * run);
  // ladder floor 2 -> loft
  for (const x of [-6.8, -5.2]) P.box('timber', 0.2, K.box - K.story, 0.25, x, (K.f2 + K.top) / 2, -1.2);
  for (let y = K.f2 + 1; y < K.top; y += 1) P.box('timber', 1.6, 0.12, 0.12, -6, y, -1.2);
  return P.build();
}

function roof(M) {
  const P = part('roof', M);
  const s = Math.SQRT1_2, len = K.pitch * Math.SQRT2;       // slope length ridge to eave
  const z0 = -hl - 1, z1 = 0.25, zc = (z0 + z1) / 2, zl = z1 - z0;
  const panelLen = len + 1.2;
  for (const side of [-1, 1]) {
    // slope plane centre, pushed 0.6 ft down-slope for the eave overhang, lifted 0.15 off the frame
    const cx = side * (hw / 2) + side * 0.6 * s + 0.15 * s * side, cy = K.top + K.pitch / 2 - 0.6 * s + 0.15 * s;
    P.box('metal', panelLen, 0.18, zl, cx, cy, zc, 0, 0, -side * Math.PI / 4);
    // standing-seam ribs every foot
    for (let z = z0 + 0.5; z < z1; z += 1) P.box('metal', panelLen, 0.12, 0.08, cx + 0.12 * s * side, cy + 0.12 * s, z, 0, 0, -side * Math.PI / 4);
  }
  P.box('metal', 0.8, 0.3, zl, 0, K.ridge + 0.25, zc);
  // gable ends: outer end and the end facing the deck
  const g1 = gable(K.W, K.pitch, 0.5); g1.translate(0, K.top, -hl); P.geo('siding', g1);
  const g2 = gable(K.W, K.pitch, 0.5); g2.translate(0, K.top, -0.5); P.geo('siding', g2);
  windowAt(P, 'z', -hl, 0, K.top + 1.6, 2.5, 2.5);
  // loft door onto the deck
  P.box('timber', 3, 6.2, 0.7, 0, K.top + 0.3 + 3.1, -0.25);
  P.box('trim', 3.6, 0.3, 0.8, 0, K.top + 6.6, -0.25);
  // loft floor / deck structure
  P.span('floor', -hw, K.top, -hl, hw, K.top + 0.3, hl);
  // chimney from the stove through every level and out the roof
  P.cyl('dark', 0.33, K.ridge + 1.5 - (K.f1 + 2.9), -4, (K.f1 + 2.9 + K.ridge + 1.5) / 2, -6, 14);
  P.cyl('dark', 0.55, 0.25, -4, K.ridge + 1.4, -6, 14);
  P.cyl('dark', 0.5, 0.18, -4, K.ridge + 2.0, -6, 14);
  P.cyl('dark', 0.1, 0.5, -4, K.ridge + 1.7, -6, 8);
  return P.build();
}

function deck(M) {
  const P = part('deck', M);
  const y = K.top + 0.3;
  P.span('metal', -hw, y, 0, hw, y + 0.12, hl);
  for (let x = -hw + 0.6; x < hw; x += 1) P.span('metal', x - 0.04, y + 0.12, 0.1, x + 0.04, y + 0.2, hl - 0.1);
  // railing on the three open edges
  const rh = 3.5, ry = y + 0.12;
  const postAt = (x, z) => P.box('timber', 0.33, rh, 0.33, x, ry + rh / 2, z);
  for (let z = 0.5; z <= hl; z += 3.2) { postAt(-hw + 0.2, Math.min(z, hl - 0.2)); postAt(hw - 0.2, Math.min(z, hl - 0.2)); }
  for (let x = -hw + 0.2; x <= hw; x += 3.2) postAt(x, hl - 0.2);
  postAt(hw - 0.2, hl - 0.2);
  for (const h of [rh, rh / 2]) {
    P.span('timber', -hw + 0.05, ry + h - 0.12, 0.3, -hw + 0.35, ry + h + 0.12, hl - 0.05);
    P.span('timber', hw - 0.35, ry + h - 0.12, 0.3, hw - 0.05, ry + h + 0.12, hl - 0.05);
    P.span('timber', -hw + 0.05, ry + h - 0.12, hl - 0.35, hw - 0.05, ry + h + 0.12, hl - 0.05);
  }
  return P.build();
}

function solarRoof(M) {
  const P = part('solar_roof', M);
  const s = Math.SQRT1_2;
  // three panels on the +x (south) slope
  const cx = hw / 2 + 0.45 * s, cy = K.top + K.pitch / 2 + 0.45 * s;
  for (const z of [-8.3, -5, -1.7]) {
    P.box('solar', 5.4, 0.12, 3.1, cx, cy, z, 0, 0, -Math.PI / 4);
    P.box('steel', 5.6, 0.1, 3.3, cx - 0.05 * s, cy - 0.05 * s, z, 0, 0, -Math.PI / 4);
  }
  return P.build();
}

function stairsPorch(M) {
  const P = part('stairs_porch', M);
  const { x0, x1, z0, z1 } = PORCH;
  const top = K.f1;
  // porch deck + framing + posts on their own piers (detached structure)
  P.span('floor', x0, top - 0.25, z0, x1, top, z1);
  P.span('timber', x0, top - 0.95, z0, x1, top - 0.25, z0 + 0.4);
  P.span('timber', x0, top - 0.95, z1 - 0.4, x1, top - 0.25, z1);
  P.span('timber', x1 - 0.4, top - 0.95, z0, x1, top - 0.25, z1);
  for (const z of [z0 + 0.3, z1 - 0.3]) {
    P.cyl('concrete', 0.7, 1.2, x1 - 0.3, 0.4, z, 16);
    P.box('timber', 0.5, top - 1, 0.5, x1 - 0.3, top / 2, z);
    P.beam('timber', [x1 - 0.3, top - 4, z], [x1 - 0.3, top - 1, z + (z < 5 ? 3 : -3)], 0.3, 0.45);
  }
  // detached stair: 15 risers, run toward -z, 3.5 ft wide
  const { n, rise, run, x0: sx0, x1: sx1, zEnd } = STAIR;
  // porch guard: outer side full length, far end, and a return along the stair head that
  // ties into the stair's top newel. Stair rails start at the same heights, so the lines are continuous.
  const rh = PORCH.rail, zr = z0 + 0.15, xr = x1 - 0.2, slope = rise / run;
  const railY = (z, h) => top + h + (z - zr) * slope;
  for (let z = zr; z < z1 - 0.3; z += 2.5) P.box('timber', 0.3, rh + 0.15, 0.3, xr, top + (rh + 0.15) / 2, z);
  P.box('timber', 0.3, rh + 0.15, 0.3, xr, top + (rh + 0.15) / 2, z1 - 0.2);
  P.box('timber', 0.3, rh + 0.15, 0.3, x0 + 0.2, top + (rh + 0.15) / 2, z1 - 0.2);
  for (const h of [rh, rh / 2]) {
    P.span('timber', xr - 0.15, top + h - 0.1, zr, xr + 0.15, top + h + 0.1, z1);          // outer side
    P.span('timber', x0, top + h - 0.1, z1 - 0.35, x1, top + h + 0.1, z1 - 0.05);          // far end
    P.span('timber', sx1, top + h - 0.1, zr - 0.15, xr, top + h + 0.1, zr + 0.15);         // stair-head return
  }
  for (const x of [sx0, sx1]) {
    P.beam('timber', [x, top - 0.3, z0], [x, 0.2, zEnd - 0.4], 0.25, 0.9);
    // top newel: from under the porch framing up to the guard cap
    P.box('timber', 0.35, rh + 1.15, 0.35, x, top - 1 + (rh + 1.15) / 2, zr);
    // handrail + mid rail, parallel to the stair, meeting the newel at the porch rail heights
    for (const h of [rh, rh / 2]) P.beam('timber', [x, railY(zr, h), zr], [x, railY(zEnd, h), zEnd], 0.18, 0.18);
    const hb = railY(zEnd, rh) + 0.15;
    P.box('timber', 0.3, hb, 0.3, x, hb / 2, zEnd);                            // bottom newel
    P.box('timber', 0.25, 5.4, 0.25, x, 2.7, (z0 + zEnd) / 2 + 0.6);           // mid support under the stringer
  }
  for (let i = 0; i < n - 1; i++) P.box('timber', sx1 - sx0, 0.15, run + 0.1, (sx0 + sx1) / 2, top - (i + 1) * rise, z0 - (i + 0.5) * run);
  P.span('concrete', sx0 - 0.4, 0, zEnd - 2.2, sx1 + 0.4, 0.2, zEnd + 0.2);
  return P.build();
}

// IBC tote: 48 x 40 x 46 in, cage + tank + pallet
function tote(P, x, y, z) {
  const W = 3.33, D = 4, H = 3.83, pal = 0.45;
  P.span('dark', x - W / 2, y, z - D / 2, x + W / 2, y + pal, z + D / 2);
  P.span('tote', x - W / 2 + 0.12, y + pal, z - D / 2 + 0.12, x + W / 2 - 0.12, y + H - 0.1, z + D / 2 - 0.12);
  const cy = y + pal, ch = H - pal;
  for (const [ax, az] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) P.box('steel', 0.12, ch, 0.12, x + ax * W / 2, cy + ch / 2, z + az * D / 2);
  for (const h of [0.05, ch / 3, (2 * ch) / 3, ch]) {
    P.box('steel', W, 0.07, 0.07, x, cy + h, z - D / 2); P.box('steel', W, 0.07, 0.07, x, cy + h, z + D / 2);
    P.box('steel', 0.07, 0.07, D, x - W / 2, cy + h, z); P.box('steel', 0.07, 0.07, D, x + W / 2, cy + h, z);
  }
  for (let i = 1; i < 5; i++) {
    const zz = z - D / 2 + (i * D) / 5, xx = x - W / 2 + (i * W) / 5;
    P.box('steel', 0.06, ch, 0.06, x - W / 2, cy + ch / 2, zz); P.box('steel', 0.06, ch, 0.06, x + W / 2, cy + ch / 2, zz);
    P.box('steel', 0.06, ch, 0.06, xx, cy + ch / 2, z - D / 2); P.box('steel', 0.06, ch, 0.06, xx, cy + ch / 2, z + D / 2);
  }
  P.cyl('dark', 0.45, 0.25, x, y + H, z, 14);                                 // fill cap
  return { top: y + H, bottom: y + pal };
}

function tower(M) {
  const P = part('tower', M);
  const { x, z, half: h, levels, top } = TOWER;
  for (const [ax, az] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    P.cyl('concrete', 0.8, 1.2, x + ax * h, 0.4, z + az * h, 16);
    P.box('timber', 0.5, top - 0.9, 0.5, x + ax * h, (top + 0.9) / 2, z + az * h);
  }
  for (const ly of [...levels, top]) {
    P.span('timber', x - h - 0.25, ly - 0.6, z - h - 0.25, x + h + 0.25, ly - 0.3, z + h + 0.25);
    if (ly !== top) P.span('floor', x - h - 0.25, ly - 0.3, z - h - 0.25, x + h + 0.25, ly, z + h + 0.25);
  }
  // X bracing on every face, ground to level 1 and level 1 to level 2
  const bands = [[1, levels[0] - 0.6], [levels[0], levels[1] - 0.6], [levels[1], top - 0.6]];
  for (const [y0, y1] of bands) {
    for (const s of [-1, 1]) {
      P.beam('timber', [x - h, y0, z + s * h], [x + h, y1, z + s * h], 0.2, 0.4);
      P.beam('timber', [x + h, y0, z + s * h], [x - h, y1, z + s * h], 0.2, 0.4);
      P.beam('timber', [x + s * h, y0, z - h], [x + s * h, y1, z + h], 0.4, 0.2);
      P.beam('timber', [x + s * h, y0, z + h], [x + s * h, y1, z - h], 0.4, 0.2);
    }
  }
  tote(P, x, levels[0], z); tote(P, x, levels[1], z);
  // solar on top, tilted 30 degrees to face outward (-x, away from the house)
  const tilt = Math.PI / 6, py = top + 1.2, tn = Math.tan(tilt);
  P.box('solar', 5.4, 0.12, 3.2, x, py, z, 0, 0, tilt);
  P.box('steel', 5.6, 0.1, 3.4, x + 0.03, py - 0.06, z, 0, 0, tilt);
  const hiY = py + 2.2 * tn - 0.1, loY = py - 2.2 * tn - 0.1;                 // panel underside at the supports
  P.box('steel', 0.2, hiY - (top - 0.3), 0.2, x + 2.2, (hiY + top - 0.3) / 2, z);
  P.box('steel', 0.2, loY - (top - 0.3), 0.2, x - 2.2, (loY + top - 0.3) / 2, z);
  P.box('dark', 1.2, 0.8, 0.4, x - 1.5, 12.5, z + h + 0.45);                    // charge controller box on the face
  return P.build();
}

function plumbing(M) {
  const P = part('pipes', M);
  const y = K.top - 0.1;
  // gutters along the deck edges
  P.span('pvc', -hw - 0.55, y - 0.35, 0, -hw - 0.05, y, hl + 0.3);
  P.span('pvc', hw + 0.05, y - 0.35, 0, hw + 0.55, y, hl + 0.3);
  P.span('pvc', -hw - 0.55, y - 0.35, hl + 0.05, hw + 0.55, y, hl + 0.55);
  // first-flush stub, then the run to the upper tote
  const tx = TOWER.x, tz = TOWER.z, upTop = 10 + 3.83, ry = 14.25;            // run passes under the tower's solar panel
  P.pipe('pvc', [-hw - 0.3, y - 0.35, 1], [-hw - 0.3, y - 4, 1], 0.22);
  P.cyl('pvc', 0.3, 0.3, -hw - 0.3, y - 4.1, 1, 12);
  P.pipe('pvc', [-hw - 0.3, y - 0.3, 1.5], [tx + 4.4, ry, tz + 2.2], 0.18);
  P.pipe('pvc', [tx + 4.4, ry, tz + 2.2], [tx + 1.6, ry, tz + 1.4], 0.18);
  P.pipe('pvc', [tx + 1.6, ry, tz + 1.4], [tx + 1.6, upTop + 0.02, tz + 1.4], 0.18);
  // upper tote overflows into the lower one
  P.pipe('pvc', [tx + 1.75, 10.6, tz + 1.5], [tx + 1.75, 5 + 3.9, tz + 1.5], 0.14);
  // house supply: lower tote out, then up the post line into floor 1
  P.pipe('steel', [tx + 1.7, 5.7, tz - 1.2], [-hw - 0.4, 5.7, tz - 1.2], 0.12);
  P.pipe('steel', [-hw - 0.4, 5.7, tz - 1.2], [-hw - 0.4, K.clear + 0.2, tz - 1.2], 0.12);
  P.pipe('steel', [-hw - 0.4, K.clear + 0.2, tz - 1.2], [-hw + 1, K.clear + 0.2, tz - 1.2], 0.12);
  return P.build();
}

function car(M) {
  const P = part('car', M);
  const w = 6.2, l = 15.5, z = 1.4;                                          // parked so the sunroof sits under the trap door
  P.span('car', -w / 2, 1.2, z - l / 2, w / 2, 4.1, z + l / 2);
  P.span('car', -w / 2 + 0.25, 4.1, z - l / 2 + 0.6, w / 2 - 0.25, 6.0, z + l / 2 - 4.2);
  P.span('carglass', -w / 2 + 0.2, 4.4, z - l / 2 + 1.0, w / 2 - 0.2, 5.75, z + l / 2 - 4.5);
  P.box('carglass', w - 0.8, 1.5, 0.3, 0, 5.0, z + l / 2 - 4.25, -0.35, 0, 0);
  P.span('carglass', -1.2, 5.98, z + 0.5, 1.2, 6.05, z + 3.2);              // sunroof under the trap door
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) P.cyl('tire', 1.25, 0.9, sx * (w / 2 - 0.35), 1.25, z + sz * 4.9, 18, 0, Math.PI / 2);
  for (const sx of [-1, 1]) P.span('trim', sx * 2.1 - 0.5, 3.2, z + l / 2, sx * 2.1 + 0.5, 3.7, z + l / 2 + 0.06);
  P.span('dark', -w / 2, 1.2, z + l / 2 - 0.05, w / 2, 1.9, z + l / 2 + 0.25);
  P.span('dark', -w / 2, 6.0, z - l / 2 + 1.5, -w / 2 + 0.2, 6.25, z + l / 2 - 5);
  P.span('dark', w / 2 - 0.2, 6.0, z - l / 2 + 1.5, w / 2, 6.25, z + l / 2 - 5);
  return P.build();
}

function turbine(M) {
  const P = part('turbine', M);
  const { x, z, h } = TURBINE, b = 4, t = 0.8;
  const legs = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  for (const [ax, az] of legs) {
    P.cyl('concrete', 0.7, 1, x + ax * b, 0.3, z + az * b, 14);
    P.beam('steel', [x + ax * b, 0.6, z + az * b], [x + ax * t, h, z + az * t], 0.22);
  }
  const at = (yy) => b + (t - b) * (yy / h);
  for (let i = 0; i < 4; i++) {
    const y0 = 0.6 + (i * (h - 0.6)) / 4, y1 = 0.6 + ((i + 1) * (h - 0.6)) / 4, r0 = at(y0), r1 = at(y1);
    for (let k = 0; k < 4; k++) {
      const [ax, az] = legs[k], [bx, bz] = legs[(k + 1) % 4];
      P.beam('steel', [x + ax * r0, y0, z + az * r0], [x + bx * r1, y1, z + bz * r1], 0.12);
      P.beam('steel', [x + bx * r0, y0, z + bz * r0], [x + ax * r1, y1, z + az * r1], 0.12);
      P.beam('steel', [x + ax * r1, y1, z + az * r1], [x + bx * r1, y1, z + bz * r1], 0.14);
    }
  }
  P.span('trim', x - 0.6, h, z - 1.2, x + 0.6, h + 1.2, z + 1.6);            // nacelle
  P.beam('steel', [x, h + 0.6, z + 1.2], [x, h + 0.6, z + 4.2], 0.15);
  P.box('trim', 0.12, 2.0, 2.4, x, h + 1.0, z + 4.8);                      // tail vane
  const grp = P.build();
  // rotor as its own node so the viewer can turn it
  const R = part('turbine_rotor', M);
  R.cyl('trim', 0.45, 0.9, 0, 0, 0, 14, Math.PI / 2, 0);
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3;
    R.box('blade', 0.75, 7, 0.12, Math.sin(a) * 3.8, Math.cos(a) * 3.8, -0.1, 0, 0, -a);
  }
  const rotor = R.build();
  rotor.position.set(x * FT, (h + 0.6) * FT, (z - 1.6) * FT);
  grp.add(rotor);
  grp.userData.rotor = rotor;
  return grp;
}

function shed(M) {
  const P = part('shed', M);
  const x = -26, z = -18, w = 8, d = 10, wall = 7, rise = 2.5;
  for (const [ax, az] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) P.box('timber', 0.5, 0.5, 0.5, x + ax * (w / 2 - 0.3), 0.25, z + az * (d / 2 - 0.3));
  P.span('timber', x - w / 2, 0.5, z - d / 2, x + w / 2, 0.9, z + d / 2);
  P.span('siding', x - w / 2, 0.9, z - d / 2, x + w / 2, 0.9 + wall, z + d / 2);
  for (let xx = x - w / 2 + 0.75; xx < x + w / 2; xx += 1.5) { P.box('siding', 0.2, wall, 0.12, xx, 0.9 + wall / 2, z + d / 2 + 0.06); P.box('siding', 0.2, wall, 0.12, xx, 0.9 + wall / 2, z - d / 2 - 0.06); }
  const g1 = gable(w, rise, 0.4); g1.translate(x, 0.9 + wall, z - d / 2); P.geo('siding', g1);
  const g2 = gable(w, rise, 0.4); g2.translate(x, 0.9 + wall, z + d / 2 - 0.4); P.geo('siding', g2);
  const sl = Math.hypot(w / 2, rise) + 0.8, ang = Math.atan2(rise, w / 2);
  for (const s of [-1, 1]) P.box('metal', sl, 0.15, d + 1.2, x + s * (w / 4 + 0.15), 0.9 + wall + rise / 2 + 0.1, z, 0, 0, -s * ang);
  P.box('timber', 4, 6.2, 0.25, x, 0.9 + 3.1, z + d / 2 + 0.15);
  P.box('trim', 0.12, 6.2, 0.3, x, 0.9 + 3.1, z + d / 2 + 0.2);
  windowAt(P, 'x', x + w / 2, z, 4.2, 2, 2);
  return P.build();
}

function pen(M) {
  const P = part('pen', M);
  const x0 = -32, x1 = -14, z0 = 14, z1 = 26, sp = 4;
  const run = (a, b) => {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(len / sp));
    for (let i = 0; i <= n; i++) {
      const px = a[0] + ((b[0] - a[0]) * i) / n, pz = a[1] + ((b[1] - a[1]) * i) / n;
      P.box('timber', 0.4, 4.4, 0.4, px, 2.0, pz);
    }
    for (const y of [1.2, 2.5, 3.8]) P.beam('timber', [a[0], y, a[1]], [b[0], y, b[1]], 0.15, 0.45);
  };
  run([x0, z0], [x1, z0]); run([x1, z0], [x1, z1]); run([x1, z1], [x0, z1]);
  run([x0, z1], [x0, z0 + 6]); run([x0, z0 + 2], [x0, z0]);                  // gate gap on the west side
  // small three-sided shelter and a trough
  P.span('timber', x0 + 1, 0, z1 - 6, x0 + 1.4, 5, z1 - 1);
  P.span('timber', x0 + 1, 0, z1 - 1.4, x0 + 6, 5, z1 - 1);
  P.span('timber', x0 + 1, 0, z1 - 6, x0 + 6, 5, z1 - 5.6);
  P.box('metal', 6, 0.15, 6.4, x0 + 3.5, 5.3, z1 - 3.5, 0.12, 0, 0);
  P.span('steel', x1 - 6, 0, z0 + 1, x1 - 1, 1.6, z0 + 2.6);
  P.span('pvc', x1 - 5.8, 1.3, z0 + 1.2, x1 - 1.2, 1.5, z0 + 2.4);
  return P.build();
}

function ground(M) {
  const P = part('ground', M);
  P.geo('grass', new THREE.CylinderGeometry(70, 72, 1, 64).translate(0, -0.5, 0));
  P.span('gravel', -hw - 3, 0, -hl - 10, hw + 8, 0.06, hl + 4);
  return P.build();
}

// ---------------------------------------------------------------------------------------------
// Label anchors (metres) and the spec line each one carries.
const at = (x, y, z) => new THREE.Vector3(x * FT, y * FT, z * FT);
export const SPOTS = [
  { id: 'deck', part: 'deck', text: 'Rain deck', anchor: at(3, K.top + 1.5, 5), info: '16 x 10 ft metal deck with its own gutters. One inch of rain on the deck yields about 100 gallons after first-flush.' },
  { id: 'loft', part: 'roof', text: 'Loft', anchor: at(-2, K.top + 3, -5), info: '16 x 10 ft (160 sf) under the 45 degree metal roof. Sleep and storage, half the 20 ft length.' },
  { id: 'floors', part: 'envelope', text: 'Floors 1 + 2', anchor: at(-hw - 0.5, K.f2, -1), info: '320 sf each, two ~8 ft stories in a 16 ft wall. About 800 sf living with the loft. Shell: crate pair, wood frame, or stucco foam to the same outside size.' },
  { id: 'stove', part: 'interior', text: 'Wood stove', anchor: at(-4, K.f1 + 3.5, -6), info: 'Floor 1 wood stove. Chimney runs through floor 2 and the loft. Cook on it, heat water on it, radiant heat on all three levels.' },
  { id: 'trap', part: 'interior', text: 'Trap door', anchor: at(0, K.f1 + 0.6, 3), info: 'Trap door in floor 1. Drop onto the vehicle below or through its sunroof.' },
  { id: 'istair', part: 'interior', text: 'Inner stair', anchor: at(6, K.f1 + 5, -5), info: 'Stair floor 1 to 2 and a ladder to the loft. Placement is a model assumption, the kit spec does not fix it.' },
  { id: 'carport', part: 'car', text: 'Carport', anchor: at(0, 6.8, -6), info: '16 x 20 ft under the house, 9 ft clear (8 ft minimum). Room for an SUV plus the sunroof trap.' },
  { id: 'posts', part: 'structure', text: 'Stilts', anchor: at(hw - 0.3, 5, -hl + 0.3), info: '8x8 or larger posts on a 6-post grid: corners plus midspan on the 20 ft sides. 45 degree braces. Concrete piers below frost and flood line.' },
  { id: 'porch', part: 'stairs_porch', text: 'Stairs + porch', anchor: at(hw + 3, K.f1 + 1, 6), info: 'Detached wood or steel stair along the 20 ft side to a small porch. Unhook it for security.' },
  { id: 'solar', part: 'solar_roof', text: 'Roof solar', anchor: at(5, K.top + 4.5, -5), info: 'PV on the house roof and the tower. Finish the envelope and the stove before buying more panels.' },
  { id: 'tower', part: 'tower', text: 'Water tower', anchor: at(TOWER.x, 16.5, TOWER.z), info: '8 x 8 ft, about 16 ft total. Two 275 gal IBC totes hold rain and well water high. Gravity feeds the house. Solar on top.' },
  { id: 'pipes', part: 'pipes', text: 'Rain line', anchor: at(-hw - 4, K.top - 4, 2.5), info: 'Deck gutters, a first-flush stub, then a filter into the upper tote. The upper tote overflows to the lower one. Supply runs downhill into floor 1.' },
  { id: 'turbine', part: 'turbine', text: 'Wind turbine', anchor: at(TURBINE.x, TURBINE.h + 3, TURBINE.z), info: 'Small lattice-tower wind turbine. Concept from the site drawing, not part of the kit spec.' },
  { id: 'shed', part: 'shed', text: 'Shed', anchor: at(-26, 11, -18), info: '8 x 10 ft storage shed. Concept from the site drawing, not part of the kit spec.' },
  { id: 'pen', part: 'pen', text: 'Animal pen', anchor: at(-23, 5.5, 20), info: 'Rail-fenced pen with a small shelter and trough. Concept from the site drawing, not part of the kit spec.' },
];

// Part groups the viewer toggles, in panel order.
export const PARTS = [
  { group: 'House', items: [['structure', 'Stilts + frame'], ['envelope', 'Walls'], ['roof', 'Roof + loft'], ['deck', 'Rain deck'], ['interior', 'Interior'], ['solar_roof', 'Roof solar']] },
  { group: 'Water', items: [['tower', 'Water tower'], ['pipes', 'Gutters + pipes']] },
  { group: 'Access', items: [['stairs_porch', 'Stairs + porch']] },
  { group: 'Site', items: [['car', 'Car'], ['turbine', 'Wind turbine'], ['shed', 'Shed'], ['pen', 'Animal pen']] },
];

export function buildSite() {
  const M = mats();
  const site = new THREE.Group(); site.name = '1333_stilt_house_site';
  const parts = {};
  const add = (g) => { parts[g.name] = g; site.add(g); return g; };
  [structure, envelope, interior, roof, deck, solarRoof, stairsPorch, tower, plumbing, car, turbine, shed, pen].forEach(f => add(f(M)));
  const gnd = ground(M); gnd.userData.noExport = true; site.add(gnd); parts.ground = gnd;
  return { site, parts, materials: M };
}
