/** El Café's sheet: take the order by ear, serve it, then tell the customer the total in Spanish. */
import { state, commit } from '../state/store';
import { speak, stopSpeaking } from '../audio/speech';
import { sfx } from '../audio/sfx';
import { iconCanvas } from '../art/cafe';
import { makePatient } from '../engine/clinic';
import {
  MENU, itemById, makeOrder, checkServe, priceUS, priceOptions, GREET, THANKS, cafeLevel, newCafeShift, scoreCafe, endCafeShift,
  type Order, type CafeShift,
} from '../engine/cafe';
import type { CafeScene } from '../scenes/CafeScene';
import { shield } from './shield';
import { toast } from './toast';

interface Cust {
  look: ReturnType<typeof makePatient>['look'];
  gender: 'f' | 'm';
  greet: string;
  o: Order;
  hearts: number;
  qty: Record<string, number>;
  sugar: 'con' | 'sin' | null;
  napkin: boolean;
  show: boolean;
  helped: boolean;
  served: { ok: boolean; why: string[] } | null;
  pay: { es: string; ok: boolean }[] | null;
  paid: number | null;
  tip: boolean;
}

let layer: HTMLDivElement | null = null;
let scene: CafeScene | null = null;
let stage: 'menu' | 'take' | 'pay' | 'bye' | 'end' = 'menu';
let sh: CafeShift = newCafeShift(1);
let cu: Cust | null = null;
let names = true;
let lastXP = 0;
const icons: Record<string, string> = {};

const esc = (s: string | number) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const icon = (id: string) => (icons[id] ||= iconCanvas(id).toDataURL());

export function openCafe(s: CafeScene): void {
  scene = s;
  if (!layer) {
    layer = document.createElement('div');
    layer.className = 'ui-layer sheet';
    layer.id = 'cafe';
    layer.addEventListener('click', onClick);
    shield(layer);
    document.body.appendChild(layer);
  }
  layer.hidden = false;
  stage = 'menu';
  cu = null;
  render();
}

export function closeCafe(): void {
  stopSpeaking();
  if (layer) layer.hidden = true;
  scene = null;
}

function talk(text: string, slow = false): void {
  if (!cu) return;
  speak(text, state(), { slow, pitch: cu.gender === 'f' ? 1.15 : 0.82, onend: () => scene?.say(false) });
  scene?.say(true);
}

function nextCustomer(): void {
  const p = makePatient();
  const lvl = cafeLevel(state());
  names = lvl <= 1;
  cu = {
    look: p.look, gender: p.gender, greet: GREET[Math.floor(Math.random() * GREET.length)], o: makeOrder(lvl), hearts: 3,
    qty: {}, sugar: null, napkin: false, show: false, helped: false, served: null, pay: null, paid: null, tip: false,
  };
  stage = 'take';
  scene?.setTray({}, null, false);
  render();
  void scene?.setCustomer(cu.look, cu.gender).then(() => cu && talk(`${cu.greet} ${cu.o.es}`));
}

function lose(): void {
  if (!cu) return;
  cu.hearts = Math.max(0, cu.hearts - 1);
}

