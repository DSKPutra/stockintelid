// Estimasi free float metode MSCI (disederhanakan) — sumber kebenaran tunggal,
// dipakai bersama backend (screener) & bisa diuji unit secara terpisah.
//
// Klasifikasi (MSCI Global Investable Market Indexes, disederhanakan):
//  - STRATEGIC (non-free-float): pemegang pengendali, korporasi, bank investasi,
//    yayasan, pemerintah, dan INDIVIDU TERAFILIASI (punya groupId / pengendali).
//  - PORTFOLIO (free float): reksa dana, asuransi, dana pensiun, broker, ritel
//    ("Masyarakat"), serta individu non-terafiliasi.
import { InvestorType, Shareholder } from './types';

export const STRATEGIC_INVESTOR_TYPES: ReadonlySet<InvestorType> = new Set<InvestorType>([
  'Corporate',
  'Investment Bank',
  'Foundation',
  'Government',
]);

export const PORTFOLIO_INVESTOR_TYPES: ReadonlySet<InvestorType> = new Set<InvestorType>([
  'Mutual Fund',
  'Insurance',
  'Pension',
  'Broker',
]);

export type FloatRisk = 'Low' | 'Medium' | 'High';

/** Subset field yang dibutuhkan untuk klasifikasi (agar mudah diuji). */
export type HolderClassification = Pick<
  Shareholder,
  'holderName' | 'holderType' | 'isController' | 'groupId' | 'pct'
>;

export interface FloatEstimate {
  strategicPct: number;
  freeFloatPct: number;
  topHolder: string;
  riskLevel: FloatRisk;
  /** Pemegang saham dengan kepemilikan > 1% (untuk kolom "top holders"). */
  topHoldersAbove1: { holderName: string; pct: number }[];
}

/** Apakah holder tergolong strategis (non-free-float) menurut metode MSCI. */
export function isStrategicHolder(h: HolderClassification): boolean {
  // Ritel/masyarakat selalu free float.
  if (/masyarakat|publik|public/i.test(h.holderName)) return false;
  // Pengendali selalu strategis.
  if (h.isController) return true;
  if (STRATEGIC_INVESTOR_TYPES.has(h.holderType)) return true;
  // Individu hanya strategis bila terafiliasi grup.
  if (h.holderType === 'Individual' && h.groupId) return true;
  return false;
}

function roundPct(v: number): number {
  return parseFloat(v.toFixed(2));
}

/** Risiko likuiditas dari estimasi free float. */
export function freeFloatRisk(freeFloatPct: number): FloatRisk {
  if (freeFloatPct < 20) return 'High';
  if (freeFloatPct < 40) return 'Medium';
  return 'Low';
}

/** Hitung estimasi free float dari daftar pemegang saham. */
export function computeFreeFloat(holders: HolderClassification[]): FloatEstimate {
  const strategicPct = roundPct(
    holders.filter(isStrategicHolder).reduce((sum, h) => sum + h.pct, 0),
  );
  const freeFloatPct = roundPct(Math.max(0, Math.min(100, 100 - strategicPct)));

  const sorted = [...holders].sort((a, b) => b.pct - a.pct);
  const topHolder = sorted[0]?.holderName ?? 'Masyarakat';
  const topHoldersAbove1 = sorted
    .filter((h) => h.pct > 1)
    .map((h) => ({ holderName: h.holderName, pct: h.pct }));

  return {
    strategicPct,
    freeFloatPct,
    topHolder,
    riskLevel: freeFloatRisk(freeFloatPct),
    topHoldersAbove1,
  };
}
