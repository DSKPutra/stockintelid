import { MarketDataProvider } from './provider.interface';
import {
  Stock,
  StockQuote,
  Fundamentals,
  FinancialStatements,
  Shareholder,
  CorporateAction,
  Sector,
  Disclosure,
  OHLCV,
  ControllingGroup,
  MutualFund,
  InvestorType,
  InvestorLocalForeign,
} from './types';

// Data statis untuk Sektor
export const MOCK_SECTORS: Sector[] = [
  { code: 'energy', nameId: 'Energi', nameEn: 'Energy', performance: 2.4, avgPe: 12.5, avgPbv: 1.8, contributionIHSG: 8.5, bestTicker: 'ADRO', worstTicker: 'BUMI' },
  { code: 'basic', nameId: 'Barang Baku', nameEn: 'Basic Materials', performance: -0.8, avgPe: 18.2, avgPbv: 2.1, contributionIHSG: 10.2, bestTicker: 'TPIA', worstTicker: 'INDF' },
  { code: 'industrials', nameId: 'Industri', nameEn: 'Industrials', performance: 1.1, avgPe: 14.1, avgPbv: 1.5, contributionIHSG: 6.4, bestTicker: 'ASII', worstTicker: 'UNTR' },
  { code: 'noncyclic', nameId: 'Konsumer Non-Primer', nameEn: 'Consumer Non-Cyclicals', performance: 0.5, avgPe: 16.4, avgPbv: 3.2, contributionIHSG: 12.1, bestTicker: 'ICBP', worstTicker: 'GOTO' },
  { code: 'cyclic', nameId: 'Konsumer Primer', nameEn: 'Consumer Cyclicals', performance: -1.2, avgPe: 22.1, avgPbv: 2.5, contributionIHSG: 4.8, bestTicker: 'MAPI', worstTicker: 'ACES' },
  { code: 'healthcare', nameId: 'Kesehatan', nameEn: 'Healthcare', performance: 0.2, avgPe: 25.4, avgPbv: 3.8, contributionIHSG: 3.1, bestTicker: 'KLBF', worstTicker: 'MIKA' },
  { code: 'financials', nameId: 'Keuangan', nameEn: 'Financials', performance: 1.8, avgPe: 15.6, avgPbv: 2.2, contributionIHSG: 33.4, bestTicker: 'BBCA', worstTicker: 'BBRI' },
  { code: 'properties', nameId: 'Properti & Real Estate', nameEn: 'Properties & Real Estate', performance: -0.5, avgPe: 11.2, avgPbv: 0.9, contributionIHSG: 5.2, bestTicker: 'BSDE', worstTicker: 'PWON' },
  { code: 'technology', nameId: 'Teknologi', nameEn: 'Technology', performance: -3.5, avgPe: -45.0, avgPbv: 1.2, contributionIHSG: 7.8, bestTicker: 'GOTO', worstTicker: 'BUKA' },
  { code: 'infrastructure', nameId: 'Infrastruktur', nameEn: 'Infrastructure', performance: 3.2, avgPe: 20.8, avgPbv: 4.5, contributionIHSG: 6.8, bestTicker: 'BREN', worstTicker: 'TLKM' },
  { code: 'transportation', nameId: 'Transportasi & Logistik', nameEn: 'Transportation & Logistics', performance: 0.9, avgPe: 13.7, avgPbv: 1.4, contributionIHSG: 1.7, bestTicker: 'RMKE', worstTicker: 'ASSA' },
];

