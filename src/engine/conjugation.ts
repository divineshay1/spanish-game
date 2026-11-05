/**
 * Conjugation engine (Latin American Spanish, 5 persons: yo, tú, él/ella/usted,
 * nosotros, ellos/ustedes). Present, past, imperfect, continuous, perfect tenses,
 * future, conditional, subjunctive, commands, reflexives. Ported from the prototype.
 */
interface VerbSpec {
  pr?: string[]; // full present
  pt?: string[]; // full simple past
  im?: string[]; // full imperfect
  sub?: string[]; // full present subjunctive
  ger?: string;
  part?: string;
  yo?: string; // irregular yo in present
  pc?: 'ie' | 'ue' | 'i'; // present stem change
  ps?: string; // irregular past stem
  p3?: 'i' | 'u'; // él/ellos past stem change
  sp?: 'car' | 'gar' | 'zar'; // spelling change in yo past
  vy?: 1; // y in past (creer, caer)
  uir?: 1; // -uir verbs
  refl?: 1;
}

const SPEC: Record<string, VerbSpec> = {
  ser: { pr: ['soy', 'eres', 'es', 'somos', 'son'], pt: ['fui', 'fuiste', 'fue', 'fuimos', 'fueron'], im: ['era', 'eras', 'era', 'éramos', 'eran'], ger: 'siendo', part: 'sido' },
  estar: { pr: ['estoy', 'estás', 'está', 'estamos', 'están'], ps: 'estuv', ger: 'estando', part: 'estado' },
  tener: { yo: 'tengo', pc: 'ie', ps: 'tuv' },
  hacer: { yo: 'hago', ps: 'hic', part: 'hecho' },
  decir: { yo: 'digo', pc: 'i', ps: 'dij', p3: 'i', part: 'dicho' },
  ir: { pr: ['voy', 'vas', 'va', 'vamos', 'van'], pt: ['fui', 'fuiste', 'fue', 'fuimos', 'fueron'], im: ['iba', 'ibas', 'iba', 'íbamos', 'iban'], ger: 'yendo', part: 'ido' },
  venir: { yo: 'vengo', pc: 'ie', ps: 'vin', p3: 'i' },
  ver: { yo: 'veo', pt: ['vi', 'viste', 'vio', 'vimos', 'vieron'], im: ['veía', 'veías', 'veía', 'veíamos', 'veían'], part: 'visto' },
  saber: { yo: 'sé', ps: 'sup' },
  pensar: { pc: 'ie' },
  parecer: { yo: 'parezco' },
  volverse: { pc: 'ue', part: 'vuelto', refl: 1 },
  mantenerse: { yo: 'mantengo', pc: 'ie', ps: 'mantuv', refl: 1 },
  sentirse: { pc: 'ie', p3: 'i', refl: 1 },
  hacerse: { yo: 'hago', ps: 'hic', part: 'hecho', refl: 1 },
  llegar: { sp: 'gar' },
  seguir: { yo: 'sigo', pc: 'i', p3: 'i' },
  contar: { pc: 'ue' },
  explicar: { sp: 'car' },
  practicar: { sp: 'car' },
  pagar: { sp: 'gar' },
  costar: { pc: 'ue' },
  elegir: { yo: 'elijo', pc: 'i', p3: 'i' },
  pedir: { pc: 'i', p3: 'i' },
  dar: { pr: ['doy', 'das', 'da', 'damos', 'dan'], pt: ['di', 'diste', 'dio', 'dimos', 'dieron'] },
  probar: { pc: 'ue' },
  encontrar: { pc: 'ue' },
  buscar: { sp: 'car' },
  abrir: { part: 'abierto' },
  cerrar: { pc: 'ie' },
  entender: { pc: 'ie' },
  conocer: { yo: 'conozco' },
  creer: { vy: 1 },
  recordar: { pc: 'ue' },
  ofrecer: { yo: 'ofrezco' },
  incluir: { uir: 1 },
  comenzar: { pc: 'ie', sp: 'zar' },
  empezar: { pc: 'ie', sp: 'zar' },
  continuar: { pr: ['continúo', 'continúas', 'continúa', 'continuamos', 'continúan'] },
  conseguir: { yo: 'consigo', pc: 'i', p3: 'i' },
  perder: { pc: 'ie' },
  morir: { pc: 'ue', p3: 'u', part: 'muerto' },
  nacer: { yo: 'nazco' },
  crecer: { yo: 'crezco' },
  salir: { yo: 'salgo' },
  caer: { yo: 'caigo', vy: 1 },
  sentar: { pc: 'ie' },
  conducir: { yo: 'conduzco', ps: 'conduj' },
  construir: { uir: 1 },
  destruir: { uir: 1 },
  oír: { pr: ['oigo', 'oyes', 'oye', 'oímos', 'oyen'], pt: ['oí', 'oíste', 'oyó', 'oímos', 'oyeron'], ger: 'oyendo', part: 'oído' },
};
SPEC.ser.sub = ['sea', 'seas', 'sea', 'seamos', 'sean'];
SPEC.estar.sub = ['esté', 'estés', 'esté', 'estemos', 'estén'];
SPEC.ir.sub = ['vaya', 'vayas', 'vaya', 'vayamos', 'vayan'];
SPEC.dar.sub = ['dé', 'des', 'dé', 'demos', 'den'];
SPEC.saber.sub = ['sepa', 'sepas', 'sepa', 'sepamos', 'sepan'];
SPEC.continuar.sub = ['continúe', 'continúes', 'continúe', 'continuemos', 'continúen'];
SPEC['oír'].sub = ['oiga', 'oigas', 'oiga', 'oigamos', 'oigan'];

