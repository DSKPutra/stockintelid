import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { StockModule } from './stock/stock.module';
import { RealtimeModule } from './stock/realtime.module';
import { ChatbotModule } from './chatbot/chatbot.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    // Sajikan build web Expo (apps/api/public) dari URL yang sama dengan API.
    // Semua rute /api/* dikecualikan agar tetap ditangani controller.
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      exclude: ['/api/(.*)'],
    }),
    AuthModule,
    StockModule,
    RealtimeModule,
    ChatbotModule,
  ],
})
export class AppModule {}
