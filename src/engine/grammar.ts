/**
 * El Observatorio: grammar drills, Armar (build words, sentences and verbs)
 * and Oído fino (minimal pairs). Ported from the prototype.
 */
import {
  BUILD, COMP, CONN, CQ, DIFS, ENDS, EXTRA, IMG, PAIRS, PCATS, PHR, QQ, QW, RAIZ, RGRP, TENSES, TOPICS, TQ, VERBS, VTN,
  type MinimalPair,
} from '../content';
import { conj, forms, PERS, PRON, type TenseId } from './conjugation';
import { pron, syllabify } from './pronunciation';
import { norm, shuffle } from './text';
import { dayKey } from './clock';
import { bump } from './bump';
import type { State } from '../state/state';
import { addXP, recMod, recWord } from '../state/progress';

type R = () => number;

export interface QItem {
  p: string;
  s: string;
  a: string;
  opts: string[];
  say: string;
  why: string;
  ck?: string;
  ces?: string;
  cen?: string;
}

export type QuizKind = 'q' | 'tp' | 'ta' | 'comp' | 'v' | 'ph' | 'rt' | 'dif' | 'topic' | 'c';
export interface QuizOpts { vg?: number; cat?: string; rg?: number; difq?: string; topic?: string }

const label = (s: string, cap: boolean) => (cap ? s : s.charAt(0).toLowerCase() + s.slice(1));
const pick4 = (correct: string, pool: string[], r: R) => shuffle([correct, ...shuffle(pool.filter((x) => x !== correct), r).slice(0, 3)], r);

interface Entry { id: string; es: string; en: string; note?: string; [k: string]: unknown }

function mcItems(list: Entry[], all: Entry[], key: string, sameKey: string, r: R): QItem[] {
  return shuffle(list, r)
    .slice(0, 10)
    .map((p, i) => {
      const others = shuffle(list.filter((x) => x.id !== p.id), r).concat(shuffle(all.filter((x) => x[sameKey] !== p[sameKey]), r));
      const why = p.es + ' · ' + p.en + (p.note ? ' · ' + p.note : '');
      if (i % 2 === 0) {
        const eo: string[] = [];
        others.forEach((o) => {
          if (eo.length < 3 && o.en !== p.en && !eo.includes(o.en)) eo.push(o.en);
        });
        return { p: p.es, s: 'What does it mean?', a: p.en, opts: shuffle([p.en, ...eo], r), say: p.es, why, ck: key + p.id, ces: p.es, cen: p.en };
      }
      const so: string[] = [];
      others.forEach((o) => {
        if (so.length < 3 && o.es !== p.es && !so.includes(o.es)) so.push(o.es);
      });
      return { p: p.en, s: 'How do you say it in Spanish?', a: p.es, opts: shuffle([p.es, ...so], r), say: p.es, why, ck: key + p.id, ces: p.es, cen: p.en };
    });
}

const dropParens = (s: string) => s.replace(/\s*\([^)]*\)/g, '').trim();

