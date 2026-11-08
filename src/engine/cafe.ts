/**
 * El Café: customers order in Spanish; you listen, serve the right things,
 * then tell them the total in Spanish. Uses words from your notes
 * (una taza de café, un vaso de leche, azúcar, una servilleta, una propina…).
 */
import { n2s } from './numbers';
import { shuffle } from './text';
import type { State } from '../state/state';
import { addXP, recMod } from '../state/progress';

type R = () => number;

export interface MenuItem {
  id: string;
  /** "un café" */
  one: string;
  /** plural noun phrase without number: "cafés" */
  many: string;
  en1: string;
  enN: string;
  /** price in cents */
  price: number;
  hot?: boolean;
}

export const MENU: MenuItem[] = [
  { id: 'cafe', one: 'un café', many: 'cafés', en1: 'a coffee', enN: 'coffees', price: 200, hot: true },
  { id: 'taza', one: 'una taza de café', many: 'tazas de café', en1: 'a cup of coffee', enN: 'cups of coffee', price: 250, hot: true },
  { id: 'te', one: 'un té', many: 'tés', en1: 'a tea', enN: 'teas', price: 150, hot: true },
  { id: 'choco', one: 'un chocolate', many: 'chocolates', en1: 'a hot chocolate', enN: 'hot chocolates', price: 250, hot: true },
  { id: 'agua', one: 'un vaso de agua', many: 'vasos de agua', en1: 'a glass of water', enN: 'glasses of water', price: 50 },
  { id: 'leche', one: 'un vaso de leche', many: 'vasos de leche', en1: 'a glass of milk', enN: 'glasses of milk', price: 100 },
  { id: 'jugo', one: 'un jugo de naranja', many: 'jugos de naranja', en1: 'an orange juice', enN: 'orange juices', price: 300 },
  { id: 'pan', one: 'un pan dulce', many: 'panes dulces', en1: 'a sweet bread', enN: 'sweet breads', price: 150 },
  { id: 'sandwich', one: 'un sándwich', many: 'sándwiches', en1: 'a sandwich', enN: 'sandwiches', price: 450 },
  { id: 'sopa', one: 'una sopa', many: 'sopas', en1: 'a soup', enN: 'soups', price: 500 },
  { id: 'ensalada', one: 'una ensalada', many: 'ensaladas', en1: 'a salad', enN: 'salads', price: 550 },
  { id: 'arepa', one: 'una arepa', many: 'arepas', en1: 'an arepa', enN: 'arepas', price: 350 },
];
export const itemById = (id: string) => MENU.find((m) => m.id === id)!;

export interface Line { id: string; qty: number }
export interface Order {
  lines: Line[];
  /** for hot drinks: con / sin azúcar */
  sugar: 'con' | 'sin' | null;
  napkin: boolean;
  es: string;
  en: string;
  total: number;
}

const NUM_ES = ['', '', 'dos', 'tres'];

function phrase(l: Line): { es: string; en: string } {
  const m = itemById(l.id);
  return l.qty === 1 ? { es: m.one, en: m.en1 } : { es: NUM_ES[l.qty] + ' ' + m.many, en: (l.qty === 2 ? 'two ' : 'three ') + m.enN };
}

const joinEs = (xs: string[]) => (xs.length < 2 ? xs.join('') : xs.slice(0, -1).join(', ') + ' y ' + xs[xs.length - 1]);
const joinEn = (xs: string[]) => (xs.length < 2 ? xs.join('') : xs.slice(0, -1).join(', ') + ' and ' + xs[xs.length - 1]);

/** Level 1: one thing. Level 2: two things. Level 3: amounts, sugar and a napkin. */
export function makeOrder(level: number, r: R = Math.random): Order {
  const n = level <= 1 ? 1 : level === 2 ? 2 : 1 + Math.floor(r() * 3);
  const items = shuffle(MENU, r).slice(0, n);
  const lines = items.map((m) => ({ id: m.id, qty: level >= 3 && r() < 0.5 ? 2 + Math.floor(r() * 2) : 1 }));
  const hot = lines.some((l) => itemById(l.id).hot);
  const sugar: Order['sugar'] = level >= 3 && hot ? (r() < 0.5 ? 'con' : 'sin') : null;
  const napkin = level >= 3 && r() < 0.4;
  const ps = lines.map(phrase);
  const opener = (['Quiero', 'Me da', 'Quisiera'] as const)[Math.floor(r() * 3)];
  const enOpen = { Quiero: 'I want', 'Me da': 'Can I have', Quisiera: "I'd like" }[opener];
  let es = `${opener} ${joinEs(ps.map((p) => p.es))}`;
  let en = `${enOpen} ${joinEn(ps.map((p) => p.en))}`;
  if (sugar) {
    es += sugar === 'con' ? ', con azúcar' : ', sin azúcar';
    en += sugar === 'con' ? ', with sugar' : ', without sugar';
  }
  es += ', por favor.';
  en += ', please.';
  if (napkin) {
    es += ' ¿Y me da una servilleta?';
    en += ' And can I have a napkin?';
  }
  const total = lines.reduce((a, l) => a + itemById(l.id).price * l.qty, 0);
  return { lines, sugar, napkin, es, en, total };
}