// Data statis untuk Grup Pengendali
export const MOCK_GROUPS: ControllingGroup[] = [
  {
    id: 'barito',
    name: 'Prajogo Pangestu / Barito Grup',
    ultimateOwner: 'Prajogo Pangestu',
    description: 'Konglomerasi energi terbarukan, petrokimia, dan infrastruktur yang dipimpin oleh Prajogo Pangestu. Mengalami ekspansi luar biasa melalui IPO entitas energi hijau BREN.',
    tickers: ['BREN', 'BRPT', 'TPIA', 'CUAN', 'PTRO'],
  },
  {
    id: 'bakrie',
    name: 'Bakrie Group',
    ultimateOwner: 'Keluarga Bakrie',
    description: 'Konglomerasi tertua di Indonesia, bergerak di bidang pertambangan batu bara, minyak & gas, perkebunan, infrastruktur, media, dan kendaraan listrik.',
    tickers: ['BUMI', 'BNBR', 'DEWA', 'ENRG', 'VKTR'],
  },
  {
    id: 'happy',
    name: 'Happy Hapsoro Group',
    ultimateOwner: 'Hapsoro Sukmonohadi (Happy Hapsoro)',
    description: 'Grup bisnis yang berfokus pada logistik batubara, energi minyak bumi, jasa keuangan, dan infrastruktur mineral.',
    tickers: ['RMKE', 'RAJA', 'SDRA'],
  },
  {
    id: 'djarum',
    name: 'Djarum Group',
    ultimateOwner: 'Budi & Michael Hartono',
    description: 'Grup terbesar di Indonesia dari sisi kapitalisasi pasar, ditopang oleh kepemilikan di Bank Central Asia (BBCA) dan infrastruktur menara TOWR.',
    tickers: ['BBCA', 'TOWR'],
  },
  {
    id: 'salim',
    name: 'Salim Group',
    ultimateOwner: 'Anthoni Salim',
    description: 'Raksasa industri makanan (Indofood), perkebunan kelapa sawit, ritel modern (Indomaret), dan infrastruktur.',
    tickers: ['INDF', 'ICBP', 'LSIP'],
  },
  {
    id: 'sinarmas',
    name: 'Sinar Mas Group',
    ultimateOwner: 'Keluarga Widjaja',
    description: 'Grup raksasa pulp & paper, agribisnis, properti (Bumi Serpong Damai BSDE), layanan keuangan, dan telekomunikasi.',
    tickers: ['BSIM', 'BSDE'],
  },
  {
    id: 'astra',
    name: 'Astra / Jardine Group',
    ultimateOwner: 'Jardine Matheson Holdings',
    description: 'Pilar otomotif Indonesia dengan ekspansi masif ke alat berat, pertambangan, agribisnis, infrastruktur, dan jasa keuangan.',
    tickers: ['ASII', 'UNTR'],
  },
];

