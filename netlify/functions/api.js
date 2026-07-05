// Netlify Function (CommonJS) — jalankan NestJS (REST) sebagai serverless.
// CJS eksplisit agar Netlify me-load-nya sebagai CommonJS (bukan ESM).
// Memuat Nest yang SUDAH dikompilasi tsc (apps/api/dist) agar metadata dekorator
// terjaga; dibungkus serverless-http untuk event gaya AWS Lambda milik Netlify.
// WebSocket & data periodik tak berlaku di serverless — REST mock tetap jalan.
const serverless = require('serverless-http');
const { server, ensureReady } = require('../../apps/api/dist/serverless');

const slsHandler = serverless(server);

exports.handler = async (event, context) => {
  await ensureReady();
  // Normalisasi path agar diawali '/api' (sesuai setGlobalPrefix Nest),
  // apa pun bentuk path setelah rewrite Netlify.
  const raw = event.path || '/';
  const idx = raw.indexOf('/api');
  if (idx > 0) event.path = raw.slice(idx);
  return slsHandler(event, context);
};
