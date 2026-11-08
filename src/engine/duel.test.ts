import { describe, expect, it } from 'vitest';
import { deckCards, startBattle, challenge, answerOk, resolve, endTurn, win, buyPerk, buildOk } from './duel';
import { defaults } from '../state/state';
import { rng } from '../art/rng';

describe('El Duelo', () => {
  it('deck: 14 picture-word cards, power grows with the plant', () => {
    const S = defaults();
    const d = deckCards(S, rng(1));
    expect(d).toHaveLength(14);
    expect(new Set(d.map((c) => c.id)).size).toBe(14);
    expect(d.every((c) => c.power === 4)).toBe(true);
    S.cards['i:' + d[0].id] = { box: 6, due: '2999-01-01', seen: 3 };
    S.game.perks.pluma = true;
    expect(deckCards(S, rng(1)).find((c) => c.id === d[0].id)?.power ?? 8).toBe(8);
  });
  it('battle: 40 HP, 3 cards a turn, a right answer plays the card and reviews the word', () => {
    const S = defaults();
    const b = startBattle(S, 0, rng(2));
    expect(b.hp).toBe(40);
    expect(b.hand).toHaveLength(3);
    expect(b.e.hp).toBe(16);
    const ch = challenge(b, 0, rng(3))!;
    let ok: boolean;
    if (ch.k === 'build') {
      ch.placed = ch.tokens!.map((t) => ch.pool!.find((p) => p.w === t)!.id);
      ok = buildOk(ch);
    } else {
      const n = (ch.opts || ch.pics)!.length;
      ok = answerOk(b, [...Array(n).keys()].find((i) => answerOk(b, i))!);
    }
    expect(ok).toBe(true);
    const card = b.hand[0];
    resolve(S, b, true);
    expect(S.cards[card.key].box).toBe(1);
    if (card.type === 'atk') expect(b.e.hp).toBe(16 - card.power);
    expect(S.mod.game).toEqual({ n: 1, r: 1 });
  });
  it('a miss fizzles unless the Espejo forgives it', () => {
    const S = defaults();
    S.game.perks.espejo = true;
    const b = startBattle(S, 0, rng(4));
    challenge(b, 0, rng(5));
    resolve(S, b, false);
    expect(b.ch!.res).toBe('forgiven');
    b.ch = null;
    challenge(b, 1, rng(6));
    resolve(S, b, false);
    expect(b.ch!.res).toBe('bad');
    expect(b.fx).toBe('miss');
  });
  it('ending a turn: perfect turn shield, enemy attacks, you can lose', () => {
    const S = defaults();
    const b = startBattle(S, 0, rng(7));
    for (let i = 0; i < 3; i++) {
      challenge(b, i, rng(i));
      resolve(S, b, true);
      b.ch = null;
    }
    endTurn(S, b, rng(8));
    expect(b.perfect).toBe(true);
    expect(b.hp).toBe(40);
    b.hp = 1;
    const out = endTurn(S, b, rng(9));
    expect(out?.kind).toBe('lose');
    expect(S.game.losses).toBe(1);
  });
  it('winning unlocks the next duel and pays coins; perks can be bought', () => {
    const S = defaults();
    const b = startBattle(S, 0, rng(10));
    b.right = 4;
    const out = win(S, b)!;
    expect(out).toEqual({ kind: 'win', coins: 14, first: true, xp: 18 });
    expect(S.game.cleared).toBe(1);
    expect(buyPerk(S, 'piedra')).toBe('poor');
    S.game.coins = 100;
    expect(buyPerk(S, 'piedra')).toBe('ok');
    expect(buyPerk(S, 'piedra')).toBe('owned');
    expect(startBattle(S, 1, rng(11)).max).toBe(46);
  });
});
