import { describe, expect, it } from 'vitest';
import { makeOrder, checkServe, priceEs, priceOptions, MENU, cafeLevel, newCafeShift, scoreCafe, endCafeShift } from './cafe';
import { defaults } from '../state/state';
import { rng } from '../art/rng';

describe('El Café', () => {
  it('orders read naturally in Spanish and English', () => {
    for (let s = 0; s < 50; s++)
      for (const lvl of [1, 2, 3]) {
        const o = makeOrder(lvl, rng(s * 7 + lvl));
        expect(o.es).toMatch(/^(Quiero|Me da|Quisiera) .+, por favor\.( ¿Y me da una servilleta\?)?$/);
        expect(o.lines.length).toBeGreaterThan(0);
        if (lvl === 1) expect(o.lines).toHaveLength(1);
        if (lvl < 3) expect(o.sugar).toBeNull();
        expect(o.total).toBe(o.lines.reduce((a, l) => a + MENU.find((m) => m.id === l.id)!.price * l.qty, 0));
      }
  });
  it('plurals and joining', () => {
    let found = false;
    for (let s = 0; s < 200 && !found; s++) {
      const o = makeOrder(3, rng(s));
      if (o.lines.length >= 2 && o.lines.some((l) => l.qty > 1)) {
        expect(o.es).toMatch(/ y /);
        expect(o.es).toMatch(/(dos|tres) /);
        found = true;
      }
    }
    expect(found).toBe(true);
  });
  it('serving checks items, amounts, sugar and napkin', () => {
    const o = { lines: [{ id: 'cafe', qty: 2 }, { id: 'pan', qty: 1 }], sugar: 'sin' as const, napkin: true, es: '', en: '', total: 550 };
    expect(checkServe(o, { qty: { cafe: 2, pan: 1 }, sugar: 'sin', napkin: true }).ok).toBe(true);
    expect(checkServe(o, { qty: { cafe: 1, pan: 1 }, sugar: 'sin', napkin: true }).ok).toBe(false);
    expect(checkServe(o, { qty: { cafe: 2, pan: 1, te: 1 }, sugar: 'sin', napkin: true }).ok).toBe(false);
    expect(checkServe(o, { qty: { cafe: 2, pan: 1 }, sugar: 'con', napkin: true }).why).toEqual(['sin azúcar (without sugar)']);
  });
  it('prices in Spanish', () => {
    expect(priceEs(450)).toBe('Son cuatro dólares con cincuenta centavos.');
    expect(priceEs(100)).toBe('Es un dólar.');
    expect(priceEs(150)).toBe('Es un dólar con cincuenta centavos.');
    expect(priceEs(50)).toBe('Son cincuenta centavos.');
    expect(priceEs(1200)).toBe('Son doce dólares.');
    const opts = priceOptions(450, rng(3));
    expect(opts.filter((o) => o.ok)).toHaveLength(1);
    expect(new Set(opts.map((o) => o.es)).size).toBe(3);
  });
  it('levels rise with shifts; shift XP and stats', () => {
    const S = defaults();
    expect(cafeLevel(S)).toBe(1);
    const sh = newCafeShift(1);
    scoreCafe(S, sh, true);
    scoreCafe(S, sh, true);
    sh.stars.push(3);
    sh.tips = 1;
    expect(endCafeShift(S, sh)).toBe(9 + 2 + 5);
    expect(S.cafe).toEqual({ shifts: 1, served: 1, stars: 3, tips: 1 });
    S.cafe.shifts = 4;
    expect(cafeLevel(S)).toBe(3);
  });
});
