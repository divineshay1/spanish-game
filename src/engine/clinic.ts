/**
 * La Clínica: patients speak Spanish only. Ported from the prototype.
 * Steps: check-in, symptoms, an usted question, the answer, blood pressure,
 * temperature, two commands, the plan, and thanks. Mistakes cost patience
 * (5 hearts); the hearts left at the end are the stars.
 */
import { CL_BODY, CL_CMD, CL_NAMES, CL_OTHER, CL_SYM, IMG, RGRP } from '../content';
import { n2s, tempEs } from './numbers';
import { shuffle } from './text';
import { dueIn, lapse, MAXBOX } from './srs';
import { dayKey } from './clock';
import type { State } from '../state/state';
import { addXP, recMod, recWord } from '../state/progress';

type R = () => number;
const pickOne = <T>(a: readonly T[], r: R): T => a[Math.floor(r() * a.length)];
const rnd = (a: number, b: number, r: R) => a + Math.floor(r() * (b - a + 1));

const MES = RGRP.find((g) => g.id === 'mes')!.items;
export const MONTHS_ES = MES.map((x) => x[0]);
export const MONTHS_EN = MES.map((x) => x[1]);

export interface Plan {
  en: string;
  es: string;
  bad: string[];
  ico: string;
}
const CL_PLANS: ((d: number) => Plan)[] = [
  (d) => ({
    en: 'Take this medicine with food and come back in ' + d + ' days.',
    es: 'Tome este medicamento con comida y regrese en ' + n2s(d) + ' días.',
    bad: ['Tome este medicamento sin comida y regrese en ' + n2s(d) + ' días.', 'Tome este medicamento con comida y regrese en ' + n2s(d) + ' semanas.'],
    ico: '💊',
  }),
  () => ({ en: 'Rest and drink plenty of water.', es: 'Descanse y tome mucha agua.', bad: ['Trabaje mucho y no tome agua.', 'Descanse y no tome agua.'], ico: '💧' }),
  () => ({ en: 'Take one pill every eight hours.', es: 'Tome una pastilla cada ocho horas.', bad: ['Tome una pastilla cada doce horas.', 'Tome dos pastillas cada ocho horas.'], ico: '⏰' }),
];

export interface Look {
  skin: string;
  hair: string;
  shirt: string;
  pants: string;
}

export interface Patient {
  gender: 'f' | 'm';
  name: string;
  day: number;
  mo: number;
  year: number;
  body: [string, string, string, string];
  sym: [string, string, string];
  days: number;
  pain: number;
  al: 'penicilina' | 'aspirina' | 'ninguna';
  sys: number;
  dia: number;
  temp: number;
  look: Look;
  cmds: [string, string, string, string, string][];
  plan: Plan;
  qtype: 'pain' | 'allergy';
}

export function makePatient(r: R = Math.random): Patient {
  const gender = r() < 0.5 ? 'f' : 'm';
  return {
    gender,
    name: pickOne(CL_NAMES[gender], r),
    day: rnd(1, 28, r),
    mo: rnd(0, 11, r),
    year: rnd(1950, 2004, r),
    body: pickOne(CL_BODY, r),
    sym: pickOne(CL_SYM, r),
    days: rnd(1, 6, r),
    pain: rnd(3, 9, r),
    al: pickOne(['penicilina', 'aspirina', 'ninguna'] as const, r),
    sys: rnd(104, 146, r),
    dia: rnd(64, 92, r),
    temp: rnd(366, 392, r) / 10,
    look: {
      skin: pickOne(['#e8b595', '#d9a07c', '#c68a64', '#a9714c', '#f0c7a8'], r),
      hair: pickOne(['#3a2a22', '#5b3a29', '#1f1a1a', '#8a6a45', '#b5a79a'], r),
      shirt: pickOne(['#c98b96', '#a8b7a0', '#8aa0b8', '#d7b98f', '#b59ac0'], r),
      pants: pickOne(['#8f8678', '#6f7a86', '#a38d78'], r),
    },
    cmds: shuffle(CL_CMD, r).slice(0, 2),
    plan: pickOne(CL_PLANS, r)(rnd(2, 5, r)),
    qtype: r() < 0.5 ? 'pain' : 'allergy',
  };
}

