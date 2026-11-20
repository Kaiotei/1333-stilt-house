// Exports the full site (every part except the ground) as a binary glTF, real size in metres.
// Run from a folder that has `three` installed and copies of model.js + dims.js beside it
// (build_downloads.py sets that up). Usage: node glb.mjs <output .glb>
// License: MIT. Kaiotei / 13 <33 Covenant.
import fs from 'node:fs';

// GLTFExporter reads Blobs with FileReader, which Node lacks.
globalThis.FileReader = class {
  readAsArrayBuffer(b) { b.arrayBuffer().then(r => { this.result = r; this.onload?.({ target: this }); this.onloadend?.({ target: this }); }); }
  readAsDataURL(b) { b.arrayBuffer().then(r => { this.result = `data:${b.type || 'application/octet-stream'};base64,` + Buffer.from(r).toString('base64'); this.onload?.({ target: this }); this.onloadend?.({ target: this }); }); }
};

const { buildSite } = await import('./model.js');
const { GLTFExporter } = await import('three/addons/exporters/GLTFExporter.js');
const { site, parts } = buildSite();
site.remove(parts.ground);
const buf = await new GLTFExporter().parseAsync(site, { binary: true });
fs.writeFileSync(process.argv[2], Buffer.from(buf));
console.log('glb', buf.byteLength, 'bytes');
