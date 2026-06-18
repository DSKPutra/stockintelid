import { Module } from '@nestjs/common';
import { StockModule } from './stock.module';
import { PriceGateway } from './price.gateway';

// Modul WebSocket realtime — hanya dipakai oleh server penuh (main.ts), bukan
// di lingkungan serverless. Mengandalkan PriceProviderService dari StockModule.
@Module({
  imports: [StockModule],
  providers: [PriceGateway],
})
export class RealtimeModule {}
