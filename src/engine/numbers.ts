/** Numbers to Spanish words, as used for vitals, ages and doses. Ported from the prototype. */
const N_U = [
  'cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once',
  'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte',
  'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete',
  'veintiocho', 'veintinueve',
];
const N_T = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
const N_H = [
  '', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos',
  'ochocientos', 'novecientos',
];

export function n2s(n: number): string {
  if (n < 30) return N_U[n];
  if (n < 100) {
    const t = Math.floor(n / 10);
    const u = n % 10;
    return N_T[t] + (u ? ' y ' + N_U[u] : '');
  }
  if (n === 100) return 'cien';
  if (n < 1000) {
    const h = Math.floor(n / 100);
    const r = n % 100;
    return N_H[h] + (r ? ' ' + n2s(r) : '');
  }
  if (n < 2000) return 'mil' + (n % 1000 ? ' ' + n2s(n % 1000) : '');
  if (n < 1000000) {
    const k = Math.floor(n / 1000);
    const r = n % 1000;
    return n2s(k) + ' mil' + (r ? ' ' + n2s(r) : '');
  }
  return String(n);
}

/** A temperature like 38.5 -> "treinta y ocho punto cinco". */
export function tempEs(t: number): string {
  const w = Math.floor(t);
  const d = Math.round((t - w) * 10);
  return n2s(w) + ' punto ' + n2s(d);
}
