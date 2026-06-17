// Formatter angka lokal Indonesia (id-ID) — dipakai bersama web & mobile.
// Memakai Intl bila tersedia (Node & Hermes/RN modern mendukungnya),
// dengan fallback manual agar aman di runtime tanpa data ICU.

function groupThousands(value: number, fractionDigits = 0): string {
  const fixed = Math.abs(value).toFixed(fractionDigits);
  const [intPart, fracPart] = fixed.split('.');
  const grouped = (intPart ?? '0').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const sign = value < 0 ? '-' : '';
  return fracPart ? `${sign}${grouped},${fracPart}` : `${sign}${grouped}`;
}

/** Rp dengan pemisah ribuan (titik). Contoh: 7466 -> "Rp 7.466". */
export function formatRupiah(value: number, withDecimals = false): string {
  if (!Number.isFinite(value)) return 'Rp -';
  return `Rp ${groupThousands(value, withDecimals ? 2 : 0)}`;
}

/** Angka biasa dengan pemisah ribuan. Contoh: 1234567 -> "1.234.567". */
export function formatNumber(value: number, fractionDigits = 0): string {
  if (!Number.isFinite(value)) return '-';
  return groupThousands(value, fractionDigits);
}

/** Persen dengan tanda. Contoh: 2.27 -> "+2,27%". */
export function formatPercent(value: number, fractionDigits = 2): string {
  if (!Number.isFinite(value)) return '-';
  const sign = value > 0 ? '+' : '';
  return `${sign}${groupThousands(value, fractionDigits)}%`;
}

/** Kapitalisasi pasar ringkas: T (triliun) / M (miliar). Contoh: 9.8e14 -> "Rp 980,0 T". */
export function formatMarketCap(value: number): string {
  if (!Number.isFinite(value)) return 'Rp -';
  const triliun = 1_000_000_000_000;
  const miliar = 1_000_000_000;
  if (Math.abs(value) >= triliun) return `Rp ${groupThousands(value / triliun, 1)} T`;
  if (Math.abs(value) >= miliar) return `Rp ${groupThousands(value / miliar, 1)} M`;
  return formatRupiah(value);
}

/** Volume ringkas: jt (juta) / rb (ribu). */
export function formatVolume(value: number): string {
  if (!Number.isFinite(value)) return '-';
  if (Math.abs(value) >= 1_000_000) return `${groupThousands(value / 1_000_000, 1)} jt`;
  if (Math.abs(value) >= 1_000) return `${groupThousands(value / 1_000, 1)} rb`;
  return formatNumber(value);
}
