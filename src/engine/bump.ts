import { dueIn, lapse, MAXBOX } from './srs';
import { dayKey } from './clock';
import type { State } from '../state/state';

/** Moves a card's plant one stage up (right) or back (wrong), as the prototype's mini-games did. */
export function bump(S: State, key: string, ok: boolean): void {
  const st = S.cards[key] ? { ...S.cards[key] } : { box: 0, due: '', seen: 0 };
  st.seen++;
  if (ok) {
    st.box = Math.min(MAXBOX, st.box + 1);
    st.due = dueIn(st.box);
  } else {
    st.box = lapse(st.box);
    st.due = dayKey();
  }
  S.cards[key] = st;
}
