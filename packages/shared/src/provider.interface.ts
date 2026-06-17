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
  MutualFund,
} from './types';

export interface MarketDataProvider {
  name: string;
  getStocks(): Promise<Stock[]>;
  getQuote(ticker: string): Promise<StockQuote>;
  getOHLCV(ticker: string, range?: string): Promise<OHLCV[]>;
  getFundamentals(ticker: string): Promise<Fundamentals>;
  getFinancials(ticker: string): Promise<FinancialStatements>;
  getShareholders(ticker: string): Promise<Shareholder[]>;
  getCorporateActions(ticker: string): Promise<CorporateAction[]>;
  getSectorList(): Promise<Sector[]>;
  getDisclosures(ticker: string): Promise<Disclosure[]>;
  getMutualFunds(): Promise<MutualFund[]>;
}
