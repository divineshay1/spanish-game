import { describe, expect, it } from 'vitest';
import { COGNATES } from '../content/cognates';
import { THINK, thinkRound, finishThink } from './think';
import { pron } from './pronunciation';
import { defaults } from '../state/state';
import { rng } from '../art/rng';

describe('palabras gemelas', () => {
  it('no duplicates inside a pattern, and the fixed words are in', () => {
    for (const c of COGNATES) expect(new Set(c.items.map((x) => x[1])).size).toBe(c.items.length);
    const all = COGNATES.flatMap((c) => c.items.map((x) => x[1]));
    for (const w of ['reflector', 'inflamable', 'economico', 'impregnable']) expect(all).toContain(w);
  });
  it('each pattern follows its rule', () => {
    const by = (id: string) => COGNATES.find((c) => c.id === id)!.items;
    expect(by('g-or').every(([, es]) => es.endsWith('or'))).toBe(true);
    expect(by('g-al').every(([en, es]) => en === es && es.endsWith('al'))).toBe(true);
    expect(by('g-ble').every(([, es]) => es.endsWith('ble'))).toBe(true);
    expect(by('g-co').every(([en, es]) => en.endsWith('cal') && es.endsWith('co'))).toBe(true);
    expect(by('g-ico').every(([en, es]) => en.endsWith('ic') && es.endsWith('ico'))).toBe(true);
    expect(by('g-ente').every(([, es]) => es.endsWith('ente') || es.endsWith('ante'))).toBe(true);
  });
  it('every Spanish word has a pronunciation, stressed where Spanish puts it', () => {
    for (const c of COGNATES) for (const [, es] of c.items) expect(pron(es.toLowerCase()).say.length).toBeGreaterThan(0);
    expect(pron('doctor').say).toBe('dohk-TOHR');
    expect(pron('animal').say).toBe('ah-nee-MAHL');
    expect(pron('práctico').say).toBe('PRAHK-tee-koh');
  });
  it('lessons: prototype 8, 3 more lessons, 10 patterns; rounds of up to 10; XP like the prototype', () => {
    expect(THINK).toHaveLength(21);
    expect(thinkRound(THINK.find((l) => l.id === 'g-ble')!, rng(1))).toHaveLength(10);
    const S = defaults();
    expect(finishThink(S, THINK[0], 4)).toBe(23);
    expect(S.lessons.l1).toBe(true);
  });
});
