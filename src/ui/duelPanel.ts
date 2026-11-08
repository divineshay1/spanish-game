/** El Duelo's sheet: duel map, shop, your hand of word cards, the questions, results. */
import { state, commit } from '../state/store';
import { speak, stopSpeaking } from '../audio/speech';
import { sfx } from '../audio/sfx';
import { ENEMIES, PERKS } from '../content';
import { TY, wordOf, startBattle, challenge, answerOk, buildOk, resolve, endTurn, win, buyPerk, type Battle, type Outcome } from '../engine/duel';
import { buildHint, type BItem } from '../engine/grammar';
import type { DueloScene } from '../scenes/DueloScene';
import { shield } from './shield';
import { toast } from './toast';

let layer: HTMLDivElement | null = null;
let scene: DueloScene | null = null;
let stage: 'map' | 'shop' | 'battle' | 'end' = 'map';
let b: Battle | null = null;
let out: Outcome = null;

const esc = (s: string | number) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const say = (t: string) => speak(t, state());

export const duelBusy = (): boolean => false;

export function openDuel(s: DueloScene): void {
  scene = s;
  if (!layer) {
    layer = document.createElement('div');
    layer.className = 'ui-layer sheet';
    layer.id = 'duel';
    layer.addEventListener('click', onClick);
    shield(layer);
    document.body.appendChild(layer);
  }
  layer.hidden = false;
  stage = 'map';
  scene.showMap();
  render();
}

export function closeDuel(): void {
  stopSpeaking();
  if (layer) layer.hidden = true;
  scene = null;
}

