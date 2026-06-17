import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { StockService } from './stock.service';

@WebSocketGateway({
  path: '/ws/price',
  cors: { origin: '*' },
})
export class PriceGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: any;

  private activeTickers = new Set<string>();
  private intervalId: NodeJS.Timeout | null = null;

  constructor(private readonly stockService: StockService) {}

  handleConnection(client: any) {
    console.log(`[WEBSOCKET] Client terhubung: ${client.id || 'anonymous'}`);
    this.startStreaming();
  }

  handleDisconnect(client: any) {
    console.log(`[WEBSOCKET] Client terputus: ${client.id || 'anonymous'}`);
    if (this.server && this.server.clients && this.server.clients.size === 0) {
      this.stopStreaming();
    }
  }

  @SubscribeMessage('subscribeStock')
  handleSubscribeStock(client: any, payload: { ticker: string }) {
    const ticker = payload.ticker.toUpperCase();
    this.activeTickers.add(ticker);
    console.log(`[WEBSOCKET] Client subscribe ke ticker: ${ticker}`);
    
    // Kirim harga awal secara instan
    this.sendQuoteUpdate(ticker);
  }

  @SubscribeMessage('unsubscribeStock')
  handleUnsubscribeStock(client: any, payload: { ticker: string }) {
    const ticker = payload.ticker.toUpperCase();
    this.activeTickers.delete(ticker);
    console.log(`[WEBSOCKET] Client unsubscribe dari ticker: ${ticker}`);
  }

  private startStreaming() {
    if (this.intervalId) return;

    this.intervalId = setInterval(async () => {
      if (this.activeTickers.size === 0) {
        // Jika tidak ada ticker yang disubscribe, kirim random emiten dari watchlist default
        const defaults = ['BBCA', 'BBRI', 'BREN', 'GOTO', 'ADRO'];
        const randomTicker = defaults[Math.floor(Math.random() * defaults.length)]!;
        await this.sendQuoteUpdate(randomTicker);
        return;
      }

      for (const ticker of this.activeTickers) {
        await this.sendQuoteUpdate(ticker);
      }
    }, 2000);
  }

  private stopStreaming() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[WEBSOCKET] Streaming harga dihentikan karena tidak ada klien aktif');
    }
  }

  private async sendQuoteUpdate(ticker: string) {
    try {
      const quote = await this.stockService.getQuote(ticker);
      const message = JSON.stringify({ event: 'priceUpdate', data: quote });
      
      // Kirim ke semua client yang tersambung
      if (this.server && this.server.clients) {
        this.server.clients.forEach((client: any) => {
          if (client.readyState === 1) { // OPEN state
            client.send(message);
          }
        });
      }
    } catch (e) {
      console.error(`[WEBSOCKET] Error saat update harga ${ticker}:`, e);
    }
  }
}
