// Turns pics.json (base64 JPEGs) into public/pics/<id>.jpg so the app can load them one at a time.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const pics = JSON.parse(readFileSync(new URL('../pics.json', import.meta.url), 'utf8'));
const dir = new URL('../public/pics/', import.meta.url);
mkdirSync(dir, { recursive: true });
let n = 0;
for (const [id, uri] of Object.entries(pics)) {
  const m = /^data:image\/jpeg;base64,(.+)$/.exec(uri);
  if (!m || !/^[a-z0-9_]+$/i.test(id)) throw new Error('unexpected picture: ' + id);
  writeFileSync(new URL(`${id}.jpg`, dir), Buffer.from(m[1], 'base64'));
  n++;
}
console.log(`wrote ${n} pictures to public/pics/`);
