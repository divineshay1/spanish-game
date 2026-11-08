/**
 * El Observatorio's grammar book: reference pages for every section, plus
 * the prototype's drills (multiple choice), Armar (build it) and Oído fino.
 */
import { state, commit } from '../state/store';
import { speak, stopSpeaking } from '../audio/speech';
import { sfx } from '../audio/sfx';
import { pron } from '../engine/pronunciation';
import { conj, forms, impForms, conjNotes, PERS, type TenseId } from '../engine/conjugation';
import { norm } from '../engine/text';
import {
  buildQuiz, answerQuiz, quizSkill, buildItems, checkBuild, buildHint, genVerbItems, finoItems, answerFino, finishDrill, uniqVerbs,
  type QuizKind, type QuizOpts, type QItem, type BItem, type FinoItem,
} from '../engine/grammar';
import { CNOTE, CONN, DIFS, PCATS, PHR, QW, RAIZ, RGRP, SOUNDS, TENSES, TOPICS, VGROUPS, VERBS } from '../content';
import { EXTRA_SOUNDS } from '../content/extraSounds';
import { THINK, thinkRound, thinkAnswer, finishThink, type ThinkLesson } from '../engine/think';
import { shield } from './shield';
import { toast } from './toast';

export type Section = 'conj' | 'verbs' | 'tenses' | 'qw' | 'conn' | 'topics' | 'difs' | 'cimientos' | 'armar' | 'fino' | 'sonidos' | 'pensar';

type View =
  | { k: 'sec'; sec: Section; sub?: string }
  | { k: 'quiz'; back: View; title: string; skill: string; items: QItem[]; i: number; ans: number | null; right: number; xp: number; again: () => View }
  | { k: 'build'; back: View; kind: BItem['kind']; items: BItem[]; i: number; placed: number[]; res: 'good' | 'bad' | null; hints: number; right: number; xp: number; again: () => View }
  | { k: 'fino'; items: FinoItem[]; i: number; ans: number | null; right: number; xp: number }
  | { k: 'think'; back: View; lesson: ThinkLesson; items: [string, string][]; i: number; show: boolean; got: number }
  | { k: 'done'; back: View; title: string; right: number; total: number; xp: number; again: () => View };

let layer: HTMLDivElement | null = null;
let view: View = { k: 'sec', sec: 'conj' };
let cjQ = '';
let cjVerb = 'hablar';
let cjT: TenseId | 'mand' = 'pres';
let vg = 0;
let lvl = 0;

const esc = (s: string | number) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const say = (t: string, slow = false) => speak(t, state(), { slow });
const sayBtn = (t: string) => `<button class="pbtn small" data-act="say" data-t="${esc(t)}">▶</button>`;
const exRow = (a: string, b: string) => `<div class="row between story"><div><div>${esc(a)}</div><div class="muted">${esc(b)}</div></div>${sayBtn(a)}</div>`;
const drillBtn = (label: string, kind: QuizKind, o: QuizOpts = {}) => `<button class="pbtn gold wide" data-act="drill" data-k="${kind}" data-o='${esc(JSON.stringify(o))}'>✦ ${esc(label)}</button>`;
const bar = (i: number, n: number) => `<div class="bar"><i style="width:${Math.round((100 * i) / Math.max(1, n))}%"></i></div>`;

const TITLES: Record<Section, string> = {
  conj: 'Conjugar', verbs: '100 Verbos', tenses: 'Tiempos', qw: 'Preguntas', conn: 'Conectores', topics: 'Temas',
  difs: 'Diferencias', cimientos: 'Cimientos', armar: 'Armar', fino: 'Oído fino', sonidos: 'Sonidos', pensar: 'Pensar',
};

export const grammarOpen = (): boolean => !!layer && !layer.hidden;

export function openGrammar(sec: Section): void {
  if (!layer) {
    layer = document.createElement('div');
    layer.className = 'ui-layer';
    layer.id = 'grammar';
    layer.addEventListener('click', onClick);
    layer.addEventListener('input', onInput);
    shield(layer);
    document.body.appendChild(layer);
  }
  layer.hidden = false;
  view = sec === 'fino' ? startFino() : { k: 'sec', sec };
  render();
}