function render(): void {
  if (!layer) return;
  const S = state();
  let h = '';
  if (stage === 'menu') {
    const c = S.cafe;
    h += `<div class="eyebrow">El Café</div><h2>Escucha y sirve</h2><p class="muted">Customers order in Spanish. Listen, put the right things on the tray, then tell them the total in Spanish. Each customer has 3 ★: mistakes cost one.</p>`;
    h += `<div class="chipline"><span class="pill gold">Nivel ${cafeLevel(S)}</span>${c.shifts ? `<span class="pill">${c.served} served · ${c.stars} ★ · ${c.tips} tips</span>` : ''}</div>`;
    h += `<p class="muted">Level 1: one thing. Level 2: two things. Level 3: amounts, sugar and napkins. The level goes up every 2 shifts.</p>`;
    h += `<div class="row"><button class="pbtn gold" style="flex:1" data-act="go" data-n="1">Quick shift (1)</button><button class="pbtn" style="flex:1" data-act="go" data-n="3">Full shift (3)</button></div>`;
  } else if (stage === 'take' && cu) {
    const lvl = cafeLevel(S);
    h += `<div class="row between"><span class="muted">Cliente ${sh.i + 1} de ${sh.total}</span><span class="stars" style="font-size:18px">${'★'.repeat(cu.hearts)}<span class="off">${'★'.repeat(3 - cu.hearts)}</span></span></div>`;
    h += `<div class="row"><button class="pbtn gold" data-act="listen">▶ Escuchar</button><button class="pbtn" data-act="listen" data-slow="1">Lento</button><button class="pbtn small" data-act="show">${cu.show ? 'Hide text' : 'Show text'}</button><button class="pbtn small" data-act="help">English</button></div>`;
    if (cu.show) h += `<p class="say-line">“${esc(cu.o.es)}”</p>`;
    if (cu.helped) h += `<p class="muted">${esc(cu.o.en)}</p>`;
    h += `<div class="menugrid">${MENU.map((m) => `<button data-act="add" data-id="${m.id}" ${cu!.served ? 'disabled' : ''}><img alt="" src="${icon(m.id)}">${names ? esc(m.one.replace(/^(un|una) /, '')) : ''}${cu!.qty[m.id] ? `<span class="q">${cu!.qty[m.id]}</span>` : ''}</button>`).join('')}</div>`;
    if (!names) h += `<button class="pbtn small" data-act="names">Show names</button> `;
    if (lvl >= 3)
      h += `<div class="row"><button class="pbtn small${cu.sugar === 'con' ? ' on' : ''}" data-act="sugar" data-v="con">con azúcar</button><button class="pbtn small${cu.sugar === 'sin' ? ' on' : ''}" data-act="sugar" data-v="sin">sin azúcar</button><button class="pbtn small${cu.napkin ? ' on' : ''}" data-act="napkin">servilleta</button></div>`;
    if (!cu.served) h += `<div class="row" style="margin-top:8px"><button class="pbtn" data-act="clear">Borrar</button><button class="pbtn gold" style="flex:1" data-act="serve" ${Object.values(cu.qty).some(Boolean) ? '' : 'disabled'}>Servir ✦</button></div>`;
    else {
      h += cu.served.ok ? `<p class="feedback ok">✓ ¡Perfecto! Exactly what they asked for.</p>` : `<p class="feedback no">Not quite. They wanted: ${esc(cu.served.why.join(' · '))}</p><p class="muted">“${esc(cu.o.es)}”</p>`;
      h += `<button class="pbtn gold wide" data-act="topay">Cobrar (charge) →</button>`;
    }
  } else if (stage === 'pay' && cu && cu.pay) {
    h += `<div class="receipt">${cu.o.lines.map((l) => `${l.qty} × ${esc(itemById(l.id).one.replace(/^(un|una) /, ''))} … ${priceUS(itemById(l.id).price * l.qty)}`).join('<br>')}<br><b>Total: ${priceUS(cu.o.total)}</b></div>`;
    h += `<p class="muted center">“¿Cuánto es?” Tell them the total:</p>`;
    h += cu.pay.map((o, i) => `<button class="opt${cu!.paid !== null ? (o.ok ? ' good' : i === cu!.paid ? ' bad' : '') : ''}" data-act="pay" data-i="${i}" ${cu!.paid !== null ? 'disabled' : ''}>${esc(o.es)}</button>`).join('');
    if (cu.paid !== null) h += `<button class="pbtn gold wide" data-act="bye">Next →</button>`;
  } else if (stage === 'bye' && cu) {
    h += `<div class="center"><div class="stars">${'★'.repeat(cu.hearts)}<span class="off">${'★'.repeat(3 - cu.hearts)}</span></div><p>${cu.tip ? 'They left a propina (tip)! ◈' : 'They enjoyed it.'}</p></div>`;
    h += `<button class="pbtn gold wide" data-act="nextc">${sh.i + 1 < sh.total ? 'Next customer →' : 'End shift'}</button>`;
  } else if (stage === 'end') {
    const tot = sh.stars.reduce((a, b) => a + b, 0);
    h += `<div class="center"><div class="big spark">☕</div><h2>Turno terminado</h2><p>${sh.stars.length} customer${sh.stars.length > 1 ? 's' : ''} served · ${tot} ★ · ${sh.tips} tip${sh.tips === 1 ? '' : 's'}</p><p class="muted">${sh.right} of ${sh.ans} answers right. You used help ${helpN} time${helpN === 1 ? '' : 's'}.</p><p class="spark">+${lastXP} XP</p></div>`;
    h += `<div class="row"><button class="pbtn gold" style="flex:1" data-act="go" data-n="${sh.total}">Another shift</button><button class="pbtn" style="flex:1" data-act="menu">Menu</button></div>`;
  }
  layer.innerHTML = `<div class="panel" role="dialog" aria-label="El Café">${h}</div>`;
}

