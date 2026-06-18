import { Module } from '@nestjs/common';
import { StockService } from './stock.service';
import { StockController } from './stock.controller';
import { PriceProviderService } from './price-provider.service';
import { AuthModule } from '../auth/auth.module';

// Catatan: PriceGateway (WebSocket) dipindah ke RealtimeModule agar StockModule
// aman dipakai di lingkungan serverless (Vercel) yang tak punya socket persisten.
@Module({
  imports: [AuthModule],
  providers: [StockService, PriceProviderService],
  controllers: [StockController],
  exports: [StockService, PriceProviderService],
})
export class StockModule {}
