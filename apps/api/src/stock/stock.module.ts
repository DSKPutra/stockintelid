import { Module } from '@nestjs/common';
import { StockService } from './stock.service';
import { StockController } from './stock.controller';
import { PriceGateway } from './price.gateway';
import { PriceProviderService } from './price-provider.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [StockService, PriceProviderService, PriceGateway],
  controllers: [StockController],
  exports: [StockService, PriceProviderService],
})
export class StockModule {}
