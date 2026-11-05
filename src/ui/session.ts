/**
 * Learning screens for El Jardín, shown over the garden:
 *  - Regar (water): review due plants in your chosen test mode
 *  - Sembrar (plant): meet today's new words, then a quick check plants them
 *  - Focus: rescue the words you keep missing
 *  - Plant info: tap a plant to see its word
 */
import { state, commit } from '../state/store';
import { speak, stopSpeaking } from '../audio/speech';
import { pron } from '../engine/pronunciation';
import { cleanEs, bareWord } from '../engine/text';
import type { Card } from '../engine/cards';
import { addDays, dayKey } from '../engine/clock';
import type { Grade } from '../engine/grading';
import {
  answer, checkTyped, current, done, finish, prompt, seedQueue, startSession, TEST_MODES, typedRating, waterQueue,
  type Prompt, type Session, type TestMode,
} from '../engine/review';
import { focusPool, focusResult, focusStep, hint, eqArr, type FocusItem, type FocusStep } from '../engine/focus';
import { addXP } from '../state/progress';
import { cardById, catalog } from '../engine/cards';
import { STAGE_EN, STAGE_NAME, FAMILY_NAME } from '../art/plants';
import { toast } from './toast';
import { shield } from './shield';

export interface SessionResult {
  grew: string[];
  shrank: string[];
  xp: number;
}

type View =
  | { k: 'menu' }
  | { k: 'play'; s: Session; p: Prompt; show: boolean; pick: number | null; typed: string; grade: Grade | null; over: boolean }
  | { k: 'learn'; seeds: Card[]; i: number }
  | { k: 'fin'; s: Session }
  | { k: 'fmenu'; pool: FocusItem[] }
  | { k: 'focus'; items: FocusItem[]; i: number; step: FocusStep; phase: 'mc' | 'build'; pick: number | null; placed: number[]; res: 'good' | 'bad' | null; hints: number; xp: number; right: number; mcOk: boolean; grew: string[] }
  | { k: 'fdone'; right: number; total: number; xp: number }
  | { k: 'info'; c: Card };

let layer: HTMLDivElement | null = null;
let view: View = { k: 'menu' };
let kind: 'water' | 'plant' | 'focus' | 'info' = 'water';
let onClose: ((r: SessionResult) => void) | null = null;
let result: SessionResult = { grew: [], shrank: [], xp: 0 };

const esc = (s: string) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const say = (t: string, slow = false) => speak(cleanEs(t), state(), { slow });

function ensureLayer(): HTMLDivElement {
  if (!layer) {
    layer = document.createElement('div');
    layer.className = 'ui-layer';
    layer.id = 'session';
    layer.addEventListener('click', onClick);
    layer.addEventListener('keydown', onKey);
    shield(layer);
    // keep the keyboard open when tapping accent buttons
    layer.addEventListener('pointerdown', (e) => {
      if ((e.target as HTMLElement).closest('.accents button')) e.preventDefault();
    });
    document.body.appendChild(layer);
  }
  layer.hidden = false;
  return layer;
}

export const sessionOpen = (): boolean => !!layer && !layer.hidden;

function close(): void {
  stopSpeaking();
  if (layer) layer.hidden = true;
  const r = result;
  result = { grew: [], shrank: [], xp: 0 };
  commit();
  onClose?.(r);
  onClose = null;
}

// ---------- entry points ----------

export function openWater(cb: (r: SessionResult) => void): void {
  kind = 'water';
  onClose = cb;
  view = { k: 'menu' };
  ensureLayer();
  render();
}

export function openPlant(cb: (r: SessionResult) => void): void {
  kind = 'plant';
  onClose = cb;
  const seeds = seedQueue(state());
  if (!seeds.length) {
    toast('No more seeds today. Come back tomorrow ✦');
    return;
  }
  view = { k: 'learn', seeds, i: 0 };
  ensureLayer();
  render();
  say(seeds[0].es);
}

export function openFocus(cb: (r: SessionResult) => void): void {
  kind = 'focus';
  onClose = cb;
  view = { k: 'fmenu', pool: focusPool(state()) };
  ensureLayer();
  render();
}