export const CL_STEPS = ['checkin', 'symptoms', 'q1', 'a1', 'bp', 'temp', 'cmd1', 'cmd2', 'plan', 'thanks'] as const;
export type StepId = (typeof CL_STEPS)[number];

export interface Opt {
  t: string;
  ok: boolean;
  why?: string;
}

const mcOpts = (ok: string, bads: [string, string][], r: R): Opt[] =>
  shuffle([{ t: ok, ok: true } as Opt].concat(bads.map((b) => ({ t: b[0], ok: false, why: b[1] }))), r);

export interface Task {
  id: StepId;
  kind: 'checkin' | 'sym' | 'mc' | 'chips' | 'vital';
  room: 'desk' | 'exam';
  title: string;
  say: string;
  en?: string;
  opts?: Opt[];
  miss?: [string, string];
  names?: string[];
  days?: number[];
  months?: number[];
  years?: number[];
  syms?: [string, string, string][];
  chips?: { k: number | string; t: string }[];
  correct?: number | string;
  reading?: string;
  cmd?: [string, string, string, string, string];
  ico?: string;
}

export function makeTask(id: StepId, p: Patient, r: R = Math.random): Task {
  const f = p.gender === 'f';
  const dayEs = p.day === 1 ? 'uno' : n2s(p.day);
  if (id === 'checkin') {
    const dset = new Set([p.day]);
    [p.day + 10, p.day - 10, p.day + 1, p.day - 1].forEach((x) => {
      if (x >= 1 && x <= 28 && dset.size < 3) dset.add(x);
    });
    const yset = new Set([p.year]);
    [p.year + 10, p.year - 10, p.year + 1, p.year - 1].forEach((x) => {
      if (x >= 1940 && x <= 2010 && yset.size < 3) yset.add(x);
    });
    return {
      id, kind: 'checkin', room: 'desk',
      title: 'Check-in. Listen, then fill in the form.',
      say: `Buenos días. Me llamo ${p.name}. Nací el ${dayEs} de ${MONTHS_ES[p.mo]} de ${n2s(p.year)}.`,
      en: `Good morning. My name is ${p.name}. I was born on ${MONTHS_EN[p.mo]} ${p.day}, ${p.year}.`,
      names: shuffle([p.name].concat(shuffle(CL_NAMES.f.concat(CL_NAMES.m).filter((n) => n !== p.name), r).slice(0, 2)), r),
      days: shuffle([...dset], r),
      months: shuffle([p.mo].concat(shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].filter((m) => m !== p.mo), r).slice(0, 2)), r),
      years: shuffle([...yset], r),
    };
  }
  if (id === 'symptoms') {
    const dEs = p.days === 1 ? 'un día' : n2s(p.days) + ' días';
    return {
      id, kind: 'sym', room: 'exam',
      title: 'Where does it hurt? Tap the body, pick the symptom, and the number of days.',
      say: `Me duele ${p.body[1]} desde hace ${dEs}, y tengo ${p.sym[1]}.`,
      en: `My ${p.body[2]} hurts, for ${p.days} day${p.days > 1 ? 's' : ''}, and I have ${p.sym[2]}.`,
      syms: shuffle(CL_SYM, r),
    };
  }
  if (id === 'q1') {
    if (p.qtype === 'pain')
      return {
        id, kind: 'mc', room: 'exam', say: '',
        title: 'Ask how much it hurts. Use usted with patients.',
        opts: mcOpts('¿Del uno al diez, cuánto le duele?', [
          ['¿Del uno al diez, cuánto te duele?', 'Too informal. Use le (usted) with patients.'],
          ['¿Cuántos años tiene?', 'That asks about age, not pain.'],
        ], r),
        miss: ['¿Del uno al diez, cuánto le duele?', 'From one to ten, how much does it hurt?'],
      };
    return {
      id, kind: 'mc', room: 'exam', say: '',
      title: 'Ask if the patient has any medication allergies. Use usted.',
      opts: mcOpts('¿Es alérgico a algún medicamento?', [
        ['¿Eres alérgico a algún medicamento?', 'Too informal. Use es (usted) with patients.'],
        ['¿Toma algún medicamento?', 'That asks if they take medication, not about allergies.'],
      ], r),
      miss: ['¿Es alérgico a algún medicamento?', 'Are you allergic to any medication?'],
    };
  }
  if (id === 'a1') {
    if (p.qtype === 'pain')
      return {
        id, kind: 'chips', room: 'exam',
        title: 'Listen to the answer. How bad is the pain?',
        say: 'Me duele un ' + n2s(p.pain) + '.',
        en: 'It hurts about a ' + p.pain + '.',
        chips: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => ({ k: n, t: String(n) })),
        correct: p.pain,
      };
    return {
      id, kind: 'chips', room: 'exam',
      title: 'Listen to the answer. What is the allergy?',
      say: p.al === 'ninguna' ? 'No tengo alergias.' : `Soy ${f ? 'alérgica' : 'alérgico'} a la ${p.al}.`,
      en: p.al === 'ninguna' ? 'I have no allergies.' : 'I am allergic to ' + (p.al === 'penicilina' ? 'penicillin' : 'aspirin') + '.',
      chips: [{ k: 'penicilina', t: 'Penicillin' }, { k: 'aspirina', t: 'Aspirin' }, { k: 'ninguna', t: 'No allergies' }],
      correct: p.al,
    };
  }
  if (id === 'bp') {
    const mk = (s: number, d: number) => 'Su presión es ' + n2s(s) + ' sobre ' + n2s(d) + '.';
    return {
      id, kind: 'vital', room: 'exam',
      title: 'Take the blood pressure, then tell the patient the result.',
      say: '¿Cómo está mi presión?', en: 'How is my blood pressure?',
      reading: 'BP ' + p.sys + '/' + p.dia,
      opts: mcOpts(mk(p.sys, p.dia), [[mk(p.sys + 10, p.dia), 'Check the first number again.'], [mk(p.sys, p.dia + 8), 'Check the second number again.']], r),
      miss: [mk(p.sys, p.dia), 'Your blood pressure is ' + p.sys + ' over ' + p.dia + '.'],
    };
  }
  if (id === 'temp') {
    const mk = (v: number) => 'Su temperatura es ' + tempEs(v) + '.';
    const w = Math.floor(p.temp);
    const dd = Math.round((p.temp - w) * 10);
    return {
      id, kind: 'vital', room: 'exam',
      title: 'Take the temperature, then tell the patient the result.',
      say: '¿Y la temperatura?', en: 'And my temperature?',
      reading: 'Temp ' + p.temp.toFixed(1) + ' °C',
      opts: mcOpts(mk(p.temp), [[mk(w + 1 + dd / 10), 'Check the whole number again.'], [mk(w + ((dd + 4) % 10) / 10), 'Check the decimal again.']], r),
      miss: [mk(p.temp), 'Your temperature is ' + p.temp.toFixed(1) + '.'],
    };
  }
  if (id === 'cmd1' || id === 'cmd2') {
    const c = p.cmds[id === 'cmd1' ? 0 : 1];
    return {
      id, kind: 'mc', room: 'exam', say: '',
      title: c[4] + ' Use usted.',
      opts: mcOpts(c[0], [[c[1], 'Too informal. Use the usted form with patients.'], [pickOne(CL_OTHER, r), 'That is a different instruction.']], r),
      cmd: c,
      miss: [c[0], c[2]],
    };
  }
  if (id === 'plan')
    return {
      id, kind: 'mc', room: 'exam', say: '',
      title: 'Explain the plan: ' + p.plan.en,
      opts: mcOpts(p.plan.es, p.plan.bad.map((b) => [b, 'That does not match the plan.'] as [string, string]), r),
      miss: [p.plan.es, p.plan.en],
      ico: p.plan.ico,
    };
  return {
    id, kind: 'mc', room: 'exam',
    title: 'The patient thanks you. Reply politely.',
    say: 'Muchas gracias.', en: 'Thank you very much.',
    opts: mcOpts('De nada.', [['Perdón.', 'That means sorry.'], ['Con permiso.', 'That means excuse me, to pass.']], r),
    miss: ['De nada.', "You're welcome."],
  };
}

