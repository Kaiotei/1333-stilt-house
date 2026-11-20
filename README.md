# 1333 Stilt House Kit

Open-source plans for a 16 x 20 ft house on stilts: carport underneath, two floors and a
half loft, a rooftop rain deck and a gravity water tower. Published free by
**Kaiotei / 13 &lt;33 Covenant** as a basis for off-grid and sustainable living.

- Live 3D model: https://1333covenant.com/irl/house/
- Building guide: https://1333covenant.com/irl/house/guide.html

## Read first: disclaimer

Experimental design, published for educational purposes as a starting point for off-grid and
sustainable living. These plans are not engineered, stamped, or approved for construction in
any jurisdiction, and have not been reviewed by a licensed architect or engineer. Before
building, have a licensed engineer design the foundations, posts, beams, connections and roof
for your site's soil, frost depth, flood, wind, snow, seismic and fire conditions, and obtain
every permit your jurisdiction requires. Anyone who builds, modifies or occupies a structure
based on these plans does so entirely at their own risk. The plans are provided as-is, without
warranty of any kind, and the authors and 13 &lt;33 Covenant accept no liability for injury,
death, property damage or any other loss arising from their use.

## What is in here

| Path | What it is |
|---|---|
| `plans/1333-stilt-house-plans.pdf` | The ten-sheet plan set on 11 x 17 paper |
| `plans/sheets/*.svg` | Each sheet as a scalable vector file |
| `docs/1333-stilt-house-guide.pdf` | The building guide: before you build, materials estimate, build sequence, systems, safety |
| `export/1333-stilt-house.glb` | The full site as a 3D model, real size in metres (Blender, SketchUp, Windows 3D Viewer) |
| `model/dims.js` | **Every dimension, in feet.** Change it here and regenerate. |
| `model/model.js` | The 3D model (three.js) |
| `model/plans.js` | The blueprint sheets (SVG) and the materials estimate |
| `tools/` | Scripts that rebuild the SVGs, PDFs and GLB |

## Sheets

| Sheet | Content |
|---|---|
| G-001 | Cover, index, disclaimer, key specs |
| C-101 | Site plan |
| S-101 | Foundation and post plan |
| S-102 | Floor framing plan and brace detail |
| A-101 | Floor plans: floor 1, floor 2, loft + rain deck |
| A-201 | Elevations: south (porch) and north (tower) |
| A-202 | Elevations: west (loft gable) and east (deck end) |
| A-301 | Building section A-A |
| A-401 | Stair and porch detail |
| P-101 | Water, power and heat schematic |

## Key specs

- Footprint 16 x 20 ft (two 8 x 20 crates, or wood / foam to the same outside size)
- Floors 1 + 2: 320 sf each, two ~8 ft stories in a 16 ft wall; about 800 sf living with the loft
- Loft 16 x 10 ft under a 45 degree metal roof; the other half is a 16 x 10 ft metal rain deck
- Carport 16 x 20, 9 ft clear (8 ft minimum)
- Posts 8x8 or larger on a 6-post grid with 45 degree braces, concrete piers below frost and flood line
- Detached stair to a small porch; trap door in floor 1 down to the vehicle
- Water tower 8 x 8, about 16 ft, two 275 gal IBC totes, gravity to the house
- Floor-1 wood stove; solar on the roof and the tower

## Material cost estimate

The guide includes a lumber takeoff and material cost estimate (no labor), priced November 2026
from US big-box and lumber-yard listings: about **5,900 board feet + 82 sheets, roughly $9,000
in lumber and sheet goods**, and about **$17,300 to $21,500 for a weathertight wood-frame shell**
including concrete, metal roofing and allowances for windows, doors, siding and hardware.
Quantities follow `model/dims.js`; prices and their sources live in `costs()` in `model/plans.js`.
Member sizes used for pricing are estimating assumptions, not engineering.

## Change the design

1. Edit `model/dims.js`.
2. Run `python tools/build_downloads.py` (needs Node 18+, Python 3, and Microsoft Edge or
   Chrome for the PDFs). It rebuilds every SVG sheet, both PDFs, the GLB and the ZIP.

The 3D model, all ten sheets and the materials estimate read the same file, so they stay in step.

## License

- **Plans, drawings, guide and 3D model:** [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) (`LICENSE`).
  Copy, adapt, build from and share them, including commercially, if you credit
  "Kaiotei / 13 &lt;33 Covenant", link the license, say what you changed, and release your
  adapted plans under the same license.
- **Code** (`model/*.js`, `tools/`): MIT (`LICENSE-CODE`).

Attribution line to copy:
"1333 Stilt House Kit" by Kaiotei / 13 &lt;33 Covenant, CC BY-SA 4.0, 1333covenant.com/irl/house

Devised by Kaiotei from lived builds. Math and research support from AI.
