import { Controller, Get, Post, Body, Param, Query, Headers, UnauthorizedException } from '@nestjs/common';
import { StockService } from './stock.service';
import { AuthService } from '../auth/auth.service';

@Controller('stocks')
export class StockController {
  constructor(
    private readonly stockService: StockService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  async getStocks() {
    return this.stockService.getStocks();
  }

  @Get('search')
  async search(@Query('q') q: string = '') {
    return this.stockService.searchStocks(q);
  }

  @Get('sectors')
  async getSectors() {
    return this.stockService.getSectorList();
  }

  @Get('groups')
  async getGroups() {
    return this.stockService.getControllingGroups();
  }

  @Get('groups/:id')
  async getGroup(@Param('id') id: string) {
    return this.stockService.getControllingGroup(id);
  }

  @Get(':ticker')
  async getStock(@Param('ticker') ticker: string) {
    const stocks = await this.stockService.getStocks();
    const stock = stocks.find(s => s.ticker === ticker.toUpperCase());
    if (!stock) throw new Error(`Stock ${ticker} tidak ditemukan`);
    return stock;
  }

  @Get(':ticker/quote')
  async getQuote(@Param('ticker') ticker: string) {
    return this.stockService.getQuote(ticker);
  }

  @Get(':ticker/ohlcv')
  async getOHLCV(@Param('ticker') ticker: string, @Query('range') range?: string) {
    return this.stockService.getOHLCV(ticker, range);
  }

  @Get(':ticker/fundamentals')
  async getFundamentals(@Param('ticker') ticker: string) {
    return this.stockService.getFundamentals(ticker);
  }

  @Get(':ticker/financials')
  async getFinancials(@Param('ticker') ticker: string) {
    return this.stockService.getFinancials(ticker);
  }

  @Get(':ticker/shareholders')
  async getShareholders(@Param('ticker') ticker: string) {
    return this.stockService.getShareholders(ticker);
  }

  @Get(':ticker/corporate-actions')
  async getCorporateActions(@Param('ticker') ticker: string) {
    return this.stockService.getCorporateActions(ticker);
  }

  @Get(':ticker/disclosures')
  async getDisclosures(@Param('ticker') ticker: string) {
    return this.stockService.getDisclosures(ticker);
  }

  // --- Watchlist Endpoints ---
  private async getEmailFromAuth(authHeader?: string): Promise<string> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token otorisasi diperlukan');
    }
    const token = authHeader.split(' ')[1];
    if (!token) throw new UnauthorizedException('Token kosong');
    const profile = await this.authService.validateToken(token);
    return profile.email;
  }

  @Get('watchlist/list')
  async getWatchlist(@Headers('authorization') authHeader?: string) {
    const email = await this.getEmailFromAuth(authHeader);
    return this.stockService.getWatchlist(email);
  }

  @Post('watchlist/toggle')
  async toggleWatchlist(
    @Headers('authorization') authHeader: string | undefined,
    @Body() body: { ticker: string },
  ) {
    const email = await this.getEmailFromAuth(authHeader);
    return this.stockService.toggleWatchlist(email, body.ticker);
  }
}
