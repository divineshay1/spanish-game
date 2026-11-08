import { describe, expect, it } from 'vitest';
import { defaults } from '../state/state';
import { phraseOfDay, taskDone, tasksDone, TASKS, REALMS, levelProgress } from './daily';

describe('daily route', () => {
  it('nothing done on a fresh day', () => {
    const S = defaults();
    expect(tasksDone(S, '2026-11-06')).toBe(0);
    expect(TASKS.length).toBe(5);
  });
  it('steps tick off', () => {
    const S = defaults();
    S.days['2026-11-06'] = { xp: 10, done: { phrase: true, focus: true } };
    expect(taskDone(S, 'phrase', '2026-11-06')).toBe(true);
    expect(tasksDone(S, '2026-11-06')).toBe(2);
  });
  it('planting counts as done once today’s seeds are used', () => {
    const S = defaults();
    S.planted['2026-11-06'] = 5;
    expect(taskDone(S, 'plant', '2026-11-06')).toBe(true);
  });
  it('phrase of the day is stable within a day and changes across days', () => {
    const S = defaults();
    const a = phraseOfDay(S, new Date(2026, 10, 6, 8));
    const b = phraseOfDay(S, new Date(2026, 10, 6, 22));
    const c = phraseOfDay(S, new Date(2026, 10, 7, 8));
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });
  it('eight realms, garden is open', () => {
    expect(REALMS).toHaveLength(8);
    expect(REALMS.find((r) => r.key === 'jardin')!.scene).toBe('Jardin');
  });
  it('levels every 250 XP like the prototype', () => {
    const S = defaults();
    S.xp = 260;
    expect(levelProgress(S)).toEqual({ level: 2, into: 10, of: 250 });
  });
});
