import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { makePatient, makeTask, CL_STEPS, checkinOk, symOk, judge, topicsFor, newShift, endPatient, endShift, poseFor, type Patient } from './clinic';
import { n2s } from './numbers';
import { defaults } from '../state/state';
import { rng } from '../art/rng';

const P = (): Patient => ({
  ...makePatient(rng(5)),
  gender: 'f', name: 'Ana Torres', day: 14, mo: 2, year: 1987, days: 3, pain: 7, al: 'penicilina',
  sys: 128, dia: 82, temp: 38.5, qtype: 'pain',
  body: ['cabeza', 'la cabeza', 'head', 'front'], sym: ['fiebre', 'fiebre', 'fever'],
});

describe('patient lines (Spanish)', () => {
  const p = P();
  it('check-in says name and birth date', () => {
    expect(makeTask('checkin', p, rng(1)).say).toBe('Buenos días. Me llamo Ana Torres. Nací el catorce de marzo de mil novecientos ochenta y siete.');
  });
  it('symptoms', () => {
    expect(makeTask('symptoms', p).say).toBe('Me duele la cabeza desde hace tres días, y tengo fiebre.');
    expect(makeTask('symptoms', { ...p, days: 1 }).say).toBe('Me duele la cabeza desde hace un día, y tengo fiebre.');
  });
  it('pain answer, allergy answer with gender', () => {
    expect(makeTask('a1', p).say).toBe('Me duele un siete.');
    expect(makeTask('a1', { ...p, qtype: 'allergy' }).say).toBe('Soy alérgica a la penicilina.');
    expect(makeTask('a1', { ...p, qtype: 'allergy', gender: 'm', al: 'aspirina' }).say).toBe('Soy alérgico a la aspirina.');
    expect(makeTask('a1', { ...p, qtype: 'allergy', al: 'ninguna' }).say).toBe('No tengo alergias.');
  });
  it('vitals read aloud', () => {
    const bp = makeTask('bp', p, rng(2));
    expect(bp.opts!.find((o) => o.ok)!.t).toBe('Su presión es ciento veintiocho sobre ochenta y dos.');
    const t = makeTask('temp', p, rng(3));
    expect(t.opts!.find((o) => o.ok)!.t).toBe('Su temperatura es treinta y ocho punto cinco.');
  });
});

describe('every step', () => {
  it('multiple-choice steps have exactly one right answer and a reason for each wrong one', () => {
    for (let s = 0; s < 30; s++) {
      const p = makePatient(rng(s));
      for (const id of CL_STEPS) {
        const t = makeTask(id, p, rng(s + 100));
        if (!t.opts) continue;
        expect(t.opts.filter((o) => o.ok)).toHaveLength(1);
        expect(new Set(t.opts.map((o) => o.t)).size).toBe(t.opts.length);
        for (const o of t.opts) if (!o.ok) expect(o.why).toBeTruthy();
      }
    }
  });
  it('commands use usted; the tú version is the trap', () => {
    const p = makePatient(rng(9));
    const t = makeTask('cmd1', p, rng(1));
    expect(t.opts!.find((o) => o.ok)!.t).toBe(p.cmds[0][0]);
    expect(t.opts!.find((o) => o.t === p.cmds[0][1])!.why).toMatch(/usted/);
  });
  it('check-in choices always include the right answers', () => {
    for (let s = 0; s < 40; s++) {
      const p = makePatient(rng(s));
      const t = makeTask('checkin', p, rng(s + 7));
      expect(t.names).toContain(p.name);
      expect(t.days).toContain(p.day);
      expect(t.months).toContain(p.mo);
      expect(t.years).toContain(p.year);
      expect(checkinOk(p, { name: p.name, day: p.day, mo: p.mo, year: p.year })).toBe(true);
      expect(checkinOk(p, { name: p.name, day: p.day, mo: (p.mo + 1) % 12, year: p.year })).toBe(false);
    }
  });
  it('symptom check', () => {
    const p = P();
    expect(symOk(p, { body: 'cabeza', sym: 'fiebre', days: 3 })).toBe(true);
    expect(symOk(p, { body: 'pecho', sym: 'fiebre', days: 3 })).toBe(false);
  });
  it('command reactions', () => {
    expect(poseFor('mouth')).toEqual({ mouth: true });
    expect(poseFor('turn')).toEqual({ turn: true });
  });
});

describe('plans match the prototype word for word', () => {
  it('all three plans for 2 to 5 days', () => {
    const html = readFileSync(new URL('../../mi-espanol-legacy.html', import.meta.url), 'utf8');
    const line = html.split('\n').find((l) => l.startsWith('const CL_PLANS='))!;
    const ctx = { n2s } as Record<string, unknown>;
    vm.createContext(ctx);
    vm.runInContext(line.replace('const CL_PLANS=', 'globalThis.CL_PLANS='), ctx);
    const legacy = ctx.CL_PLANS as ((d: number) => unknown)[];
    const seen = new Set<string>();
    for (let s = 0; s < 200; s++) {
      const p = makePatient(rng(s));
      seen.add(p.plan.es);
      const d = Number((/regrese en .* días/.test(p.plan.es) && p.plan.en.match(/(\d) days/)?.[1]) || 0);
      const want = legacy.map((f) => JSON.stringify(f(d)));
      expect(want).toContain(JSON.stringify(p.plan));
    }
    expect(seen.size).toBeGreaterThan(3);
  });
});

describe('scoring', () => {
  it('symptom answers grow the picture-word plants for that body part and symptom', () => {
    const S = defaults();
    const p = P();
    judge(S, true, topicsFor(makeTask('symptoms', p), p));
    expect(S.cards['i:m39'].box).toBe(1); // cabeza
    expect(S.cards['i:m48'].box).toBe(1); // fiebre
    expect(S.mod.clinic).toEqual({ n: 1, r: 1 });
  });
  it('a wrong usted question goes to the rescue list', () => {
    const S = defaults();
    const p = P();
    const t = makeTask('q1', p);
    judge(S, false, topicsFor(t, p));
    expect(Object.keys(S.miss)[0]).toMatch(/^cl:q1:/);
  });
  it('hearts become stars, coins and XP', () => {
    const S = defaults();
    const sh = newShift(1);
    sh.right = 8;
    expect(endPatient(sh, 4)).toEqual({ left: false, stars: 4, coins: 12 });
    expect(endShift(S, sh)).toBe(16 + 8);
    expect(S.clin).toEqual({ patients: 1, stars: 4, coins: 12, shifts: 1 });
    expect(S.xp).toBe(24);
  });
});
