// Renders every plant into one PNG for checking: node scripts/plant_sheet.mjs out.png  (uses Playwright)
import { createRequire } from 'node:module';
import { build } from 'vite';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const out = process.argv[2] || 'plants.png';
const res = await build({ logLevel: 'silent', configFile: false, build: { write: false, lib: { entry: 'src/art/plants.ts', formats: ['es'], fileName: 'p' } } });
const code = res[0].output[0].code;
const b = await chromium.launch();
const p = await b.newPage();
p.on('pageerror', (e) => console.log('PAGE ERROR', e.message));
await p.setContent('<body style="margin:0;background:#fcb4db"></body>');
await p.addScriptTag({ type: 'module', content: code.replace(/export\s*\{([^}]*)\};?\s*$/, (_, list) => list.split(',').map((x) => { const [a, b] = x.trim().split(/\s+as\s+/); return `const ${b || a} = ${a};`; }).join('')) + `
const fams=Object.keys(FAMILY_LOOK);const S=4,W=16,H=26;const cv=document.createElement('canvas');cv.width=9*3*W*S/1.5|0;cv.width=27*W*S/2;cv.height=fams.length*H*S/2;
const g=cv.getContext('2d');g.imageSmoothingEnabled=false;fams.forEach((f,fi)=>{for(let t=0;t<3;t++)for(let s=0;s<9;s++){g.drawImage(plantCanvas(f,s,t),(t*9+s)*W*S/2,fi*H*S/2,W*S/2,H*S/2);}});
document.body.appendChild(cv);window.done=1;` });
await p.waitForFunction('window.done');
await p.locator('canvas').screenshot({ path: out });
await b.close();