// Emiten Saham
export const MOCK_STOCKS: Stock[] = [
  // Barito
  { ticker: 'BREN', name: 'PT Barito Renewables Energy Tbk', sectorCode: 'infrastructure', subSector: 'Ketenagalistrikan / EBT', listedShares: 133786228000, listingDate: '2023-10-09', marketCap: 980000000000000, logoUrl: 'https://logo.clearbit.com/barito-renewables.co.id' },
  { ticker: 'BRPT', name: 'PT Barito Pacific Tbk', sectorCode: 'basic', subSector: 'Petrokimia & Investasi', listedShares: 93758000000, listingDate: '1993-08-31', marketCap: 92000000000000, logoUrl: 'https://logo.clearbit.com/barito-pacific.com' },
  { ticker: 'TPIA', name: 'PT Chandra Asri Pacific Tbk', sectorCode: 'basic', subSector: 'Bahan Kimia / Petrokimia', listedShares: 86523000000, listingDate: '2008-05-26', marketCap: 710000000000000, logoUrl: 'https://logo.clearbit.com/chandra-asri.com' },
  { ticker: 'CUAN', name: 'PT Petrindo Jaya Kreasi Tbk', sectorCode: 'energy', subSector: 'Pertambangan Batubara & Mineral', listedShares: 11241000000, listingDate: '2023-03-08', marketCap: 82000000000000, logoUrl: 'https://logo.clearbit.com/petrindo.co.id' },
  { ticker: 'PTRO', name: 'PT Petrosea Tbk', sectorCode: 'industrials', subSector: 'Kontraktor Tambang & Rekayasa', listedShares: 1008600000, listingDate: '1990-05-21', marketCap: 16000000000000, logoUrl: 'https://logo.clearbit.com/petrosea.com' },

  // Bakrie
  { ticker: 'BUMI', name: 'PT Bumi Resources Tbk', sectorCode: 'energy', subSector: 'Pertambangan Batubara', listedShares: 371320000000, listingDate: '1990-07-30', marketCap: 45000000000000, logoUrl: 'https://logo.clearbit.com/bumiresources.com' },
  { ticker: 'BNBR', name: 'PT Bakrie & Brothers Tbk', sectorCode: 'industrials', subSector: 'Manufaktur & Infrastruktur', listedShares: 22100000000, listingDate: '1989-08-28', marketCap: 1200000000000, logoUrl: 'https://logo.clearbit.com/bakrie-brothers.com' },
  { ticker: 'DEWA', name: 'PT Darma Henwa Tbk', sectorCode: 'energy', subSector: 'Kontraktor Batubara', listedShares: 21850000000, listingDate: '2007-09-26', marketCap: 1500000000000, logoUrl: 'https://logo.clearbit.com/ptdh.co.id' },
  { ticker: 'ENRG', name: 'PT Energi Mega Persada Tbk', sectorCode: 'energy', subSector: 'Eksplorasi Minyak & Gas Bumi', listedShares: 24820000000, listingDate: '2004-06-07', marketCap: 5200000000000, logoUrl: 'https://logo.clearbit.com/energi-mp.com' },
  { ticker: 'VKTR', name: 'PT VKTR Teknologi Mobilitas Tbk', sectorCode: 'industrials', subSector: 'Kendaraan Listrik / EV', listedShares: 43750000000, listingDate: '2023-06-19', marketCap: 4800000000000, logoUrl: 'https://logo.clearbit.com/vktr.co.id' },

  // Happy Hapsoro
  { ticker: 'RMKE', name: 'PT RMK Energy Tbk', sectorCode: 'transportation', subSector: 'Jasa Distribusi Batubara', listedShares: 4375000000, listingDate: '2021-12-07', marketCap: 2800000000000, logoUrl: 'https://logo.clearbit.com/rmkenergy.com' },
  { ticker: 'RAJA', name: 'PT Rukun Raharja Tbk', sectorCode: 'energy', subSector: 'Infrastruktur & Distribusi Gas', listedShares: 4227000000, listingDate: '2003-04-19', marketCap: 5400000000000, logoUrl: 'https://logo.clearbit.com/raja.co.id' },
  { ticker: 'SDRA', name: 'PT Bank Woori Saudara Indonesia 1906 Tbk', sectorCode: 'financials', subSector: 'Perbankan Swasta', listedShares: 8560000000, listingDate: '2006-12-15', marketCap: 4900000000000, logoUrl: 'https://logo.clearbit.com/bankwoorisaudara.com' },

  // Lainnya (Djarum/Hartono, Salim, Astra, dll)
  { ticker: 'BBCA', name: 'PT Bank Central Asia Tbk', sectorCode: 'financials', subSector: 'Perbankan Besar', listedShares: 123275000000, listingDate: '2000-05-31', marketCap: 1150000000000000, logoUrl: 'https://logo.clearbit.com/bca.co.id' },
  { ticker: 'BBRI', name: 'PT Bank Rakyat Indonesia (Persero) Tbk', sectorCode: 'financials', subSector: 'Perbankan BUMN', listedShares: 151559000000, listingDate: '2003-11-10', marketCap: 720000000000000, logoUrl: 'https://logo.clearbit.com/bri.co.id' },
  { ticker: 'ADRO', name: 'PT Adaro Energy Indonesia Tbk', sectorCode: 'energy', subSector: 'Produsen Batubara', listedShares: 31985900000, listingDate: '2008-07-16', marketCap: 90000000000000, logoUrl: 'https://logo.clearbit.com/adaro.com' },
  { ticker: 'TLKM', name: 'PT Telkom Indonesia (Persero) Tbk', sectorCode: 'infrastructure', subSector: 'Telekomunikasi', listedShares: 99062000000, listingDate: '1995-11-14', marketCap: 380000000000000, logoUrl: 'https://logo.clearbit.com/telkom.co.id' },
  { ticker: 'GOTO', name: 'PT GoTo Gojek Tokopedia Tbk', sectorCode: 'technology', subSector: 'Teknologi Informasi & Layanan Digital', listedShares: 1201402000000, listingDate: '2022-04-11', marketCap: 75000000000000, logoUrl: 'https://logo.clearbit.com/gotocompany.com' },
  { ticker: 'ASII', name: 'PT Astra International Tbk', sectorCode: 'industrials', subSector: 'Konglomerat Otomotif & Tambang', listedShares: 40483000000, listingDate: '1990-04-04', marketCap: 210000000000000, logoUrl: 'https://logo.clearbit.com/astra.co.id' },
];

export class MockMarketDataProvider implements MarketDataProvider {
  readonly name = 'MockMarketDataProvider';

