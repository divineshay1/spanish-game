/**
 * Pronunciation engine for Latin American Spanish: syllables, stress and an
 * English-style respelling. Ported from the prototype.
 *
 * Fixes (approved): a c or g that ends a syllable keeps its hard sound
 * (doctor = dohk-TOHR, not dohs-TOHR). And the prototype looped forever when a "y" sat between a vowel and a
 * consonant inside a word (only happens with English words like "days").
 * Here that "y" is simply read as part of the vowel sound.
 */
const VOW = 'aeiouáéíóúü';
const CL = new Set(['pr', 'br', 'tr', 'dr', 'cr', 'gr', 'fr', 'pl', 'bl', 'cl', 'gl', 'fl', 'tl']);
const EXC: Record<string, string> = {
  méxico: 'MEH-hee-koh',
  mexicano: 'meh-hee-KAH-noh',
  mexicana: 'meh-hee-KAH-nah',
};
const NU: Record<string, string> = {
  a: 'ah', e: 'eh', i: 'ee', o: 'oh', u: 'oo', y: 'ee', ai: 'eye', ay: 'eye', ei: 'ay', ey: 'ay',
  oi: 'oy', oy: 'oy', au: 'ow', eu: 'ehoo', ou: 'ohoo', ia: 'yah', ie: 'yeh', io: 'yoh', iu: 'yoo',
  ua: 'wah', ue: 'weh', ui: 'wee', uo: 'woh', uy: 'wee', uay: 'wy', uai: 'wy', uey: 'way', uei: 'way',
};
const weakV = (c: string) => 'iuü'.includes(c);

interface Unit {
  t: 'c' | 'v';
  s: string;
}

function tokenize(w: string): Unit[] {
  const u: Unit[] = [];
  let i = 0;
  while (i < w.length) {
    const c = w[i];
    const p = w.slice(i, i + 2);
    const n2 = w[i + 2] || '';
    if (p === 'ch' || p === 'll' || p === 'rr') {
      u.push({ t: 'c', s: p });
      i += 2;
      continue;
    }
    if (p === 'qu' || (p === 'gu' && 'eéií'.includes(n2))) {
      u.push({ t: 'c', s: p });
      i += 2;
      continue;
    }
    if (VOW.includes(c) || (c === 'y' && i === w.length - 1)) {
      let s = c;
      let j = i + 1;
      while (j < w.length && (VOW.includes(w[j]) || (w[j] === 'y' && j === w.length - 1))) {
        const a = s[s.length - 1];
        const b = w[j];
        if (weakV(a) || a === 'y' || weakV(b) || b === 'y') {
          s += b;
          j++;
        } else break;
      }
      u.push({ t: 'v', s });
      i = j;
      continue;
    }
    u.push({ t: 'c', s: c });
    i++;
  }
  return u;
}

export function syllabify(w: string): string[] {
  const u = tokenize(w);
  const nuc: number[] = [];
  u.forEach((x, i) => {
    if (x.t === 'v') nuc.push(i);
  });
  if (!nuc.length) return [w];
  const sy: string[] = [];
  let start = 0;
  for (let k = 0; k < nuc.length - 1; k++) {
    const a = nuc[k];
    const b = nuc[k + 1];
    const cons = u.slice(a + 1, b);
    const n = cons.length;
    let sp: number;
    if (n <= 1) sp = 0;
    else if (n === 2) sp = CL.has(cons[0].s + cons[1].s) ? 0 : 1;
    else if (n === 3) sp = CL.has(cons[1].s + cons[2].s) ? 1 : 2;
    else sp = 2;
    const cut = a + 1 + sp;
    sy.push(u.slice(start, cut).map((x) => x.s).join(''));
    start = cut;
  }
  sy.push(u.slice(start).map((x) => x.s).join(''));
  return sy;
}