function close(): void {
  stopSpeaking();
  if (layer) layer.hidden = true;
  commit();
}

const header = (eyebrow: string, title: string, backAct = 'close') =>
  `<div class="row between"><div><div class="eyebrow">${esc(eyebrow)}</div><h2>${esc(title)}</h2></div><button class="pbtn small" data-act="${backAct}">${backAct === 'close' ? '✕' : '← Volver'}</button></div>`;

function pronLine(w: string): string {
  const p = pron(w);
  return `<span class="syl">${p.syl.map((s, i) => (i === p.st && p.syl.length > 1 ? `<b>${esc(s)}</b>` : esc(s))).join('·')}</span> <span class="say">${esc(p.say)}</span>`;
}

// ---------- section pages ----------

function secHtml(sec: Section, sub?: string): string {
  let h = header('El Observatorio', TITLES[sec], sub ? 'secback' : 'close');
  if (sec === 'conj') {
    const q = norm(cjQ);
    const list = uniqVerbs().filter((v) => !q || norm(v.es).indexOf(q) === 0 || norm(v.en).indexOf(q) > -1).slice(0, 14);
    h += `<p class="muted">Pick any of the 100 verbs and see it in every tense.</p><input class="pinput" id="cjq" placeholder="Search a verb or its meaning" autocomplete="off" autocapitalize="off" value="${esc(cjQ)}">`;
    h += `<div class="chips" id="cjres">${list.map((v) => `<button class="chip${v.es === cjVerb ? ' good' : ''}" data-act="cjpick" data-es="${esc(v.es)}">${esc(v.es)}</button>`).join('') || '<span class="muted">No match in the 100 verbs.</span>'}</div>`;
    const v = uniqVerbs().find((x) => x.es === cjVerb)!;
    const cj = conj(v.es);
    h += `<div class="card"><div class="row between"><h3>${esc(v.es)}</h3><span class="pill">${esc(v.en)}</span></div><p>${pronLine(v.es)}</p>`;
    h += `<div class="chipline"><span class="pill gold">participio: ${esc(cj.part)}</span><span class="pill gold">gerundio: ${esc(cj.ger)}</span></div>`;
    h += conjNotes(v.es).map((n) => `<p class="muted">${esc(n)}</p>`).join('') + `</div>`;
    const short = (s: string) => s.replace(' (simple)', '').replace(' (compuesto)', '').replace('Pretérito ', '').replace('Presente ', 'Pres. ');
    h += `<div class="chips">${TENSES.filter((t) => t.id !== 'perfp').map((t) => `<button class="pbtn small${cjT === t.id ? ' on' : ''}" data-act="cjt" data-t="${t.id}">${esc(short(t.es))}</button>`).join('')}</div>`;
    const tn = TENSES.find((t) => t.id === cjT)!;
    let rows: string;
    if (cjT === 'mand') {
      const im = impForms(cj);
      rows = im
        ? im.map((r) => `<div class="row between story"><div><span class="muted">${esc(r.lab)}</span><div><b>${esc(r.f)}</b></div></div>${sayBtn(r.f)}</div>`).join('')
        : '<p class="muted">Reflexive verbs attach the pronoun to the command, like siéntese. Pick a non-reflexive verb for the full table.</p>';
    } else {
      const fm = forms(cj, cjT);
      rows = PERS.map((pp, i) => `<div class="row between story"><div><span class="muted">${esc(pp[0])}</span><div><b>${esc((cjT === 'subj' ? 'que ' : '') + fm[i])}</b></div></div>${sayBtn(fm[i])}</div>`).join('');
    }
    h += `<div class="card" style="border-left:6px solid ${tn.col}"><h3>${esc(tn.es)}</h3><p class="muted">${esc(tn.form)}</p>${rows}</div>`;
    h += `<button class="pbtn gold wide" data-act="cjbuild">Build this verb (8 rounds)</button><p class="muted">Forms shown are for Latin America. There is no vosotros. In some places, like Medellín, people also use vos.</p>`;
  } else if (sec === 'verbs') {
    h += `<div class="chips">${VGROUPS.map((g, i) => `<button class="pbtn small${vg === i ? ' on' : ''}" data-act="vg" data-i="${i}">${esc(g)}</button>`).join('')}</div>`;
    h += drillBtn(`Practice verbs ${vg * 20 + 1} to ${vg * 20 + 20}`, 'v', { vg });
    h += VERBS.filter((v) => v.g === vg).map((v) => `<div class="row between story"><div><b>${v.n}. ${esc(v.es)}</b> <span class="muted">${esc(v.en)}</span><div class="say">${esc(pron(v.es).say)}</div></div>${sayBtn(v.es)}</div>`).join('');
  } else if (sec === 'tenses') {
    h += `<div class="row">${drillBtn('Which present tense?', 'tp')}${drillBtn('Which past tense?', 'ta')}${drillBtn('Complete the sentence', 'comp')}</div>`;
    h += TENSES.map(
      (t) => `<div class="card" style="border-left:6px solid ${t.col}"><h3>${esc(t.es)}</h3><p class="muted">${esc(t.en)}</p><ul>${t.when.map((w) => `<li>${esc(w)}</li>`).join('')}</ul><p><b>${esc(t.form)}</b></p><p class="muted">${esc(t.forms)}</p>${exRow(t.ex, t.exen)}</div>`,
    ).join('');
  } else if (sec === 'qw') {
    h += drillBtn('Practice question words', 'q');
    h += QW.map((w) => `<div class="card" style="border-left:6px solid ${w.col}"><div class="row between"><h3>${esc(w.es)}</h3><span class="pill">${esc(w.en)}</span></div><p class="muted">${esc(w.use)}</p>${w.ex.map((e) => exRow(e[0], e[1])).join('')}</div>`).join('');
  } else if (sec === 'conn') {
    h += drillBtn('Practice connectors', 'c');
    h += CONN.map(
      (c) => `<div class="card" style="border-left:6px solid ${c.col}"><h3>${esc(c.t)}</h3><p class="muted">${esc(c.sub)}</p>${c.r
        .map((x) => `<div class="row between"><div><b>${esc(x[0])}</b> <span class="muted">${esc(x[1])}</span>${CNOTE[x[0]] ? `<div class="muted">⚠ ${esc(CNOTE[x[0]])}</div>` : ''}</div>${sayBtn(x[0])}</div>`)
        .join('')}</div>`,
    ).join('');
  } else if (sec === 'topics') {
    const t = sub ? TOPICS.find((x) => x.id === sub) : null;
    if (!t) h += TOPICS.map((x) => `<button class="task" data-act="sub" data-s="${x.id}"><span class="dot">✦</span><span>${esc(x.t)}<small>${esc(x.sub)}</small></span></button>`).join('');
    else {
      h += `<h3>${esc(t.t)}</h3><p class="muted">${esc(t.sub)}</p>` + drillBtn('Practice this', 'topic', { topic: t.id });
      h += t.blocks.map((b) => `<div class="card"><h3>${esc(b.h)}</h3>${b.p.map((p) => `<p>${esc(p)}</p>`).join('')}${(b.ex || []).map((e) => exRow(e[0], e[1])).join('')}</div>`).join('');
    }
  } else if (sec === 'difs') {
    const g = sub ? DIFS.find((x) => x.id === sub) : null;
    if (!g) {
      h += `<p class="muted">Words and expressions that look alike but are not interchangeable. Learn when to use each one, then drill.</p>` + drillBtn('Practice a mix', 'dif', { difq: 'all' });
      h += DIFS.map((x) => `<button class="task" data-act="sub" data-s="${x.id}"><span class="dot">≈</span><span>${esc(x.t)}<small>${esc(x.sub)}</small></span></button>`).join('');
    } else {
      h += `<h3>${esc(g.t)}</h3>` + drillBtn('Practice this', 'dif', { difq: g.id });
      h += `<div class="card">${g.words.map((w) => `<div class="row between"><div><b>${esc(w[0])}</b><div class="muted">${esc(w[1])}</div>${w[2] ? `<div class="tr">${esc(w[2])}</div>` : ''}</div>${sayBtn(w[0].replace(/[¿?+]/g, '').split(' / ')[0])}</div>`).join('')}</div>`;
      h += `<div class="card"><h3>In use</h3>${g.ex.map((e) => exRow(e[0], e[1])).join('')}</div><div class="story"><b class="spark">Remember</b><br>${esc(g.tip)}</div>`;
    }
  } else if (sec === 'cimientos') {
    h += `<h3>Frases esenciales</h3><p class="muted">The phrases you'll use every day. Each set has a quick drill; right answers grow those plants in your garden.</p>`;
    h += PCATS.map((c) => `<div class="card"><div class="row between"><b>${esc(c.t)}</b><span class="muted">${PHR.filter((p) => p.cat === c.id).length}</span></div><p class="muted">${esc(c.sub)}</p><button class="pbtn small" data-act="drill" data-k="ph" data-o='${esc(JSON.stringify({ cat: c.id }))}'>✦ Practice</button></div>`).join('');
    h += `<h3>Raíces</h3><p class="muted">Root words: pronouns, articles, prepositions, numbers, months and more.</p>`;
    h += RGRP.map((g, i) => `<div class="card"><div class="row between"><b>${esc(g.t)}</b><span class="muted">${RAIZ.filter((r) => r.g === g.id).length}</span></div><p class="muted">${esc(g.sub)}</p><button class="pbtn small" data-act="drill" data-k="rt" data-o='${esc(JSON.stringify({ rg: i }))}'>✦ Practice</button></div>`).join('');
  } else if (sec === 'armar') {
    h += `<p class="muted">Putting a word together yourself makes your brain work for it, and that is what makes it stick. Pick what to build.</p>`;
    h += `<p class="muted">Sentence level</p><div class="row">${[['Todo', 0], ['Nivel 1', 1], ['Nivel 2', 2], ['Nivel 3', 3]].map(([l, n]) => `<button class="pbtn small${lvl === n ? ' on' : ''}" data-act="lvl" data-n="${n}">${l}</button>`).join('')}</div><p class="muted">1 is short and simple. 2 is everyday and clinic. 3 is longer, with mixed tenses.</p>`;
    const card = (k: string, g: string, t: string, d: string) => `<button class="task" data-act="bstart" data-k="${k}"><span class="dot">${g}</span><span>${t}<small>${d}</small></span></button>`;
    h += card('frase', '✎', 'Frases', 'Build full sentences from English. Words and distractors to sort through.');
    h += card('oido', '♪', 'Oído', 'Listen first, then build what you heard. English stays hidden until you finish.');
    h += card('palabra', '❖', 'Palabras', 'Build a word syllable by syllable. Words you are about to forget show up first.');
    h += card('verbo', '☾', 'Verbos', 'Build conjugations from pieces: stem and ending, or helper plus participle.');
  } else if (sec === 'pensar') {
    const l = sub ? THINK.find((x) => x.id === sub) : null;
    const S = state();
    if (!l) {
      h += `<p class="muted">Think it through: patterns that turn English you already know into Spanish. See the English, think of the Spanish, then check.</p>`;
      h += `<h3>Patrones</h3>` + THINK.filter((x) => !x.twin).map((x) => `<button class="task${S.lessons[x.id] ? ' on' : ''}" data-act="sub" data-s="${x.id}"><span class="dot">${S.lessons[x.id] ? '✓' : '✎'}</span><span>${esc(x.title)}<small>${esc(x.rule)}</small></span></button>`).join('');
      h += `<h3>Palabras gemelas</h3><p class="muted">Twin words: often spelled the same or almost the same. The trick is saying them the Spanish way.</p>`;
      h += THINK.filter((x) => x.twin).map((x) => `<button class="task${S.lessons[x.id] ? ' on' : ''}" data-act="sub" data-s="${x.id}"><span class="dot">${S.lessons[x.id] ? '✓' : '≈'}</span><span>${esc(x.title)}<small>${x.items.length} words</small></span></button>`).join('');
    } else {
      h += `<h3>${esc(l.title)}</h3><p>${esc(l.rule)}</p><button class="pbtn gold wide" data-act="think" data-id="${l.id}">✦ Practice (${Math.min(10, l.items.length)} words)</button>`;
      h += `<div class="chips">${l.items.map(([en, es]) => `<button class="chip" data-act="say" data-t="${esc(es)}">${esc(es)}${en !== es ? `<br><small class="muted">${esc(en)}</small>` : ''}<br><small class="say">${esc(es.split(' ').length === 1 ? pron(es.toLowerCase()).say : '')}</small></button>`).join('')}</div>`;
    }
  } else if (sec === 'sonidos') {
    h += `<p class="muted">The rules that cover almost every word. Tap any example to hear it.</p>`;
    const rule = (s: (typeof SOUNDS)[number]) =>
      `<div class="card"><h3>${esc(s[0])}</h3><p class="muted">${esc(s[1])}</p><div class="chips">${s[2].map((w) => `<button class="chip" data-act="say" data-t="${esc(w)}">${esc(w)}<br><small class="say">${esc(pron(w).say)}</small></button>`).join('')}</div></div>`;
    h += SOUNDS.map(rule).join('') + `<h3>More from your pronunciation key</h3>` + EXTRA_SOUNDS.map(rule).join('');
    h += `<button class="pbtn gold wide" data-act="tofino">♪ Oído fino: hear the difference</button>`;
  }
  return h;
}

