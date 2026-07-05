import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { ServerlessAppModule } from './serverless-app.module';

// Bootstrap NestJS sebagai handler serverless (Vercel & Netlify). App di-cache
// antar invocation agar cold start hanya sekali. Express dipakai sebagai adapter.
export const server = express();
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

/** Pastikan Nest sudah init (dipakai oleh wrapper Netlify/Vercel). */
export function ensureReady(): Promise<void> {
  if (!initPromise) initPromise = bootstrap();
  return initPromise;
}

// Handler gaya (req,res) untuk Vercel.
export default async function handler(req: unknown, res: unknown): Promise<void> {
  await ensureReady();
  (server as unknown as (req: unknown, res: unknown) => void)(req, res);
}