  private stocks: Stock[] = MOCK_STOCKS;
  private sectors: Sector[] = MOCK_SECTORS;
  private groups: ControllingGroup[] = MOCK_GROUPS;

  async getStocks(): Promise<Stock[]> {
    return this.stocks;
  }

  async getQuote(ticker: string): Promise<StockQuote> {
    const stock = this.stocks.find(s => s.ticker === ticker);
    if (!stock) throw new Error(`Stock ${ticker} not found`);

    // Hasilkan harga quote yang realistis
    let basePrice = 50;
    if (ticker === 'BBCA') basePrice = 9500;
    else if (ticker === 'BBRI') basePrice = 4800;
    else if (ticker === 'BREN') basePrice = 7300;
    else if (ticker === 'TPIA') basePrice = 8200;
    else if (ticker === 'BRPT') basePrice = 980;
    else if (ticker === 'BUMI') basePrice = 120;
    else if (ticker === 'CUAN') basePrice = 7200;
    else if (ticker === 'PTRO') basePrice = 16000;
    else if (ticker === 'ADRO') basePrice = 2800;
    else if (ticker === 'TLKM') basePrice = 3800;
    else if (ticker === 'GOTO') basePrice = 62;
    else if (ticker === 'RMKE') basePrice = 650;
    else if (ticker === 'RAJA') basePrice = 1280;
    else if (ticker === 'ASII') basePrice = 5200;

    const change = Math.floor((Math.random() - 0.45) * (basePrice * 0.05));
    const changePercent = parseFloat(((change / basePrice) * 100).toFixed(2));
    const currentPrice = basePrice + change;

    return {
      ticker,
      price: currentPrice,
      change,
      changePercent,
      open: basePrice,
      high: Math.max(basePrice, currentPrice) + Math.floor(Math.random() * 5),
      low: Math.min(basePrice, currentPrice) - Math.floor(Math.random() * 5),
      volume: 100000 + Math.floor(Math.random() * 20000000),
      value: currentPrice * (100000 + Math.floor(Math.random() * 15000000)),
      lastUpdated: new Date().toISOString(),
    };
  }

  async getOHLCV(ticker: string, range = '30d'): Promise<OHLCV[]> {
    const days = range === '1y' ? 365 : range === '90d' ? 90 : 30;
    let basePrice = 50;
    if (ticker === 'BBCA') basePrice = 9400;
    else if (ticker === 'BBRI') basePrice = 4750;
    else if (ticker === 'BREN') basePrice = 7000;
    else if (ticker === 'TPIA') basePrice = 8000;
    else if (ticker === 'BRPT') basePrice = 950;
    else if (ticker === 'BUMI') basePrice = 110;
    else if (ticker === 'CUAN') basePrice = 7000;
    else if (ticker === 'PTRO') basePrice = 15500;
    else if (ticker === 'ADRO') basePrice = 2700;
    else if (ticker === 'TLKM') basePrice = 3700;
    else if (ticker === 'GOTO') basePrice = 60;
    else if (ticker === 'RMKE') basePrice = 620;
    else if (ticker === 'RAJA') basePrice = 1200;
    else if (ticker === 'ASII') basePrice = 5100;

    const data: OHLCV[] = [];
    const now = new Date();
    let currentPrice = basePrice;

    for (let i = days; i >= 0; i--) {
      const ts = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      // Lewati akhir pekan
      if (ts.getDay() === 0 || ts.getDay() === 6) continue;

      const change = (Math.random() - 0.48) * (currentPrice * 0.03);
      const open = currentPrice;
      const close = currentPrice + change;
      const high = Math.max(open, close) + Math.random() * (currentPrice * 0.01);
      const low = Math.min(open, close) - Math.random() * (currentPrice * 0.01);
      const volume = Math.floor(500000 + Math.random() * 40000000);

      data.push({
        ticker,
        ts: ts.toISOString(),
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        volume,
      });

      currentPrice = close;
    }

    return data;
  }