let helpN = 0;

function onClick(e: Event): void {
  const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-act]');
  if (!btn || (btn as HTMLButtonElement).disabled) return;
  const S = state();
  const act = btn.dataset.act;
  if (act === 'go') {
    sh = newCafeShift(Number(btn.dataset.n) || 1);
    helpN = 0;
    return nextCustomer();
  }
  if (act === 'menu') {
    stage = 'menu';
    void scene?.setCustomer(null);
    scene?.setTray({}, null, false);
    return render();
  }
  if (!cu) return;
  switch (act) {
    case 'listen':
      talk(cu.o.es, btn.dataset.slow === '1');
      return;
    case 'show':
      cu.show = !cu.show;
      break;
    case 'help':
      if (!cu.helped) helpN++;
      cu.helped = true;
      cu.show = true;
      break;
    case 'names':
      names = true;
      break;
    case 'add':
      cu.qty[btn.dataset.id!] = Math.min(3, (cu.qty[btn.dataset.id!] || 0) + 1);
      sfx('tap');
      scene?.setTray(cu.qty, cu.sugar, cu.napkin);
      break;
    case 'clear':
      cu.qty = {};
      cu.sugar = null;
      cu.napkin = false;
      scene?.setTray(cu.qty, null, false);
      break;
    case 'sugar':
      cu.sugar = btn.dataset.v as 'con' | 'sin';
      scene?.setTray(cu.qty, cu.sugar, cu.napkin);
      break;
    case 'napkin':
      cu.napkin = !cu.napkin;
      scene?.setTray(cu.qty, cu.sugar, cu.napkin);
      break;
    case 'serve': {
      cu.served = checkServe(cu.o, { qty: cu.qty, sugar: cu.sugar, napkin: cu.napkin });
      scoreCafe(S, sh, cu.served.ok);
      if (cu.served.ok) {
        sfx('good');
        scene?.cheer();
      } else {
        sfx('bad');
        lose();
      }
      commit();
      break;
    }
    case 'topay':
      cu.pay = priceOptions(cu.o.total);
      stage = 'pay';
      talk('¿Cuánto es?');
      break;
    case 'pay': {
      if (cu.paid !== null || !cu.pay) return;
      cu.paid = Number(btn.dataset.i);
      const ok = cu.pay[cu.paid].ok;
      scoreCafe(S, sh, ok);
      sfx(ok ? 'good' : 'bad');
      if (!ok) lose();
      speak(cu.pay.find((o) => o.ok)!.es, S);
      commit();
      break;
    }
    case 'bye': {
      cu.tip = cu.hearts === 3;
      if (cu.tip) sh.tips++;
      sh.stars.push(cu.hearts);
      stage = 'bye';
      talk(cu.tip ? THANKS[0] : THANKS[1 + Math.floor(Math.random() * 2)]);
      sfx(cu.tip ? 'done' : 'sparkle');
      break;
    }
    case 'nextc':
      void scene?.setCustomer(null);
      scene?.setTray({}, null, false);
      if (sh.i + 1 < sh.total) {
        sh.i++;
        return nextCustomer();
      }
      lastXP = endCafeShift(S, sh);
      commit();
      toast(`+${lastXP} XP ✦`);
      stage = 'end';
      cu = null;
      break;
  }
  render();
}

// for automated tests
if (typeof window !== 'undefined') Object.assign(window, { __cafe: () => ({ stage, cu }) });
