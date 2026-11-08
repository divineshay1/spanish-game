/**
 * La Clínica's task sheet (DOM), ported from the prototype's clinic game.
 * It drives the ClinicaScene: room, patient, poses, hearts.
 */
import { state, commit } from '../state/store';
import { speak, stopSpeaking } from '../audio/speech';
import { sfx } from '../audio/sfx';
import { IMG } from '../content';
import {
  CL_STEPS, MONTHS_ES, makePatient, makeTask, checkinOk, symOk, judge, topicsFor, newShift, endPatient, endShift,
  poseFor, voicePitch, type Patient, type Task, type Shift, type CheckinPick, type SymPick,
} from '../engine/clinic';
import type { ClinicaScene } from '../scenes/ClinicaScene';
import { shield } from './shield';
import { toast } from './toast';

interface Play {
  p: Patient;
  hearts: number;
  ti: number;
  t: Task;
  show: boolean;
  helped: boolean;
  done: boolean;
  ok: boolean;
  note: string;
  tool: boolean;
  pick: CheckinPick & SymPick & { v?: number | string };
}

let layer: HTMLDivElement | null = null;
let scene: ClinicaScene | null = null;
let stage: 'menu' | 'play' | 'pend' | 'end' = 'menu';
let showAlways = false;
let sh: Shift = newShift(1);
let P: Play | null = null;
let pend: { left: boolean; stars: number; coins: number } | null = null;
let lastXP = 0;

const esc = (s: string | number) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const picOf = (es: string) => IMG.find((x) => x.es === es)?.id;

export function openClinic(s: ClinicaScene): void {
  scene = s;
  if (!layer) {
    layer = document.createElement('div');
    layer.className = 'ui-layer sheet';
    layer.id = 'clinic';
    layer.addEventListener('click', onClick);
    shield(layer);
    document.body.appendChild(layer);
  }
  layer.hidden = false;
  stage = 'menu';
  P = null;
  render();
}

export function closeClinic(): void {
  stopSpeaking();
  if (layer) layer.hidden = true;
  scene = null;
}

/** True while a visit is in progress (so the back button asks nothing silly). */
export const clinicBusy = (): boolean => false;

function talk(slow = false): void {
  if (!P || !P.t.say) return;
  speak(P.t.say, state(), { slow, pitch: voicePitch(P.p), onend: () => scene?.say(false) });
  scene?.say(true);
}

function beginPatient(): void {
  const p = makePatient();
  P = { p, hearts: 5, ti: 0, t: makeTask(CL_STEPS[0], p), show: showAlways, helped: false, done: false, ok: false, note: '', tool: false, pick: {} };
  scene?.setPatient(p);
  scene?.setRoom(P.t.room);
  hud();
  render();
  void scene?.walkIn().then(() => talk());
}

function hud(): void {
  if (!scene) return;
  if (!P) return scene.setHud(5, '');
  scene.setHud(P.hearts, `Paciente ${sh.pi + 1} de ${sh.total} · paso ${P.ti + 1}/${CL_STEPS.length}`);
}

function nextStep(): void {
  if (!P) return;
  P.ti++;
  scene?.setPose({}, 'front');
  if (P.hearts <= 0 || P.ti >= CL_STEPS.length) return finishPatient();
  const t = makeTask(CL_STEPS[P.ti], P.p);
  Object.assign(P, { t, show: showAlways, helped: false, done: false, ok: false, note: '', tool: false, pick: {} });
  scene?.setRoom(t.room);
  hud();
  render();
  if (t.kind !== 'vital') talk();
}

function finishPatient(): void {
  if (!P) return;
  pend = endPatient(sh, P.hearts);
  stage = 'pend';
  sfx(pend.left ? 'bad' : 'done');
  void scene?.walkOut(pend.left);
  scene?.setHotspots(false, undefined, () => {});
  render();
}

function record(ok: boolean): void {
  if (!P) return;
  const S = state();
  sh.ans++;
  if (ok) sh.right++;
  judge(S, ok, topicsFor(P.t, P.p));
  commit();
  P.done = true;
  P.ok = ok;
  if (ok) {
    sfx('good');
    scene?.cheer();
  } else {
    sfx('bad');
    P.hearts = Math.max(0, P.hearts - 1);
    scene?.oops();
    hud();
  }
}

// ---------- render ----------