export interface Served { qty: Record<string, number>; sugar: 'con' | 'sin' | null; napkin: boolean }

/** Exactly what was asked: right items and amounts, sugar choice, napkin. */
export function checkServe(o: Order, s: Served): { ok: boolean; why: string[] } {
  const why: string[] = [];
  for (const l of o.lines) if ((s.qty[l.id] || 0) !== l.qty) why.push(`${phrase(l).es} (${phrase(l).en})`);
  for (const [id, q] of Object.entries(s.qty)) if (q && !o.lines.some((l) => l.id === id)) why.push(`not ${itemById(id).one}`);
  if (o.sugar && s.sugar !== o.sugar) why.push(o.sugar === 'con' ? 'con azúcar (with sugar)' : 'sin azúcar (without sugar)');
  if (o.napkin !== s.napkin) why.push(o.napkin ? 'una servilleta (a napkin)' : 'no napkin');
  return { ok: why.length === 0, why };
}

/** "Son cuatro dólares con cincuenta centavos." */
export function priceEs(cents: number): string {
  const d = Math.floor(cents / 100);
  const c = cents % 100;
  const dol = d === 1 ? 'un dólar' : `${n2s(d)} dólares`;
  if (!c) return d === 1 ? 'Es un dólar.' : `Son ${dol}.`;
  if (!d) return `Son ${n2s(c)} centavos.`;
  return `${d === 1 ? 'Es' : 'Son'} ${dol} con ${n2s(c)} centavos.`;
}

export const priceUS = (cents: number) => '$' + (cents / 100).toFixed(2);

/** The right total and two close wrong ones, as Spanish sentences. */
export function priceOptions(total: number, r: R = Math.random): { es: string; ok: boolean }[] {
  const wrong = new Set<number>();
  const cands = shuffle([total + 100, total - 100, total + 50, total - 50, total + 1000, total * 2], r).filter((x) => x > 0 && x !== total);
  for (const c of cands) if (wrong.size < 2) wrong.add(c);
  return shuffle([{ es: priceEs(total), ok: true }, ...[...wrong].map((w) => ({ es: priceEs(w), ok: false }))], r);
}

export const GREET = ['Buenos días.', 'Buenas tardes.', 'Hola, buenas.'];
export const THANKS = ['¡Gracias! Aquí tiene una propina.', 'Muchas gracias. ¡Qué rico!', 'Gracias, muy amable.'];

/** Café level from how many shifts you've worked. */
export const cafeLevel = (S: State) => Math.min(3, 1 + Math.floor((S.cafe?.shifts || 0) / 2));

export interface CafeShift { total: number; i: number; stars: number[]; right: number; ans: number; tips: number }
export const newCafeShift = (total: number): CafeShift => ({ total, i: 0, stars: [], right: 0, ans: 0, tips: 0 });

export function scoreCafe(S: State, sh: CafeShift, ok: boolean): void {
  sh.ans++;
  if (ok) sh.right++;
  recMod(S, 'cafe', ok);
}

/** Ends the shift: XP and lifetime stats. */
export function endCafeShift(S: State, sh: CafeShift): number {
  const stars = sh.stars.reduce((a, b) => a + b, 0);
  const xp = stars * 3 + sh.right + 5;
  S.cafe = S.cafe || { shifts: 0, served: 0, stars: 0, tips: 0 };
  S.cafe.shifts++;
  S.cafe.served += sh.stars.length;
  S.cafe.stars += stars;
  S.cafe.tips += sh.tips;
  addXP(S, xp, 'cafe');
  return xp;
}
