/**
 * "Hoy" (today: XP, streak, phrase of the day, daily route) and
 * "Progreso" (the progress dashboard, ported from the prototype).
 */
import { state, commit } from '../state/store';
import { speak } from '../audio/speech';
import { pron } from '../engine/pronunciation';
import { bareWord } from '../engine/text';
import { addDays, dayKey, now } from '../engine/clock';
import { phraseOfDay, SOON_TASKS, TASKS, taskDone, tasksDone, levelProgress, type Task } from '../engine/daily';
import { addXP, curStreak, today } from '../state/progress';
import { allCards, dueList } from '../engine/cards';
import { IMG, MODN } from '../content';
import { MAXBOX } from '../engine/srs';
import { shield } from './shield';
import { sfx } from '../audio/sfx';
import { toast } from './toast';

let layer: HTMLDivElement | null = null;
let which: 'hoy' | 'progreso' = 'hoy';
let onGo: ((t: Task['go']) => void) | null = null;
let showSounds = false;

const esc = (s: string | number) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

function ensure(): HTMLDivElement {
  if (!layer) {
    layer = document.createElement('div');
    layer.className = 'ui-layer';
    layer.id = 'panel';
    layer.addEventListener('click', onClick);
    shield(layer);
    document.body.appendChild(layer);
  }
  layer.hidden = false;
  return layer;
}

export const panelOpen = (): boolean => !!layer && !layer.hidden;

export function closePanel(): void {
  if (layer) layer.hidden = true;
}

export function openHoy(go: (t: Task['go']) => void): void {
  which = 'hoy';
  onGo = go;
  showSounds = false;
  ensure();
  render();
}

export function openProgreso(): void {
  which = 'progreso';
  ensure();
  render();
}

const bar = (i: number, n: number) => `<div class="bar"><i style="width:${Math.round((100 * Math.min(i, n)) / Math.max(1, n))}%"></i></div>`;
const header = (eyebrow: string, title: string) =>
  `<div class="row between"><div><div class="eyebrow">${esc(eyebrow)}</div><h2>${esc(title)}</h2></div><button class="pbtn small" data-act="close">✕</button></div>`;
const stat = (n: string | number, l: string) => `<div><b>${esc(n)}</b>${esc(l)}</div>`;

function greeting(): string {
  const h = now().getHours();
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
}

function renderHoy(): string {
  const S = state();
  const t = today(S);
  const lv = levelProgress(S);
  const ph = phraseOfDay(S);
  const done = tasksDone(S);
  let h = header('Mi Español', `${greeting()}, ${S.name}`);
  h += `<div class="chipline"><span class="pill gold">🔥 ${curStreak(S)} day streak</span><span class="pill">Nivel ${lv.level}</span><span class="pill">${S.xp} XP total</span></div>`;
  h += `<p class="muted">Today: ${t.xp} of ${S.goal} XP</p>${bar(t.xp, S.goal)}`;
  h += `<p class="muted">Level ${lv.level + 1} in ${lv.of - lv.into} XP</p>${bar(lv.into, lv.of)}`;
  h += `<div class="card"><div class="eyebrow">Frase del día</div><div class="big">${esc(ph.es)}</div><p class="center muted">${esc(ph.en)}</p>`;
  h += `<div class="row center"><button class="pbtn gold" data-act="phrase">▶ Escuchar</button><button class="pbtn" data-act="phrase" data-slow="1">Lento</button><button class="pbtn" data-act="sounds">Sonidos</button></div>`;
  if (showSounds) {
    h += `<div class="story">${ph.es
      .split(/\s+/)
      .map(bareWord)
      .filter(Boolean)
      .map((w) => {
        const p = pron(w);
        return `<div class="row between"><span class="syl">${p.syl.map((s, i) => (i === p.st && p.syl.length > 1 ? `<b>${esc(s)}</b>` : esc(s))).join('·')} <span class="say">${esc(p.say)}</span></span><button class="pbtn small" data-act="sayword" data-t="${esc(w)}">▶</button></div>`;
      })
      .join('')}</div>`;
  }
  h += `</div>`;
  h += `<h3>Tu ruta de hoy</h3><p class="muted">${done === TASKS.length ? 'Everything done today ✦' : `${done} of ${TASKS.length} steps done. Small and daily beats big and rare.`}</p>`;
  h += TASKS.map((x) => {
    const on = taskDone(S, x.id);
    return `<button class="task${on ? ' on' : ''}" data-act="task" data-id="${x.id}"><span class="dot">${on ? '✓' : x.icon}</span><span>${esc(x.t)}<small>${esc(x.d)}</small></span></button>`;
  }).join('');
  h += SOON_TASKS.map(([n, d]) => `<div class="task soon"><span class="dot">·</span><span>${esc(n)} · pronto<small>${esc(d)}</small></span></div>`).join('');
  return h;
}