function chip(act: string, f: string, v: string | number, label: string, cls: string, disabled = false): string {
  return `<button class="chip ${cls}" data-act="${act}" data-f="${f}" data-v="${esc(v)}" ${disabled ? 'disabled' : ''}>${esc(label)}</button>`;
}

function optsHtml(): string {
  const t = P!.t;
  let h = t.opts!.map((o, i) => {
    let cl = '';
    if (P!.done) cl = o.ok ? ' good' : P!.pick.v === i ? ' bad' : '';
    return `<button class="opt${cl}" data-act="opt" data-i="${i}" ${P!.done ? 'disabled' : ''}>${esc(o.t)}</button>`;
  }).join('');
  const wrong = P!.done && typeof P!.pick.v === 'number' && !t.opts![P!.pick.v].ok;
  if (wrong) h += `<p class="feedback no">${esc(t.opts![P!.pick.v as number].why || '')}</p>`;
  return h;
}

function render(): void {
  if (!layer) return;
  const S = state();
  let h = '';
  if (stage === 'menu') {
    const c = S.clin;
    h += `<div class="eyebrow">La Clínica</div><h2>You are the medical assistant</h2>`;
    h += `<p class="muted">Patients speak Spanish only. Listen, tap and choose the way you would on shift. Mistakes cost patience (♥). A patient with no patience leaves.</p>`;
    h += `<div class="story">• Listen first: the patient's words are hidden, so train your ear.<br>• Use <b>usted</b> with patients. Informal tú costs a heart.<br>• Help (text or English) is free, but the game counts it.</div>`;
    h += `<div class="row"><button class="pbtn${showAlways ? ' on' : ''}" data-act="showall">${showAlways ? 'Always show text: on' : 'Always show text: off'}</button></div>`;
    h += `<div class="row" style="margin-top:10px"><button class="pbtn gold" style="flex:1" data-act="go" data-n="1">Quick shift (1)</button><button class="pbtn" style="flex:1" data-act="go" data-n="3">Full shift (3)</button></div>`;
    if (c.shifts) h += `<p class="muted">So far: ${c.patients} patients, ${c.stars} stars, ${c.shifts} shifts.</p>`;
  } else if (stage === 'play' && P) {
    const { t, p } = P;
    h += `<p class="title"><b>${esc(t.title)}</b></p>`;
    const canHear = t.say && (t.kind !== 'vital' || P.tool);
    if (canHear) {
      h += `<div class="row"><button class="pbtn gold" data-act="listen">▶ Escuchar</button><button class="pbtn" data-act="listen" data-slow="1">Lento</button><button class="pbtn small" data-act="show">${P.show ? 'Hide text' : 'Show text'}</button><button class="pbtn small" data-act="help">English</button></div>`;
      if (P.show) h += `<p class="say-line">“${esc(t.say)}”</p>`;
      if (P.helped && t.en) h += `<p class="muted">${esc(t.en)}</p>`;
    }
    if (t.ico) h += `<div class="big">${t.ico}</div>`;
    const s = P.pick;
    const cls = (isRight: boolean, isPicked: boolean) => (P!.done ? (isRight ? 'good' : isPicked ? 'bad' : '') : isPicked ? 'good' : '');
    if (t.kind === 'checkin') {
      h += `<p class="muted">Name</p><div class="chips">${t.names!.map((n) => chip('pick', 'name', n, n, cls(n === p.name, s.name === n), P!.done)).join('')}</div>`;
      h += `<p class="muted">Day · Month · Year</p><div class="chips">${t.days!.map((d) => chip('pick', 'day', d, String(d), cls(d === p.day, s.day === d), P!.done)).join('')}</div>`;
      h += `<div class="chips">${t.months!.map((m) => chip('pick', 'mo', m, MONTHS_ES[m], cls(m === p.mo, s.mo === m), P!.done)).join('')}</div>`;
      h += `<div class="chips">${t.years!.map((y) => chip('pick', 'year', y, String(y), cls(y === p.year, s.year === y), P!.done)).join('')}</div>`;
      if (!P.done) h += `<button class="pbtn gold wide" data-act="submit" ${s.name && s.day && s.mo !== undefined && s.year ? '' : 'disabled'}>Submit form</button>`;
    } else if (t.kind === 'sym') {
      h += `<div class="row"><button class="pbtn small" data-act="turn">↻ Turn the patient around</button><span class="muted">${s.body ? `Picked: ${esc(s.body)}` : 'Tap the body where it hurts.'}</span></div>`;
      h += `<p class="muted">Symptom</p><div class="symgrid">${t.syms!.map((sy) => {
        const id = picOf(sy[0]);
        return `<button class="opt ${cls(sy[0] === p.sym[0], s.sym === sy[0])}" data-act="pick" data-f="sym" data-v="${esc(sy[0])}" ${P!.done ? 'disabled' : ''}>${id ? `<img alt="" src="pics/${id}.jpg">` : ''}${esc(sy[2])}</button>`;
      }).join('')}</div>`;
      h += `<p class="muted">Days</p><div class="chips">${[1, 2, 3, 4, 5, 6, 7].map((d) => chip('pick', 'days', d, String(d), cls(d === p.days, s.days === d), P!.done)).join('')}</div>`;
      if (!P.done) h += `<button class="pbtn gold wide" data-act="submit" ${s.body && s.sym && s.days ? '' : 'disabled'}>Record symptoms</button>`;
      else h += `<p class="feedback ${P.ok ? 'ok' : 'no'}">${esc(p.body[2])} · ${esc(p.sym[2])} · ${p.days} day(s)</p>`;
    } else if (t.kind === 'chips') {
      h += `<div class="chips">${t.chips!.map((c) => `<button class="chip ${P!.done ? (c.k === t.correct ? 'good' : s.v === c.k ? 'bad' : '') : ''}" data-act="chipv" data-v="${esc(c.k)}" ${P!.done ? 'disabled' : ''}>${esc(c.t)}</button>`).join('')}</div>`;
    } else if (t.kind === 'vital') {
      if (!P.tool) h += `<button class="pbtn gold wide" data-act="tool">${t.id === 'bp' ? '🩺 Use the blood pressure cuff' : '🌡 Use the thermometer'}</button>`;
      else h += `<div class="reading">${esc(t.reading!)}</div><p class="muted">Tell the patient the result:</p>${optsHtml()}`;
    } else h += optsHtml();
    if (P.done && P.note) h += `<p class="feedback ${P.ok ? 'ok' : 'no'}">${esc(P.note)}</p>`;
    if (P.done) h += `<button class="pbtn gold wide" data-act="next">${P.ti + 1 >= CL_STEPS.length || P.hearts <= 0 ? 'Finish patient' : 'Next →'}</button>`;
  } else if (stage === 'pend' && pend && P) {
    h += `<div class="center"><h2>${pend.left ? 'The patient left' : `${esc(P.p.name)} is all set`}</h2>`;
    h += `<p class="muted">${pend.left ? 'Too many mistakes and no patience left. Try again, and listen closely.' : `Thank you for your help. Patience left: ${pend.stars} of 5.`}</p>`;
    h += `<div class="stars">${'★'.repeat(pend.stars)}<span class="off">${'★'.repeat(5 - pend.stars)}</span></div><p class="spark">◈ +${pend.coins}</p></div>`;
    h += `<button class="pbtn gold wide" data-act="nextp">${sh.pi + 1 < sh.total ? 'Next patient →' : 'End shift'}</button>`;
  } else if (stage === 'end') {
    const tot = sh.stars.reduce((a, b) => a + b, 0);
    h += `<div class="center"><div class="big spark">✦</div><h2>Shift complete</h2><p>${sh.stars.length} patient${sh.stars.length > 1 ? 's' : ''} seen. ${tot} stars earned.</p>`;
    h += `<p class="muted">${sh.right} of ${sh.ans} answers correct. You used help ${sh.helpN} time${sh.helpN === 1 ? '' : 's'}. Anything you missed is in your Focus list.</p><p class="spark">+${lastXP} XP</p></div>`;
    h += `<div class="row"><button class="pbtn gold" style="flex:1" data-act="go" data-n="${sh.total}">Another shift</button><button class="pbtn" style="flex:1" data-act="menu">Menu</button></div>`;
  }
  layer.innerHTML = `<div class="panel" role="dialog" aria-label="La Clínica">${h}</div>`;
  layer.querySelector('.panel')?.scrollTo(0, 0);
  // body hotspots in the room
  if (scene && P && stage === 'play') scene.setHotspots(P.t.kind === 'sym' && !P.done, P.t.kind === 'sym' ? P.pick.body : undefined, onBody);
  else scene?.setHotspots(false, undefined, () => {});
}