function render(): void {
  if (!layer) return;
  const S = state();
  const g = S.game;
  let h = '';
  if (stage === 'map') {
    h += `<div class="row between"><div><div class="eyebrow">Duelo de palabras</div><h2>The Tarot of Words</h2></div><button class="pbtn small" data-act="shop">Shop</button></div>`;
    h += `<p class="muted">Your picture words are the cards. Answer correctly to play a card and strike, ward or mend. Every answer is a real review, so winning duels means remembering words.</p><div class="chipline"><span class="pill gold">◈ ${g.coins} coins</span><span class="pill">${g.wins} wins</span></div>`;
    h += ENEMIES.map((e, i) => {
      const done = i < g.cleared;
      const open = i <= g.cleared;
      return `<button class="task" ${open ? `data-act="go" data-i="${i}"` : 'disabled style="opacity:.45"'}><span class="dot">${i + 1}</span><span>${esc(e.n)} ${done ? '✓' : open ? '· fight' : '· locked'}<small>${esc(e.t)} HP ${e.hp} · attacks for ${e.atk}</small></span></button>`;
    }).join('');
  } else if (stage === 'shop') {
    h += `<div class="row between"><div><div class="eyebrow">El Duelo</div><h2>Shop</h2></div><button class="pbtn small" data-act="map">← Duels</button></div><p class="muted">Talismans last forever. Earn coins by winning duels and by answering well.</p><div class="chipline"><span class="pill gold">◈ ${g.coins} coins</span></div>`;
    h += PERKS.map((p) => {
      const own = g.perks[p[0]];
      return `<div class="card"><div class="row between"><b>${esc(p[1])}</b><span class="pill${own ? ' gold' : ''}">${own ? 'owned' : `◈ ${p[3]}`}</span></div><p class="muted">${esc(p[2])}</p>${own ? '' : `<button class="pbtn${g.coins >= p[3] ? ' gold' : ''}" data-act="buy" data-k="${p[0]}">Buy</button>`}</div>`;
    }).join('');
  } else if (stage === 'battle' && b) {
    const ch = b.ch;
    if (!ch) {
      h += `<div class="row between"><span class="muted">Turno ${b.turn}</span><button class="pbtn small" data-act="flee">Flee</button></div>`;
      if (b.perfect && b.turn > 1) h += `<p class="feedback ok">Perfect turn: +4 shield.</p>`;
      h += `<p class="muted center">Tap a card, then answer to play it.</p><div class="hand">${b.hand
        .map((c, i) => `<button class="tcard ${c.type}${c.used ? ' used' : ''}" data-act="play" data-i="${i}" ${c.used ? 'disabled' : ''}><span class="ty">${TY[c.type][0]} ${c.power}</span><span class="mid">${c.used ? '✓' : '✦'}</span><span class="lbl">${TY[c.type][1]}</span></button>`)
        .join('')}</div><button class="pbtn gold wide" data-act="endturn">End turn</button>`;
    } else {
      const c = b.hand[ch.i];
      h += `<p class="muted center">Play <b>${TY[c.type][1]} ${c.power}</b>: answer to cast it</p>`;
      if (ch.k === 'mc') {
        h += `<p class="muted center">What does it mean?</p><div class="big">${esc(wordOf(c.w))}</div><div class="row center"><button class="pbtn" data-act="say" data-t="${esc(c.w.es)}">▶ Escuchar</button></div>`;
        h += ch.opts!.map((o, i) => `<button class="opt${ch.ans !== null ? (o === c.w.en ? ' good' : i === ch.ans ? ' bad' : '') : ''}" data-act="opt" data-i="${i}" ${ch.ans !== null ? 'disabled' : ''}>${esc(o)}</button>`).join('');
      } else if (ch.k === 'ear') {
        h += `<p class="muted center">Listen. Which picture is it?</p><div class="row center"><button class="pbtn gold" data-act="say" data-t="${esc(c.w.es)}">▶ Escuchar</button></div>`;
        h += `<div class="picgrid">${ch.pics!.map((o, i) => `<button class="opt${ch.ans !== null ? (o.id === c.id ? ' good' : i === ch.ans ? ' bad' : '') : ''}" data-act="opt" data-i="${i}" ${ch.ans !== null ? 'disabled' : ''}><img alt="" src="pics/${esc(o.id)}.jpg"></button>`).join('')}</div>`;
      } else {
        h += `<p class="muted center">Build the word</p><div class="big en">${esc(c.w.en)}</div><div class="row center"><button class="pbtn" data-act="say" data-t="${esc(c.w.es)}">▶ Escuchar</button></div>`;
        const chip = (id: number, act: string, cls = '') => `<button class="chip ${cls}" data-act="${act}" data-id="${id}">${esc(ch.pool!.find((p) => p.id === id)!.w)}</button>`;
        h += `<div class="slot chips">${ch.placed!.map((id) => chip(id, 'un', ch.res ? (ch.ok ? 'good' : 'bad') : '')).join('')}</div>`;
        h += `<div class="chips">${ch.pool!.filter((p) => !ch.placed!.includes(p.id)).map((p) => chip(p.id, 'put')).join('')}</div>`;
      }
      if (ch.res !== null) {
        const msg =
          ch.res === 'bad' ? 'Missed. The card fizzles, and this word comes back soon.'
          : ch.res === 'forgiven' ? 'Missed, but the Espejo forgave you. The card still works.'
          : c.type === 'atk' ? `Strike! ${c.power} damage.` : c.type === 'def' ? `Ward! +${c.power} shield.` : `Mend! +${c.power} HP.`;
        h += `<div class="story"><b>${esc(wordOf(c.w))}</b> · ${esc(c.w.en)}<br>${msg}</div><button class="pbtn gold wide" data-act="cont">${b.e.hp <= 0 ? 'Claim victory ✦' : 'Continue'}</button>`;
      } else if (ch.k === 'build')
        h += `<div class="row"><button class="pbtn" data-act="hint">Hint</button><button class="pbtn gold" style="flex:1" data-act="cast" ${ch.placed!.length ? '' : 'disabled'}>Cast</button></div>`;
    }
  } else if (stage === 'end' && b && out) {
    const w = out.kind === 'win';
    h += `<div class="center"><div class="big spark">${w ? '✦' : '☾'}</div><h2>${w ? 'Victory' : 'Defeated'}</h2>`;
    h += `<p class="muted">${w ? `${esc(b.e.n)} fades away.${out.kind === 'win' && out.first && b.lv < ENEMIES.length - 1 ? ' The next duel is unlocked.' : ''}` : `${esc(b.e.n)} wins this time. Every answer still strengthened your memory.`}</p>`;
    h += `<p>${b.right} of ${b.total} cards played correctly.</p><p class="spark">◈ +${out.coins} coins · +${out.xp} XP</p></div>`;
    h += `<div class="row"><button class="pbtn gold" style="flex:1" data-act="go" data-i="${b.lv}">${w ? 'Fight again' : 'Try again'}</button><button class="pbtn" style="flex:1" data-act="map">Duels</button></div>`;
  }
  layer.innerHTML = `<div class="panel" role="dialog" aria-label="El Duelo">${h}</div>`;
  layer.querySelector('.panel')?.scrollTo(0, 0);
}