export function openInfo(id: string, cb: (r: SessionResult) => void): void {
  const c = cardById(state(), id);
  if (!c) return;
  kind = 'info';
  onClose = cb;
  view = { k: 'info', c };
  ensureLayer();
  render();
  say(c.es);
}

// ---------- pieces ----------

const bar = (i: number, n: number) => `<div class="bar"><i style="width:${Math.round((100 * i) / Math.max(1, n))}%"></i></div>`;
const picHtml = (c: Card, sm = false) => (c.pic ? `<img class="pic${sm ? ' sm' : ''}" alt="" src="pics/${esc(c.pic)}.jpg">` : '');
const listenRow = (es: string) =>
  `<div class="row center"><button class="pbtn" data-act="say" data-t="${esc(es)}">▶ Escuchar</button><button class="pbtn" data-act="say" data-slow="1" data-t="${esc(es)}">Lento</button></div>`;

function pronHtml(es: string): string {
  const words = cleanEs(es).split(/\s+/).map(bareWord).filter(Boolean);
  if (!words.length || words.length > 4) return '';
  return `<p class="center syl">${words
    .map((w) => {
      const p = pron(w);
      const syl = p.syl.map((s, i) => (i === p.st && p.syl.length > 1 ? `<b>${esc(s)}</b>` : esc(s))).join('·');
      return `${syl} <span class="say">${esc(p.say)}</span>`;
    })
    .join('&nbsp;&nbsp; ')}</p>`;
}

const mnemonic = (c: Card) => (c.mn ? `<div class="story">${esc(c.ico || '✦')} ${esc(c.mn)}</div>` : '');
const accents = () =>
  `<div class="accents" aria-label="Accent letters">${['á', 'é', 'í', 'ó', 'ú', 'ñ', 'ü', '¿', '¡']
    .map((a) => `<button type="button" data-act="acc" data-t="${a}">${a}</button>`)
    .join('')}</div>`;

const header = (title: string, sub = '') =>
  `<div class="row between"><div><div class="eyebrow">${esc(sub)}</div><h2>${esc(title)}</h2></div><button class="pbtn small" data-act="close">✕</button></div>`;

// ---------- render ----------

