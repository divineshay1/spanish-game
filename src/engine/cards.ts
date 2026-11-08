/**
 * The set of reviewable cards, with the same ids as the prototype:
 *   c1..      phrase cards (filtered by accent: Colombia / México)
 *   w:<es>    words saved while reading
 *   v:<n>     verbs, p:<id> phrases, r:<id> root words, sv:<id> Siete Pasos words
 *   i:<id>    picture words
 * Only started cards are included for the optional families, like in the prototype.
 * Each card also has a "family" that decides its flower type in El Jardín.
 */
import { CARDS, IMG, PHR, RAIZ, SIETE, VERBS } from '../content';
import { VOCAB } from '../content/moreLessons';
import type { State } from '../state/state';
import { dayKey } from './clock';

export type Family = 'frases' | 'paciente' | 'raices' | 'imagen' | 'verbos' | 'siete' | 'mias' | 'tarjetas' | 'vocab';

export interface Card {
  id: string;
  es: string;
  en: string;
  tag: string;
  family: Family;
  ico?: string;
  mn?: string;
  /** picture id in pics.json, if any */
  pic?: string;
}

const withArt = (art: string, es: string) => (art ? art + ' ' : '') + es;

/** Phrase cards for the chosen accent (hides the other country's cards). */
export const pool = (S: State) =>
  CARDS.filter((c) => !(S.accent === 'co' && c.tag === 'México') && !(S.accent === 'mx' && c.tag === 'Colombia'));

/** Every card that could be planted, started or not. */
export function catalog(S: State): Card[] {
  return [
    ...pool(S).map<Card>((c) => ({ id: c.id, es: c.es, en: c.en, tag: c.tag, family: c.tag === 'Paciente' ? 'paciente' : 'tarjetas' })),
    ...IMG.map<Card>((x) => ({ id: 'i:' + x.id, es: withArt(x.art, x.es), en: x.en, tag: 'Imaginar', family: 'imagen', ico: x.ico, mn: x.mn, pic: x.id })),
    ...PHR.map<Card>((p) => ({ id: 'p:' + p.id, es: p.es, en: p.en, tag: 'Frases', family: p.cat === 'pac' ? 'paciente' : 'frases' })),
    ...RAIZ.map<Card>((r) => ({ id: 'r:' + r.id, es: r.es, en: r.en, tag: 'Raíces', family: 'raices' })),
    ...VERBS.map<Card>((v) => ({ id: 'v:' + v.n, es: v.es, en: v.en, tag: 'Verbos', family: 'verbos' })),
    ...SIETE.map<Card>((w) => ({ id: 'sv:' + w.id, es: withArt(w.art, w.es), en: w.en, tag: 'Siete pasos', family: 'siete', ico: w.ico, mn: w.mn, pic: w.pid })),
    ...VOCAB.map<Card>(([es, en]) => ({ id: 'b:' + es, es, en, tag: 'Vocabulario', family: 'vocab' })),
    ...Object.values(S.saved).map<Card>((w) => ({ id: 'w:' + w.es, es: w.es, en: w.en, tag: 'Mis palabras', family: 'mias' })),
  ];
}

/** Cards that are in play: all phrase cards and saved words, plus started cards of other families (prototype rule). */
export function allCards(S: State): Card[] {
  return catalog(S).filter((c) => {
    if (c.family === 'tarjetas' || c.family === 'mias' || (c.family === 'paciente' && !c.id.includes(':'))) return true;
    if (c.family === 'imagen') return !!S.imgSeen[c.id.slice(2)] || !!S.cards[c.id];
    return !!S.cards[c.id];
  });
}

const byId = new Map<string, Card>();
export function cardById(S: State, id: string): Card | undefined {
  if (!byId.size) for (const c of catalog(S)) byId.set(c.id, c);
  return byId.get(id) ?? catalog(S).find((c) => c.id === id);
}

/** Planted cards whose watering day has come. */
export const dueList = (S: State, key: string = dayKey()): Card[] =>
  catalog(S).filter((c) => {
    const s = S.cards[c.id];
    return !!s && s.due <= key;
  });

/** Cards not planted yet, in a gentle order: patient phrases and picture words first. */
export function seedList(S: State): Card[] {
  const order: Family[] = ['paciente', 'imagen', 'vocab', 'tarjetas', 'frases', 'raices', 'verbos', 'siete', 'mias'];
  return catalog(S)
    .filter((c) => !S.cards[c.id])
    .sort((a, b) => order.indexOf(a.family) - order.indexOf(b.family));
}

/** How many new seeds can still be planted today. */
export function seedsLeftToday(S: State, key: string = dayKey()): number {
  return Math.max(0, S.settings.newPerDay - (S.planted[key] || 0));
}
