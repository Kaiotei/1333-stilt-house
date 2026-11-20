// 1333 stilt house kit: every dimension in one place (feet).
// Read by the 3D model (model.js), the blueprint sheets (plans.js) and the materials estimate,
// so the model, the drawings and the numbers can never disagree. Change a value here and
// regenerate the downloads (tools/build_downloads.py).
// Source: the published kit spec on 1333covenant.com/irl/ ("Full kit specs").
// License: CC BY-SA 4.0 (design), MIT (code). Experimental, educational, not engineered.

export const FT = 0.3048;                  // feet -> metres

export const K = {
  W: 16, L: 20,            // plate: 16 x 20 ft (two 8 x 20 crates, or wood / foam to the same outside)
  clear: 9,                // carport clear height (8 ft minimum, 9 ft recommended)
  beam: 0.75, deck: 0.25,  // floor framing depth under floor 1 (size per engineer)
  story: 8, box: 16,       // two ~8 ft stories inside a 16 ft wall
  pitch: 8,                // 45 degree roof over the 16 ft span rises 8 ft
  post: 0.67,              // 8x8 posts (or larger)
  wall: 0.5,               // modelled wall thickness
  rail: 3.5,               // rooftop deck guard height
};
K.f1 = K.clear + K.beam + K.deck;          // floor 1 surface (10 ft)
K.f2 = K.f1 + K.story;                     // floor 2 surface (18 ft)
K.top = K.f1 + K.box;                      // wall top = loft floor = deck (26 ft)
K.ridge = K.top + K.pitch;                 // ridge (34 ft)
export const HW = K.W / 2, HL = K.L / 2;

// Axes: x across the 16 ft width (+x = south, porch + roof solar side), z along the 20 ft
// length (+z = east, deck end), y up. Origin = centre of the plate at grade.

// Six posts: corners plus midspan on the 20 ft sides.
const PX = HW - K.post / 2;
export const POSTS = [[-PX, -HL + 0.34], [PX, -HL + 0.34], [-PX, 0], [PX, 0], [-PX, HL - 0.34], [PX, HL - 0.34]];
export const POST_X = PX;
export const JOIST_OC = 2;                 // joists every 24 in
export const BRACE = 4;                    // 45 degree knee braces, 4 ft legs

// Openings. wall: '-x' north, '+x' south, '-z' west (loft gable end), '+z' east (deck end).
// at = position along the wall, y0 = sill height above grade, w x h = rough size.
const SILL = 3;
export const WINDOWS = [];
for (const fy of [K.f1 + SILL, K.f2 + SILL]) {
  WINDOWS.push(
    { wall: '-x', at: -5, y0: fy, w: 3, h: 4 }, { wall: '-x', at: 4, y0: fy, w: 3, h: 4 },
    { wall: '+x', at: -5, y0: fy, w: 3, h: 4 },
    { wall: '-z', at: -3.5, y0: fy, w: 3, h: 4 }, { wall: '-z', at: 3.5, y0: fy, w: 3, h: 4 },
    { wall: '+z', at: 0, y0: fy, w: 3, h: 4 },
  );
}
WINDOWS.push({ wall: '+x', at: 7, y0: K.f2 + SILL, w: 3, h: 4 });
export const LOFT_WINDOW = { wall: '-z', at: 0, y0: K.top + 1.6, w: 2.5, h: 2.5 };
export const DOORS = {
  porch: { wall: '+x', at: 7, y0: K.f1, w: 3, h: 7 },
  loft: { at: 0, z: -0.25, y0: K.top + 0.3, w: 3, h: 6.2 },          // gable wall, onto the rain deck
};

// Interior (stove, trap and rough sizes from the spec; inner stair + ladder are a model assumption)
export const STOVE = { x0: -5.1, x1: -2.9, z0: -7, z1: -5, h: 2.9, hearth: [-7.5, -3, -8, -4] };
export const CHIMNEY = { x: -4, z: -6, r: 0.33, cap: K.ridge + 2.0 };
export const TRAP = { x0: -1.5, x1: 1.5, z0: 1.5, z1: 4.5 };
export const ISTAIR = { x0: 4.6, x1: 7.4, zLow: -1, zHigh: -9, n: 12 };
export const LADDER = { x0: -6.8, x1: -5.2, z: -1.2 };
export const ROOF_SOLAR = { z: [-8.3, -5, -1.7], len: 5.4, wid: 3.1 };

// Detached porch + stair on the south (+x) side, running toward -z.
export const PORCH = { x0: HW + 0.25, x1: HW + 5.25, z0: 2.5, z1: HL, rail: 3.0 };
export const STAIR = { n: 15, run: 0.833, width: 3.5, x0: PORCH.x0 + 0.4 };
STAIR.x1 = STAIR.x0 + STAIR.width;
STAIR.rise = K.f1 / STAIR.n;
STAIR.zEnd = PORCH.z0 - (STAIR.n - 1) * STAIR.run;

// Water tower: 8 x 8, ~16 ft, two 275 gal IBC totes, solar on top.
export const TOWER = { x: -17, z: 4, size: 8, half: 3.75, levels: [5, 10], top: 15 };
export const TOTE = { W: 3.33, D: 4, H: 3.83, gal: 275 };

// Concept extras (from the site drawing, not part of the kit spec)
export const TURBINE = { x: 30, z: -16, h: 27, base: 4 };
export const SHED = { x: -26, z: -18, w: 8, d: 10, wall: 7, rise: 2.5 };
export const PEN = { x0: -32, x1: -14, z0: 14, z1: 26 };

// Feet -> 12'-6" style text
export function ftin(v) {
  const neg = v < 0; v = Math.abs(v);
  let f = Math.floor(v + 1e-6), i = Math.round((v - f) * 12);
  if (i === 12) { f += 1; i = 0; }
  return `${neg ? '-' : ''}${f}'-${i}"`;
}
export const metres = v => `${(v * FT).toFixed(2)} m`;