function startFino(): View {
  const items = finoItems();
  setTimeout(() => say(items[0].p.w[items[0].t][0]), 300);
  return { k: 'fino', items, i: 0, ans: null, right: 0, xp: 0 };
}

// ---------- render ----------

function render(): void {
  if (!layer) return;
  const v = view;
  let h = '';
  if (v.k === 'sec') h = secHtml(v.sec, v.sub);
  else if (v.k === 'quiz') {
    const it = v.items[v.i];
    h += header('Práctica', v.title, 'qback') + bar(v.i, v.items.length);
    h += `<p class="muted center">${esc(it.s)}</p><div class="big${it.p.length > 26 ? ' en' : ''}">${esc(it.p)}</div>`;
    if (it.say) h += `<div class="row center"><button class="pbtn" data-act="say" data-t="${esc(it.say)}">▶ Escuchar</button></div>`;
    it.opts.forEach((o, i) => {
      let cl = '';
      if (v.ans !== null) cl = o === it.a ? ' good' : i === v.ans ? ' bad' : '';
      h += `<button class="opt${cl}" data-act="qopt" data-i="${i}" ${v.ans !== null ? 'disabled' : ''}>${esc(o)}</button>`;
    });
    if (v.ans !== null) h += `<div class="story">${esc(it.why)}</div><button class="pbtn gold wide" data-act="qnext">${v.i + 1 < v.items.length ? 'Next →' : 'Finish'}</button>`;
  } else if (v.k === 'build') {
    const it = v.items[v.i];
    const name = { frase: 'Frases', oido: 'Oído', palabra: 'Palabras', verbo: 'Verbos' }[v.kind];
    h += header('Armar', name, 'qback') + bar(v.i, v.items.length) + `<p class="muted center">${esc(it.s)}</p>`;
    if (it.word && it.word.key.startsWith('i:')) h += `<img class="pic sm" alt="" src="pics/${esc(it.word.key.slice(2))}.jpg">`;
    if (it.kind === 'oido') {
      h += `<div class="row center"><button class="pbtn gold" data-act="say" data-t="${esc(it.say)}">▶ Escuchar</button><button class="pbtn" data-act="say" data-slow="1" data-t="${esc(it.say)}">Lento</button></div>`;
      if (v.res) h += `<p class="muted center">${esc(it.en || '')}</p>`;
    } else {
      h += `<div class="big${it.p.length > 24 ? ' en' : ''}">${esc(it.p)}</div>`;
      if (it.kind === 'palabra' || it.kind === 'verbo' || v.res === 'good') h += `<div class="row center"><button class="pbtn" data-act="say" data-t="${esc(it.say)}">▶ Escuchar</button></div>`;
    }
    if (it.hint) h += `<p class="muted center">Formula: ${esc(it.hint)}</p>`;
    const chip = (id: number, act: string, cls = '') => `<button class="chip ${cls}" data-act="${act}" data-id="${id}">${esc(it.pool.find((p) => p.id === id)!.w)}</button>`;
    h += `<div class="slot chips">${v.placed.map((id) => chip(id, 'bun', v.res || '')).join('')}</div>`;
    h += `<div class="chips">${it.pool.filter((p) => !v.placed.includes(p.id)).map((p) => chip(p.id, 'bput')).join('')}</div>`;
    if (v.res === 'bad') h += `<p class="feedback no">Answer: <b>${esc(it.ansText)}</b></p>`;
    if (v.res && it.word) h += `<div class="story"><b>${esc((it.word.art ? it.word.art + ' ' : '') + it.word.es)}</b> · ${pronLine(it.word.es)}${it.word.mn ? `<br>${esc(it.word.mn)}` : ''}</div>`;
    h += !v.res
      ? `<div class="row"><button class="pbtn" data-act="bhint">Hint</button><button class="pbtn gold" style="flex:1" data-act="bcheck" ${v.placed.length ? '' : 'disabled'}>Check</button></div>`
      : `<button class="pbtn gold wide" data-act="bnext">${v.i + 1 < v.items.length ? 'Next →' : 'Finish'}</button>`;
  } else if (v.k === 'fino') {
    const it = v.items[v.i];
    h += header('Oído fino', 'Which one did you hear?') + bar(v.i, v.items.length);
    h += `<div class="row center"><button class="pbtn gold" data-act="fplay">▶ Escuchar</button><button class="pbtn" data-act="fplay" data-slow="1">Lento</button></div>`;
    h += it.ord.map((k) => {
      let cl = '';
      if (v.ans !== null) cl = k === it.t ? ' good' : k === v.ans ? ' bad' : '';
      return `<button class="opt center${cl}" style="font-size:24px" data-act="fopt" data-k="${k}" ${v.ans !== null ? 'disabled' : ''}>${esc(it.p.w[k][0])}</button>`;
    }).join('');
    if (v.ans !== null)
      h += `<div class="story">${it.p.w.map((w) => `<b>${esc(w[0])}</b> · ${esc(w[1])} ${sayBtn(w[0])}`).join('<br>')}<br><span class="muted">${esc(it.p.tip)}</span></div><button class="pbtn gold wide" data-act="fnext">${v.i + 1 < v.items.length ? 'Next →' : 'Finish'}</button>`;
  } else if (v.k === 'think') {
    const [en, es] = v.items[v.i];
    h += header('Pensar', v.lesson.title, 'qback') + bar(v.i, v.items.length) + `<p class="muted center">${esc(v.lesson.rule)}</p>`;
    h += `<div class="big en">${esc(en)}</div><p class="muted center">Think it in Spanish first.</p>`;
    if (!v.show) h += `<button class="pbtn gold wide" data-act="tshow">Show the Spanish</button>`;
    else {
      h += `<div class="big">${esc(es)}</div>${es.split(' ').length <= 4 ? `<p class="center">${es.split(' ').map((w) => pronLine(w.replace(/[¿?¡!,.]/g, '').toLowerCase())).join(' &nbsp; ')}</p>` : ''}`;
      h += `<div class="row center"><button class="pbtn" data-act="say" data-t="${esc(es)}">▶ Escuchar</button></div>`;
      h += `<div class="row"><button class="pbtn" style="flex:1" data-act="tnext" data-r="0">Todavía no</button><button class="pbtn gold" style="flex:1" data-act="tnext" data-r="1">¡Lo sabía!</button></div>`;
    }
  } else {
    h += `<div class="center"><div class="big spark">✦</div><h2>¡Listo!</h2><p class="muted">${v.right} of ${v.total} correct.</p><p class="spark">+${v.xp} XP</p></div>`;
    h += `<div class="row"><button class="pbtn gold" style="flex:1" data-act="again">Practice again</button><button class="pbtn" style="flex:1" data-act="qback">Back</button></div>`;
  }
  layer.innerHTML = `<div class="panel session" role="dialog" aria-label="El Observatorio">${h}</div>`;
}

