/**
 * The story reader for La Biblioteca: tap any word for its meaning,
 * listen sentence by sentence, an immersion mode with no English,
 * save words to the garden, and "Ordena la historia".
 */
import { state, commit } from '../state/store';
import { speak, stopSpeaking } from '../audio/speech';
import { sfx } from '../audio/sfx';
import { pron } from '../engine/pronunciation';
import { STORIES, type Story } from '../content';
import { tokens, gloss, saveWord, finishStory, orderPuzzle, orderCheck, storyById, timesRead } from '../engine/reading';
import { shuffle } from '../engine/text';
import { shield } from './shield';
import { toast } from './toast';

interface ReadView {
  k: 'read';
  st: Story;
  imm: boolean;
  hide: boolean;
  rev: Record<number, boolean>;
  en: Record<number, boolean>;
  all: boolean;
  cur: number;
  playing: boolean;
  word: { w: string; si: number; mean: boolean } | null;
  sounds: number | null;
}
interface RecapView { k: 'recap'; st: Story; words: string[]; xp: number }
interface OrderView { k: 'order'; st: Story; sents: string[]; pool: { id: number; t: string }[]; placed: number[]; res: boolean | null }
type View = ReadView | RecapView | OrderView;

let layer: HTMLDivElement | null = null;
let view: View | null = null;
let playId = 0;

const esc = (s: string | number) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

function ensure(): HTMLDivElement {
  if (!layer) {
    layer = document.createElement('div');
    layer.className = 'ui-layer';
    layer.id = 'reader';
    layer.addEventListener('click', onClick);
    shield(layer);
    document.body.appendChild(layer);
  }
  layer.hidden = false;
  return layer;
}

export const readerOpen = (): boolean => !!layer && !layer.hidden;

function close(): void {
  stop();
  if (layer) layer.hidden = true;
  view = null;
  commit();
}

function stop(): void {
  playId++;
  stopSpeaking();
  if (view?.k === 'read') {
    view.playing = false;
    view.cur = -1;
  }
}

export function openReader(id: string): void {
  const st = storyById(id);
  if (!st) return;
  const S = state();
  view = { k: 'read', st, imm: S.imm, hide: S.imm, rev: {}, en: {}, all: false, cur: -1, playing: false, word: null, sounds: null };
  ensure();
  render();
}

/** Put a story back in order: a story you've read, or any story. */
export function openOrder(id?: string): void {
  const S = state();
  const read = STORIES.filter((s) => timesRead(S, s.id));
  const st = id ? storyById(id)! : shuffle(read.length ? read : STORIES)[0];
  const p = orderPuzzle(st);
  view = { k: 'order', st, sents: p.sents, pool: p.pool, placed: [], res: null };
  ensure();
  render();
}

const header = (eyebrow: string, title: string) =>
  `<div class="row between"><div><div class="eyebrow">${esc(eyebrow)}</div><h2>${esc(title)}</h2></div><button class="pbtn small" data-act="close">✕</button></div>`;

function sylHtml(w: string): string {
  const p = pron(w);
  return `<span class="syl">${p.syl.map((s, i) => (i === p.st && p.syl.length > 1 ? `<b>${esc(s)}</b>` : esc(s))).join('·')}</span> <span class="say">${esc(p.say)}</span>`;
}

