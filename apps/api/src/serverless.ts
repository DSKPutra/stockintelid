import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { ServerlessAppModule } from './serverless-app.module';

// Bootstrap NestJS sebagai handler serverless (Vercel). App di-cache antar
// invocation agar cold start hanya sekali. Express dipakai sebagai adapter.
const server = express();
let initPromise: Promise<void> | null = null;

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(
    ServerlessAppModule,
    new ExpressAdapter(server),
    { logger: ['error', 'warn'] },
  );
  app.enableCors();
  app.setGlobalPrefix('api');
  await app.init();
}

export default async function handler(req: unknown, res: unknown): Promise<void> {
  if (!initPromise) initPromise = bootstrap();
  await initPromise;
  // Teruskan ke instance Express milik Nest.
  (server as unknown as (req: unknown, res: unknown) => void)(req, res);
}