function renderProgreso(): string {
  const S = state();
  const all = allCards(S);
  const cards = Object.values(S.cards);
  const due = dueList(S).length;
  const reviews = cards.reduce((a, v) => a + (v.seen || 0), 0);
  const active = Object.keys(S.days).filter((k) => S.days[k].xp > 0).length;
  const imgMet = IMG.filter((x) => S.imgSeen[x.id]).length;
  const lv = levelProgress(S);
  let h = header('Progreso', 'How you are doing');
  h += `<div class="stats">${stat(S.xp, 'total XP')}${stat(lv.level, 'level')}${stat(curStreak(S), 'day streak')}</div>`;
  h += `<div class="stats">${stat(S.best, 'best streak')}${stat(active, 'days practiced')}${stat(reviews, 'answers')}</div>`;

  // last 14 days
  let maxv = S.goal;
  const days: { d: Date; xp: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = now();
    d.setDate(d.getDate() - i);
    const xp = (S.days[dayKey(d)] || { xp: 0 }).xp;
    days.push({ d, xp });
    maxv = Math.max(maxv, xp);
  }
  h += `<div class="card"><h3>Last 14 days</h3><div class="chart">${days
    .map(
      (x) =>
        `<div><i class="${x.xp >= S.goal ? 'goal' : x.xp > 0 ? '' : 'zero'}" style="height:${Math.max(6, Math.round((76 * x.xp) / maxv))}px"></i>${'DLMMJVS'[x.d.getDay()]}</div>`,
    )
    .join('')}</div><p class="muted">Gold means you hit your daily goal of ${S.goal} XP.</p></div>`;

  // skills
  const used = Object.keys(MODN).map((k) => {
    const m = S.mod[k] || { n: 0, r: 0 };
    return { k, name: MODN[k], n: m.n, r: m.r, acc: m.n ? m.r / m.n : 0 };
  });
  // garden skills are new: name them too
  for (const [k, name] of [['plant', 'Sembrar']] as const) {
    const m = S.mod[k] || { n: 0, r: 0 };
    used.push({ k, name, n: m.n, r: m.r, acc: m.n ? m.r / m.n : 0 });
  }
  const act = used.filter((m) => m.n > 0);
  const strong = act.filter((m) => m.n >= 8 && m.acc >= 0.8).sort((a, b) => b.acc - a.acc);
  const weak = act.filter((m) => m.n >= 6 && m.acc < 0.65).sort((a, b) => a.acc - b.acc);
  const mid = act.filter((m) => !strong.includes(m) && !weak.includes(m));
  const row = (m: (typeof used)[number]) =>
    `<div><div class="row between"><b>${esc(m.name)}</b><span class="muted">${Math.round(100 * m.acc)}% right · ${m.n}</span></div>${bar(m.r, m.n)}</div>`;
  const sect = (t: string, list: typeof used, sub: string) =>
    list.length ? `<div class="card"><h3>${t}</h3><p class="muted">${sub}</p>${list.map(row).join('')}</div>` : '';
  h += sect('Needs attention', weak, 'Under 65% right so far. A few more rounds here will pay off.');
  h += sect('Getting there', mid, 'Keep going, or too few answers to judge yet.');
  h += sect('Going strong', strong, '80% or better over 8 or more answers.');
  if (!act.length) h += `<div class="card"><h3>Skills</h3><p class="muted">Finish a round in the garden and your strengths and weak spots show up here.</p></div>`;

  // word strength (garden stages)
  const labels = ['New', 'Learning', 'Familiar', 'Good', 'Strong', 'Solid', 'Long term', 'Deep', 'Mastered'];
  const counts = Array(9).fill(0);
  cards.forEach((c) => counts[Math.min(MAXBOX, c.box || 0)]++);
  const tot = Math.max(1, cards.length);
  h += `<div class="card"><div class="row between"><h3>Word strength</h3><span class="muted">${due} thirsty now</span></div>${labels
    .map((l, i) => `<div class="lvl"><span>${l}</span>${bar(counts[i], tot)}<span>${counts[i]}</span></div>`)
    .join('')}<p class="muted">${cards.length} planted · ${all.length} in play</p></div>`;

  // rescue list
  const miss = Object.values(S.miss).sort((a, b) => b.c - a.c).slice(0, 8);
  h += `<div class="card"><h3>Words to rescue</h3>${
    miss.length
      ? `<p class="muted">The ones you keep missing. Get it right and its count goes down. Nail it in Focus and it drops off.</p>${miss
          .map((w) => `<div class="row between"><div><b>${esc(w.es)}</b><div class="muted">${esc(w.en)} · missed ${w.c}×</div></div><button class="pbtn small" data-act="sayword" data-t="${esc(w.es)}">▶</button></div>`)
          .join('')}`
      : '<p class="muted">Nothing is slipping right now ✦</p>'
  }</div>`;

  // milestones (prototype list + garden ones)
  const stars = cards.filter((c) => c.box >= 8).length;
  const ms: [string, boolean][] = [
    ['100 XP', S.xp >= 100], ['500 XP', S.xp >= 500], ['1,000 XP', S.xp >= 1000],
    ['3 day streak', S.best >= 3], ['7 day streak', S.best >= 7], ['14 day streak', S.best >= 14],
    ['First 10 plants', cards.length >= 10], ['First star flower', stars >= 1],
    ['25 picture words', imgMet >= 25], [`All ${IMG.length} picture words`, imgMet >= IMG.length],
    ['100 cards answered', reviews >= 100], ['A story read', Object.keys(S.stories).length >= 1],
    ['30 immersion minutes', S.immData.min >= 30], ['2 hours of immersion', S.immData.min >= 120],
  ];
  h += `<div class="card"><h3>Milestones</h3><div class="chipline">${ms.map(([l, on]) => `<span class="pill${on ? ' gold' : ' off'}">${on ? '✓ ' : ''}${esc(l)}</span>`).join('')}</div></div>`;
  h += `<p class="muted center">Next 7 days: ${Object.values(S.cards).filter((c) => c.due > dayKey() && c.due <= addDays(7)).length} plants will ask for water.</p>`;
  return h;
}

