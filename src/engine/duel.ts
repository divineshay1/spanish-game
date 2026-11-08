/**
 * El Duelo: a tarot-style card battle powered by your picture words
 * (ported from the prototype's Duelo de palabras). Every card you play is a
 * real review: answer right and the card strikes, wards or mends.
 */
import { ENEMIES, IMG, PERKS, type PictureWord } from '../content';
import { dayKey } from './clock';
import { shuffle } from './text';
import { bump } from './bump';
import { wordItem, eqArr, type Chip } from './grammar';
import type { State } from '../state/state';
import { addXP, recMod, recWord } from '../state/progress';

type R = () => number;
export type CardType = 'atk' | 'def' | 'heal';
export const TY: Record<CardType, [string, string]> = { atk: ['⚔', 'Strike'], def: ['🛡', 'Ward'], heal: ['♥', 'Mend'] };

export interface DCard { id: string; key: string; w: PictureWord; type: CardType; power: number; used: boolean }

const box = (S: State, id: string) => S.cards['i:' + id]?.box ?? 0;
export const wordOf = (w: PictureWord) => (w.art ? w.art + ' ' : '') + w.es;

/** 14 cards drawn from your picture words, favouring due and weak ones. */
export function deckCards(S: State, r: R = Math.random): DCard[] {
  const now = dayKey();
  const bag = IMG.map((x) => {
    const st = S.cards['i:' + x.id];
    let w = 2;
    if (st) w = (st.due <= now ? 4 : 1) + (st.box <= 1 ? 2 : 0);
    return { x, w };
  });
  const out: DCard[] = [];
  while (out.length < 14 && bag.length) {
    const tot = bag.reduce((a, b) => a + b.w, 0);
    let rr = r() * tot;
    let i = 0;
    for (; i < bag.length; i++) {
      rr -= bag[i].w;
      if (rr <= 0) break;
    }
    if (i >= bag.length) i = bag.length - 1;
    const w = bag.splice(i, 1)[0].x;
    const n = parseInt(w.id.slice(1), 10);
    out.push({ id: w.id, key: 'i:' + w.id, w, type: (['atk', 'atk', 'def', 'heal'] as const)[n % 4], power: 4 + Math.floor(box(S, w.id) / 2) + (S.game.perks.pluma ? 1 : 0), used: false });
  }
  return out;
}

export interface Challenge {
  i: number;
  k: 'mc' | 'ear' | 'build';
  ans: number | null;
  res: 'good' | 'bad' | 'forgiven' | null;
  ok?: boolean;
  opts?: string[];
  pics?: PictureWord[];
  tokens?: string[];
  pool?: Chip[];
  placed?: number[];
}

export interface Battle {
  lv: number;
  e: { n: string; g: string; t: string; atk: number; hp: number; max: number };
  hp: number;
  max: number;
  shield: number;
  deck: DCard[];
  disc: DCard[];
  hand: DCard[];
  turn: number;
  ch: Challenge | null;
  right: number;
  total: number;
  forgive: number;
  fx: 'hit' | 'block' | 'heal' | 'miss' | 'ouch' | 'blocked' | null;
  intent: number;
  turnMiss: number;
  perfect: boolean;
  hit: number;
}

export function draw(S: State, b: Battle, r: R = Math.random): void {
  const n = 3 + (S.game.perks.vela ? 1 : 0);
  b.disc = b.disc.concat(b.hand);
  b.hand = [];
  b.turnMiss = 0;
  for (let i = 0; i < n; i++) {
    if (!b.deck.length) {
      b.deck = shuffle(b.disc, r);
      b.disc = [];
    }
    const c = b.deck.pop();
    if (c) {
      c.used = false;
      b.hand.push(c);
    }
  }
}

export function startBattle(S: State, lv: number, r: R = Math.random): Battle {
  const e = ENEMIES[lv];
  const max = 40 + (S.game.perks.piedra ? 6 : 0);
  const b: Battle = {
    lv, e: { n: e.n, g: e.g, t: e.t, atk: e.atk, hp: e.hp, max: e.hp }, hp: max, max, shield: 0,
    deck: shuffle(deckCards(S, r), r), disc: [], hand: [], turn: 1, ch: null, right: 0, total: 0,
    forgive: S.game.perks.espejo ? 1 : 0, fx: null, intent: e.atk, turnMiss: 0, perfect: false, hit: 0,
  };
  draw(S, b, r);
  S.game.played++;
  return b;
}

