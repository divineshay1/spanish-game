/**
 * Copies content out of mi-espanol-legacy.html into JSON, byte-for-byte,
 * by running the prototype's own data code. Also records the prototype's
 * engine outputs as "golden" answers so tests prove the new engine matches.
 *
 * Run: node scripts/extract_legacy.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../mi-espanol-legacy.html', import.meta.url), 'utf8').split('\n');
const lines = (a, b) => html.slice(a - 1, b).join('\n');
const find = (re, from = 1) => {
  for (let i = from - 1; i < html.length; i++) if (re.test(html[i])) return i + 1;
  throw new Error('not found: ' + re);
};
// locate blocks by their first line so small edits to the prototype don't break this
const L = {
  dataStart: find(/^const DICT=\{/),
  dataEnd: find(/^\(function\(\)\{/, find(/^const DIFS=\[/)) - 1,
  helpers: [find(/^const norm=/), find(/^const norm=/)],
  pron: [find(/^const VOW=/), find(/^function pron\(/) + 4],
  sounds: [find(/^const SOUNDS=\[/), find(/^function vSounds\(/) - 1],
  srs: [find(/^const INT=\[/), find(/^const lapse=/)],
  grade: [find(/^const lev=/), find(/^function gradeTyped\(/) + 4],
  conj: [find(/^const SPEC=\{/), find(/^function impForms\(/)],
  vtn: [find(/^const VTN=/), find(/^const ENDS=/)],
  pairs: [find(/^const PAIRS=\[/), find(/^let F=\{/) - 1],
  imm: [find(/^const HQ=\[/), find(/^const ISEQ=/)],
  duel: [find(/^const ENEMIES=\[/), find(/^const TY=/)],
  clinic: [find(/^const CL_NAMES=/), find(/^const CL_OTHER=/)],
  nums: [find(/^const N_U=/), find(/^function n2s\(/)],
  modn: [find(/^const MODN=/), find(/^const MODN=/)],
};

const r = (k) => lines(...L[k]);
const program = [
  'var PICS={};',
  lines(L.dataStart, L.dataEnd).replace(/^const PICS=\{\};.*$/m, ''),
  r('helpers'), r('pron'), r('sounds'), r('srs'), r('grade'), r('conj'), r('vtn'),
  r('pairs'), r('imm'), r('duel'), r('clinic'), r('nums'), r('modn'),
  `;globalThis.OUT = {
    DICT, STORIES, CARDS, BUILD, EXTRA, LESSONS, IMG, QW, QQ, TENSES, TQ, COMP, VGROUPS, VERBS,
    CONN, CNOTE, CQ, TOPICS, PCATS, PHR, RGRP, RAIZ, DLG, SIETE, STEPT, STEPD, DIFS, SOUNDS,
    VTN, ENDS, PAIRS, HQ, CONN_ES, IST, ISEQ, ENEMIES, PERKS, CL_NAMES, CL_BODY, CL_SYM, CL_CMD,
    CL_OTHER, N_U, N_T, N_H, MODN };
  globalThis.ENGINE = { norm, pron, syllabify, gradeTyped, enAlts, stripArt, lev, conj, forms,
    subjForms, impForms, conjNotes, n2s, INT, lapse };`,
].join('\n');

const ctx = { console, Math, JSON, Object, Array, String, Number, Set, Map, RegExp };
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(program, ctx, { filename: 'legacy.js' });
const { OUT, ENGINE: E } = ctx;

// ---- content ----
const dataDir = new URL('../src/content/data/', import.meta.url);
mkdirSync(dataDir, { recursive: true });
const groups = {
  core: ['DICT', 'CARDS', 'EXTRA', 'IMG', 'SIETE', 'STEPT', 'STEPD'],
  reading: ['STORIES', 'BUILD', 'LESSONS', 'DLG'],
  grammar: ['QW', 'QQ', 'TENSES', 'TQ', 'COMP', 'VGROUPS', 'VERBS', 'CONN', 'CNOTE', 'CQ', 'TOPICS', 'DIFS', 'VTN', 'ENDS'],
  phrases: ['PCATS', 'PHR', 'RGRP', 'RAIZ'],
  sounds: ['SOUNDS', 'PAIRS'],
  immersion: ['HQ', 'CONN_ES', 'IST', 'ISEQ'],
  duel: ['ENEMIES', 'PERKS'],
  clinic: ['CL_NAMES', 'CL_BODY', 'CL_SYM', 'CL_CMD', 'CL_OTHER'],
  progress: ['MODN'],
};
const counts = {};
for (const [g, keys] of Object.entries(groups)) {
  const obj = {};
  for (const k of keys) {
    obj[k] = OUT[k];
    counts[k] = Array.isArray(OUT[k]) ? OUT[k].length : Object.keys(OUT[k]).length;
  }
  writeFileSync(new URL(`${g}.json`, dataDir), JSON.stringify(obj, null, 1) + '\n');
}
console.log('content:', JSON.stringify(counts));

// ---- golden engine answers ----
const gold = new URL('../tests/golden/', import.meta.url);
mkdirSync(gold, { recursive: true });

// every Spanish word that appears anywhere in the content
const words = new Set();
const addText = (t) => String(t).toLowerCase().split(/\s+/).forEach((w) => {
  const c = w.replace(/^[¿¡"“«(]+|[.,;:!?"”»)…]+$/g, '');
  if (c) words.add(c);
});
Object.keys(OUT.DICT).forEach(addText);
OUT.CARDS.forEach((c) => addText(c.es));
OUT.PHR.forEach((p) => addText(p.es));
OUT.RAIZ.forEach((p) => addText(p.es));
OUT.IMG.forEach((p) => { addText(p.es); addText(p.ex); });
OUT.VERBS.forEach((v) => addText(v.es));
OUT.SOUNDS.forEach((s) => s[2].forEach(addText));
OUT.STORIES.forEach((s) => JSON.stringify(s).split(/[^a-záéíóúüñ]+/i).forEach(addText));
// The prototype's pron() never finishes on a few English words like "days"
// (y between a vowel and a consonant). Those are skipped here and fixed in
// src/engine/pronunciation.ts.
const pronGold = {};
const pronHangs = [];
[...words].sort().forEach((w) => {
  try {
    pronGold[w] = JSON.parse(vm.runInContext(
      `JSON.stringify(Object.assign(ENGINE.pron(${JSON.stringify(w)}), {sy: ENGINE.syllabify(${JSON.stringify(w)})}))`,
      ctx, { timeout: 250 }));
  } catch { pronHangs.push(w); }
});
if (pronHangs.length) console.log('prototype pron() hangs on (skipped):', pronHangs.join(', '));
writeFileSync(new URL('pron.json', gold), JSON.stringify(pronGold) + '\n');

const conjGold = {};
for (const v of OUT.VERBS) {
  const cj = E.conj(v.es);
  const t = {};
  for (const tid of [...OUT.VTN, 'plus', 'ant', 'pluscont']) t[tid] = E.forms(cj, tid);
  conjGold[v.es] = {
    pr: cj.pr, pt: cj.pt, im: cj.im, part: cj.part, ger: cj.ger, refl: cj.refl,
    tenses: t, subj: E.subjForms(cj), imp: E.impForms(cj), notes: E.conjNotes(v.es),
  };
}
writeFileSync(new URL('conj.json', gold), JSON.stringify(conjGold) + '\n');

const n2sGold = {};
for (let n = 0; n <= 2100; n++) n2sGold[n] = E.n2s(n);
for (const n of [2500, 9999, 10000, 15001, 99999, 100000, 250321, 999999, 1000000]) n2sGold[n] = E.n2s(n);
writeFileSync(new URL('n2s.json', gold), JSON.stringify(n2sGold) + '\n');

// grading: real answers from the content, with typical mistakes
const gradeCases = [];
const mistakes = (s) => {
  const out = [s, s.toUpperCase(), s.normalize('NFD').replace(/[̀-ͯ]/g, ''), s + '.', '¿' + s + '?'];
  if (s.length > 4) out.push(s.slice(0, -1), s.slice(1), s.slice(0, 2) + s[3] + s[2] + s.slice(4));
  out.push('', 'xyz');
  return out;
};
const sample = [...OUT.IMG.map((x) => ({ es: (x.art ? x.art + ' ' : '') + x.es, en: x.en })),
  ...OUT.CARDS.slice(0, 20), ...OUT.PHR.filter((_, i) => i % 5 === 0)];
for (const c of sample) {
  const esAns = [c.es.replace(' (f.)', ''), E.stripArt(c.es.replace(' (f.)', ''))];
  for (const inp of mistakes(esAns[0])) for (const acc of [true, false])
    gradeCases.push({ inp, answers: esAns, accent: acc, res: E.gradeTyped(inp, esAns, acc) });
  const enAns = E.enAlts(c.en);
  for (const inp of mistakes(enAns[0] || c.en))
    gradeCases.push({ inp, answers: enAns, accent: false, res: E.gradeTyped(inp, enAns, false) });
}
const enAltsGold = {};
[...OUT.IMG, ...OUT.CARDS, ...OUT.PHR, ...OUT.RAIZ, ...OUT.VERBS].forEach((c) => { enAltsGold[c.en] = E.enAlts(c.en); });
writeFileSync(new URL('grade.json', gold), JSON.stringify({ cases: gradeCases, enAlts: enAltsGold }) + '\n');

const srsGold = { INT: E.INT, lapse: E.INT.map((_, b) => E.lapse(b)) };
writeFileSync(new URL('srs.json', gold), JSON.stringify(srsGold) + '\n');
console.log('golden:', Object.keys(pronGold).length, 'words,', Object.keys(conjGold).length, 'verbs,',
  gradeCases.length, 'grading cases');