function renderRead(v: ReadView): string {
  const S = state();
  let h = header(`${v.st.lvl} · ${v.imm ? 'Inmersión' : 'Lectura'}`, v.st.title);
  h += `<div class="row"><button class="pbtn gold" data-act="playall">${v.playing ? '■ Parar' : '▶ Escuchar todo'}</button>`;
  h += v.imm
    ? `<button class="pbtn" data-act="hide">${v.hide ? 'Show all text' : 'Hide text again'}</button>`
    : `<button class="pbtn" data-act="alltr">${v.all ? 'Hide English' : 'Show English'}</button>`;
  h += `</div>`;
  if (v.imm && v.hide) h += `<p class="muted">Listen first. Tap "Ver texto" on a sentence when you are ready to read it.</p>`;
  v.st.s.forEach(([es, en], si) => {
    const hid = v.imm && v.hide && !v.rev[si];
    const words = tokens(es)
      .map((t) => `${esc(t.pre)}<span class="w${S.saved[t.word.toLowerCase()] ? ' kn' : ''}" data-act="word" data-w="${esc(t.word)}" data-si="${si}">${esc(t.word)}</span>${esc(t.post)}`)
      .join(' ');
    const open = v.imm ? v.en[si] : v.all || v.en[si];
    h += `<div class="sent${v.cur === si ? ' cur' : ''}"><p class="${hid ? 'hidden' : ''}">${hid ? esc(es) : words}</p><div class="srow"><button class="pbtn small" data-act="splay" data-si="${si}">▶</button>`;
    h += hid
      ? `<button class="pbtn small" data-act="rev" data-si="${si}">Ver texto</button>`
      : `<button class="pbtn small" data-act="sen" data-si="${si}">${v.imm ? 'Peek English' : 'EN'}</button><button class="pbtn small" data-act="sounds" data-si="${si}">Sonidos</button>`;
    h += `</div>`;
    if (v.sounds === si && !hid) h += `<div class="story">${tokens(es).map((t) => t.word).filter(Boolean).map(sylHtml).join('<br>')}</div>`;
    if (open) h += `<div class="tr">${esc(en)} <button class="pbtn small" data-act="ssave" data-si="${si}">+ guardar</button></div>`;
    h += `</div>`;
  });
  h += `<button class="pbtn gold wide" style="margin-top:14px" data-act="finish">Terminé ✦</button>`;
  if (v.word) {
    const { w, si, mean } = v.word;
    const g = gloss(w);
    h += `<div class="wordcard"><div class="row between"><h3>${esc(w)}</h3><button class="pbtn small" data-act="wclose">✕</button></div><p>${sylHtml(w)}</p>`;
    if (v.imm && !mean) h += `<p class="muted">Look at the sentence around it first. What do you think it means?</p><div class="row"><button class="pbtn gold" data-act="sayw">▶ Oír</button><button class="pbtn" data-act="wmean">Show meaning</button></div>`;
    else {
      h += g ? `<p class="big en" style="text-align:left;margin:4px 0">${esc(g)}</p>` : `<p class="muted">No meaning for this one yet. The whole sentence: ${esc(v.st.s[si][1])}</p>`;
      h += `<div class="row"><button class="pbtn gold" data-act="sayw">▶ Oír</button>${g ? `<button class="pbtn" data-act="savew">${S.saved[w.toLowerCase()] ? 'Saved ✓' : '+ Save to my garden'}</button>` : ''}</div>`;
    }
    h += `</div>`;
  }
  return h;
}

function render(): void {
  if (!layer || !view) return;
  let h = '';
  const v = view;
  if (v.k === 'read') h = renderRead(v);
  else if (v.k === 'recap') {
    h += header('¡Terminé!', v.st.title) + `<div class="center"><div class="big spark">✦</div><p class="spark">+${v.xp} XP</p></div>`;
    if (v.words.length) {
      h += `<h3>Palabras para quedarte</h3><p class="muted">${v.words.length} words from this story you haven't saved yet. Add them and they grow in your garden.</p>`;
      h += v.words.map((w) => `<div class="row between story"><div><b>${esc(w)}</b><div class="muted">${esc(gloss(w) || '')}</div></div><button class="pbtn small" data-act="sayword" data-t="${esc(w)}">▶</button></div>`).join('');
      h += `<button class="pbtn gold wide" data-act="recapadd">🌱 Add them to my garden</button>`;
    }
    h += `<div class="row" style="margin-top:8px"><button class="pbtn" style="flex:1" data-act="order">Ordena la historia</button><button class="pbtn" style="flex:1" data-act="close">Back to the shelf</button></div>`;
  } else {
    h += header('Ordena la historia', v.st.title) + `<p class="muted">Tap the sentences in the order they happen in the story.</p>`;
    h += `<div class="slot order">${v.placed
      .map((id, n) => `<button class="chip ${v.res === null ? '' : v.placed[n] === n ? 'good' : 'bad'}" data-act="unplace" data-id="${id}">${n + 1}. ${esc(v.pool.find((p) => p.id === id)!.t)}</button>`)
      .join('')}</div>`;
    h += `<div class="order">${v.pool.filter((p) => !v.placed.includes(p.id)).map((p) => `<button class="chip" data-act="place" data-id="${p.id}">${esc(p.t)}</button>`).join('')}</div>`;
    if (v.res === null) h += `<button class="pbtn gold wide" data-act="ocheck" ${v.placed.length === v.sents.length ? '' : 'disabled'}>Comprobar</button>`;
    else {
      h += v.res ? `<p class="feedback ok">✓ ¡Perfecto! +5 XP</p>` : `<p class="feedback no">Not quite. The right order:</p><div class="story">${v.sents.map((s, i) => `${i + 1}. ${esc(s)}`).join('<br>')}</div>`;
      h += `<div class="row"><button class="pbtn gold" style="flex:1" data-act="order">Another</button><button class="pbtn" style="flex:1" data-act="close">Back to the shelf</button></div>`;
    }
  }
  const scroll = layer.querySelector('.panel')?.scrollTop ?? 0;
  layer.innerHTML = `<div class="panel session" role="dialog" aria-label="La Biblioteca">${h}</div>`;
  const panel = layer.querySelector('.panel');
  if (panel && v.k === 'read') panel.scrollTop = scroll;
}