export interface CheckinPick { name?: string; day?: number; mo?: number; year?: number }
export interface SymPick { body?: string; sym?: string; days?: number }

export const checkinOk = (p: Patient, s: CheckinPick) => s.name === p.name && s.day === p.day && s.mo === p.mo && s.year === p.year;
export const symOk = (p: Patient, s: SymPick) => s.body === p.body[0] && s.sym === p.sym[0] && s.days === p.days;

/** The pose a correctly given command produces (animated reactions). */
export function poseFor(cmd: string): { mouth?: boolean; arm?: boolean; breathe?: boolean; turn?: boolean } {
  return cmd === 'mouth' ? { mouth: true } : cmd === 'arm' ? { arm: true } : cmd === 'breathe' ? { breathe: true } : cmd === 'turn' ? { turn: true } : {};
}

/** Patient voice: a little higher or lower so it sounds like a different person. */
export const voicePitch = (p: Patient) => (p.gender === 'f' ? 1.15 : 0.82);

// ---- recording results (same bookkeeping as the prototype) ----

export interface Topic { key?: string; es?: string; en?: string; img?: string }

function clWord(S: State, key: string, ok: boolean): void {
  const st = S.cards[key] ? { ...S.cards[key] } : { box: 0, due: '', seen: 0 };
  st.seen++;
  if (ok) {
    st.box = Math.min(MAXBOX, st.box + 1);
    st.due = dueIn(st.box);
  } else {
    st.box = lapse(st.box);
    st.due = dayKey();
  }
  S.cards[key] = st;
}

