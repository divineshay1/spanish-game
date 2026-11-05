/**
 * All learning content, copied exactly from mi-espanol-legacy.html by
 * scripts/extract_legacy.mjs. Edit the JSON in ./data, not the prototype.
 */
import core from './data/core.json';
import reading from './data/reading.json';
import grammar from './data/grammar.json';
import phrases from './data/phrases.json';
import sounds from './data/sounds.json';
import immersion from './data/immersion.json';
import duel from './data/duel.json';
import clinic from './data/clinic.json';
import progress from './data/progress.json';

export type Pair = [es: string, en: string];

export interface PhraseCard { id: string; es: string; en: string; tag: 'Everyday' | 'Colombia' | 'México' | 'Paciente' | string }
export interface PictureWord { id: string; es: string; art: string; en: string; ico: string; tag: string; mn: string; ex: string; exen: string }
export interface SieteWord { id: string; pid?: string; es: string; art: string; en: string; ico: string; mn: string; [step: string]: unknown }
export interface Story { id: string; title: string; lvl: string; blurb: string; s: Pair[]; [k: string]: unknown }
export interface BuildItem { en: string; es: string; lvl: number }
export interface Lesson { id: string; title: string; rule: string; items: [en: string, es: string][] }
export interface Dialogue { id: string; t: string; sc: string; lvl: number; turns: [who: string, es: string, en: string][] }
export interface QuestionWord { es: string; en: string; col: string; use: string; ex: Pair[] }
export interface Tense { id: string; grp: string; es: string; en: string; col: string; when: string[]; form: string; forms: string; ex: string; exen: string }
export interface Verb { n: number; es: string; en: string; g: number }
export interface ConnectorGroup { t: string; sub: string; col: string; r: Pair[] }
export interface Topic { id: string; t: string; sub: string; col: string; blocks: { h: string; p: string[]; ex?: Pair[] }[]; [k: string]: unknown }
export interface DiffGroup { id: string; t: string; sub: string; words: [w: string, meaning: string, note?: string][]; ex: Pair[]; tip: string; drill: unknown[] }
export interface PhraseCategory { id: string; t: string; sub: string; col: string; items: [es: string, en: string, note?: string][] }
export interface Phrase { id: string; cat: string; es: string; en: string; note: string }
export interface RootGroup { id: string; t: string; sub: string; items: Pair[] }
export interface RootWord { id: string; g: string; es: string; en: string }
export type SoundRule = [title: string, explain: string, examples: string[]]
export interface MinimalPair { w: [Pair, Pair]; tip: string }
export interface Enemy { n: string; g: string; hp: number; atk: number; t: string }

export const DICT = core.DICT as Record<string, string>;
export const CARDS = core.CARDS as PhraseCard[];
export const EXTRA = core.EXTRA as string[];
export const IMG = core.IMG as PictureWord[];
export const SIETE = core.SIETE as SieteWord[];
export const STEPT = core.STEPT as string[];
export const STEPD = core.STEPD as string[];

export const STORIES = reading.STORIES as unknown as Story[];
export const BUILD = reading.BUILD as BuildItem[];
export const LESSONS = reading.LESSONS as unknown as Lesson[];
export const DLG = reading.DLG as unknown as Dialogue[];

export const QW = grammar.QW as unknown as QuestionWord[];
export const QQ = grammar.QQ as [string, string, string][];
export const TENSES = grammar.TENSES as Tense[];
export const TQ = grammar.TQ as [string, string, string][];
export const COMP = grammar.COMP as unknown as [string, string, string, string[]][];
export const VGROUPS = grammar.VGROUPS as string[];
export const VERBS = grammar.VERBS as Verb[];
export const CONN = grammar.CONN as unknown as ConnectorGroup[];
export const CNOTE = grammar.CNOTE as Record<string, string>;
export const CQ = grammar.CQ as [string, string, string, string][];
export const TOPICS = grammar.TOPICS as unknown as Topic[];
export const DIFS = grammar.DIFS as unknown as DiffGroup[];
export const VTN = grammar.VTN as string[];
export const ENDS = grammar.ENDS as string[];

export const PCATS = phrases.PCATS as unknown as PhraseCategory[];
export const PHR = phrases.PHR as Phrase[];
export const RGRP = phrases.RGRP as unknown as RootGroup[];
export const RAIZ = phrases.RAIZ as RootWord[];

export const SOUNDS = sounds.SOUNDS as unknown as SoundRule[];
export const PAIRS = sounds.PAIRS as unknown as MinimalPair[];

export const HQ = immersion.HQ as [string, string, string][];
export const CONN_ES = immersion.CONN_ES as string[];
export const IST = immersion.IST as Record<string, string>;
export const ISEQ = immersion.ISEQ as string[];

export const ENEMIES = duel.ENEMIES as Enemy[];
export const PERKS = duel.PERKS as [string, string, string, number][];

export const CL_NAMES = clinic.CL_NAMES as { f: string[]; m: string[] };
export const CL_BODY = clinic.CL_BODY as [string, string, string, string][];
export const CL_SYM = clinic.CL_SYM as [string, string, string][];
export const CL_CMD = clinic.CL_CMD as [string, string, string, string, string][];
export const CL_OTHER = clinic.CL_OTHER as string[];

/** Skill names for the progress dashboard. */
export const MODN = progress.MODN as Record<string, string>;