// ---------- actions ----------

function quizView(back: View, k: QuizKind, o: QuizOpts): View {
  const q = buildQuiz(k, o);
  return { k: 'quiz', back, title: q.title, skill: quizSkill(k, o), items: q.items, i: 0, ans: null, right: 0, xp: 0, again: () => quizView(back, k, o) };
}

function buildView(back: View, kind: BItem['kind'], items?: BItem[], only?: string): View {
  const its = items || buildItems(state(), kind, lvl);
  if (its[0]?.auto) setTimeout(() => say(its[0].say), 250);
  return {
    k: 'build', back, kind, items: its, i: 0, placed: [], res: null, hints: 0, right: 0, xp: 0,
    again: () => buildView(back, kind, only ? genVerbItems({ es: only }) : undefined, only),
  };
}

function onInput(e: Event): void {
  const t = e.target as HTMLInputElement;
  if (t.id !== 'cjq') return;
  cjQ = t.value;
  const q = norm(cjQ);
  const list = uniqVerbs().filter((v) => !q || norm(v.es).indexOf(q) === 0 || norm(v.en).indexOf(q) > -1).slice(0, 14);
  const box = layer!.querySelector('#cjres');
  if (box) box.innerHTML = list.map((v) => `<button class="chip${v.es === cjVerb ? ' good' : ''}" data-act="cjpick" data-es="${esc(v.es)}">${esc(v.es)}</button>`).join('') || '<span class="muted">No match in the 100 verbs.</span>';
}

