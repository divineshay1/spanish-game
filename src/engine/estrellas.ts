/**
 * Estrellas Fugaces: words fall like shooting stars; tap the one that matches.
 * The "Mi jardín" set uses your planted words (thirsty ones first), and a
 * right answer waters a thirsty plant (once per word per game).
 */
import { catalog } from './cards';
import { dayKey } from './clock';
import { rate } from './srs';
import { shuffle } from './text';
import type { State } from '../state/state';
import { addXP, recMod } from '../state/progress';

export type StarSet = 'jardin' | 'clinic' | 'numbers' | 'past';
/** [prompt shown, Spanish answer, card id when it is one of your plants] */
export type StarPair = [string, string, string?];

export const SET_LABEL: Record<StarSet, string> = { jardin: 'Mi jardín', clinic: 'En la clínica', numbers: 'Números', past: 'Pasado' };

const FIXED: Record<Exclude<StarSet, 'jardin'>, StarPair[]> = {
  clinic: [
    ['heart', 'el corazón'], ['cough', 'la tos'], ['fever', 'la fiebre'], ['head', 'la cabeza'], ['back', 'la espalda'],
    ['chest', 'el pecho'], ['arm', 'el brazo'], ['leg', 'la pierna'], ['throat', 'la garganta'], ['stomach', 'el estómago'],
    ['nurse', 'la enfermera'], ['allergy', 'la alergia'], ['medication', 'el medicamento'], ['patient', 'el paciente'],
    ['wound', 'la herida'], ['lungs', 'los pulmones'], ['dizziness', 'el mareo'], ['pressure', 'la presión'],
  ],
  numbers: [
    ['16', 'dieciséis'], ['15', 'quince'], ['50', 'cincuenta'], ['14', 'catorce'], ['40', 'cuarenta'], ['70', 'setenta'],
    ['17', 'diecisiete'], ['120', 'ciento veinte'], ['80', 'ochenta'], ['100', 'cien'], ['90', 'noventa'], ['13', 'trece'],
    ['30', 'treinta'], ['60', 'sesenta'], ['38.5', 'treinta y ocho punto cinco'], ['500', 'quinientos'],
  ],
  past: [
    ['I took', 'tomé'], ['you took', 'tomó'], ['I wrote', 'escribí'], ['I read', 'leí'], ['did you read?', '¿leyó?'],
    ['I bought', 'compré'], ['we worked', 'trabajamos'], ['they worked', 'trabajaron'], ['I had', 'tuve'], ['I did', 'hice'],
    ['I said', 'dije'], ['I went', 'fui'], ['I saw', 'vi'], ['I came', 'vine'], ['I could', 'pude'], ['I put', 'puse'],
  ],
};

/** Short enough to fit on a falling star. */
const fits = (es: string) => es.length <= 26;

/** Your planted words, thirsty first; needs at least 6 to play. */
export function gardenPairs(S: State, key: string = dayKey()): StarPair[] {
  const planted = catalog(S).filter((c) => S.cards[c.id] && fits(c.es) && c.en.length <= 32);
  const thirsty = planted.filter((c) => S.cards[c.id].due <= key);
  const rest = planted.filter((c) => S.cards[c.id].due > key);
  return [...shuffle(thirsty), ...shuffle(rest)].slice(0, 24).map((c) => [c.en, c.es.replace(' (f.)', ''), c.id]);
}

export function pairsFor(S: State, set: StarSet): StarPair[] {
  return set === 'jardin' ? gardenPairs(S) : FIXED[set];
}

export const canUseGarden = (S: State) => gardenPairs(S).length >= 6;

/** A right zap: waters the plant if it was thirsty, once per word per game. Returns true if it grew. */
export function zap(S: State, p: StarPair, watered: Set<string>, when: Date = new Date()): boolean {
  recMod(S, 'estrellas', true);
  const id = p[2];
  if (!id || watered.has(id)) return false;
  const st = S.cards[id];
  if (!st || st.due > dayKey(when)) return false;
  watered.add(id);
  S.cards[id] = rate(st, 'good', when);
  return true;
}

export const miss = (S: State) => recMod(S, 'estrellas', false);

/** XP for a game: 1 per zap plus 5 for playing. */
export function finishStars(S: State, score: number): number {
  const xp = score + 5;
  addXP(S, xp, 'estrellas');
  return xp;
}