function render(): void {
  if (!layer) return;
  const S = state();
  let h = '';
  const v = view;
  switch (v.k) {
    case 'menu': {
      const k = dayKey();
      const due = waterQueue(S).length;
      const inDays = (n: number) => Object.values(S.cards).filter((c) => c.due > k && c.due <= addDays(n)).length;
      h += header('Regar', 'El Jardín');
      h += `<p class="muted">Watering is reviewing. A plant asks for water right before you would forget its word. Answer right and it grows; miss and it shrinks a little, but it never dies.</p>`;
      h += `<div class="stats"><div><b>${due}</b>to water</div><div><b>${inDays(1)}</b>tomorrow</div><div><b>${inDays(7)}</b>this week</div></div>`;
      h += `<p class="muted">How do you want to test yourself?</p>`;
      h += TEST_MODES.map(
        ([m, t, d]) => `<button class="opt${S.testMode === m ? ' sel' : ''}" data-act="mode" data-m="${m}">${esc(t)}<small>${esc(d)}</small></button>`,
      ).join('');
      h += due
        ? `<button class="pbtn gold wide" data-act="start">💧 Water ${due} plant${due === 1 ? '' : 's'}</button>`
        : `<p class="center">Every plant has water ✦</p><button class="pbtn wide" data-act="close">Back to the garden</button>`;
      break;
    }
    case 'learn': {
      const c = v.seeds[v.i];
      h += header('Sembrar', `Semilla ${v.i + 1} de ${v.seeds.length}`) + bar(v.i, v.seeds.length);
      h += `<div class="eyebrow center">${esc(FAMILY_NAME[c.family])}</div>${picHtml(c)}<div class="big">${esc(cleanEs(c.es))}</div>`;
      h += pronHtml(c.es) + listenRow(c.es) + `<div class="big en">${esc(c.en)}</div>` + mnemonic(c);
      h += `<button class="pbtn gold wide" data-act="learnnext">${v.i + 1 < v.seeds.length ? 'Next seed →' : '🌱 Plant them: quick check'}</button>`;
      break;
    }
    case 'play': {
      const { s, p } = v;
      const c = current(s)!;
      const es = cleanEs(c.es);
      const title = kind === 'plant' ? 'Sembrar' : 'Regar';
      const modeName = TEST_MODES.find((m) => m[0] === s.mode)![1];
      h += header(title, `${modeName} · ${Math.min(s.i + 1, s.queue.length)} of ${s.queue.length}`) + bar(s.i, s.queue.length);
      const answered = v.show || v.pick !== null || v.grade !== null;
      if (answered) h += picHtml(c, true);
      if (s.mode === 'flash') {
        if (p.dir === 'es') {
          h += `<div class="big">${esc(es)}</div>${listenRow(es)}`;
          if (v.show) h += `<div class="big en">${esc(c.en)}</div>${pronHtml(es)}`;
        } else {
          h += `<div class="big en">${esc(c.en)}</div><p class="muted center">Say it in Spanish first</p>`;
          if (v.show) h += `<div class="big">${esc(es)}</div>${pronHtml(es)}${listenRow(es)}`;
        }
        if (v.show) h += mnemonic(c);
        h += !v.show
          ? `<button class="pbtn gold wide" data-act="reveal">Show answer</button>`
          : `<div class="row"><button class="pbtn" style="flex:1" data-act="rate" data-r="again">Otra vez</button><button class="pbtn" style="flex:1" data-act="rate" data-r="good">Bien</button><button class="pbtn gold" style="flex:1" data-act="rate" data-r="easy">Fácil</button></div>`;
      } else if (s.mode === 'mc') {
        h +=
          p.dir === 'es'
            ? `<p class="muted center">What does it mean?</p><div class="big">${esc(es)}</div>${listenRow(es)}`
            : `<p class="muted center">How do you say it in Spanish?</p><div class="big en">${esc(c.en)}</div>`;
        p.opts.forEach((o, i) => {
          let cl = '';
          if (v.pick !== null) cl = o === p.answer ? ' good' : i === v.pick ? ' bad' : '';
          h += `<button class="opt${cl}" data-act="pick" data-i="${i}" ${v.pick !== null ? 'disabled' : ''}>${esc(o)}</button>`;
        });
        if (v.pick !== null) h += pronHtml(es) + mnemonic(c) + `<button class="pbtn gold wide" data-act="next">Next →</button>`;
      } else {
        const isTr = s.mode === 'rtr';
        h += isTr
          ? `<p class="muted center">Type the English</p><div class="big">${esc(es)}</div>${listenRow(es)}`
          : `<p class="muted center">Type it in Spanish</p><div class="big en">${esc(c.en)}</div>`;
        h += `<input class="pinput" id="answer" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="done" placeholder="${isTr ? 'English' : 'Español'}" value="${esc(v.typed)}" ${v.grade !== null ? 'disabled' : ''}>`;
        if (v.grade === null) h += accents() + `<button class="pbtn gold wide" data-act="check">Check</button>`;
        else {
          const ok = v.grade !== 'bad' || v.over;
          const ans = isTr ? c.en : es;
          const msg =
            v.grade === 'good'
              ? '✓ Correct'
              : v.grade === 'accent'
                ? `✓ Correct, but watch the accent: <b>${esc(es)}</b>`
                : v.grade === 'close'
                  ? `✓ Almost. Check the spelling: <b>${esc(ans)}</b>`
                  : v.over
                    ? `✓ Counted as correct. Answer: <b>${esc(ans)}</b>`
                    : `Answer: <b>${esc(ans)}</b>`;
          h += `<p class="feedback ${ok ? 'ok' : 'no'}">${msg}</p>${isTr ? `<p class="muted">${esc(es)}</p>` : pronHtml(es) + listenRow(es)}${mnemonic(c)}`;
          h += !ok
            ? `<div class="row"><button class="pbtn" style="flex:1" data-act="over">I was right, count it</button><button class="pbtn gold" style="flex:1" data-act="next">Next →</button></div>`
            : `<button class="pbtn gold wide" data-act="next">Next →</button>`;
        }
      }
      break;
    }
    case 'fin': {
      const { s } = v;
      const grew = s.grew.length;
      h += `<div class="center"><div class="big spark">✦</div><h2>${kind === 'plant' ? '¡Sembrado!' : '¡Listo!'}</h2>`;
      h +=
        kind === 'plant'
          ? `<p>${s.right} of ${s.queue.length} seeds sprouted right away. The others are seeds that need water soon.</p>`
          : `<p>${grew} plant${grew === 1 ? '' : 's'} grew. Each one comes back right before you would forget it.</p>`;
      h += `<p class="spark">+${s.xp} XP</p></div><button class="pbtn gold wide" data-act="close">Back to the garden</button>`;
      break;
    }
    case 'fmenu': {
      h += header('Focus', 'Rescue your weak spots');
      h += `<p class="muted">A short round on the words you keep missing. Each one gets two tries: first you recognise it, then you build it yourself. Get both right and it leaves your rescue list.</p>`;
      if (!v.pool.length) h += `<div class="story">Nothing to rescue yet. Water a few plants and the words you miss show up here.</div>`;
      else {
        h += v.pool
          .map(
            (p) => `<div class="row between story"><div><b>${esc(p.es)}</b><div class="muted">${esc(p.en)}${p.c ? ` · missed ${p.c}×` : ' · weakest plant'}</div></div><button class="pbtn small" data-act="say" data-t="${esc(p.es)}">▶</button></div>`,
          )
          .join('');
        h += `<button class="pbtn gold wide" data-act="fstart">✦ Start Focus (${v.pool.length} words)</button>`;
      }
      break;
    }
    case 'focus': {
      const it = v.items[v.i];
      const c = cardById(S, it.ck);
      h += header('Focus', `${v.i + 1} of ${v.items.length}`) + bar(v.i, v.items.length);
      if (v.phase === 'mc') {
        if (c) h += picHtml(c, true);
        h += `<p class="muted center">What does it mean?</p><div class="big">${esc(it.es)}</div>${listenRow(it.es)}`;
        v.step.opts.forEach((o, i) => {
          let cl = '';
          if (v.pick !== null) cl = o === it.en ? ' good' : i === v.pick ? ' bad' : '';
          h += `<button class="opt${cl}" data-act="fpick" data-i="${i}" ${v.pick !== null ? 'disabled' : ''}>${esc(o)}</button>`;
        });
        if (v.pick !== null) h += `<button class="pbtn gold wide" data-act="fbuild">Now build it →</button>`;
      } else {
        const art = v.step.kind === 'word' && v.step.art ? ` (without the ${esc(v.step.art)})` : '';
        h += `<p class="muted center">Build it in Spanish${art}</p><div class="big en">${esc(it.en)}</div>${listenRow(it.es)}`;
        const chip = (id: number, act: string) => {
          const w = v.step.pool.find((p) => p.id === id)!.w;
          return `<button class="chip ${act === 'fun' ? v.res || '' : ''}" data-act="${act}" data-id="${id}">${esc(w)}</button>`;
        };
        h += `<div class="slot chips">${v.placed.map((id) => chip(id, 'fun')).join('')}</div>`;
        h += `<div class="chips">${v.step.pool.filter((p) => !v.placed.includes(p.id)).map((p) => chip(p.id, 'fput')).join('')}</div>`;
        if (v.res === 'bad') h += `<p class="feedback no">Answer: <b>${esc(it.es)}</b></p>`;
        if (v.res) h += pronHtml(it.es);
        h += !v.res
          ? `<div class="row"><button class="pbtn" data-act="fhint">Hint</button><button class="pbtn gold" style="flex:1" data-act="fcheck" ${v.placed.length ? '' : 'disabled'}>Check</button></div>`
          : `<button class="pbtn gold wide" data-act="fnext">${v.i + 1 < v.items.length ? 'Next word →' : 'Finish'}</button>`;
      }
      break;
    }
    case 'fdone':
      h += `<div class="center"><div class="big spark">✦</div><h2>¡Listo!</h2><p>${v.right} of ${v.total} words rescued. The ones that slipped come back next time.</p><p class="spark">+${v.xp} XP</p></div><button class="pbtn gold wide" data-act="close">Back to the garden</button>`;
      break;
    case 'info': {
      const c = v.c;
      const st = S.cards[c.id];
      const k = dayKey();
      h += header(FAMILY_NAME[c.family], st ? `${STAGE_NAME[st.box]} · ${STAGE_EN[st.box]}` : 'Not planted yet');
      h += picHtml(c) + `<div class="big">${esc(cleanEs(c.es))}</div>` + pronHtml(c.es) + listenRow(c.es) + `<div class="big en">${esc(c.en)}</div>` + mnemonic(c);
      if (st) {
        const when = st.due <= k ? 'Thirsty now: water it today 💧' : st.due === addDays(1) ? 'Next watering: tomorrow' : `Next watering: ${esc(st.due)}`;
        h += `<p class="muted center">Stage ${st.box + 1} of 9 · answered ${st.seen}× · ${when}</p>`;
        if (st.due <= k) h += `<button class="pbtn gold wide" data-act="waterone">💧 Water this one</button>`;
      }
      break;
    }
  }
  layer.innerHTML = `<div class="panel session" role="dialog" aria-label="El Jardín">${h}</div>`;
  const inp = layer.querySelector<HTMLInputElement>('#answer:not([disabled])');
  if (inp) inp.focus({ preventScroll: true });
  layer.querySelector('.panel')?.scrollTo(0, 0);
}

