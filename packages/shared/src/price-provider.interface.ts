// Abstraksi penyedia harga realtime (provider/adapter). Dipilih via env
// PRICE_PROVIDER=tradingview|api|mock. Harga = REALTIME (beda dari kepemilikan
// yang periodik). Lihat ApiPriceProvider (server) untuk integrasi vendor berbayar.
import { OHLCV, StockQuote } from './types';
import { MockMarketDataProvider } from './mock-data.generator';

/** Fungsi untuk berhenti berlangganan stream. */
export type Unsubscribe = () => void;

export interface PriceProvider {
  readonly name: string;
  getQuote(symbol: string): Promise<StockQuote>;
  getQuotesBatch(symbols: string[]): Promise<StockQuote[]>;
  getOHLCV(symbol: string, interval?: string): Promise<OHLCV[]>;
  /** Stream tick berkala; mengembalikan fungsi unsubscribe. */
  subscribe(symbols: string[], cb: (quote: StockQuote) => void): Unsubscribe;
}

/**
 * Adapter `mock` — simulasi tick realistis tanpa kredensial (default dev).
 * Memakai ulang MockMarketDataProvider untuk quote/OHLCV.
 */
export class MockPriceProvider implements PriceProvider {
  readonly name = 'MockPriceProvider';
  private readonly md = new MockMarketDataProvider();

  async getQuote(symbol: string): Promise<StockQuote> {
    return this.md.getQuote(symbol.toUpperCase());
  }

  async getQuotesBatch(symbols: string[]): Promise<StockQuote[]> {
    return Promise.all(symbols.map((s) => this.getQuote(s)));
  }

  async getOHLCV(symbol: string, interval = '30d'): Promise<OHLCV[]> {
    return this.md.getOHLCV(symbol.toUpperCase(), interval);
  }

  subscribe(symbols: string[], cb: (quote: StockQuote) => void): Unsubscribe {
    const timer = setInterval(async () => {
      for (const s of symbols) {
        try {
          cb(await this.getQuote(s));
        } catch {
          /* abaikan simbol gagal */
        }
      }
    }, 2000);
    return () => clearInterval(timer);
  }
}
