/**
 * Backup and Restore as a JSON file. Restore also accepts an old
 * Mi Español save (the raw object the prototype kept in localStorage).
 */
import { mergeState, type State } from './state';

export const BACKUP_APP = 'mi-espanol-el-cielo';
export const BACKUP_FORMAT = 1;

export interface BackupFile {
  app: string;
  format: number;
  exportedAt: string;
  state: State;
}

export function makeBackup(S: State, when: Date = new Date()): BackupFile {
  return { app: BACKUP_APP, format: BACKUP_FORMAT, exportedAt: when.toISOString(), state: S };
}

export const backupFileName = (when: Date = new Date()): string =>
  `el-cielo-backup-${when.toISOString().slice(0, 10)}.json`;

export type RestoreResult = { ok: true; state: State; source: 'backup' | 'mi-espanol' } | { ok: false; error: string };

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/** Reads a backup file's text. Never throws. */
export function readBackup(text: string): RestoreResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: 'That file is not a backup (it is not JSON).' };
  }
  if (!isObj(data)) return { ok: false, error: 'That file is not a backup.' };
  if (data.app === BACKUP_APP) {
    if (typeof data.format !== 'number' || data.format > BACKUP_FORMAT)
      return { ok: false, error: 'This backup comes from a newer version of the game. Update the app first.' };
    if (!isObj(data.state)) return { ok: false, error: 'This backup is damaged (no progress inside).' };
    return { ok: true, state: mergeState(data.state), source: 'backup' };
  }
  // an old Mi Español save: has cards and xp at the top level
  if (isObj(data.cards) && 'xp' in data) return { ok: true, state: mergeState(data), source: 'mi-espanol' };
  return { ok: false, error: 'That file is not a backup from this game.' };
}

/** Starts a download of the backup file. */
export function downloadBackup(S: State): void {
  const when = new Date();
  const blob = new Blob([JSON.stringify(makeBackup(S, when), null, 1)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = backupFileName(when);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** Opens a file picker and reads the chosen backup. */
export function pickBackupFile(): Promise<RestoreResult | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = async () => {
      const f = input.files?.[0];
      if (!f) return resolve(null);
      resolve(readBackup(await f.text()));
    };
    input.click();
  });
}
