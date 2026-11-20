// Writes every blueprint sheet as an SVG file.
// Usage: node sheets.mjs <path to plans.js> <output dir>
// License: MIT. Kaiotei / 13 <33 Covenant.
import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const [, , plansPath, outDir] = process.argv;
const { SHEETS } = await import(pathToFileURL(path.resolve(plansPath)).href);
fs.mkdirSync(outDir, { recursive: true });
for (const s of SHEETS) {
  fs.writeFileSync(path.join(outDir, `${s.id}.svg`), `<?xml version="1.0" encoding="UTF-8"?>\n${s.svg()}\n`);
  console.log('sheet', s.id);
}
