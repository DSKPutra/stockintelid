import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { WsAdapter } from '@nestjs/platform-ws';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
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

  // Dokumentasi OpenAPI/Swagger di /api/docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('IDX App API')
    .setDescription(
      'API analisa saham IDX (data mock M1). Alat informasi/edukasi, bukan rekomendasi investasi.',
    )
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.API_PORT || 4000;
  await app.listen(port);
  console.log(`[IDX API] Server berjalan di http://localhost:${port}/api`);
  console.log(`[IDX API] Dokumentasi Swagger di http://localhost:${port}/api/docs`);
}
bootstrap();
