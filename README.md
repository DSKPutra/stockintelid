# Aplikasi Analisa Saham IDX (Web + Mobile, Satu Codebase)

Aplikasi analisa saham Bursa Efek Indonesia (IDX) premium berbasis **cross-platform** (iOS, Android, dan Web dari satu codebase) yang menampilkan data fundamental, pergerakan harga, kepemilikan pengendali (konglomerasi), sektoral, screener multi-metrik, dan asisten AI Chatbot berbasis **RAG (Retrieval-Augmented Generation) + Tool Calling**.

> ⚠️ **Disclaimer Hukum:** Platform ini dirancang murni sebagai alat informasi dan edukasi keuangan, bukan rekomendasi/ajakan transaksi jual atau beli efek keuangan. Keputusan investasi sepenuhnya merupakan tanggung jawab pengguna secara mandiri (DYOR).

---

## ✅ Status Milestone

| Milestone | Cakupan | Status |
|-----------|---------|--------|
| **M1 — Fondasi** | Monorepo, paket bersama, provider data mock, API NestJS (REST + WebSocket + Swagger), auth OTP/JWT, app Expo (web+mobile), tema dark/light, i18n ID/EN, formatter id-ID, dashboard end-to-end | ✅ Selesai & terverifikasi jalan |
| **M2 — Data inti** | Detail saham (chart/fundamental/laporan keuangan), watchlist, DB Postgres/Timescale | 🟡 UI & endpoint tersedia |
| **M3 — Ownership & Sektor** | Kepemilikan, per-konglomerat, analisa sektor, visualisasi | 🟡 Layar & data tersedia |
| **M4 — Screener & Chatbot** | Screener, chatbot (ringkasan+reasoning+tabel+chart+disclaimer) | 🟡 Endpoint & layar tersedia |
| **M5 — Hardening** | Test menyeluruh, optimasi, build web + EAS mobile | ⬜ Belum |

---

## 🏗️ Struktur Arsitektur Monorepo

Proyek ini dibangun menggunakan struktur **npm workspaces monorepo** terintegrasi:

```
├── apps/
│   ├── api/             # Backend API Server (NestJS, REST, WebSocket & RAG Engine)
│   └── mobile/          # Frontend Web & Mobile App (Expo + React Native Web)
├── packages/
│   └── shared/          # Library Bersama (Tipe data TypeScript, Interface Provider, & Mock Data)
├── infra/
│   └── db/
│       └── init/        # Skema SQL inisialisasi basis data PostgreSQL + TimescaleDB
├── docker-compose.yml   # Kontainerisasi PostgreSQL, TimescaleDB, dan Redis lokal
└── package.json         # Workspace manifest root
```

---

## ⚡ Tech Stack Utama

- **Frontend (Satu Codebase):** [Expo](https://expo.dev/) (React Native) + **React Native Web** (Metro bundler).
- **State & Data Fetching:** Zustand (Global State) + TanStack Query.
- **Charting Engine:** Grafik candlestick, volume, dan Simple Moving Average (MA) interaktif kustom berbasis **SVG Lintas Platform** (`react-native-svg`).
- **Backend API:** Node.js + NestJS (Modular modules: `Auth`, `Stock`, `Chatbot`).
- **Realtime Price Stream:** WebSockets Gateway (simulasi tick harga per 2 detik).
- **Database & Cache:** PostgreSQL (relasional) + TimescaleDB (OHLCV time-series) + Redis (Cache TTL & rate-limiting).
- **Bahasa pemrograman:** TypeScript (Strict Mode) end-to-end.

---

## ⚙️ Persiapan & Instalasi Lokal

### Prerequisites
Pastikan perangkat Anda telah terinstall:
- **Node.js** v20 atau lebih baru.
- **Docker & Docker Compose** (jika ingin menjalankan database PostgreSQL & Redis).

### Langkah-Langkah

1. **Clone & Salin Environment:**
   Salin berkas `.env.example` menjadi `.env` di direktori utama:
   ```bash
   cp .env.example .env
   ```

2. **Instalasi Dependensi Monorepo:**
   Jalankan perintah berikut di root folder untuk menginstal seluruh dependensi sub-proyek secara otomatis:
   ```bash
   npm install
   ```

3. **Kompilasi Modul Bersama:**
   Lakukan build pada paket `@idx/shared` terlebih dahulu agar tipe datanya terdeteksi secara global:
   ```bash
   npm run build:shared
   ```

4. **Nyalakan Database (Opsional - Berjalan Otomatis Fallback):**
   Nyalakan Postgres/TimescaleDB dan Redis menggunakan Docker:
   ```bash
   docker compose up -d
   ```
   *Catatan: Jika kontainer database tidak aktif, backend API akan secara otomatis mengaktifkan **local fallback in-memory mock provider** sehingga server tetap berjalan normal untuk kebutuhan demo tanpa crash.*

5. **Jalankan Aplikasi:**
   Mulai server Backend API dan Frontend Web secara bersamaan dengan perintah:
   ```bash
   npm run dev
   ```
   - **Backend API:** Berjalan di `http://localhost:4000/api`
   - **Dokumentasi API (Swagger/OpenAPI):** `http://localhost:4000/api/docs`
   - **Frontend Expo Web:** Terbuka di browser Anda pada port `http://localhost:8081` (atau port terdekat yang tersedia).
   - **Mobile Device:** Buka aplikasi **Expo Go** pada perangkat iOS/Android Anda, lalu pindai QR Code yang tercetak di terminal untuk membukanya secara native.

---

## 🚀 Panduan Deploy / Push ke GitHub Anda

Direktori ini **belum** menjadi repositori Git. Untuk mengunggahnya ke GitHub:

1. Inisialisasi Git dan buat commit pertama di direktori proyek ini:
   ```bash
   git init
   git add .
   git commit -m "feat: IDX Stock Analyzer monorepo (M1)"
   git branch -M main
   ```
2. Buat repositori baru di akun GitHub Anda (mis. `idx-stock-analyzer`). Jangan centang
   inisialisasi README atau `.gitignore` — berkas tersebut sudah ada di lokal.
3. Daftarkan remote dan dorong kode:
   ```bash
   git remote add origin https://github.com/USERNAME/idx-stock-analyzer.git
   git push -u origin main
   ```
4. Selesai! Seluruh kode aplikasi Anda kini tersimpan di GitHub.

---

## 👨‍💻 Panduan Pengembangan & Kontribusi

### 1. Menambahkan Grup Pengendali / Konglomerasi Baru
Untuk mendaftarkan grup baru (seperti Salim, Djarum, dll), tambahkan entri grup tersebut ke dalam berkas [mock-data.generator.ts](packages/shared/src/mock-data.generator.ts) pada konstanta `MOCK_GROUPS` dan emitennya pada `MOCK_STOCKS`. Skema database akan memuat data baru tersebut secara otomatis saat inisialisasi pertama kali.

### 2. Mengaktifkan Vendor Data Pasar IDX Riil
Pola modular ingestion layer kita menggunakan interface `MarketDataProvider`. Jika Anda telah memiliki lisensi API dari vendor data pasar pihak ketiga:
1. Buat file adapter baru di `apps/api/src/stock/` yang mengimplementasikan interface tersebut.
2. Setel kredensial di berkas `.env`:
   ```env
   MARKET_DATA_PROVIDERS=vendorA,mock
   MARKET_VENDOR_BASE_URL=https://api.vendor.com
   MARKET_VENDOR_API_KEY=rahasia-api-key
   ```
3. Tandai setiap integrasi data luar dengan komentar `// LEGAL:` untuk review legalitas dan kepatuhan Terms of Service.
