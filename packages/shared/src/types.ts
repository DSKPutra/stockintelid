export interface Stock {
  ticker: string;
  name: string;
  sectorCode: string;
  subSector: string;
  listedShares: number;
  listingDate: string;
  logoUrl?: string;
  marketCap: number;
}

export interface StockQuote {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  value: number;
  lastUpdated: string;
}

export interface Fundamentals {
  ticker: string;
  asOf: string;
  per: number;
  pbv: number;
  roe: number;
  der: number;
  eps: number;
  dividendYield: number;
  netMargin: number;
  marketCap: number;
  source: string;
}

export interface FinancialPeriod {
  period: string; // e.g., "2023", "2024", "2025" atau "2025-Q1"
  revenue: number;
  netIncome: number;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  operatingCashFlow: number;
}

export interface FinancialStatements {
  ticker: string;
  periods: FinancialPeriod[];
}

export interface Shareholder {
  id: string;
  ticker: string;
  holderName: string;
  groupId: string | null;
  pct: number;
  shares: number;
  isController: boolean;
  asOf: string;
  source: string;
  verified: boolean;
}

export interface ControllingGroup {
  id: string; // 'barito' | 'bakrie' | 'happy' | etc.
  name: string;
  ultimateOwner: string;
  description: string;
  tickers: string[];
  totalMarketCap?: number;
  avgPerformance?: number;
  sectorDistribution?: { sectorCode: string; percentage: number }[];
}

export interface OHLCV {
  ticker: string;
  ts: string; // ISO String or Date string
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Sector {
  code: string; // e.g., 'energy', 'financials'
  nameId: string;
  nameEn: string;
  performance: number; // YTD or daily change %
  avgPe: number;
  avgPbv: number;
  contributionIHSG: number; // e.g. % weighting
  bestTicker: string;
  worstTicker: string;
}

export interface CorporateAction {
  id: string;
  ticker: string;
  type: 'DIVIDEND' | 'RUPS' | 'SPLIT' | 'RIGHTS';
  date: string;
  description: string;
}

export interface Disclosure {
  id: string;
  ticker: string;
  title: string;
  date: string;
  url: string;
}

export interface WatchlistItem {
  ticker: string;
  addedAt: string;
}

export interface UserProfile {
  email: string;
  role: 'free' | 'premium' | 'admin';
  createdAt: string;
}
