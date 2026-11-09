import { describe, expect, it } from 'vitest';
import { defaults } from '../state/state';
import { phraseOfDay, taskDone, tasksDone, TASKS, REALMS, levelProgress } from './daily';

describe('daily route', () => {
  it('nothing done on a fresh day', () => {
    const S = defaults();
    expect(tasksDone(S, '2026-11-06')).toBe(0);
    expect(TASKS.length).toBe(11);
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
  it('eight realms, all open', () => {
    expect(REALMS.every((r) => r.scene)).toBe(true);
    expect(REALMS).toHaveLength(8);
    expect(REALMS.find((r) => r.key === 'jardin')!.scene).toBe('Jardin');
  });
  it('levels every 250 XP like the prototype', () => {
    const S = defaults();
    S.xp = 260;
    expect(levelProgress(S)).toEqual({ level: 2, into: 10, of: 250 });
  });
});

describe('finishing activities ticks the right daily step', () => {
  it('Focus ticks focus; Armar, Oído fino and Mezcla tick Observatorio', async () => {
    const { addXP } = await import('../state/progress');
    const { finishDrill } = await import('./grammar');
    const { made } = await import('./mezcla');
    const { defaults: d } = await import('../state/state');
    const { taskDone: done } = await import('./daily');
    const S = d();
    addXP(S, 7, 'focus');
    expect(done(S, 'focus')).toBe(true);
    const S2 = d();
    finishDrill(S2, 10, 'build');
    expect(done(S2, 'grammar')).toBe(true);
    const S3 = d();
    const seen = new Set<string>();
    for (const x of ['a', 'b', 'c', 'd', 'e']) made(S3, seen, x);
    expect(done(S3, 'grammar')).toBe(true);
  });
});
