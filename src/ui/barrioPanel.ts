/** El Barrio's sheet: conversations with people on the street (the prototype's dialogues). */
import { state, commit } from '../state/store';
import { speak, stopSpeaking } from '../audio/speech';
import { sfx } from '../audio/sfx';
import { PLACES, dlgById, myTurns, makeTurn, buildOk, hint, scoreTurn, finishTalk, placeDone, type Place, type Turn } from '../engine/barrio';
import { wc } from '../engine/immersion';
import type { Dialogue } from '../content';
import type { BarrioScene } from '../scenes/BarrioScene';
import { shield } from './shield';
import { toast } from './toast';

type SRCtor = new () => { lang: string; interimResults: boolean; onresult: (e: { results: { 0: { 0: { transcript: string } } } }) => void; onerror: (e: { error?: string }) => void; onend: () => void; start: () => void };
const SR: SRCtor | undefined =
  typeof window !== 'undefined' ? ((window as unknown as { SpeechRecognition?: SRCtor }).SpeechRecognition ?? (window as unknown as { webkitSpeechRecognition?: SRCtor }).webkitSpeechRecognition) : undefined;

interface Play {
  d: Dialogue;
  k: number;
  t: Turn;
  placed: number[];
  pick: number | null;
  res: boolean | null;
  hints: number;
  show: boolean;
  log: [string, string, string][];
  right: number;
  xp: number;
  en: Record<number, boolean>;
}

let layer: HTMLDivElement | null = null;
let scene: BarrioScene | null = null;
let stage: 'idle' | 'place' | 'play' | 'end' | 'speak' = 'idle';
let place: Place | null = null;
let P: Play | null = null;
let mode: 'choose' | 'build' = 'choose';
let listenFirst = false;
let lastXP = 0;
let heard: Record<number, string> = {};
let recOn: number | null = null;

const esc = (s: string | number) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const say = (t: string, slow = false) => speak(t, state(), { slow });

export const barrioTalking = (): boolean => stage !== 'idle';

export function openBarrio(s: BarrioScene, p?: Place): void {
  scene = s;
  if (!layer) {
    layer = document.createElement('div');
    layer.className = 'ui-layer sheet';
    layer.id = 'barrio';
    layer.addEventListener('click', onClick);
    shield(layer);
    document.body.appendChild(layer);
  }
  layer.hidden = false;
  if (p) {
    place = p;
    if (p.dlgs.length === 1) start(dlgById(p.dlgs[0]));
    else {
      stage = 'place';
      render();
    }
  } else {
    stage = 'idle';
    render();
  }
}

export function closeBarrio(): void {
  stopSpeaking();
  if (layer) layer.hidden = true;
  scene = null;
  stage = 'idle';
}

function start(d: Dialogue): void {
  P = { d, k: 0, t: makeTurn(d, 0), placed: [], pick: null, res: null, hints: 0, show: !listenFirst, log: [], right: 0, xp: 0, en: {} };
  // lines before your first reply
  const first = myTurns(d)[0];
  for (let i = 0; i < first - 1; i++) P.log.push(d.turns[i]);
  stage = 'play';
  render();
  if (P.t.a) say(P.t.a[1]);
}

const bubble = (t: [string, string, string], i: number, showEn: boolean) =>
  `<div class="bub ${t[0] === 'A' ? 'a' : 'b'}"><div class="who">${t[0] === 'A' ? esc(place?.who || 'Ellos') : 'Tú'}</div><div>${esc(t[1])}</div>${showEn ? `<div class="muted">${esc(t[2])}</div>` : ''}<div class="srow"><button class="pbtn small" data-act="say" data-t="${esc(t[1])}">▶</button><button class="pbtn small" data-act="en" data-i="${i}">EN</button></div></div>`;

