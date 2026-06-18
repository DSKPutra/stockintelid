// Vercel Serverless Function (catch-all) untuk semua rute /api/*.
// Memuat NestJS yang SUDAH dikompilasi tsc (apps/api/dist) — bukan TS mentah —
// agar metadata dekorator terjaga dan DI Nest berfungsi di runtime Vercel.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const mod = require('../apps/api/dist/serverless');
const handler = mod.default || mod;

module.exports = handler;
module.exports.default = handler;