const FUTST: Record<string, string> = {
  tener: 'tendr', hacer: 'har', decir: 'dir', venir: 'vendr', saber: 'sabr', salir: 'saldr',
  mantenerse: 'mantendr', hacerse: 'har', oír: 'oir',
};
const IMPT: Record<string, string> = {
  decir: 'di', hacer: 'haz', ir: 've', venir: 'ven', salir: 'sal', ser: 'sé', tener: 'ten', ver: 've', estar: 'está',
};

export const PERS: [string, string][] = [
  ['yo', 'yo'], ['tú', 'tú'], ['él / ella / usted', 'él'], ['nosotros', 'nosotros'], ['ellos / ustedes', 'ellos'],
];
export const PRON = ['me', 'te', 'se', 'nos', 'se'];
const HAB_PR = ['he', 'has', 'ha', 'hemos', 'han'];
const HAB_IM = ['había', 'habías', 'había', 'habíamos', 'habían'];
const HAB_PT = ['hube', 'hubiste', 'hubo', 'hubimos', 'hubieron'];
const EST_PR = ['estoy', 'estás', 'está', 'estamos', 'están'];

const lastE = (s: string) => s.replace(/e(?=[^e]*$)/, 'ie');
const lastEi = (s: string) => s.replace(/e(?=[^e]*$)/, 'i');
const lastO = (s: string) => s.replace(/o(?=[^o]*$)/, 'ue');
const lastOu = (s: string) => s.replace(/o(?=[^o]*$)/, 'u');

export type TenseId =
  | 'pres' | 'indef' | 'imp' | 'cont' | 'perf' | 'perfcont' | 'fut' | 'cond' | 'subj' | 'plus' | 'ant' | 'pluscont'
  | 'perfp';

export interface Conj {
  inf: string;
  base: string;
  stem: string;
  refl: boolean;
  pr: string[];
  pt: string[];
  im: string[];
  part: string;
  ger: string;
  sp: VerbSpec;
  fst: string;
}

export function conj(inf: string): Conj {
  const sp = SPEC[inf] || {};
  let base = inf;
  let refl = false;
  if (sp.refl) {
    base = inf.slice(0, -2);
    refl = true;
  }
  const typ = base.slice(-2);
  const stem = base.slice(0, -2);
  let pr: string[];
  if (sp.pr) pr = sp.pr;
  else {
    const E = typ === 'ar' ? ['o', 'as', 'a', 'amos', 'an'] : typ === 'er' ? ['o', 'es', 'e', 'emos', 'en'] : ['o', 'es', 'e', 'imos', 'en'];
    const chg = (s: string) => (sp.pc === 'ie' ? lastE(s) : sp.pc === 'ue' ? lastO(s) : sp.pc === 'i' ? lastEi(s) : s);
    pr = E.map((e, i) => {
      if (i === 0 && sp.yo) return sp.yo;
      let st = i === 3 ? stem : chg(stem);
      if (sp.uir && i !== 3) st = stem + 'y';
      return st + e;
    });
  }
  let pt: string[];
  if (sp.pt) pt = sp.pt;
  else if (sp.ps) {
    const ps = sp.ps;
    const j = /j$/.test(ps);
    pt = ['e', 'iste', 'o', 'imos', j ? 'eron' : 'ieron'].map((e) => ps + e);
    if (ps === 'hic') pt[2] = 'hizo';
  } else if (typ === 'ar') {
    pt = ['é', 'aste', 'ó', 'amos', 'aron'].map((e) => stem + e);
    if (sp.sp === 'car') pt[0] = stem.slice(0, -1) + 'qué';
    if (sp.sp === 'gar') pt[0] = stem + 'ué';
    if (sp.sp === 'zar') pt[0] = stem.slice(0, -1) + 'cé';
  } else if (sp.vy) pt = ['í', 'íste', 'yó', 'ímos', 'yeron'].map((e) => stem + e);
  else if (sp.uir) pt = ['í', 'iste', 'yó', 'imos', 'yeron'].map((e) => stem + e);
  else {
    pt = ['í', 'iste', 'ió', 'imos', 'ieron'].map((e) => stem + e);
    if (sp.p3) {
      const c = sp.p3 === 'i' ? lastEi(stem) : lastOu(stem);
      pt[2] = c + 'ió';
      pt[4] = c + 'ieron';
    }
  }
  const im = sp.im || (typ === 'ar' ? ['aba', 'abas', 'aba', 'ábamos', 'aban'] : ['ía', 'ías', 'ía', 'íamos', 'ían']).map((e) => stem + e);
  const part = sp.part || (typ === 'ar' ? stem + 'ado' : /[aeo]$/.test(stem) ? stem + 'ído' : stem + 'ido');
  const ger =
    sp.ger ||
    (typ === 'ar'
      ? stem + 'ando'
      : sp.uir || /[aeo]$/.test(stem)
        ? stem + 'yendo'
        : sp.p3 === 'i'
          ? lastEi(stem) + 'iendo'
          : sp.p3 === 'u'
            ? lastOu(stem) + 'iendo'
            : stem + 'iendo');
  return { inf, base, stem, refl, pr, pt, im, part, ger, sp, fst: FUTST[inf] || base };
}