function render(): void {
  if (!layer) return;
  const S = state();
  let h = '';
  if (stage === 'idle') {
    h += `<div class="eyebrow">El Barrio</div><h2>Tu barrio</h2><p class="muted">Walk down the street (tap the ground) and tap someone to talk. Each person has a conversation for you: you hear their line, then give your reply.</p>`;
    h += PLACES.map((p) => `<button class="task${placeDone(S, p) ? ' on' : ''}" data-act="goto" data-id="${p.id}"><span class="dot">${placeDone(S, p) ? '✓' : '!'}</span><span>${esc(p.name)} · ${esc(p.who)}<small>${p.dlgs.map((id) => esc(dlgById(id).t)).join(' · ')}</small></span></button>`).join('');
  } else if (stage === 'place' && place) {
    h += `<div class="row between"><div><div class="eyebrow">${esc(place.name)}</div><h2>${esc(place.who)}</h2></div><button class="pbtn small" data-act="idle">✕</button></div>`;
    h += place.dlgs.map((id) => {
      const d = dlgById(id);
      const n = S.barrio.talks[id] || 0;
      return `<button class="task${n ? ' on' : ''}" data-act="start" data-id="${id}"><span class="dot">${n ? '✓' : d.lvl}</span><span>${esc(d.t)}<small>Level ${d.lvl} · ${myTurns(d).length} replies${n ? ` · done ${n}×` : ''}</small></span></button>`;
    }).join('');
  } else if (stage === 'play' && P) {
    h += `<div class="row between"><span class="muted">${esc(P.d.t)} · ${P.k + 1}/${myTurns(P.d).length}</span><div class="row"><button class="pbtn small${mode === 'choose' ? ' on' : ''}" data-act="mode" data-m="choose">Elegir</button><button class="pbtn small${mode === 'build' ? ' on' : ''}" data-act="mode" data-m="build">Armar</button><button class="pbtn small${listenFirst ? ' on' : ''}" data-act="listen1">🎧</button><button class="pbtn small" data-act="idle">✕</button></div></div>`;
    h += P.log.map((t, i) => bubble(t, i, !!P!.en[i])).join('');
    const t = P.t;
    if (t.a) {
      if (!P.show && P.res === null) h += `<div class="bub a"><div class="who">${esc(place?.who || '')}</div><div class="muted">🎧 Listen, then reply</div><div class="srow"><button class="pbtn small" data-act="say" data-t="${esc(t.a[1])}">▶</button><button class="pbtn small" data-act="say" data-slow="1" data-t="${esc(t.a[1])}">Lento</button><button class="pbtn small" data-act="showa">Ver texto</button></div></div>`;
      else h += bubble(t.a, 1000, !!P.en[1000]);
    }
    h += `<p class="muted center">Your reply, in Spanish:</p><div class="big en">${esc(t.b[2])}</div>`;
    if (mode === 'choose') {
      h += t.opts.map((o, i) => `<button class="opt${P!.pick !== null ? (o === t.b[1] ? ' good' : i === P!.pick ? ' bad' : '') : ''}" data-act="pick" data-i="${i}" ${P!.pick !== null ? 'disabled' : ''}>${esc(o)}</button>`).join('');
    } else {
      const chip = (id: number, act: string, cls = '') => `<button class="chip ${cls}" data-act="${act}" data-id="${id}">${esc(t.pool.find((p) => p.id === id)!.w)}</button>`;
      h += `<div class="slot chips">${P.placed.map((id) => chip(id, 'un', P!.res === null ? '' : P!.res ? 'good' : 'bad')).join('')}</div><div class="chips">${t.pool.filter((p) => !P!.placed.includes(p.id)).map((p) => chip(p.id, 'put')).join('')}</div>`;
      if (P.res === null) h += `<div class="row"><button class="pbtn" data-act="hint">Hint</button><button class="pbtn gold" style="flex:1" data-act="check" ${P.placed.length ? '' : 'disabled'}>Check</button></div>`;
    }
    if (P.res === false) h += `<p class="feedback no">Answer: <b>${esc(t.b[1])}</b></p>`;
    if (P.res !== null) h += `<button class="pbtn gold wide" data-act="next">${P.k + 1 < myTurns(P.d).length ? 'Next →' : 'Finish'}</button>`;
  } else if (stage === 'end' && P) {
    h += `<div class="center"><div class="big spark">✦</div><h2>Conversación completa</h2><p class="muted">${P.right} of ${myTurns(P.d).length} replies right.</p><p class="spark">+${lastXP} XP</p></div>`;
    h += `<div class="row"><button class="pbtn gold" style="flex:1" data-act="speak">🎙 Say your lines</button><button class="pbtn" style="flex:1" data-act="idle">Back to the street</button></div>`;
  } else if (stage === 'speak' && P) {
    h += `<div class="row between"><div><div class="eyebrow">Hablar</div><h2>Say your lines out loud</h2></div><button class="pbtn small" data-act="idle">✕</button></div><p class="muted">Listen, then say each line. ${SR ? 'Tap 🎙 to check with the phone.' : 'Say it out loud; your phone cannot listen here.'}</p>`;
    h += myTurns(P.d).map((j, i) => {
      const t = P!.d.turns[j];
      return `<div class="bub b"><div>${esc(t[1])}</div><div class="muted">${esc(t[2])}</div><div class="srow"><button class="pbtn small" data-act="say" data-t="${esc(t[1])}">▶</button>${SR ? `<button class="pbtn small${recOn === i ? ' on' : ''}" data-act="mic" data-i="${i}">${recOn === i ? 'Te escucho…' : '🎙'}</button>` : ''}</div>${heard[i] ? `<p class="muted">Escuché: ${esc(heard[i])} · ${wc(heard[i])} palabras</p>` : ''}</div>`;
    }).join('');
  }
  layer.innerHTML = `<div class="panel" role="dialog" aria-label="El Barrio">${h}</div>`;
  const panel = layer.querySelector('.panel');
  if (panel && stage === 'play') panel.scrollTop = panel.scrollHeight;
}