function stressIdx(sy: string[], w: string): number {
  const a = sy.findIndex((s) => /[áéíóú]/.test(s));
  if (a >= 0) return a;
  if (sy.length === 1) return 0;
  return /[aeiouáéíóúüns]$/.test(w) ? sy.length - 2 : sy.length - 1;
}

function nucSay(s: string): string {
  const k = s.normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (NU[k]) return NU[k];
  if (k.length >= 3 && 'iu'.includes(k[0])) {
    const r = k.slice(1);
    return (k[0] === 'i' ? 'y' : 'w') + (NU[r] || r.split('').map((x) => NU[x] || x).join(''));
  }
  return k
    .split('')
    .map((x) => NU[x] || x)
    .join('');
}

function sylSay(s: string, trill: boolean): string {
  let o = '';
  let i = 0;
  const E = 'eéií';
  // The prototype treated a missing next letter as "e or i" ('eéií'.includes('')
  // is true), so a syllable-final c or g read as "s" or "h" (doctor -> dohs-TOHR).
  // Fixed with your OK: only a real following e or i softens c and g.
  const isE = (ch: string | undefined) => !!ch && E.includes(ch);
  while (i < s.length) {
    const c = s[i];
    const p = s.slice(i, i + 2);
    if (p === 'ch') { o += 'ch'; i += 2; continue; }
    if (p === 'll') { o += 'y'; i += 2; continue; }
    if (p === 'rr') { o += 'rr'; i += 2; continue; }
    if (p === 'qu') { o += 'k'; i += 2; continue; }
    if (p === 'gu' && isE(s[i + 2])) { o += 'g'; i += 2; continue; }
    if (p === 'gü') { o += 'gw'; i += 2; continue; }
    if (c === 'ñ') { o += 'ny'; i++; continue; }
    if (c === 'c') { o += isE(s[i + 1]) ? 's' : 'k'; i++; continue; }
    if (c === 'z') { o += 's'; i++; continue; }
    if (c === 'g') { o += isE(s[i + 1]) ? 'h' : 'g'; i++; continue; }
    if (c === 'j') { o += 'h'; i++; continue; }
    if (c === 'h') { i++; continue; }
    if (c === 'v') { o += 'b'; i++; continue; }
    if (c === 'x') { o += 'ks'; i++; continue; }
    if (c === 'r' && i === 0 && trill) { o += 'rr'; i++; continue; }
    if (c === 'y') {
      const nx = s[i + 1];
      if (nx && VOW.includes(nx)) { o += 'y'; i++; continue; }
      if (!(i > 0 && VOW.includes(s[i - 1]))) { o += 'ee'; i++; continue; }
    }
    if (VOW.includes(c) || c === 'y') {
      let j = i;
      while (j < s.length && (VOW.includes(s[j]) || (s[j] === 'y' && j === s.length - 1 && j > i))) j++;
      if (j === i) {
        // fix: a "y" after a vowel but before a consonant; read it as "ee"
        o += 'ee';
        i++;
        continue;
      }
      o += nucSay(s.slice(i, j));
      i = j;
      continue;
    }
    o += c;
    i++;
  }
  return o;
}

export interface Pron {
  /** syllables */
  syl: string[];
  /** index of the stressed syllable */
  st: number;
  /** respelling, stressed syllable in capitals, e.g. "KAH-sah" */
  say: string;
}

export function pron(word: string): Pron {
  const w = word.toLowerCase();
  if (!w || /[^a-záéíóúüñ]/.test(w)) return { syl: [word], st: 0, say: word };
  const sy = syllabify(w);
  const st = stressIdx(sy, w);
  const parts = sy.map((s, k) => {
    const tr = s[0] === 'r' && s[1] !== 'r' && (k === 0 || /[nls]$/.test(sy[k - 1]));
    return sylSay(s, tr);
  });
  let say = parts.map((p, k) => (k === st && sy.length > 1 ? p.toUpperCase() : p)).join('-');
  if (EXC[w]) say = EXC[w];
  return { syl: sy, st, say };
}