function onBody(part: string): void {
  if (!P || P.done) return;
  P.pick.body = part;
  sfx('tap');
  render();
}

// ---------- actions ----------

function onClick(e: Event): void {
  const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-act]');
  if (!btn || (btn as HTMLButtonElement).disabled) return;
  const act = btn.dataset.act;
  switch (act) {
    case 'showall':
      showAlways = !showAlways;
      render();
      return;
    case 'go':
      sh = newShift(Number(btn.dataset.n) || 1);
      stage = 'play';
      beginPatient();
      return;
    case 'menu':
      stage = 'menu';
      P = null;
      scene?.setPatient(null);
      scene?.setRoom('exam');
      hud();
      render();
      return;
  }
  if (stage === 'pend' && act === 'nextp') {
    if (sh.pi + 1 < sh.total) {
      sh.pi++;
      stage = 'play';
      beginPatient();
    } else {
      lastXP = endShift(state(), sh);
      commit();
      stage = 'end';
      toast(`+${lastXP} XP ✦`);
      render();
    }
    return;
  }
  if (stage !== 'play' || !P) return;
  const t = P.t;
  switch (act) {
    case 'listen':
      talk(btn.dataset.slow === '1');
      return;
    case 'show':
      P.show = !P.show;
      render();
      return;
    case 'help':
      if (!P.helped) {
        P.helped = true;
        sh.helpN++;
      }
      P.show = true;
      render();
      return;
    case 'turn': {
      const v = scene?.getView() === 'back' ? 'front' : 'back';
      scene?.setPose({}, v);
      render();
      return;
    }
    case 'pick': {
      if (P.done) return;
      const f = btn.dataset.f as keyof Play['pick'];
      const v = btn.dataset.v!;
      (P.pick as Record<string, unknown>)[f] = f === 'day' || f === 'mo' || f === 'year' || f === 'days' ? Number(v) : v;
      sfx('tap');
      render();
      return;
    }
    case 'submit': {
      if (P.done) return;
      const p = P.p;
      if (t.kind === 'checkin') {
        const ok = checkinOk(p, P.pick);
        record(ok);
        P.note = ok ? 'Perfect form.' : `Correct: ${p.name}, ${p.day} ${MONTHS_ES[p.mo]} ${p.year}.`;
      } else {
        const ok = symOk(p, P.pick);
        record(ok);
        P.note = ok ? 'Recorded correctly.' : `Correct: ${p.body[2]}, ${p.sym[2]}, ${p.days} day(s).`;
        if (scene && HOTSPOTS_VIEW[p.body[0]] !== scene.getView()) scene.setPose({}, HOTSPOTS_VIEW[p.body[0]]);
        P.pick.body = p.body[0];
      }
      render();
      return;
    }
    case 'chipv': {
      if (P.done) return;
      const c = t.chips!.find((x) => String(x.k) === btn.dataset.v)!;
      P.pick.v = c.k;
      const ok = c.k === t.correct;
      record(ok);
      P.note = ok ? 'Got it.' : `Listen again: ${P.p.qtype === 'pain' ? P.p.pain : P.p.al}.`;
      render();
      return;
    }
    case 'tool':
      P.tool = true;
      scene?.setPose(t.id === 'bp' ? { cuff: true } : { thermo: true });
      sfx('tap');
      render();
      talk();
      return;
    case 'opt': {
      if (P.done) return;
      const i = Number(btn.dataset.i);
      const o = t.opts![i];
      P.pick.v = i;
      record(o.ok);
      if (t.cmd && o.ok) {
        const pose = poseFor(t.cmd[3]);
        scene?.setPose(pose.turn ? {} : pose, pose.turn ? 'back' : 'front');
      }
      if (t.id === 'thanks' || t.id === 'plan') speak(t.opts!.find((x) => x.ok)!.t, state());
      render();
      return;
    }
    case 'next':
      nextStep();
      return;
  }
}

/** Which view shows each body part (the back is only visible from behind). */
const HOTSPOTS_VIEW: Record<string, 'front' | 'back'> = {
  cabeza: 'front', garganta: 'front', pecho: 'front', estómago: 'front', brazo: 'front', pierna: 'front', espalda: 'back',
};

// for automated tests: peek at the current patient and task
if (typeof window !== 'undefined') Object.assign(window, { __clinic: () => (P ? { p: P.p, t: P.t, stage } : { stage }) });
