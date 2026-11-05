/**
 * The one live copy of the game state, shared by every scene and screen.
 * Call commit() after changing it; it saves and tells listeners.
 */
import { defaults, type State } from './state';
import { loadState, saveState, askPersistent } from './storage';

let S: State = defaults();
const subs = new Set<(s: State) => void>();

export const state = (): State => S;

export async function initStore(): Promise<State> {
  S = await loadState();
  void askPersistent();
  return S;
}

export function commit(): void {
  saveState(S);
  subs.forEach((f) => f(S));
}

/** Swap in a whole new state (restore or reset). */
export function replaceState(next: State): void {
  S = next;
  commit();
}

export function subscribe(f: (s: State) => void): () => void {
  subs.add(f);
  return () => subs.delete(f);
}