/** Builds a 9 to 10 question multiple-choice drill (mirrors buildQuiz()). */
export function buildQuiz(k: QuizKind, o: QuizOpts = {}, r: R = Math.random): { title: string; items: QItem[] } {
  if (k === 'q') {
    const names = QW.map((w) => w.es);
    return {
      title: 'Question words',
      items: shuffle(QQ, r).slice(0, 10).map((q) => ({ p: '¿' + q[0], s: q[1], a: q[2], opts: pick4(q[2], names, r), say: '¿' + q[0].replace('___', q[2]), why: q[1] })),
    };
  }
  if (k === 'tp' || k === 'ta') {
    const g = k === 'tp' ? 'pres' : 'past';
    const ts = TENSES.filter((t) => t.grp === g && t.id !== 'perfp');
    const names = ts.map((t) => t.es);
    return {
      title: g === 'pres' ? 'Which present tense?' : 'Which past tense?',
      items: shuffle(TQ.filter((q) => ts.some((t) => t.id === q[2])), r)
        .slice(0, 9)
        .map((q) => {
          const t = ts.find((x) => x.id === q[2])!;
          return { p: q[0], s: q[1], a: t.es, opts: pick4(t.es, names, r), say: q[0], why: t.form + ' (' + t.forms.split(',')[0] + ')' };
        }),
    };
  }
  if (k === 'comp')
    return {
      title: 'Complete the sentence',
      items: shuffle(COMP, r).slice(0, 9).map((q) => ({ p: q[0], s: q[1], a: q[2], opts: shuffle([q[2], ...q[3]], r), say: q[0].replace('___', q[2]), why: q[1] })),
    };
  if (k === 'v') {
    const vg = o.vg ?? 0;
    const grp = VERBS.filter((v) => v.g === vg);
    const dup: Record<string, number> = {};
    VERBS.forEach((v) => (dup[v.en] = (dup[v.en] || 0) + 1));
    return {
      title: 'Verbs ' + (vg * 20 + 1) + ' to ' + (vg * 20 + 20),
      items: shuffle(grp, r)
        .slice(0, 10)
        .map((v, i) => {
          const others = shuffle(VERBS.filter((x) => x.en !== v.en && x.es !== v.es), r);
          const toEn = i % 2 === 0 || dup[v.en] > 1;
          const why = v.es + ' · ' + v.en + ' · ' + pron(v.es).say;
          const base = { say: v.es, why, ck: 'v:' + v.n, ces: v.es, cen: v.en };
          if (toEn) {
            const eo: string[] = [];
            others.forEach((x) => eo.length < 3 && !eo.includes(x.en) && eo.push(x.en));
            return { p: v.es, s: 'What does it mean?', a: v.en, opts: shuffle([v.en, ...eo], r), ...base };
          }
          const so: string[] = [];
          others.forEach((x) => so.length < 3 && !so.includes(x.es) && so.push(x.es));
          return { p: v.en, s: 'How do you say it in Spanish?', a: v.es, opts: shuffle([v.es, ...so], r), ...base };
        }),
    };
  }
  if (k === 'ph') {
    const c = PCATS.find((x) => x.id === o.cat) || PCATS[0];
    return { title: c.t, items: mcItems(PHR.filter((p) => p.cat === c.id) as unknown as Entry[], PHR as unknown as Entry[], 'p:', 'cat', r) };
  }
  if (k === 'rt') {
    const g = RGRP[o.rg ?? 0];
    return { title: g.t, items: mcItems(RAIZ.filter((x) => x.g === g.id) as unknown as Entry[], RAIZ as unknown as Entry[], 'r:', 'g', r) };
  }
  if (k === 'dif') {
    const gs = !o.difq || o.difq === 'all' ? DIFS : DIFS.filter((g) => g.id === o.difq);
    const pool: [string, string, string, string[], string][] = [];
    gs.forEach((g) => (g.drill as [string, string, string, string[], string][]).forEach((q) => pool.push(q)));
    return {
      title: gs.length > 1 ? 'Similar words' : gs[0].t,
      items: shuffle(pool, r).slice(0, 10).map((q) => ({ p: q[0], s: q[1], a: q[2], opts: shuffle([q[2], ...q[3]], r), say: dropParens(q[0].replace('___', q[2])), why: q[4] })),
    };
  }
  if (k === 'topic') {
    const t = TOPICS.find((x) => x.id === o.topic) || TOPICS[0];
    return {
      title: t.t,
      items: shuffle(t.drill as [string, string, string, string[], string][], r)
        .slice(0, 10)
        .map((q) => ({ p: q[0], s: q[1], a: q[2], opts: shuffle([q[2], ...q[3]], r), say: dropParens(q[0].replace('___', q[2])), why: q[4] })),
    };
  }
  // connectors
  const catOf: Record<string, string[]> = {};
  CONN.forEach((c) => c.r.forEach((x) => (catOf[x[0]] = catOf[x[0]] || []).push(c.t)));
  return {
    title: 'Connectors',
    items: shuffle(CQ, r)
      .slice(0, 10)
      .map((q) => {
        const cap = q[0].indexOf('___') === 0;
        const bad: string[] = [];
        shuffle(Object.keys(catOf), r).forEach((w) => {
          if (bad.length < 3 && w !== q[2] && !catOf[w].includes(q[3])) bad.push(w);
        });
        const full = q[0].replace('___', cap ? q[2] : label(q[2], false));
        return { p: q[0], s: q[1], a: label(q[2], cap), opts: shuffle([q[2], ...bad], r).map((x) => label(x, cap)), say: full, why: q[1] };
      }),
  };
}

/** Skill key for the dashboard (g_q, g_tp, g_ser…). */
export const quizSkill = (k: QuizKind, o: QuizOpts = {}) => 'g_' + (k === 'topic' ? o.topic : k);

/** Records one quiz answer; returns XP for it. */
export function answerQuiz(S: State, skill: string, it: QItem, ok: boolean): number {
  recMod(S, skill, ok);
  if (it.ck) {
    recWord(S, it.ck, it.ces!, it.cen!, ok);
    bump(S, it.ck, ok);
  }
  return ok ? 3 : 0;
}