  async getFundamentals(ticker: string): Promise<Fundamentals> {
    const stock = this.stocks.find(s => s.ticker === ticker);
    if (!stock) throw new Error(`Stock ${ticker} not found`);

    let per = 15;
    let pbv = 2.5;
    let roe = 16.5;
    let der = 0.8;
    let eps = 150;
    let dividendYield = 2.5;
    let netMargin = 15;

    if (ticker === 'BBCA') {
      per = 24.5; pbv = 4.8; roe = 21.2; der = 0.15; eps = 390; dividendYield = 1.8; netMargin = 45.2;
    } else if (ticker === 'BBRI') {
      per = 14.8; pbv = 2.3; roe = 18.5; der = 0.22; eps = 310; dividendYield = 4.5; netMargin = 28.4;
    } else if (ticker === 'BREN') {
      per = 180.5; pbv = 65.2; roe = 35.8; der = 4.2; eps = 40; dividendYield = 0.2; netMargin = 55.4;
    } else if (ticker === 'BRPT') {
      per = 45.2; pbv = 3.1; roe = 6.8; der = 1.6; eps = 21; dividendYield = 0.8; netMargin = 4.2;
    } else if (ticker === 'TPIA') {
      per = 210.0; pbv = 9.8; roe = 1.2; der = 1.1; eps = 38; dividendYield = 0.0; netMargin = 1.0;
    } else if (ticker === 'BUMI') {
      per = 8.2; pbv = 0.85; roe = 10.4; der = 1.8; eps = 14; dividendYield = 0.0; netMargin = 5.8;
    } else if (ticker === 'GOTO') {
      per = -10.5; pbv = 0.8; roe = -8.5; der = 0.08; eps = -6; dividendYield = 0.0; netMargin = -45.0;
    } else if (ticker === 'ADRO') {
      per = 5.4; pbv = 1.1; roe = 22.4; der = 0.5; eps = 520; dividendYield = 9.8; netMargin = 25.1;
    }

    return {
      ticker,
      asOf: '2026-03-31',
      per,
      pbv,
      roe,
      der,
      eps,
      dividendYield,
      netMargin,
      marketCap: stock.marketCap,
      source: 'Laporan Keuangan Q1 2026',
    };
  }

  async getFinancials(ticker: string): Promise<FinancialStatements> {
    const periods = ['2023', '2024', '2025'];
    const dataMap: Record<string, number[]> = {
      BBCA: [99000, 112000, 128000],
      BBRI: [180000, 195000, 215000],
      BREN: [8000, 9200, 10500],
      GOTO: [14000, 12000, 15500],
      ADRO: [110000, 85000, 92000],
      DEFAULT: [10000, 12000, 14500],
    };

    const rev = dataMap[ticker] || dataMap['DEFAULT'] || [10000, 12000, 14500];
    const margin = ticker === 'BBCA' ? 0.45 : ticker === 'BREN' ? 0.55 : ticker === 'GOTO' ? -0.2 : 0.15;
    
    const financialPeriods = periods.map((period, i) => {
      const revenue = rev[i] ?? 10000;
      const netIncome = Math.floor(revenue * margin);
      const totalEquity = Math.floor(revenue * 3);
      const totalLiabilities = Math.floor(totalEquity * (ticker === 'BREN' ? 4 : 0.5));
      const totalAssets = totalEquity + totalLiabilities;
      const operatingCashFlow = Math.floor(netIncome * 1.2);

      return {
        period,
        revenue,
        netIncome,
        totalAssets,
        totalLiabilities,
        totalEquity,
        operatingCashFlow,
      };
    });

    return {
      ticker,
      periods: financialPeriods,
    };
  }