/** Tapping a card asks a question about its word: meaning, listening, or building it. */
export function challenge(b: Battle, i: number, r: R = Math.random): Challenge | null {
  const c = b.hand[i];
  if (!c || c.used || b.ch) return null;
  const k = (['mc', 'ear', 'build'] as const)[Math.floor(r() * 3)];
  const others = shuffle(IMG.filter((x) => x.id !== c.id), r);
  const ch: Challenge = { i, k, ans: null, res: null };
  if (k === 'mc') ch.opts = shuffle([c.w.en, ...others.filter((x) => x.en !== c.w.en).slice(0, 3).map((x) => x.en)], r);
  if (k === 'ear') ch.pics = shuffle([c.w, ...others.slice(0, 3)], r);
  if (k === 'build') {
    const it = wordItem({ key: c.key, es: c.w.es, en: c.w.en, ico: '❖', mn: '', art: c.w.art }, r);
    ch.tokens = it.ans;
    ch.pool = it.pool;
    ch.placed = [];
  }
  b.ch = ch;
  b.fx = null;
  return ch;
}

export function answerOk(b: Battle, i: number): boolean {
  const ch = b.ch!;
  const c = b.hand[ch.i];
  return ch.k === 'mc' ? ch.opts![i] === c.w.en : ch.pics![i].id === c.id;
}

export const buildOk = (ch: Challenge) => eqArr(ch.placed!.map((id) => ch.pool!.find((p) => p.id === id)!.w), ch.tokens!);

/** Applies an answer: the card's effect (or a fizzle), plus a real review of the word. */
export function resolve(S: State, b: Battle, ok: boolean): void {
  const ch = b.ch!;
  const c = b.hand[ch.i];
  c.used = true;
  b.total++;
  let forgiven = false;
  if (!ok && b.forgive > 0) {
    b.forgive--;
    forgiven = true;
  }
  bump(S, c.key, ok);
  if (ok) b.right++;
  S.imgSeen[c.id] = true;
  recMod(S, 'game', ok);
  recWord(S, c.key, wordOf(c.w), c.w.en, ok);
  if (ok || forgiven) {
    if (c.type === 'atk') {
      b.e.hp = Math.max(0, b.e.hp - c.power);
      b.fx = 'hit';
    } else if (c.type === 'def') {
      b.shield += c.power;
      b.fx = 'block';
    } else {
      b.hp = Math.min(b.max, b.hp + c.power);
      b.fx = 'heal';
    }
  } else b.fx = 'miss';
  if (!ok) b.turnMiss++;
  ch.res = ok ? 'good' : forgiven ? 'forgiven' : 'bad';
  ch.ok = ok;
}

export type Outcome = { kind: 'win'; coins: number; first: boolean; xp: number } | { kind: 'lose'; coins: number; xp: number } | null;

export function win(S: State, b: Battle): Outcome {
  const coins = 10 + b.lv * 5 + b.right;
  const first = b.lv >= S.game.cleared;
  if (first) S.game.cleared = b.lv + 1;
  S.game.coins += coins;
  S.game.wins++;
  const xp = b.right * 2 + 10;
  addXP(S, xp, 'duel');
  return { kind: 'win', coins, first, xp };
}

function lose(S: State, b: Battle): Outcome {
  S.game.coins += b.right;
  S.game.losses++;
  const xp = b.right * 2;
  addXP(S, xp, 'duel');
  return { kind: 'lose', coins: b.right, xp };
}

/** Ends your turn: perfect turns earn +4 shield, then the enemy attacks. */
export function endTurn(S: State, b: Battle, r: R = Math.random): Outcome {
  if (b.ch) return null;
  if (b.hand.length && b.hand.every((c) => c.used) && b.turnMiss === 0) {
    b.shield += 4;
    b.perfect = true;
  } else b.perfect = false;
  const dmg = Math.max(0, b.intent - b.shield);
  b.hp -= dmg;
  b.shield = Math.max(0, b.shield - b.intent);
  b.fx = dmg ? 'ouch' : 'blocked';
  b.hit = dmg;
  if (b.hp <= 0) {
    b.hp = 0;
    return lose(S, b);
  }
  b.turn++;
  b.intent = b.e.atk + (b.turn % 4 === 0 ? 1 : 0);
  draw(S, b, r);
  return null;
}

export function buyPerk(S: State, key: string): 'ok' | 'owned' | 'poor' | 'none' {
  const p = PERKS.find((x) => x[0] === key);
  if (!p) return 'none';
  if (S.game.perks[key]) return 'owned';
  if (S.game.coins < p[3]) return 'poor';
  S.game.coins -= p[3];
  S.game.perks[key] = true;
  return 'ok';
}