// ---------- Armar ----------

export interface Chip { w: string; id: number }
export interface BItem {
  kind: 'frase' | 'oido' | 'palabra' | 'verbo';
  p: string;
  s: string;
  en?: string;
  say: string;
  ans: string[];
  ansText: string;
  pool: Chip[];
  auto: boolean;
  hint?: string;
  ico?: string;
  word?: { key: string; es: string; en: string; ico: string; mn: string; art: string };
  key?: string;
}

const mkChips = (tokens: string[], extra: string[], r: R): Chip[] => shuffle(tokens.concat(extra), r).map((w, i) => ({ w, id: i }));

function frItem(b: { es: string; en: string }, ear: boolean, r: R): BItem {
  const t = b.es.split(' ');
  const ex = shuffle(EXTRA.filter((w) => !norm(b.es).split(' ').includes(norm(w))), r).slice(0, 2);
  return { kind: ear ? 'oido' : 'frase', p: ear ? '' : b.en, s: ear ? 'Listen, then build what you hear' : 'Build this in Spanish', en: b.en, say: b.es, ans: t, ansText: b.es, pool: mkChips(t, ex, r), auto: ear };
}

let SYLS: string[] | null = null;
function sylPool(): string[] {
  if (!SYLS) {
    const s = new Set<string>();
    [...IMG, ...VERBS].forEach((x) => syllabify(x.es.toLowerCase()).forEach((y) => s.add(y)));
    SYLS = [...s];
  }
  return SYLS;
}

function pickWords(S: State, n: number, r: R) {
  const k = dayKey();
  const seen: Record<string, 1> = {};
  const all = IMG.map((x) => ({ key: 'i:' + x.id, es: x.es, en: x.en, ico: x.ico, mn: x.mn, art: x.art })).concat(
    VERBS.filter((v) => !seen[v.es] && (seen[v.es] = 1)).map((v) => ({ key: 'v:' + v.n, es: v.es, en: v.en, ico: '❖', mn: '', art: '' })),
  );
  const due = shuffle(all.filter((w) => S.cards[w.key] && S.cards[w.key].due <= k), r).slice(0, 5);
  const rest = shuffle(all.filter((w) => !due.includes(w)), r);
  return due.concat(rest).slice(0, n);
}

export function wordItem(w: { key: string; es: string; en: string; ico: string; mn: string; art: string }, r: R = Math.random): BItem {
  const lw = w.es.toLowerCase();
  let syl = syllabify(lw);
  let letters = false;
  if (syl.length < 2) {
    syl = lw.split('');
    letters = true;
  }
  const ex = letters
    ? shuffle('aeoiunrsltm'.split('').filter((c) => !syl.includes(c)), r).slice(0, 2)
    : shuffle(sylPool().filter((s) => !syl.includes(s) && s.length <= 4), r).slice(0, 3);
  return { kind: 'palabra', p: w.en, s: letters ? 'Build the word, letter by letter' : 'Build the word, syllable by syllable', ico: w.ico, say: w.es, ans: syl, ansText: lw, pool: mkChips(syl, ex, r), auto: true, word: w };
}

const HAB_PR = ['he', 'has', 'ha', 'hemos', 'han'];
const HAB_IM = ['había', 'habías', 'había', 'habíamos', 'habían'];
const EST_PR = ['estoy', 'estás', 'está', 'estamos', 'están'];

