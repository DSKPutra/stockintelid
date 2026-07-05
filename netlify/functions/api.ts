// Netlify Function: jalankan NestJS (REST) sebagai serverless.
// Memuat Nest yang SUDAH dikompilasi tsc (apps/api/dist) agar metadata dekorator
// terjaga; dibungkus serverless-http untuk event gaya AWS Lambda milik Netlify.
// WebSocket & data periodik tak berlaku di serverless — REST mock tetap jalan.
import serverless from 'serverless-http';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { server, ensureReady } = require('../../apps/api/dist/serverless');

const slsHandler = serverless(server);

export const handler = async (event: any, context: any) => {
  await ensureReady();
  // Normalisasi path agar diawali '/api' (sesuai setGlobalPrefix Nest),
  // apa pun bentuk path setelah redirect Netlify.
  const raw: string = event.path || '/';
  const idx = raw.indexOf('/api');
  if (idx > 0) event.path = raw.slice(idx);
  return slsHandler(event, context);
};
