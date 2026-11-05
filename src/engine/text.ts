/** Small text helpers shared by the engines (ported from the prototype). */

/** Lowercase, drop accents and punctuation, squeeze spaces. */
export const norm = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Removes the "(f.)" marker some cards carry. */
export const cleanEs = (s: string): string => s.replace(' (f.)', '');

/** Removes a leading article: "la casa" -> "casa". */
export const stripArt = (s: string): string => s.replace(/^(el|la|los|las|un|una) /i, '');

/** Fisher-Yates shuffle that returns a new array. */
export function shuffle<T>(a: readonly T[], rand: () => number = Math.random): T[] {
  const out = a.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Strips opening/closing punctuation from a single word token. */
export const bareWord = (t: string): string => t.replace(/^[¿¡"“«(]+|[.,;:!?"”»)…]+$/g, '');
