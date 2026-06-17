import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import Redis from 'ioredis';
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
  MockMarketDataProvider,
} from '@idx/shared';

@Injectable()
export class StockService implements OnModuleInit, OnModuleDestroy {
  private mockProvider!: MockMarketDataProvider;
  private watchlistMap = new Map<string, string[]>(); // userEmail -> tickers[]
  
  // Database & Cache clients
  private pgPool: Pool | null = null;
  private redisClient: Redis | null = null;
  private useDatabase = false;
  private useRedis = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    this.mockProvider = new MockMarketDataProvider();
    
    // Inisialisasi Postgres & Redis dari Environment
    const dbUrl = this.configService.get<string>('DATABASE_URL');
    const redisUrl = this.configService.get<string>('REDIS_URL');

    // 1. Hubungkan ke PostgreSQL
    if (dbUrl) {
      try {
        console.log('[DATABASE] Mencoba menghubungkan ke PostgreSQL...');
        this.pgPool = new Pool({ connectionString: dbUrl });
        // Tes query sederhana
        await this.pgPool.query('SELECT 1');
        this.useDatabase = true;
        console.log('[DATABASE] Koneksi PostgreSQL berhasil!');
        
        // Auto seeding data bursa jika database kosong
        await this.seedDatabaseIfNeeded();
      } catch (err: any) {
        console.warn(`[DATABASE] Gagal terhubung ke PostgreSQL: ${err.message}. Menggunakan fallback in-memory mock data.`);
        this.pgPool = null;
      }
    }