function render(): void {
  if (!layer) return;
  layer.innerHTML = `<div class="panel session" role="dialog">${which === 'hoy' ? renderHoy() : renderProgreso()}</div>`;
}

function onClick(e: Event): void {
  const target = e.target as HTMLElement;
  if (target === layer) return closePanel();
  const btn = target.closest<HTMLElement>('[data-act]');
  if (!btn) return;
  const S = state();
  switch (btn.dataset.act) {
    case 'close':
      return closePanel();
    case 'phrase': {
      const ph = phraseOfDay(S);
      if (!speak(ph.es, S, { slow: btn.dataset.slow === '1' })) toast('Audio is not supported here');
      const t = today(S);
      if (!t.done.phrase) {
        addXP(S, 2, 'phrase');
        commit();
        sfx('sparkle');
        toast('+2 XP ✦');
        render();
      }
      return;
    }
    case 'sounds':
      showSounds = !showSounds;
      render();
      return;
    case 'sayword':
      speak(btn.dataset.t || '', S);
      return;
    case 'task': {
      const task = TASKS.find((x) => x.id === btn.dataset.id);
      if (!task) return;
      if (task.go === 'phrase') {
        layer?.querySelector<HTMLElement>('[data-act="phrase"]')?.click();
        return;
      }
      closePanel();
      onGo?.(task.go);
      return;
    }
  }
}