function playFrom(i: number, id: number): void {
  const v = view;
  if (!v || v.k !== 'read' || id !== playId) return;
  if (i >= v.st.s.length) {
    v.playing = false;
    v.cur = -1;
    render();
    return;
  }
  v.cur = i;
  render();
  speak(v.st.s[i][0], state(), { onend: () => setTimeout(() => playFrom(i + 1, id), 250) });
}

function onClick(e: Event): void {
  const target = e.target as HTMLElement;
  if (target === layer) return close();
  const btn = target.closest<HTMLElement>('[data-act]');
  if (!btn || (btn as HTMLButtonElement).disabled) return;
  const S = state();
  const v = view;
  if (!v) return;
  const si = Number(btn.dataset.si);
  switch (btn.dataset.act) {
    case 'close':
      return close();
    case 'sayword':
      speak(btn.dataset.t || '', S);
      return;
    case 'order':
      stop();
      return openOrder(v.st.id);
  }
  if (v.k === 'read') {
    switch (btn.dataset.act) {
      case 'playall':
        if (v.playing) {
          stop();
          render();
          return;
        }
        stop();
        v.playing = true;
        playFrom(0, ++playId);
        return;
      case 'hide':
        v.hide = !v.hide;
        v.rev = {};
        break;
      case 'alltr':
        v.all = !v.all;
        break;
      case 'splay':
        stop();
        speak(v.st.s[si][0], S);
        return;
      case 'rev':
        v.rev[si] = true;
        break;
      case 'sen':
        v.en[si] = !v.en[si];
        break;
      case 'sounds':
        v.sounds = v.sounds === si ? null : si;
        break;
      case 'ssave': {
        const [es, en] = v.st.s[si];
        if (saveWord(S, es, en)) {
          sfx('plant');
          toast('Phrase saved to your garden 🌱');
        }
        commit();
        break;
      }
      case 'word':
        v.word = { w: btn.dataset.w || '', si, mean: false };
        speak(v.word.w, S);
        break;
      case 'wclose':
        v.word = null;
        break;
      case 'wmean':
        if (v.word) v.word.mean = true;
        break;
      case 'sayw':
        if (v.word) speak(v.word.w, S);
        return;
      case 'savew': {
        if (!v.word) return;
        const g = gloss(v.word.w);
        if (g && saveWord(S, v.word.w, g)) {
          sfx('plant');
          toast('Saved to your garden 🌱');
        }
        commit();
        break;
      }
      case 'finish': {
        stop();
        const r = finishStory(S, v.st);
        commit();
        sfx('done');
        view = { k: 'recap', st: v.st, words: r.recap, xp: r.xp };
        break;
      }
    }
  } else if (v.k === 'recap') {
    if (btn.dataset.act === 'recapadd') {
      v.words.forEach((w) => saveWord(S, w, gloss(w) || ''));
      commit();
      sfx('plant');
      toast('Added to your garden 🌱');
      v.words = [];
    }
  } else if (v.k === 'order') {
    switch (btn.dataset.act) {
      case 'place':
        if (v.res !== null) return;
        v.placed.push(Number(btn.dataset.id));
        sfx('tap');
        break;
      case 'unplace':
        if (v.res !== null) return;
        v.placed = v.placed.filter((x) => x !== Number(btn.dataset.id));
        break;
      case 'ocheck':
        v.res = orderCheck(S, v.placed);
        commit();
        sfx(v.res ? 'good' : 'bad');
        break;
    }
  }
  render();
}