function onClick(e: Event): void {
  const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-act]');
  if (!btn || (btn as HTMLButtonElement).disabled) return;
  const S = state();
  switch (btn.dataset.act) {
    case 'say':
      say(btn.dataset.t || '', btn.dataset.slow === '1');
      return;
    case 'idle':
      stopSpeaking();
      stage = 'idle';
      P = null;
      return render();
    case 'goto': {
      const p = PLACES.find((x) => x.id === btn.dataset.id)!;
      const i = PLACES.indexOf(p);
      stage = 'idle';
      void scene?.walkTo(20 + i * 76 + 8).then(() => scene && openBarrio(scene, p));
      return;
    }
    case 'start':
      return start(dlgById(btn.dataset.id!));
    case 'mode':
      mode = btn.dataset.m as 'choose' | 'build';
      break;
    case 'listen1':
      listenFirst = !listenFirst;
      if (P && P.res === null) P.show = !listenFirst;
      break;
    case 'speak':
      heard = {};
      stage = 'speak';
      break;
    case 'mic': {
      if (!SR || recOn !== null || !P) return;
      const i = Number(btn.dataset.i);
      try {
        const r = new SR();
        r.lang = S.accent === 'co' ? 'es-CO' : 'es-MX';
        r.interimResults = false;
        recOn = i;
        r.onresult = (ev) => (heard[i] = ev.results[0][0].transcript);
        r.onerror = () => {};
        r.onend = () => {
          recOn = null;
          render();
        };
        r.start();
      } catch {
        recOn = null;
        toast('The microphone is not available here');
      }
      break;
    }
  }
  if (!P) return render();
  const t = P.t;
  switch (btn.dataset.act) {
    case 'en': {
      const i = Number(btn.dataset.i);
      P.en[i] = !P.en[i];
      break;
    }
    case 'showa':
      P.show = true;
      break;
    case 'pick': {
      if (P.pick !== null) return;
      P.pick = Number(btn.dataset.i);
      P.res = t.opts[P.pick] === t.b[1];
      done(P.res);
      break;
    }
    case 'put':
      if (P.res !== null) return;
      P.placed.push(Number(btn.dataset.id));
      sfx('tap');
      break;
    case 'un':
      if (P.res !== null) return;
      P.placed = P.placed.filter((x) => x !== Number(btn.dataset.id));
      break;
    case 'hint':
      if (P.res !== null) return;
      {
        const n = P.placed.length;
        P.placed = hint(t, P.placed);
        if (P.placed.length > n) P.hints++;
      }
      break;
    case 'check':
      if (P.res !== null) return;
      P.res = buildOk(t, P.placed);
      done(P.res);
      break;
    case 'next': {
      const turns = myTurns(P.d);
      if (t.a) P.log.push(t.a);
      P.log.push(t.b);
      if (P.k + 1 >= turns.length) {
        // any closing lines from the other person
        for (let i = turns[turns.length - 1] + 1; i < P.d.turns.length; i++) P.log.push(P.d.turns[i]);
        lastXP = finishTalk(S, P.d, P.xp);
        commit();
        sfx('done');
        toast(`+${lastXP} XP ✦`);
        stage = 'end';
        break;
      }
      P.k++;
      P.t = makeTurn(P.d, P.k);
      // lines between your replies
      const prev = turns[P.k - 1];
      const cur = turns[P.k];
      for (let i = prev + 1; i < cur - 1; i++) P.log.push(P.d.turns[i]);
      Object.assign(P, { placed: [], pick: null, res: null, hints: 0, show: !listenFirst });
      if (P.t.a) say(P.t.a[1]);
      break;
    }
  }
  render();
}

function done(ok: boolean): void {
  if (!P) return;
  const S = state();
  P.xp += scoreTurn(S, ok, mode, P.hints);
  if (ok) P.right++;
  commit();
  sfx(ok ? 'good' : 'bad');
  say(P.t.b[1]);
}

// for automated tests
if (typeof window !== 'undefined') Object.assign(window, { __barrio: () => ({ stage, P }) });
