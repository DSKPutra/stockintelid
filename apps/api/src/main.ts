import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { WsAdapter } from '@nestjs/platform-ws';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Gunakan driver WebSocket native (ws) untuk streaming harga realtime.
  app.useWebSocketAdapter(new WsAdapter(app));

  // Aktifkan CORS untuk komunikasi frontend
  app.enableCors({
    origin: '*',
    credentials: true,
  });

  // Prefiks global API
  app.setGlobalPrefix('api');

  const port = process.env.API_PORT || 4000;
  await app.listen(port);
  console.log(`[IDX API] Server berjalan di http://localhost:${port}/api`);
}
bootstrap();