// ---------- actions ----------

function beginPlay(s: Session): void {
  const c = current(s)!;
  const p = prompt(state(), c, s.mode);
  view = { k: 'play', s, p, show: false, pick: null, typed: '', grade: null, over: false };
  render();
  if (s.mode === 'rtr' || s.mode === 'mc' ? p.dir === 'es' : s.mode === 'flash' && p.dir === 'es') say(c.es);
}

function advance(s: Session, r: 'again' | 'good' | 'easy'): void {
  const S = state();
  answer(S, s, r);
  commit();
  if (done(s)) {
    finish(S, s);
    commit();
    result.grew.push(...s.grew);
    result.shrank.push(...s.shrank);
    result.xp += s.xp;
    view = { k: 'fin', s };
    render();
    return;
  }
  beginPlay(s);
}

function onKey(e: KeyboardEvent): void {
  if (e.key === 'Enter' && (e.target as HTMLElement).id === 'answer') {
    e.preventDefault();
    layer?.querySelector<HTMLButtonElement>('[data-act="check"]')?.click();
  }
}

function onClick(e: Event): void {
  const target = e.target as HTMLElement;
  if (target === layer) {
    if (view.k === 'info' || view.k === 'menu' || view.k === 'fmenu') close();
    return;
  }
  const btn = target.closest<HTMLElement>('[data-act]');
  if (!btn || (btn as HTMLButtonElement).disabled) return;
  const S = state();
  const v = view;
  switch (btn.dataset.act) {
    case 'close':
      return close();
    case 'say':
      say(btn.dataset.t || '', btn.dataset.slow === '1');
      return;
    case 'acc': {
      const inp = layer!.querySelector<HTMLInputElement>('#answer');
      if (!inp) return;
      const a = inp.selectionStart ?? inp.value.length;
      const b = inp.selectionEnd ?? a;
      inp.value = inp.value.slice(0, a) + btn.dataset.t + inp.value.slice(b);
      inp.setSelectionRange(a + 1, a + 1);
      inp.focus();
      if (v.k === 'play') v.typed = inp.value;
      return;
    }
    case 'mode':
      S.testMode = btn.dataset.m as TestMode;
      commit();
      render();
      return;
    case 'start': {
      const q = waterQueue(S);
      if (!q.length) return;
      beginPlay(startSession('water', q, S.testMode));
      return;
    }
    case 'learnnext':
      if (v.k !== 'learn') return;
      if (v.i + 1 < v.seeds.length) {
        v.i++;
        render();
        say(v.seeds[v.i].es);
      } else beginPlay(startSession('plant', v.seeds, 'mc'));
      return;
    case 'reveal':
      if (v.k !== 'play') return;
      v.show = true;
      render();
      if (v.p.dir === 'en') say(current(v.s)!.es);
      return;
    case 'rate':
      if (v.k === 'play') advance(v.s, btn.dataset.r as 'again' | 'good' | 'easy');
      return;
    case 'pick': {
      if (v.k !== 'play' || v.pick !== null) return;
      v.pick = Number(btn.dataset.i);
      render();
      say(current(v.s)!.es);
      return;
    }
    case 'check': {
      if (v.k !== 'play' || v.grade !== null) return;
      const val = (layer!.querySelector<HTMLInputElement>('#answer')?.value || '').trim();
      if (!val) return toast('Type your answer first');
      v.typed = val;
      v.grade = checkTyped(current(v.s)!, v.s.mode as 'rtr' | 'rwd', val);
      render();
      say(current(v.s)!.es);
      return;
    }
    case 'over':
      if (v.k !== 'play') return;
      v.over = true;
      render();
      return;
    case 'next': {
      if (v.k !== 'play') return;
      let r: 'again' | 'good' | 'easy' = 'good';
      if (v.s.mode === 'mc') r = v.p.opts[v.pick!] === v.p.answer ? 'good' : 'again';
      else if (v.grade) r = typedRating(v.grade, v.over);
      advance(v.s, r);
      return;
    }
    case 'waterone': {
      if (v.k !== 'info') return;
      kind = 'water';
      beginPlay(startSession('water', [v.c], S.testMode));
      return;
    }
    // ---- focus ----
    case 'fstart': {
      if (v.k !== 'fmenu' || !v.pool.length) return;
      const items = v.pool.slice().sort(() => Math.random() - 0.5);
      view = { k: 'focus', items, i: 0, step: focusStep(S, items[0]), phase: 'mc', pick: null, placed: [], res: null, hints: 0, xp: 0, right: 0, mcOk: false, grew: [] };
      render();
      say(items[0].es);
      return;
    }
    case 'fpick':
      if (v.k !== 'focus' || v.pick !== null) return;
      v.pick = Number(btn.dataset.i);
      v.mcOk = v.step.opts[v.pick] === v.items[v.i].en;
      render();
      say(v.items[v.i].es);
      return;
    case 'fbuild':
      if (v.k !== 'focus') return;
      v.phase = 'build';
      render();
      return;
    case 'fput':
      if (v.k !== 'focus' || v.res) return;
      v.placed.push(Number(btn.dataset.id));
      render();
      return;
    case 'fun':
      if (v.k !== 'focus' || v.res) return;
      v.placed = v.placed.filter((x) => x !== Number(btn.dataset.id));
      render();
      return;
    case 'fhint':
      if (v.k !== 'focus' || v.res) return;
      {
        const before = v.placed.length;
        v.placed = hint(v.step, v.placed);
        if (v.placed.length > before) v.hints++;
      }
      render();
      return;
    case 'fcheck': {
      if (v.k !== 'focus' || v.res) return;
      const it = v.items[v.i];
      const got = v.placed.map((id) => v.step.pool.find((p) => p.id === id)!.w);
      const ok = eqArr(got, v.step.tokens);
      v.res = ok ? 'good' : 'bad';
      const before = S.cards[it.ck]?.box ?? 0;
      v.xp += focusResult(S, it, v.mcOk, ok, v.hints);
      if (ok) v.right++;
      if ((S.cards[it.ck]?.box ?? 0) > before) v.grew.push(it.ck);
      commit();
      render();
      say(it.es);
      return;
    }
    case 'fnext': {
      if (v.k !== 'focus') return;
      if (v.i + 1 >= v.items.length) {
        const xp = v.xp + 5;
        addXP(S, xp, 'review');
        commit();
        result.grew.push(...v.grew);
        result.xp += xp;
        view = { k: 'fdone', right: v.right, total: v.items.length, xp };
        render();
        return;
      }
      v.i++;
      v.step = focusStep(S, v.items[v.i]);
      v.phase = 'mc';
      v.pick = null;
      v.placed = [];
      v.res = null;
      v.hints = 0;
      v.mcOk = false;
      render();
      say(v.items[v.i].es);
      return;
    }
  }
}

/** For tests and debugging. */
export const _catalogSize = () => catalog(state()).length;
