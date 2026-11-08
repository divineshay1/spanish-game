/**
 * "Palabras gemelas": English and Spanish word patterns, from the word lists
 * you shared, plus a clinic set using the same patterns.
 * Fixes made while adding them: "re ector" → reflector, "in amable" →
 * inflamable, "economico" → económico. "impregnable" was left out: in Spanish
 * it means "able to be soaked", a false friend, not a twin.
 */
export interface Pattern {
  id: string;
  title: string;
  rule: string;
  /** [English, Spanish] */
  items: [string, string][];
}

const same = (words: string[]): [string, string][] => words.map((w) => [w, w]);

export const COGNATES: Pattern[] = [
  {
    id: 'g-or',
    title: '-or: often identical',
    rule: 'Many words ending in -or are the same in both languages. Only the sound changes: stress the last syllable (doc-TOR) and tap the r.',
    items: [
      ...same(['actor', 'error', 'humor', 'exterior', 'inferior', 'ardor', 'color', 'favor', 'inspector', 'conductor', 'fervor', 'instructor', 'director', 'furor', 'interior', 'candor', 'doctor', 'honor', 'motor', 'censor', 'editor', 'horror', 'pastor', 'rumor', 'tractor', 'vapor', 'sector', 'tumor', 'protector', 'superior', 'tutor', 'vigor', 'reflector', 'tenor', 'valor']),
      ['author', 'autor'], ['coauthor', 'coautor'], ['aggressor', 'agresor'], ['oppressor', 'opresor'], ['professor', 'profesor'],
    ],
  },
  {
    id: 'g-al',
    title: '-al: often identical',
    rule: 'Words ending in -al are usually spelled the same. Stress the last syllable: a-ni-MAL, per-so-NAL.',
    items: same(['animal', 'personal', 'hospital', 'normal', 'general', 'natural', 'central', 'total', 'original', 'final', 'ideal', 'legal', 'local', 'oral', 'social', 'vital', 'capital', 'formal']),
  },
  {
    id: 'g-ble',
    title: '-ble: often identical',
    rule: 'Words ending in -ble are usually spelled the same (el cable = the cable). Say -ble as "bleh" and stress the syllable before it: a-do-RA-ble.',
    items: [
      ...same(['cable', 'abominable', 'adorable', 'afable', 'adaptable', 'comparable', 'admirable', 'curable', 'deplorable', 'formidable', 'detestable', 'honorable', 'durable', 'ilimitable', 'explicable', 'imaginable', 'favorable', 'impenetrable', 'intolerable', 'improbable', 'irreparable', 'inalterable', 'incalculable', 'irrevocable', 'incomparable', 'irritable', 'incurable', 'lamentable', 'inefable', 'laudable', 'inestimable', 'miserable', 'inevitable', 'navegable', 'inexplicable', 'noble', 'inflamable', 'notable', 'inimitable', 'presentable', 'insaciable', 'probable', 'inseparable', 'interminable', 'imperceptible', 'sociable', 'incompatible', 'tolerable', 'infalible', 'variable', 'intangible', 'venerable', 'invisible', 'vulnerable', 'irresistible']),
      ['acceptable', 'aceptable'], ['respectable', 'respetable'], ['responsible', 'responsable'], ['impossible', 'imposible'], ['irreproachable', 'irreprochable'],
    ],
  },
  {
    id: 'g-co',
    title: '-cal becomes -co',
    rule: 'Many English words ending in -cal end in -co in Spanish, usually with an accent three syllables from the end: práctical → PRÁC-ti-co.',
    items: [
      ['classical', 'clásico'], ['physical', 'físico'], ['mechanical', 'mecánico'], ['political', 'político'], ['comical', 'cómico'],
      ['practical', 'práctico'], ['economical', 'económico'], ['hysterical', 'histérico'], ['medical', 'médico'], ['technical', 'técnico'],
      ['ethical', 'ético'], ['identical', 'idéntico'], ['methodical', 'metódico'], ['typical', 'típico'],
    ],
  },
  {
    id: 'g-ico',
    title: '-ic becomes -ico',
    rule: 'English words ending in -ic add -o in Spanish, usually with an accent: electric → eléctrico, the Atlantic → el Atlántico.',
    items: [
      ['Atlantic', 'Atlántico'], ['electric', 'eléctrico'], ['plastic', 'plástico'], ['public', 'público'], ['romantic', 'romántico'],
      ['fantastic', 'fantástico'], ['automatic', 'automático'], ['dramatic', 'dramático'], ['artistic', 'artístico'], ['Pacific', 'Pacífico'],
    ],
  },
  {
    id: 'g-ente',
    title: '-ent and -ant become -ente and -ante',
    rule: 'Add an e: president → presidente, excellent → excelente, restaurant → restaurante, important → importante.',
    items: [
      ['president', 'presidente'], ['excellent', 'excelente'], ['restaurant', 'restaurante'], ['important', 'importante'],
      ['different', 'diferente'], ['intelligent', 'inteligente'], ['ingredient', 'ingrediente'], ['evident', 'evidente'],
      ['permanent', 'permanente'], ['elegant', 'elegante'], ['instant', 'instante'], ['constant', 'constante'],
      ['abundant', 'abundante'], ['brilliant', 'brillante'], ['elephant', 'elefante'],
    ],
  },
  {
    id: 'g-clinica',
    title: 'Twins in the clinic',
    rule: 'The same patterns, words you will hear on shift. Most are just the English word with Spanish sounds.',
    items: [
      ['patient', 'paciente'], ['urgent', 'urgente'], ['frequent', 'frecuente'], ['accident', 'accidente'], ['resident', 'residente'],
      ['doctor', 'doctor'], ['tumor', 'tumor'], ['hospital', 'hospital'], ['normal', 'normal'], ['oral', 'oral'], ['vital', 'vital'],
      ['medical', 'médico'], ['clinical', 'clínico'], ['chronic', 'crónico'], ['allergic', 'alérgico'], ['diabetic', 'diabético'],
      ['asthmatic', 'asmático'], ['infection', 'infección'], ['inflammation', 'inflamación'], ['curable', 'curable'], ['visible', 'visible'],
    ],
  },
];
