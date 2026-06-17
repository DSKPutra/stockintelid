import { Module } from '@nestjs/common';
import { StockService } from './stock.service';
import { StockController } from './stock.controller';
import { PriceGateway } from './price.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [StockService, PriceGateway],
  controllers: [StockController],
  exports: [StockService],
})
export class StockModule {}
