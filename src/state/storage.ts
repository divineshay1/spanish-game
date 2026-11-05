/**
 * Saves the game on this device only. IndexedDB first (sturdier on iPhone),
 * with a localStorage copy as a fallback. Nothing ever leaves the device.
 */
import { mergeState, type State } from './state';

const DB = 'mi-espanol';
const STORE = 'kv';
const KEY = 'state';
const LS_KEY = 'miEspanol.cielo.v1';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('no indexedDB'));
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet(): Promise<unknown> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const r = db.transaction(STORE, 'readonly').objectStore(STORE).get(KEY);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

async function idbSet(v: unknown): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(v, KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function lsGet(): unknown {
  try {
    const t = localStorage.getItem(LS_KEY);
    return t ? JSON.parse(t) : null;
  } catch {
    return null;
  }
}

function lsSet(json: string): void {
  try {
    localStorage.setItem(LS_KEY, json);
  } catch {
    /* storage full or blocked; IndexedDB copy still exists */
  }
}

/** Loads the newest copy found (IndexedDB or localStorage). */
export async function loadState(): Promise<State> {
  let a: unknown = null;
  try {
    a = await idbGet();
  } catch {
    /* ignore */
  }
  const b = lsGet();
  const t = (x: unknown) => (x && typeof x === 'object' && '_t' in x ? Number((x as { _t: number })._t) || 0 : 0);
  const pick = t(b) > t(a) ? b : a || b;
  return mergeState(pick);
}

let timer: ReturnType<typeof setTimeout> | undefined;
let pending: State | null = null;

/** Saves soon (batched), so rapid taps don't hammer storage. */
export function saveState(S: State): void {
  S._t = Date.now();
  pending = S;
  clearTimeout(timer);
  timer = setTimeout(flush, 300);
}

/** Saves right now (used when the app goes to the background). */
export async function flush(): Promise<void> {
  if (!pending) return;
  const S = pending;
  pending = null;
  const json = JSON.stringify(S);
  lsSet(json);
  try {
    await idbSet(JSON.parse(json));
  } catch {
    /* localStorage copy is enough */
  }
}

/** Asks the browser not to clear our data when space is low. */
export async function askPersistent(): Promise<boolean> {
  try {
    return (await navigator.storage?.persist?.()) ?? false;
  } catch {
    return false;
  }
}

if (typeof document !== 'undefined')
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void flush();
  });
