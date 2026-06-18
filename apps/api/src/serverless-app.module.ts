import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { StockModule } from './stock/stock.module';
import { ChatbotModule } from './chatbot/chatbot.module';

// Komposisi modul untuk lingkungan SERVERLESS (Vercel function):
// tanpa ServeStaticModule (Vercel sajikan web statis) & tanpa WebSocket gateway
// (tak ada socket persisten). REST + chatbot tetap jalan dengan data mock.
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    StockModule,
    ChatbotModule,
  ],
})
export class ServerlessAppModule {}