/** Records one answer: skill stats, rescue list, and picture-word plants for body parts and symptoms. */
export function judge(S: State, ok: boolean, topics: Topic[]): void {
  recMod(S, 'clinic', ok);
  for (const tp of topics) {
    if (tp.img) {
      const im = IMG.find((x) => x.es === tp.img);
      if (im) {
        clWord(S, 'i:' + im.id, ok);
        S.imgSeen[im.id] = true;
        recWord(S, 'i:' + im.id, (im.art ? im.art + ' ' : '') + im.es, im.en, ok);
      }
    } else if (tp.key && tp.es && tp.en) recWord(S, tp.key, tp.es, tp.en, ok);
  }
}

/** Topics to record for each step. */
export function topicsFor(t: Task, p: Patient): Topic[] {
  if (t.kind === 'checkin') return [{ key: 'cl:fecha', es: 'la fecha de nacimiento', en: 'date of birth' }];
  if (t.kind === 'sym') return [{ img: p.body[0] }, { img: p.sym[0] }];
  if (t.kind === 'chips')
    return p.qtype === 'pain' ? [{ key: 'cl:dolor', es: 'del uno al diez', en: 'one to ten' }] : [{ key: 'cl:alergia', es: 'alérgico a', en: 'allergic to' }];
  return t.miss ? [{ key: 'cl:' + t.id + ':' + t.miss[0], es: t.miss[0], en: t.miss[1] }] : [];
}

export interface Shift {
  total: number;
  pi: number;
  stars: number[];
  right: number;
  ans: number;
  helpN: number;
  xp: number;
  coins: number;
}

export const newShift = (total: number): Shift => ({ total, pi: 0, stars: [], right: 0, ans: 0, helpN: 0, xp: 0, coins: 0 });

/** A patient is done: hearts left become stars, coins and XP. */
export function endPatient(sh: Shift, hearts: number): { left: boolean; stars: number; coins: number } {
  const stars = hearts;
  sh.stars.push(stars);
  const coins = stars * 3;
  sh.coins += coins;
  sh.xp += stars * 4;
  return { left: hearts <= 0, stars, coins };
}

export function endShift(S: State, sh: Shift): number {
  const c = S.clin;
  c.patients += sh.stars.length;
  c.stars += sh.stars.reduce((a, b) => a + b, 0);
  c.coins += sh.coins;
  c.shifts++;
  const xp = sh.xp + sh.right;
  addXP(S, xp, 'clinic');
  return xp;
}
