/**
 * La Isla de Inmersión: a timed, Spanish-only session (ported from the
 * prototype's Inmersión total). Every screen here is in Spanish on purpose.
 */
import { state, commit } from '../state/store';
import { speak, stopSpeaking } from '../audio/speech';
import { sfx } from '../audio/sfx';
import { makeItem, audioOf, pickOk, dictation, writing, speakingOk, newSession, score, finishSession, wc, KIND_NAME, type Item, type ImmSession } from '../engine/immersion';
import type { Grade } from '../engine/grading';
import { shield } from './shield';
import { toast } from './toast';

interface Cur {
  it: Item;
  ans: number | null;
  ok: boolean | null;
  help: boolean;
  placed: number[];
  typed: string;
  heard: string;
  rec: boolean;
  err: string;
  grade: Grade | null;
  wres: { words: number; conn: string[] } | null;
  spoke: boolean;
  ores: boolean | null;
}

let layer: HTMLDivElement | null = null;
let stage: 'menu' | 'play' | 'end' = 'menu';
let mins = 10;
let ses: ImmSession | null = null;
let cur: Cur | null = null;
let over = false;
let timer: ReturnType<typeof setInterval> | null = null;
let endRes: ReturnType<typeof finishSession> | null = null;

const esc = (s: string | number) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
type SRCtor = new () => { lang: string; interimResults: boolean; onresult: (e: { results: { 0: { 0: { transcript: string } } } }) => void; onerror: (e: { error?: string }) => void; onend: () => void; start: () => void };
const SR: SRCtor | undefined =
  typeof window !== 'undefined' ? ((window as unknown as { SpeechRecognition?: SRCtor; webkitSpeechRecognition?: SRCtor }).SpeechRecognition ?? (window as unknown as { webkitSpeechRecognition?: SRCtor }).webkitSpeechRecognition) : undefined;

export const islaPlaying = (): boolean => stage === 'play';

export function openIsla(): void {
  if (!layer) {
    layer = document.createElement('div');
    layer.className = 'ui-layer sheet tall';
    layer.id = 'isla';
    layer.addEventListener('click', onClick);
    layer.addEventListener('pointerdown', (e) => {
      if ((e.target as HTMLElement).closest('.accents button')) e.preventDefault();
    });
    shield(layer);
    document.body.appendChild(layer);
  }
  layer.hidden = false;
  stage = 'menu';
  render();
}

export function closeIsla(): void {
  stopSpeaking();
  if (timer) clearInterval(timer);
  timer = null;
  if (layer) layer.hidden = true;
}

const say = (t: string, slow = false) => speak(t, state(), { slow });

function prep(): void {
  cur = { it: makeItem(ses!.n), ans: null, ok: null, help: false, placed: [], typed: '', heard: '', rec: false, err: '', grade: null, wres: null, spoke: false, ores: null };
}

function tick(): void {
  if (!ses || stage !== 'play') return;
  const rem = Math.max(0, ses.endAt - Date.now());
  const el = layer?.querySelector('#imtimer');
  if (el) el.textContent = Math.floor(rem / 60000) + ':' + String(Math.floor((rem % 60000) / 1000)).padStart(2, '0');
  if (rem === 0 && !over) {
    over = true;
    render();
  }
}

function finish(): void {
  if (!ses) return;
  if (timer) clearInterval(timer);
  timer = null;
  stopSpeaking();
  endRes = finishSession(state(), ses);
  commit();
  sfx('done');
  stage = 'end';
  toast(`+${endRes.xp} XP ✦`);
  render();
}

const accents = () =>
  `<div class="accents">${['á', 'é', 'í', 'ó', 'ú', 'ñ', 'ü', '¿', '¡'].map((a) => `<button type="button" data-act="acc" data-t="${a}">${a}</button>`).join('')}</div>`;