function onClick(e: Event): void {
  const target = e.target as HTMLElement;
  if (target === layer) return close();
  const btn = target.closest<HTMLElement>('[data-act]');
  if (!btn || (btn as HTMLButtonElement).disabled) return;
  const S = state();
  const v = view;
  const act = btn.dataset.act;
  switch (act) {
    case 'close':
      return close();
    case 'say':
      say(btn.dataset.t || '', btn.dataset.slow === '1');
      return;
    case 'secback':
      if (v.k === 'sec') view = { k: 'sec', sec: v.sec };
      break;
    case 'sub':
      if (v.k === 'sec') view = { k: 'sec', sec: v.sec, sub: btn.dataset.s };
      break;
    case 'cjpick':
      cjVerb = btn.dataset.es!;
      say(cjVerb);
      break;
    case 'cjt':
      cjT = btn.dataset.t as TenseId | 'mand';
      break;
    case 'cjbuild':
      view = buildView(v, 'verbo', genVerbItems({ es: cjVerb }), cjVerb);
      break;
    case 'vg':
      vg = Number(btn.dataset.i);
      break;
    case 'lvl':
      lvl = Number(btn.dataset.n);
      break;
    case 'think': {
      const l = THINK.find((x) => x.id === btn.dataset.id)!;
      view = { k: 'think', back: v, lesson: l, items: thinkRound(l), i: 0, show: false, got: 0 };
      break;
    }
    case 'tshow':
      if (v.k !== 'think') return;
      v.show = true;
      say(v.items[v.i][1]);
      break;
    case 'tnext': {
      if (v.k !== 'think') return;
      const knew = btn.dataset.r === '1';
      thinkAnswer(S, knew);
      if (knew) v.got++;
      sfx(knew ? 'good' : 'tap');
      if (v.i + 1 >= v.items.length) {
        const xp = finishThink(S, v.lesson, v.got);
        commit();
        sfx('done');
        toast(`+${xp} XP ✦`);
        const lesson = v.lesson;
        const back = v.back;
        view = { k: 'done', back, title: lesson.title, right: v.got, total: v.items.length, xp, again: () => ({ k: 'think', back, lesson, items: thinkRound(lesson), i: 0, show: false, got: 0 }) };
      } else {
        v.i++;
        v.show = false;
      }
      break;
    }
    case 'tofino':
      view = startFino();
      break;
    case 'drill':
      view = quizView(v, btn.dataset.k as QuizKind, JSON.parse(btn.dataset.o || '{}'));
      break;
    case 'bstart':
      view = buildView(v, btn.dataset.k as BItem['kind']);
      break;
    case 'qback':
      stopSpeaking();
      view = v.k === 'quiz' || v.k === 'build' || v.k === 'done' || v.k === 'think' ? v.back : { k: 'sec', sec: 'sonidos' };
      break;
    case 'again':
      if (v.k === 'done') view = v.again();
      break;
    // quiz
    case 'qopt': {
      if (v.k !== 'quiz' || v.ans !== null) return;
      v.ans = Number(btn.dataset.i);
      const it = v.items[v.i];
      const ok = it.opts[v.ans] === it.a;
      if (ok) v.right++;
      v.xp += answerQuiz(S, v.skill, it, ok);
      sfx(ok ? 'good' : 'bad');
      if (it.say) say(it.say);
      break;
    }
    case 'qnext':
      if (v.k !== 'quiz') return;
      if (v.i + 1 >= v.items.length) {
        finishDrill(S, v.xp, 'grammar');
        commit();
        sfx('done');
        toast(`+${v.xp + 5} XP ✦`);
        view = { k: 'done', back: v.back, title: v.title, right: v.right, total: v.items.length, xp: v.xp + 5, again: v.again };
      } else {
        v.i++;
        v.ans = null;
      }
      break;
    // build
    case 'bput':
      if (v.k !== 'build' || v.res) return;
      v.placed.push(Number(btn.dataset.id));
      sfx('tap');
      break;
    case 'bun':
      if (v.k !== 'build' || v.res) return;
      v.placed = v.placed.filter((x) => x !== Number(btn.dataset.id));
      break;
    case 'bhint':
      if (v.k !== 'build' || v.res) return;
      {
        const n = v.placed.length;
        v.placed = buildHint(v.items[v.i], v.placed);
        if (v.placed.length > n) v.hints++;
      }
      break;
    case 'bcheck': {
      if (v.k !== 'build' || v.res) return;
      const r = checkBuild(S, v.items[v.i], v.placed, v.hints);
      v.res = r.ok ? 'good' : 'bad';
      if (r.ok) v.right++;
      v.xp += r.xp;
      commit();
      sfx(r.ok ? 'good' : 'bad');
      say(v.items[v.i].say);
      break;
    }
    case 'bnext':
      if (v.k !== 'build') return;
      if (v.i + 1 >= v.items.length) {
        finishDrill(S, v.xp, 'build');
        commit();
        sfx('done');
        toast(`+${v.xp + 5} XP ✦`);
        view = { k: 'done', back: v.back, title: 'Armar', right: v.right, total: v.items.length, xp: v.xp + 5, again: v.again };
      } else {
        v.i++;
        v.placed = [];
        v.res = null;
        v.hints = 0;
        if (v.items[v.i].auto) say(v.items[v.i].say);
      }
      break;
    // oído fino
    case 'fplay':
      if (v.k === 'fino') say(v.items[v.i].p.w[v.items[v.i].t][0], btn.dataset.slow === '1');
      return;
    case 'fopt': {
      if (v.k !== 'fino' || v.ans !== null) return;
      v.ans = Number(btn.dataset.k);
      const ok = answerFino(S, v.items[v.i], v.ans);
      if (ok) {
        v.right++;
        v.xp += 3;
      }
      sfx(ok ? 'good' : 'bad');
      break;
    }
    case 'fnext':
      if (v.k !== 'fino') return;
      if (v.i + 1 >= v.items.length) {
        finishDrill(S, v.xp, 'listen');
        commit();
        sfx('done');
        toast(`+${v.xp + 5} XP ✦`);
        view = { k: 'done', back: { k: 'sec', sec: 'sonidos' }, title: 'Oído fino', right: v.right, total: v.items.length, xp: v.xp + 5, again: startFino };
      } else {
        v.i++;
        v.ans = null;
        const it = v.items[v.i];
        say(it.p.w[it.t][0]);
      }
      break;
  }
  render();
  layer?.querySelector('.panel')?.scrollTo(0, 0);
}

// for automated tests
if (typeof window !== 'undefined') Object.assign(window, { __grammar: () => view });
