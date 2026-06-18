# =============================================================================
# StockIntelID — satu image: NestJS API + build web Expo disajikan dari satu URL.
# Dipakai oleh Render (lihat render.yaml). Build mock (tanpa DB/kredensial).
# =============================================================================
FROM node:20-bullseye

WORKDIR /app

# 1. Install dependency (manifest dulu agar layer cache efektif).
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
COPY apps/mobile/package.json ./apps/mobile/
RUN npm ci

# 2. Copy source (node_modules dikecualikan via .dockerignore).
COPY . .

# 3. Build paket bersama + API, export web, lalu taruh web di apps/api/public.
RUN npm run build --workspace @idx/shared \
 && npm run build --workspace @idx/api \
 && (cd apps/mobile && npx expo export --platform web --output-dir dist) \
 && rm -rf apps/api/public && mkdir -p apps/api/public \
 && cp -r apps/mobile/dist/* apps/api/public/

ENV NODE_ENV=production
ENV PRICE_PROVIDER=mock
# Render menyuntik PORT; main.ts menghormatinya.
EXPOSE 4000
CMD ["node", "apps/api/dist/main.js"]