    // 2. Hubungkan ke Redis
    if (redisUrl) {
      try {
        console.log('[CACHE] Mencoba menghubungkan ke Redis...');
        this.redisClient = new Redis(redisUrl, { maxRetriesPerRequest: 1 });
        this.useRedis = true;
        console.log('[CACHE] Koneksi Redis berhasil!');
      } catch (err: any) {
        console.warn(`[CACHE] Gagal terhubung ke Redis: ${err.message}. Caching dinonaktifkan.`);
        this.redisClient = null;
      }
    }
  }

  async onModuleDestroy() {
    if (this.pgPool) {
      await this.pgPool.end();
    }
    if (this.redisClient) {
      await this.redisClient.quit();
    }
  }

  // --- Auto-Seeding Database dari Mock Data shared module ---
  private async seedDatabaseIfNeeded() {
    if (!this.pgPool) return;

    try {
      const { rows } = await this.pgPool.query('SELECT COUNT(*) FROM stocks');
      const count = parseInt(rows[0]?.count || '0', 10);

      if (count === 0) {
        console.log('[DATABASE] Basis data kosong. Memulai proses seeding data IDX...');
        
        const sectors = await this.mockProvider.getSectorList();
        const stocks = await this.mockProvider.getStocks();
        const groups = require('@idx/shared').MOCK_GROUPS as ControllingGroup[];

        // 1. Seed Sectors
        for (const sec of sectors) {
          await this.pgPool.query(
            'INSERT INTO sectors (code, name_id, name_en) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
            [sec.code, sec.nameId, sec.nameEn]
          );
        }

        // 2. Seed Controlling Groups
        for (const g of groups) {
          await this.pgPool.query(
            'INSERT INTO controlling_groups (id, name, ultimate_owner, description) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
            [g.id, g.name, g.ultimateOwner, g.description]
          );
        }

        // 3. Seed Stocks
        for (const s of stocks) {
          await this.pgPool.query(
            'INSERT INTO stocks (ticker, name, sector_code, sub_sector, listed_shares, listing_date) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING',
            [s.ticker, s.name, s.sectorCode, s.subSector, s.listedShares, s.listingDate]
          );

          // Seed Fundamentals untuk stock
          const fund = await this.mockProvider.getFundamentals(s.ticker);
          await this.pgPool.query(
            'INSERT INTO fundamentals (ticker, as_of, per, pbv, roe, der, eps, dividend_yield, net_margin, market_cap, source) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) ON CONFLICT DO NOTHING',
            [s.ticker, fund.asOf, fund.per, fund.pbv, fund.roe, fund.der, fund.eps, fund.dividendYield, fund.netMargin, fund.marketCap, fund.source]
          );

          // Seed Shareholders
          const holders = await this.mockProvider.getShareholders(s.ticker);
          for (const h of holders) {
            await this.pgPool.query(
              'INSERT INTO shareholders (ticker, holder_name, group_id, pct, shares, is_controller, as_of, source, verified) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
              [s.ticker, h.holderName, h.groupId, h.pct, h.shares, h.isController, h.asOf, h.source, h.verified]
            );
          }

          // Seed 30 hari data awal OHLCV
          const ohlcvList = await this.mockProvider.getOHLCV(s.ticker, '30d');
          for (const o of ohlcvList) {
            await this.pgPool.query(
              'INSERT INTO ohlcv (ticker, ts, open, high, low, close, volume) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING',
              [s.ticker, o.ts, o.open, o.high, o.low, o.close, o.volume]
            );
          }
        }
        
        console.log('[DATABASE] Seeding data IDX sukses!');
      }
    } catch (e: any) {
      console.error('[DATABASE] Gagal melakukan seeding database:', e.message);
    }
  }

  // --- Get Stocks list ---
  async getStocks(): Promise<Stock[]> {
    if (!this.useDatabase || !this.pgPool) {
      return this.mockProvider.getStocks();
    }

    const { rows } = await this.pgPool.query(`
      SELECT s.ticker, s.name, s.sector_code as "sectorCode", s.sub_sector as "subSector", 
             s.listed_shares as "listedShares", s.listing_date as "listingDate", f.market_cap as "marketCap"
      FROM stocks s
      LEFT JOIN fundamentals f ON s.ticker = f.ticker
    `);
    return rows;
  }

  async getStock(ticker: string): Promise<Stock> {
    const stocks = await this.getStocks();
    const stock = stocks.find(s => s.ticker === ticker.toUpperCase());
    if (!stock) throw new Error(`Stock ${ticker} tidak ditemukan`);
    return stock;
  }

  // --- Get Live Quote (dengan Caching Redis) ---
  async getQuote(ticker: string): Promise<StockQuote> {
    const t = ticker.toUpperCase();
    const cacheKey = `quote:${t}`;

    // Coba ambil dari Redis cache
    if (this.useRedis && this.redisClient) {
      try {
        const cached = await this.redisClient.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (err) {
        console.warn('[CACHE] Error saat membaca cache quote:', err);
      }
    }

    // Ambil quote baru
    const quote = await this.mockProvider.getQuote(t);

    // Simpan ke Redis cache (TTL 10 detik untuk realtime data)
    if (this.useRedis && this.redisClient) {
      try {
        await this.redisClient.setex(cacheKey, 10, JSON.stringify(quote));
      } catch (err) {
        console.warn('[CACHE] Error saat menyimpan cache quote:', err);
      }
    }

    return quote;
  }

  // --- Get OHLCV (dengan Caching & Database) ---
  async getOHLCV(ticker: string, range = '30d'): Promise<OHLCV[]> {
    const t = ticker.toUpperCase();
    const cacheKey = `ohlcv:${t}:${range}`;

    // 1. Cek Cache Redis
    if (this.useRedis && this.redisClient) {
      try {
        const cached = await this.redisClient.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (err) {
        console.warn('[CACHE] Error membaca cache ohlcv:', err);
      }
    }

    let ohlcvList: OHLCV[] = [];

    // 2. Ambil dari Postgres Database jika aktif
    if (this.useDatabase && this.pgPool) {
      try {
        const limitDays = range === '1y' ? 365 : range === '90d' ? 90 : 30;
        const { rows } = await this.pgPool.query(
          `SELECT ticker, ts, open, high, low, close, volume 
           FROM ohlcv 
           WHERE ticker = $1 
           ORDER BY ts DESC 
           LIMIT $2`,
          [t, limitDays]
        );
        
        // Kembalikan urutan agar kronologis terurut membesar (kiri ke kanan di grafik)
        ohlcvList = rows.reverse().map(r => ({
          ticker: r.ticker,
          ts: r.ts.toISOString(),
          open: parseFloat(r.open),
          high: parseFloat(r.high),
          low: parseFloat(r.low),
          close: parseFloat(r.close),
          volume: parseInt(r.volume, 10),
        }));
      } catch (err) {
        console.warn('[DATABASE] Gagal mengambil OHLCV:', err);
      }
    }

    // Fallback ke Mock provider jika DB kosong atau gagal
    if (ohlcvList.length === 0) {
      ohlcvList = await this.mockProvider.getOHLCV(t, range);
    }

    // 3. Simpan ke Cache Redis (TTL 60 detik)
    if (this.useRedis && this.redisClient && ohlcvList.length > 0) {
      try {
        await this.redisClient.setex(cacheKey, 60, JSON.stringify(ohlcvList));
      } catch (err) {
        console.warn('[CACHE] Error menyimpan cache ohlcv:', err);
      }
    }

    return ohlcvList;
  }

  // --- Get Fundamentals ---
  async getFundamentals(ticker: string): Promise<Fundamentals> {
    const t = ticker.toUpperCase();

    if (this.useDatabase && this.pgPool) {
      const { rows } = await this.pgPool.query(
        `SELECT ticker, as_of as "asOf", per, pbv, roe, der, eps, dividend_yield as "dividendYield", 
                net_margin as "netMargin", market_cap as "marketCap", source 
         FROM fundamentals 
         WHERE ticker = $1 
         ORDER BY as_of DESC 
         LIMIT 1`,
        [t]
      );
      if (rows[0]) {
        const r = rows[0];
        return {
          ticker: r.ticker,
          asOf: r.asOf.toISOString().split('T')[0],
          per: parseFloat(r.per),
          pbv: parseFloat(r.pbv),
          roe: parseFloat(r.roe),
          der: parseFloat(r.der),
          eps: parseFloat(r.eps),
          dividendYield: parseFloat(r.dividendYield),
          netMargin: parseFloat(r.netMargin),
          marketCap: parseInt(r.marketCap, 10),
          source: r.source,
        };
      }
    }

    return this.mockProvider.getFundamentals(t);
  }

  // --- Get Financials Periodical ---
  async getFinancials(ticker: string): Promise<FinancialStatements> {
    return this.mockProvider.getFinancials(ticker);
  }

  // --- Get Shareholders ---
  async getShareholders(ticker: string): Promise<Shareholder[]> {
    const t = ticker.toUpperCase();

    if (this.useDatabase && this.pgPool) {
      const { rows } = await this.pgPool.query(
        `SELECT id, ticker, holder_name as "holderName", group_id as "groupId", pct, shares, is_controller as "isController", as_of as "asOf", source, verified
         FROM shareholders
         WHERE ticker = $1
         ORDER BY pct DESC`,
        [t]
      );
      if (rows.length > 0) {
        return rows.map(r => ({
          ...r,
          id: String(r.id),
          pct: parseFloat(r.pct),
          shares: parseInt(r.shares, 10),
          asOf: r.asOf.toISOString().split('T')[0],
        }));
      }
    }

    return this.mockProvider.getShareholders(t);
  }

  async getCorporateActions(ticker: string): Promise<CorporateAction[]> {
    return this.mockProvider.getCorporateActions(ticker);
  }

  async getSectorList(): Promise<Sector[]> {
    if (this.useDatabase && this.pgPool) {
      const { rows } = await this.pgPool.query(
        'SELECT code, name_id as "nameId", name_en as "nameEn" FROM sectors'
      );
      if (rows.length > 0) {
        // Ambil data statis kontribusi untuk melengkapi data sektor
        const mockSectors = await this.mockProvider.getSectorList();
        return rows.map(r => {
          const mock = mockSectors.find(s => s.code === r.code) || mockSectors[0]!;
          return {
            ...mock,
            code: r.code,
            nameId: r.nameId,
            nameEn: r.nameEn,
          };
        });
      }
    }
    return this.mockProvider.getSectorList();
  }

  async getDisclosures(ticker: string): Promise<Disclosure[]> {
    return this.mockProvider.getDisclosures(ticker);
  }

  async searchStocks(query: string): Promise<Stock[]> {
    const q = query.toUpperCase();
    const stocks = await this.getStocks();
    return stocks.filter(s => s.ticker.includes(q) || s.name.toUpperCase().includes(q));
  }

  // --- Controlling Groups ---
  async getControllingGroups(): Promise<ControllingGroup[]> {
    const stocks = await this.getStocks();
    let groups: ControllingGroup[] = [];

    if (this.useDatabase && this.pgPool) {
      const { rows } = await this.pgPool.query(
        'SELECT id, name, ultimate_owner as "ultimateOwner", description FROM controlling_groups'
      );
      
      const mockGroups = require('@idx/shared').MOCK_GROUPS as ControllingGroup[];
      groups = rows.map(r => {
        const mock = mockGroups.find(x => x.id === r.id) || mockGroups[0]!;
        return {
          id: r.id,
          name: r.name,
          ultimateOwner: r.ultimateOwner,
          description: r.description,
          tickers: mock.tickers,
        };
      });
    } else {
      groups = require('@idx/shared').MOCK_GROUPS as ControllingGroup[];
    }

    return groups.map(group => {
      const groupStocks = stocks.filter(s => group.tickers.includes(s.ticker));
      const totalMarketCap = groupStocks.reduce((sum, s) => sum + s.marketCap, 0);
      const avgPerformance = parseFloat((Math.random() * 10 - 4).toFixed(2));

      return {
        ...group,
        totalMarketCap,
        avgPerformance,
      };
    });
  }

  async getControllingGroup(id: string): Promise<ControllingGroup & { stocks: Stock[] }> {
    const groups = await this.getControllingGroups();
    const group = groups.find(g => g.id === id);
    if (!group) throw new Error(`Group ${id} tidak ditemukan`);

    const allStocks = await this.getStocks();
    const groupStocks = allStocks.filter(s => group.tickers.includes(s.ticker));

    return {
      ...group,
      stocks: groupStocks,
    };
  }

  // --- Watchlist ---
  async getWatchlist(email: string): Promise<string[]> {
    return this.watchlistMap.get(email) || [];
  }

  async toggleWatchlist(email: string, ticker: string): Promise<string[]> {
    const t = ticker.toUpperCase();
    let current = this.watchlistMap.get(email) || [];
    if (current.includes(t)) {
      current = current.filter(x => x !== t);
    } else {
      current = [...current, t];
    }
    this.watchlistMap.set(email, current);
    return current;
  }
}