function finish(o: Outcome): void {
  out = o;
  stage = 'end';
  commit();
  if (o?.kind === 'win') {
    sfx('done');
    scene?.defeat();
  } else sfx('bad');
  render();
}

function onClick(e: Event): void {
  const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-act]');
  if (!btn || (btn as HTMLButtonElement).disabled) return;
  const S = state();
  switch (btn.dataset.act) {
    case 'say':
      say(btn.dataset.t || '');
      return;
    case 'shop':
      stage = 'shop';
      break;
    case 'map':
    case 'flee':
      stage = 'map';
      b = null;
      scene?.showMap();
      commit();
      break;
    case 'buy': {
      const r = buyPerk(S, btn.dataset.k!);
      if (r === 'poor') toast('Not enough coins yet');
      if (r === 'ok') {
        sfx('sparkle');
        toast('Talismán comprado ✦');
        commit();
      }
      break;
    }
    case 'go':
      b = startBattle(S, Number(btn.dataset.i));
      commit();
      stage = 'battle';
      scene?.showBattle(b);
      break;
  }
  if (stage === 'battle' && b) {
    const ch = b.ch;
    switch (btn.dataset.act) {
      case 'play': {
        const c = challenge(b, Number(btn.dataset.i));
        sfx('tap');
        if (c?.k === 'ear') say(b.hand[c.i].w.es);
        break;
      }
      case 'opt': {
        if (!ch || ch.ans !== null) return;
        ch.ans = Number(btn.dataset.i);
        played(answerOk(b, ch.ans));
        break;
      }
      case 'put':
        if (!ch || ch.res !== null) return;
        ch.placed!.push(Number(btn.dataset.id));
        break;
      case 'un':
        if (!ch || ch.res !== null) return;
        ch.placed = ch.placed!.filter((x) => x !== Number(btn.dataset.id));
        break;
      case 'hint':
        if (!ch || ch.res !== null) return;
        ch.placed = buildHint({ ans: ch.tokens!, pool: ch.pool! } as BItem, ch.placed!);
        break;
      case 'cast':
        if (!ch || ch.res !== null) return;
        played(buildOk(ch));
        break;
      case 'cont':
        b.ch = null;
        if (b.e.hp <= 0) return finish(win(S, b));
        break;
      case 'endturn': {
        const o = endTurn(S, b);
        scene?.fx(b.fx, b.hit);
        scene?.update2(b);
        sfx(b.hit ? 'bad' : 'good');
        commit();
        if (o) return finish(o);
        break;
      }
    }
  }
  render();
}

function played(ok: boolean): void {
  if (!b || !b.ch) return;
  const c = b.hand[b.ch.i];
  resolve(state(), b, ok);
  commit();
  sfx(ok || b.ch.res === 'forgiven' ? 'good' : 'bad');
  scene?.fx(b.fx, c.power);
  scene?.update2(b);
  say(c.w.es);
}

// for automated tests
if (typeof window !== 'undefined') Object.assign(window, { __duel: () => ({ stage, b }) });