export function subjForms(cj: Conj): string[] {
  const sp = SPEC[cj.inf] || {};
  if (sp.sub) return sp.sub.slice();
  const typ = cj.base.slice(-2);
  const E = typ === 'ar' ? ['e', 'es', 'e', 'emos', 'en'] : ['a', 'as', 'a', 'amos', 'an'];
  const yo = cj.pr[0].slice(0, -1);
  return E.map((e, i) => {
    let st = yo;
    if (i === 3) {
      if (sp.yo || sp.uir || sp.vy) st = yo;
      else if (typ === 'ir' && sp.p3) st = sp.p3 === 'i' ? lastEi(cj.stem) : lastOu(cj.stem);
      else st = cj.stem;
    }
    if (e[0] === 'e') {
      if (/c$/.test(st)) st = st.slice(0, -1) + 'qu';
      else if (/g$/.test(st)) st += 'u';
      else if (/z$/.test(st)) st = st.slice(0, -1) + 'c';
    }
    return st + e;
  });
}

/** The 5 forms of a tense, with reflexive pronouns when needed. */
export function forms(cj: Conj, tid: TenseId): string[] {
  const out: string[] = [];
  for (let i = 0; i < 5; i++) {
    let f: string | undefined;
    switch (tid) {
      case 'pres': f = cj.pr[i]; break;
      case 'indef': f = cj.pt[i]; break;
      case 'imp': f = cj.im[i]; break;
      case 'cont': f = EST_PR[i] + ' ' + cj.ger; break;
      case 'perf': f = HAB_PR[i] + ' ' + cj.part; break;
      case 'perfcont': f = HAB_PR[i] + ' estado ' + cj.ger; break;
      case 'fut': f = cj.fst + ['é', 'ás', 'á', 'emos', 'án'][i]; break;
      case 'cond': f = cj.fst + ['ía', 'ías', 'ía', 'íamos', 'ían'][i]; break;
      case 'subj': f = subjForms(cj)[i]; break;
      case 'plus': f = HAB_IM[i] + ' ' + cj.part; break;
      case 'ant': f = HAB_PT[i] + ' ' + cj.part; break;
      case 'pluscont': f = HAB_IM[i] + ' estado ' + cj.ger; break;
    }
    out.push((cj.refl ? PRON[i] + ' ' : '') + f);
  }
  return out;
}

export interface Command {
  lab: string;
  f: string;
}

/** Commands (imperative). Reflexive verbs return null, as in the prototype. */
export function impForms(cj: Conj): Command[] | null {
  if (cj.refl) return null;
  const s = subjForms(cj);
  return [
    { lab: 'tú (affirmative)', f: IMPT[cj.inf] || cj.pr[2] },
    { lab: 'tú (negative)', f: 'no ' + s[1] },
    { lab: 'usted', f: s[2] },
    { lab: 'ustedes', f: s[4] },
    { lab: "nosotros (let's)", f: cj.inf === 'ir' ? 'vamos' : s[3] },
  ];
}

/** Plain-English notes on what is irregular about a verb. */
export function conjNotes(inf: string): string[] {
  const sp = SPEC[inf] || {};
  const n: string[] = [];
  if (sp.pr && sp.pt) n.push('Very irregular verb. Learn these forms as they are.');
  else {
    if (sp.pc) n.push('Stem change in the present for yo, tú, él and ellos, not nosotros.');
    if (sp.yo) n.push('Irregular yo form in the present: ' + sp.yo + '.');
    if (sp.ps) n.push('Irregular stem in the simple past.');
    if (sp.p3) n.push('Stem change in él and ellos in the simple past, and in the gerund.');
    if (sp.sp) n.push('Spelling change in the yo form of the simple past to keep the sound.');
    if (sp.vy || sp.uir) n.push('Gets a y in some forms (like cayó, construyó).');
    if (sp.part) n.push('Irregular participle.');
    if (sp.refl) n.push('Reflexive verb: the pronoun goes before the conjugated verb.');
  }
  if (!n.length) n.push('Regular verb. The endings are all you need.');
  return n;
}
