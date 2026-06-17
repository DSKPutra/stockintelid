// i18n ringan (ID default, EN disiapkan). Diperluas seiring fitur bertambah.
// Frontend membungkus ini lewat hook/store; backend dapat memakainya untuk pesan.

export type Locale = 'id' | 'en';

type Dict = Record<string, { id: string; en: string }>;

export const MESSAGES: Dict = {
  'nav.dashboard': { id: 'Dashboard', en: 'Dashboard' },
  'nav.sectors': { id: 'Sektoral', en: 'Sectors' },
  'nav.ownership': { id: 'Kepemilikan', en: 'Ownership' },
  'nav.screener': { id: 'Screener', en: 'Screener' },
  'nav.chatbot': { id: 'Asisten AI', en: 'AI Assistant' },
  'dashboard.ihsg': {
    id: 'IHSG (Indeks Harga Saham Gabungan)',
    en: 'IDX Composite Index',
  },
  'dashboard.watchlist': { id: 'Watchlist Saya', en: 'My Watchlist' },
  'dashboard.movers': { id: 'Penggerak Pasar', en: 'Market Movers' },
  'dashboard.topGainers': { id: 'Top Gainers', en: 'Top Gainers' },
  'dashboard.topLosers': { id: 'Top Losers', en: 'Top Losers' },
  'dashboard.sectorPerf': { id: 'Kinerja Sektoral (IDX-IC)', en: 'Sector Performance (IDX-IC)' },
  'dashboard.lastUpdated': { id: 'Terakhir Diperbarui', en: 'Last updated' },
  'common.login': { id: 'Masuk', en: 'Sign in' },
  'common.loading': { id: 'Memuat data bursa IDX...', en: 'Loading IDX market data...' },
};

export function t(key: string, locale: Locale = 'id'): string {
  const entry = MESSAGES[key];
  if (!entry) return key;
  return entry[locale] ?? entry.id;
}