export function verbItem(v: { es: string }, tid: TenseId, pi: number, r: R = Math.random): BItem | null {
  const cj = conj(v.es);
  const f = forms(cj, tid)[pi];
  const t = TENSES.find((x) => x.id === tid)!;
  const pre = cj.refl ? PRON[pi] : '';
  let tokens: string[];
  let extra: string[] = [];
  if (tid === 'pres' || tid === 'indef' || tid === 'imp' || tid === 'subj') {
    const rest = cj.refl ? f.slice(pre.length + 1) : f;
    let k = 0;
    while (k < rest.length && k < cj.stem.length && rest[k] === cj.stem[k]) k++;
    if (k < 2 || k >= rest.length) return null;
    const end = rest.slice(k);
    tokens = (pre ? [pre] : []).concat([rest.slice(0, k), end]);
    extra = shuffle(ENDS.filter((e) => e !== end), r).slice(0, 3);
  } else if (tid === 'fut' || tid === 'cond') {
    const rest = cj.refl ? f.slice(pre.length + 1) : f;
    const fs = cj.fst;
    if (rest.indexOf(fs) !== 0) return null;
    const end = rest.slice(fs.length);
    tokens = (pre ? [pre] : []).concat([fs, end]);
    const FE = tid === 'fut' ? ['é', 'ás', 'á', 'emos', 'án'] : ['ía', 'ías', 'ía', 'íamos', 'ían'];
    extra = shuffle(FE.filter((e) => e !== end), r).slice(0, 3);
  } else {
    tokens = f.split(' ');
    const auxL = tid === 'perf' || tid === 'perfcont' ? HAB_PR : tid === 'cont' ? EST_PR : HAB_IM;
    const aux = tokens[pre ? 1 : 0];
    extra = shuffle(auxL.filter((a) => a !== aux), r).slice(0, 2);
    const g = tid === 'cont' || tid === 'perfcont' || tid === 'pluscont';
    extra.push(g ? cj.part : cj.ger);
    if (tid === 'perf' || tid === 'plus') extra.push('estado');
  }
  extra = extra.filter((e, i, a) => !tokens.includes(e) && a.indexOf(e) === i);
  return { kind: 'verbo', p: PERS[pi][0] + ' · ' + v.es, s: t.es + ' (' + t.en + ')', hint: t.form, say: f, ans: tokens, ansText: f, pool: mkChips(tokens, extra, r), auto: false, key: v.es + tid + pi };
}

export const uniqVerbs = () => VERBS.filter((v, i, a) => a.findIndex((z) => z.es === v.es) === i);

export function genVerbItems(only: { es: string } | null, r: R = Math.random): BItem[] {
  const items: BItem[] = [];
  const seen: Record<string, 1> = {};
  const base = uniqVerbs();
  let g = 0;
  while (items.length < 8 && g++ < 300) {
    const v = only || base[Math.floor(r() * base.length)];
    const tid = VTN[Math.floor(r() * VTN.length)] as TenseId;
    const pi = Math.floor(r() * 5);
    const it = verbItem(v, tid, pi, r);
    if (it && !seen[it.key!]) {
      seen[it.key!] = 1;
      items.push(it);
    }
  }
  return items;
}

export function buildItems(S: State, kind: BItem['kind'], lvl: number, r: R = Math.random): BItem[] {
  if (kind === 'frase' || kind === 'oido') return shuffle(BUILD.filter((b) => !lvl || b.lvl === lvl), r).slice(0, 8).map((b) => frItem(b, kind === 'oido', r));
  if (kind === 'palabra') return pickWords(S, 8, r).map((w) => wordItem(w, r));
  return genVerbItems(null, r);
}

export const eqArr = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);

export function buildHint(it: BItem, placed: number[]): number[] {
  const cur = placed.map((id) => it.pool.find((p) => p.id === id)!.w);
  let out = eqArr(cur, it.ans.slice(0, cur.length)) ? placed.slice() : [];
  const n = out.length;
  if (n >= it.ans.length) return out;
  const chip = it.pool.find((p) => p.w === it.ans[n] && !out.includes(p.id));
  if (chip) out = [...out, chip.id];
  return out;
}

/** Checks a build; returns XP for it. */
export function checkBuild(S: State, it: BItem, placed: number[], hints: number): { ok: boolean; xp: number } {
  const got = placed.map((id) => it.pool.find((p) => p.id === id)!.w);
  const ok = eqArr(got, it.ans);
  recMod(S, { frase: 'bld', oido: 'ear', palabra: 'wrd', verbo: 'vrb' }[it.kind], ok);
  if (it.word) {
    recWord(S, it.word.key, it.word.es, it.word.en, ok);
    bump(S, it.word.key, ok);
    if (it.word.key[0] === 'i') S.imgSeen[it.word.key.slice(2)] = true;
  }
  return { ok, xp: ok ? Math.max(2, 5 - hints) : 0 };
}

// ---------- Oído fino ----------

export interface FinoItem { p: MinimalPair; t: 0 | 1; ord: [number, number] }
export const finoItems = (r: R = Math.random): FinoItem[] =>
  shuffle(PAIRS, r).slice(0, 10).map((p) => ({ p, t: r() < 0.5 ? 0 : 1, ord: r() < 0.5 ? [0, 1] : [1, 0] }));

export function answerFino(S: State, it: FinoItem, k: number): boolean {
  const ok = k === it.t;
  recMod(S, 'fino', ok);
  return ok;
}

/** Banks a drill's XP (+5 for finishing), as the prototype did. */
export const finishDrill = (S: State, xp: number, task: 'grammar' | 'build' | 'listen') => addXP(S, xp + 5, task);