function render(): void {
  if (!layer) return;
  const S = state();
  let h = '';
  if (stage === 'menu') {
    const d = S.immData;
    h += `<div class="eyebrow">Inmersión total</div><h2>Solo español</h2><p class="muted">Un bloque corto e intenso. Todo está en español: escuchas, lees, hablas y escribes. Sin inglés.</p>`;
    h += `<div class="story"><b>1.</b> Todo está en español.<br><b>2.</b> Usa Ayuda solo si lo necesitas. La app cuenta cuántas veces la usas.<br><b>3.</b> Habla en voz alta. No pienses en inglés.<br><b>4.</b> Escribe también a mano si puedes.</div>`;
    h += `<p class="muted">¿Cuánto tiempo?</p><div class="row">${[10, 20, 30].map((m) => `<button class="pbtn${mins === m ? ' on' : ''}" data-act="dur" data-m="${m}">${m} minutos</button>`).join('')}</div>`;
    h += `<button class="pbtn gold wide" style="margin-top:12px" data-act="start">Empezar</button>`;
    if (d.sess) h += `<p class="muted">Hasta ahora: ${d.min} minutos en ${d.sess} sesiones.</p>`;
  } else if (stage === 'end' && endRes) {
    const e = endRes;
    h += `<div class="center"><div class="big spark">✦</div><h2>Sesión completa</h2><p>${e.min} ${e.min === 1 ? 'minuto' : 'minutos'} solo en español.</p><p class="muted">Respuestas correctas: ${e.right} de ${e.total}. Usaste la ayuda ${e.help} ${e.help === 1 ? 'vez' : 'veces'}.</p><p class="spark">+${e.xp} XP</p></div>`;
    h += `<div class="row"><button class="pbtn gold" style="flex:1" data-act="start">Otra sesión</button><button class="pbtn" style="flex:1" data-act="menu">Salir</button></div>`;
  } else if (cur && ses) {
    const c = cur;
    const it = c.it;
    h += `<div class="row between"><span class="timer" id="imtimer">0:00</span><span class="pill">${esc(KIND_NAME[it.k])}</span><button class="pbtn small" data-act="end">Terminar</button></div>`;
    if (over) h += `<p class="feedback no center">¡Se acabó el tiempo! Termina esta actividad.</p>`;
    const helpBtn = c.help || !it.en ? '' : `<button class="pbtn small" data-act="help">Ayuda</button>`;
    const helpTxt = c.help && it.en ? `<p class="muted center">${esc(it.en)}</p>` : '';
    const listen = (slow = true) =>
      `<div class="row center"><button class="pbtn gold" data-act="play">▶ Escuchar</button>${slow ? `<button class="pbtn" data-act="play" data-slow="1">Más lento</button>` : ''}${helpBtn}</div>${helpTxt}`;
    const opt = (label: string, i: number, right: boolean) => {
      let cl = '';
      if (c.ans !== null) cl = right ? ' good' : i === c.ans ? ' bad' : '';
      return `<button class="opt${cl}" data-act="pick" data-i="${i}" ${c.ans !== null ? 'disabled' : ''}>${esc(label)}</button>`;
    };
    if (it.k === 'img') {
      h += `<p class="muted center">¿Qué es?</p><img class="pic sm" alt="" src="pics/${esc(it.w!.id)}.jpg">${listen(false)}`;
      it.wOpts!.forEach((o, i) => (h += opt((o.art ? o.art + ' ' : '') + o.es, i, o.id === it.w!.id)));
    } else if (it.k === 'oye') {
      h += `<p class="muted center">Escucha. ¿Qué oíste?</p>${listen()}`;
      it.lOpts!.forEach((o, i) => (h += opt(o.es, i, o.es === it.line!.es)));
    } else if (it.k === 'dial') {
      h += `<p class="muted center">Responde.</p><div class="bub">${esc(it.a![1])} <button class="pbtn small" data-act="play">▶</button> ${helpBtn}</div>${helpTxt}`;
      it.dOpts!.forEach((o, i) => (h += opt(o[1], i, o[1] === it.b![1])));
    } else if (it.k === 'dicta') {
      h += `<p class="muted center">Escucha y escribe lo que oyes.</p>${listen()}`;
      h += `<input class="pinput" id="isin" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="Escribe aquí" value="${esc(c.typed)}" ${c.grade ? 'disabled' : ''}>`;
      if (!c.grade) h += accents();
      else h += `<p class="feedback ${c.grade === 'bad' ? 'no' : 'ok'}">${c.grade === 'good' ? '✓ ¡Muy bien!' : c.grade === 'accent' ? '✓ Casi perfecto. Cuidado con el acento:' : c.grade === 'close' ? '✓ Casi. Revisa la ortografía:' : 'Respuesta:'} <b>${esc(it.line!.es)}</b></p>`;
    } else if (it.k === 'orden') {
      h += `<p class="muted center">Ordena la historia: <b>${esc(it.title!)}</b></p>`;
      if (!c.help) h += `<div class="row center"><button class="pbtn small" data-act="help">Ayuda</button></div>`;
      else h += `<p class="muted center">La primera oración: ${esc(it.sents![0])}</p>`;
      h += `<div class="slot order">${c.placed.map((id, n) => `<button class="chip ${c.ores === null ? '' : id === n ? 'good' : 'bad'}" data-act="unplace" data-id="${id}">${n + 1}. ${esc(it.sents![id])}</button>`).join('')}</div>`;
      h += `<div class="order">${it.pool!.filter((p) => !c.placed.includes(p.id)).map((p) => `<button class="chip" data-act="place" data-id="${p.id}">${esc(p.t)}</button>`).join('')}</div>`;
      if (c.ores === false) h += `<p class="feedback no">Orden correcto:</p><div class="story">${it.sents!.map((s, n) => `${n + 1}. ${esc(s)}`).join('<br>')}</div>`;
    } else if (it.k === 'habla') {
      h += `<p class="muted center">Habla en voz alta. Contesta con dos o tres oraciones.</p><div class="big">${esc(it.q![0])}</div>${listen(false)}`;
      if (!c.spoke) {
        if (SR) h += `<button class="pbtn gold wide" data-act="mic">${c.rec ? 'Te escucho…' : '● Hablar'}</button>`;
        if (c.err) h += `<p class="muted">No pude usar el micrófono (${esc(c.err)}). Contesta en voz alta y toca el botón.</p>`;
        h += `<button class="pbtn wide" style="margin-top:8px" data-act="spoke">Ya contesté en voz alta</button>`;
      } else {
        h += c.heard ? `<p class="muted">Escuché: ${esc(c.heard)}</p><p>${wc(c.heard)} palabras. ${speakingOk(c.heard) ? '¡Muy bien!' : 'Intenta decir más.'}</p>` : `<p>¡Muy bien!</p>`;
        h += `<div class="story"><b class="spark">Ejemplo</b><br>${esc(it.q![1])} <button class="pbtn small" data-act="example">▶</button></div>`;
      }
    } else {
      h += `<p class="muted center">Escribe. Contesta con dos o tres oraciones.</p><div class="big">${esc(it.q![0])}</div>${listen(false)}`;
      h += `<textarea class="pinput" id="isin" rows="4" autocomplete="off" autocapitalize="sentences" spellcheck="false" placeholder="Escribe aquí" ${c.wres ? 'disabled' : ''}>${esc(c.typed)}</textarea>`;
      if (!c.wres) h += accents() + `<p class="muted">Si puedes, escríbelo también a mano en un cuaderno.</p>`;
      else
        h += `<p>Escribiste <b>${c.wres.words}</b> palabras. ${c.wres.conn.length ? `Usaste: <b>${esc(c.wres.conn.join(', '))}</b>.` : 'Prueba con porque, pero, también o además.'}</p><div class="story"><b class="spark">Ejemplo</b><br>${esc(it.q![1])} <button class="pbtn small" data-act="example">▶</button></div>`;
    }
    const answered = c.ans !== null || c.grade !== null || c.ores !== null || c.spoke || c.wres !== null;
    if (!answered && (it.k === 'dicta' || it.k === 'escribe')) h += `<button class="pbtn gold wide" data-act="check">Comprobar</button>`;
    else if (!answered && it.k === 'orden') h += `<button class="pbtn gold wide" data-act="check" ${c.placed.length === it.sents!.length ? '' : 'disabled'}>Comprobar</button>`;
    else if (answered) h += `<button class="pbtn gold wide" data-act="next">Siguiente →</button>`;
  }
  layer.innerHTML = `<div class="panel" role="dialog" aria-label="La Isla de Inmersión">${h}</div>`;
  tick();
}