  async getShareholders(ticker: string): Promise<Shareholder[]> {
    const group = this.groups.find(g => g.tickers.includes(ticker));
    const list: Shareholder[] = [];

    // Tambah pemegang saham mayoritas terafiliasi grup
    if (group) {
      if (group.id === 'barito') {
        list.push({
          id: `sh_${ticker}_1`,
          ticker,
          holderName: 'PT Barito Pacific Tbk',
          holderType: 'Corporate',
          localForeign: 'L',
          groupId: 'barito',
          pct: 64.5,
          shares: Math.floor(MOCK_STOCKS.find(s => s.ticker === ticker)!.listedShares * 0.645),
          isController: true,
          asOf: '2026-05-31',
          source: 'Laporan Kepemilikan KSEI',
          verified: true,
        });
        list.push({
          id: `sh_${ticker}_2`,
          ticker,
          holderName: 'Prajogo Pangestu',
          holderType: 'Individual',
          localForeign: 'L',
          groupId: 'barito',
          pct: 12.3,
          shares: Math.floor(MOCK_STOCKS.find(s => s.ticker === ticker)!.listedShares * 0.123),
          isController: true,
          asOf: '2026-05-31',
          source: 'Keterbukaan Informasi IDX',
          verified: true,
        });
      } else if (group.id === 'bakrie') {
        list.push({
          id: `sh_${ticker}_1`,
          ticker,
          holderName: 'PT Bakrie Global Ventura',
          holderType: 'Corporate',
          localForeign: 'L',
          groupId: 'bakrie',
          pct: 35.8,
          shares: Math.floor(MOCK_STOCKS.find(s => s.ticker === ticker)!.listedShares * 0.358),
          isController: true,
          asOf: '2026-05-31',
          source: 'Keterbukaan KSEI',
          verified: true,
        });
        list.push({
          id: `sh_${ticker}_2`,
          ticker,
          holderName: 'NTP Asia Distribution',
          holderType: 'Corporate',
          localForeign: 'F',
          groupId: 'bakrie',
          pct: 9.5,
          shares: Math.floor(MOCK_STOCKS.find(s => s.ticker === ticker)!.listedShares * 0.095),
          isController: false,
          asOf: '2026-05-31',
          source: 'Annual Report 2025',
          verified: false,
        });
      } else if (group.id === 'happy') {
        list.push({
          id: `sh_${ticker}_1`,
          ticker,
          holderName: 'PT Sentraranusa Prima',
          holderType: 'Corporate',
          localForeign: 'L',
          groupId: 'happy',
          pct: 42.1,
          shares: Math.floor(MOCK_STOCKS.find(s => s.ticker === ticker)!.listedShares * 0.421),
          isController: true,
          asOf: '2026-04-30',
          source: 'KSEI Bulanan',
          verified: true,
        });
      }
    }

    // Pemegang saham institusi eksternal untuk melengkapi data
    if (ticker === 'BBCA') {
      list.push({
        id: `sh_${ticker}_ext1`,
        ticker,
        holderName: 'PT Dwimuria Investama Andalan',
        holderType: 'Corporate',
        localForeign: 'L',
        groupId: 'djarum',
        pct: 54.94,
        shares: Math.floor(MOCK_STOCKS.find(s => s.ticker === ticker)!.listedShares * 0.5494),
        isController: true,
        asOf: '2026-05-31',
        source: 'Laporan Registrasi KSEI',
        verified: true,
      });
      list.push({
        id: `sh_${ticker}_ext2`,
        ticker,
        holderName: 'Government of Norway',
        holderType: 'Government',
        localForeign: 'F',
        groupId: null,
        pct: 2.1,
        shares: Math.floor(MOCK_STOCKS.find(s => s.ticker === ticker)!.listedShares * 0.021),
        isController: false,
        asOf: '2026-05-31',
        source: 'KSEI Foreign Registry',
        verified: true,
      });
      list.push({
        id: `sh_${ticker}_ext3`,
        ticker,
        holderName: 'Vanguard Emerging Markets Index Fund',
        holderType: 'Mutual Fund',
        localForeign: 'F',
        groupId: null,
        pct: 1.8,
        shares: Math.floor(MOCK_STOCKS.find(s => s.ticker === ticker)!.listedShares * 0.018),
        isController: false,
        asOf: '2026-05-31',
        source: 'KSEI Foreign Registry',
        verified: true,
      });
    }

    if (ticker === 'BBRI') {
      list.push({
        id: `sh_${ticker}_ext1`,
        ticker,
        holderName: 'Negara Republik Indonesia',
        holderType: 'Government',
        localForeign: 'L',
        groupId: null,
        pct: 53.19,
        shares: Math.floor(MOCK_STOCKS.find(s => s.ticker === ticker)!.listedShares * 0.5319),
        isController: true,
        asOf: '2026-05-31',
        source: 'Laporan Kepemilikan Negara',
        verified: true,
      });
      list.push({
        id: `sh_${ticker}_ext2`,
        ticker,
        holderName: 'BPJS Ketenagakerjaan',
        holderType: 'Pension',
        localForeign: 'L',
        groupId: null,
        pct: 4.2,
        shares: Math.floor(MOCK_STOCKS.find(s => s.ticker === ticker)!.listedShares * 0.042),
        isController: false,
        asOf: '2026-05-31',
        source: 'KSEI Local Institution',
        verified: true,
      });
      list.push({
        id: `sh_${ticker}_ext3`,
        ticker,
        holderName: 'Lo Kheng Hong',
        holderType: 'Individual',
        localForeign: 'L',
        groupId: null,
        pct: 0.8, // Portofolio Lo Kheng Hong
        shares: Math.floor(MOCK_STOCKS.find(s => s.ticker === ticker)!.listedShares * 0.008),
        isController: false,
        asOf: '2026-05-31',
        source: 'Keterbukaan Publik',
        verified: true,
      });
    }

    // Default masyarakat untuk publik sisa
    const totalAffiliated = list.reduce((sum, item) => sum + item.pct, 0);
    list.push({
      id: `sh_${ticker}_pub`,
      ticker,
      holderName: 'Masyarakat / Ritel (<5%)',
      holderType: 'Individual',
      localForeign: 'L',
      groupId: null,
      pct: parseFloat((100 - totalAffiliated).toFixed(2)),
      shares: Math.floor(MOCK_STOCKS.find(s => s.ticker === ticker)!.listedShares * ((100 - totalAffiliated) / 100)),
      isController: false,
      asOf: '2026-05-31',
      source: 'KSEI Registry',
      verified: true,
    });

    return list;
  }

