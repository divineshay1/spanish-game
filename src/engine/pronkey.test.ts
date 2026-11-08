import { describe, expect, it } from 'vitest';
import { pron } from './pronunciation';

// Examples from the pronunciation key you shared; the respelling engine agrees with every one.
describe('pronunciation key examples', () => {
  it.each([
    ['acción', 'ahk-SYOHN'], ['general', 'heh-neh-RAHL'], ['hotel', 'oh-TEHL'], ['caballo', 'kah-BAH-yoh'],
    ['llevo', 'YEH-boh'], ['cabaña', 'kah-BAH-nyah'], ['señor', 'seh-NYOHR'], ['patio', 'PAH-tyoh'],
    ['simpático', 'seem-PAH-tee-koh'], ['que', 'keh'], ['guitarra', 'gee-TAH-rrah'], ['y', 'ee'],
    ['rico', 'RREE-koh'], ['perro', 'PEH-rroh'], ['zapato', 'sah-PAH-toh'], ['jugo', 'HOO-goh'],
  ])('%s → %s', (w, want) => expect(pron(w).say).toBe(want));
});