function onClick(e: Event): void {
  const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-act]');
  if (!btn || (btn as HTMLButtonElement).disabled) return;
  const S = state();
  const act = btn.dataset.act;
  if (act === 'dur') {
    mins = Number(btn.dataset.m);
    return render();
  }
  if (act === 'start') {
    ses = newSession(mins);
    over = false;
    stage = 'play';
    prep();
    if (timer) clearInterval(timer);
    timer = setInterval(tick, 1000);
    render();
    say(audioOf(cur!.it));
    return;
  }
  if (act === 'menu') {
    stage = 'menu';
    return render();
  }
  if (stage !== 'play' || !cur || !ses) return;
  const c = cur;
  const it = c.it;
  switch (act) {
    case 'end':
      return finish();
    case 'help':
      if (!c.help) {
        c.help = true;
        ses.helpN++;
      }
      break;
    case 'play':
      say(audioOf(it), btn.dataset.slow === '1');
      return;
    case 'example':
      say(it.q![1]);
      return;
    case 'acc': {
      const inp = layer!.querySelector<HTMLInputElement | HTMLTextAreaElement>('#isin');
      if (!inp) return;
      const a = inp.selectionStart ?? inp.value.length;
      const b = inp.selectionEnd ?? a;
      inp.value = inp.value.slice(0, a) + btn.dataset.t + inp.value.slice(b);
      inp.setSelectionRange(a + 1, a + 1);
      inp.focus();
      c.typed = inp.value;
      return;
    }
    case 'pick': {
      if (c.ans !== null) return;
      c.ans = Number(btn.dataset.i);
      c.ok = pickOk(it, c.ans);
      score(S, ses, c.ok);
      sfx(c.ok ? 'good' : 'bad');
      say(it.k === 'img' ? it.w!.es : it.k === 'oye' ? it.line!.es : it.b![1]);
      break;
    }
    case 'place':
      if (c.ores !== null) return;
      c.placed.push(Number(btn.dataset.id));
      break;
    case 'unplace':
      if (c.ores !== null) return;
      c.placed = c.placed.filter((x) => x !== Number(btn.dataset.id));
      break;
    case 'check': {
      const v = (layer!.querySelector<HTMLInputElement | HTMLTextAreaElement>('#isin')?.value || '').trim();
      if (it.k === 'orden') {
        c.ores = c.placed.every((id, n) => id === n);
        score(S, ses, c.ores);
        sfx(c.ores ? 'good' : 'bad');
      } else {
        if (!v) return toast('Escribe algo primero');
        c.typed = v;
        if (it.k === 'dicta') {
          c.grade = dictation(it, v);
          score(S, ses, c.grade !== 'bad');
          sfx(c.grade !== 'bad' ? 'good' : 'bad');
          say(it.line!.es);
        } else {
          const w = writing(v);
          c.wres = w;
          score(S, ses, w.ok);
          sfx('sparkle');
        }
      }
      break;
    }
    case 'spoke':
      if (c.spoke) return;
      c.spoke = true;
      score(S, ses, true);
      sfx('good');
      break;
    case 'mic': {
      if (!SR || c.rec) return;
      try {
        const r = new SR();
        r.lang = S.accent === 'co' ? 'es-CO' : 'es-MX';
        r.interimResults = false;
        c.rec = true;
        c.err = '';
        r.onresult = (ev) => {
          c.heard = ev.results[0][0].transcript;
          c.spoke = true;
        };
        r.onerror = (ev) => {
          c.err = ev.error || 'error';
        };
        r.onend = () => {
          c.rec = false;
          if (c.spoke) score(S, ses!, speakingOk(c.heard));
          if (cur === c) render();
        };
        r.start();
      } catch {
        c.rec = false;
        c.err = 'no disponible';
      }
      break;
    }
    case 'next':
      stopSpeaking();
      commit();
      if (over) return finish();
      ses.n++;
      prep();
      render();
      say(audioOf(cur!.it));
      return;
  }
  render();
}

// for automated tests
if (typeof window !== 'undefined') Object.assign(window, { __isla: () => ({ stage, it: cur?.it }) });