  async getCorporateActions(ticker: string): Promise<CorporateAction[]> {
    return [
      {
        id: `ca_${ticker}_1`,
        ticker,
        type: 'DIVIDEND',
        date: '2026-05-15',
        description: `Pembagian Dividen Tunai Sebesar Rp ${ticker === 'BBCA' ? '270' : ticker === 'BBRI' ? '310' : '25'} per lembar saham.`,
      },
    ];
  }

  async getSectorList(): Promise<Sector[]> {
    return this.sectors;
  }

  async getDisclosures(ticker: string): Promise<Disclosure[]> {
    return [
      {
        id: `disc_${ticker}_1`,
        ticker,
        title: 'Laporan Perubahan Kepemilikan Saham Pengendali KSEI',
        date: '2026-06-10',
        url: 'https://www.idx.co.id/id/berita/keterbukaan-informasi/',
      },
    ];
  }

  // ---- Get Mutual Funds ----
  async getMutualFunds(): Promise<MutualFund[]> {
    return [
      {
        id: 'mf_schroders',
        name: 'Schroders Dana Prestasi Plus',
        manager: 'PT Schroder Investment Management Indonesia',
        aum: 14500, // Rp 14.5 T
        holdings: [
          { ticker: 'BBCA', stockName: 'PT Bank Central Asia Tbk', pct: 9.5 },
          { ticker: 'BBRI', stockName: 'PT Bank Rakyat Indonesia Tbk', pct: 8.8 },
          { ticker: 'ASII', stockName: 'PT Astra International Tbk', pct: 6.2 },
          { ticker: 'TLKM', stockName: 'PT Telkom Indonesia Tbk', pct: 5.4 },
        ]
      },
      {
        id: 'mf_mandiri',
        name: 'Mandiri Saham Atraktif',
        manager: 'PT Mandiri Manajemen Investasi',
        aum: 8200, // Rp 8.2 T
        holdings: [
          { ticker: 'BBRI', stockName: 'PT Bank Rakyat Indonesia Tbk', pct: 9.8 },
          { ticker: 'BBCA', stockName: 'PT Bank Central Asia Tbk', pct: 9.2 },
          { ticker: 'ADRO', stockName: 'PT Adaro Energy Indonesia Tbk', pct: 7.1 },
          { ticker: 'BREN', stockName: 'PT Barito Renewables Energy Tbk', pct: 4.8 },
        ]
      },
      {
        id: 'mf_sucor',
        name: 'Sucorinvest Equity Fund',
        manager: 'PT Sucorinvest Asset Management',
        aum: 6100, // Rp 6.1 T
        holdings: [
          { ticker: 'RMKE', stockName: 'PT RMK Energy Tbk', pct: 8.5 },
          { ticker: 'RAJA', stockName: 'PT Rukun Raharja Tbk', pct: 7.9 },
          { ticker: 'BRPT', stockName: 'PT Barito Pacific Tbk', pct: 6.4 },
          { ticker: 'CUAN', stockName: 'PT Petrindo Jaya Kreasi Tbk', pct: 5.2 },
        ]
      }
    ];
  }
}
