import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PriceProvider,
  MockPriceProvider,
  Unsubscribe,
  StockQuote,
  OHLCV,
} from '@idx/shared';

/**
 * Adapter `api` — kerangka integrasi vendor harga IDX realtime (REST/WebSocket).
 * Kredensial via env: PRICE_API_BASE_URL, PRICE_API_KEY (JANGAN hardcode).
 *
 * LEGAL: penyedia data realtime IDX umumnya berbayar/berlisensi. Patuhi Terms of
 * Service & lisensi vendor sebelum mengaktifkan adapter ini di produksi.
 */
class ApiPriceProvider implements PriceProvider {
  readonly name = 'ApiPriceProvider';
  private readonly fallback = new MockPriceProvider();

  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
    private readonly logger: Logger,
  ) {}

  private configured(): boolean {
    return Boolean(this.baseUrl && this.apiKey);
  }

  async getQuote(symbol: string): Promise<StockQuote> {
    if (!this.configured()) return this.fallback.getQuote(symbol);
    // LEGAL/TODO: panggil vendor nyata, mis.
    //   const r = await fetch(`${this.baseUrl}/quote/${symbol}`,
    //     { headers: { Authorization: `Bearer ${this.apiKey}` } });
    this.logger.warn('ApiPriceProvider.getQuote belum diimplementasi — fallback ke mock.');
    return this.fallback.getQuote(symbol);
  }

  async getQuotesBatch(symbols: string[]): Promise<StockQuote[]> {
    return Promise.all(symbols.map((s) => this.getQuote(s)));
  }

  async getOHLCV(symbol: string, interval = '30d'): Promise<OHLCV[]> {
    if (!this.configured()) return this.fallback.getOHLCV(symbol, interval);
    this.logger.warn('ApiPriceProvider.getOHLCV belum diimplementasi — fallback ke mock.');
    return this.fallback.getOHLCV(symbol, interval);
  }

  subscribe(symbols: string[], cb: (q: StockQuote) => void): Unsubscribe {
    // LEGAL/TODO: gunakan WebSocket vendor; sementara pakai simulasi mock.
    return this.fallback.subscribe(symbols, cb);
  }
}

/**
 * Pilih penyedia harga lewat env PRICE_PROVIDER (tradingview|api|mock).
 * - mock (default): simulasi tick tanpa kredensial.
 * - tradingview: data mentah tetap dari mock (widget TV = visual di klien).
 * - api: vendor realtime nyata (kerangka, butuh env).
 */
@Injectable()
export class PriceProviderService {
  private readonly logger = new Logger(PriceProviderService.name);
  private readonly provider: PriceProvider;

  constructor(private readonly config: ConfigService) {
    const choice = (this.config.get<string>('PRICE_PROVIDER') || 'mock').toLowerCase();
    if (choice === 'api') {
      this.provider = new ApiPriceProvider(
        this.config.get<string>('PRICE_API_BASE_URL') || '',
        this.config.get<string>('PRICE_API_KEY') || '',
        this.logger,
      );
    } else {
      // 'mock' & 'tradingview' memakai data mock di server.
      this.provider = new MockPriceProvider();
    }
    this.logger.log(`Penyedia harga aktif: ${choice} (${this.provider.name})`);
  }

  get name(): string {
    return this.provider.name;
  }

  getQuote(symbol: string): Promise<StockQuote> {
    return this.provider.getQuote(symbol);
  }

  getQuotesBatch(symbols: string[]): Promise<StockQuote[]> {
    return this.provider.getQuotesBatch(symbols);
  }

  getOHLCV(symbol: string, interval?: string): Promise<OHLCV[]> {
    return this.provider.getOHLCV(symbol, interval);
  }

  subscribe(symbols: string[], cb: (q: StockQuote) => void): Unsubscribe {
    return this.provider.subscribe(symbols, cb);
  }
}
