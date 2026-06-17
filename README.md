# Aplikasi Analisa Saham IDX (Web + Mobile, Satu Codebase)

Aplikasi analisa saham Bursa Efek Indonesia (IDX) premium berbasis **cross-platform** (iOS, Android, dan Web dari satu codebase) yang menampilkan data fundamental, pergerakan harga, kepemilikan pengendali (konglomerasi), sektoral, screener multi-metrik, dan asisten AI Chatbot berbasis **RAG (Retrieval-Augmented Generation) + Tool Calling**.

> ⚠️ **Disclaimer Hukum:** Platform ini dirancang murni sebagai alat informasi dan edukasi keuangan, bukan rekomendasi/ajakan transaksi jual atau beli efek keuangan. Keputusan investasi sepenuhnya merupakan tanggung jawab pengguna secara mandiri (DYOR).

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
   - **Frontend Expo Web:** Terbuka di browser Anda pada port `http://localhost:8081` (atau port terdekat yang tersedia).
   - **Mobile Device:** Buka aplikasi **Expo Go** pada perangkat iOS/Android Anda, lalu pindai QR Code yang tercetak di terminal untuk membukanya secara native.

---

## 🚀 Panduan Deploy / Push ke GitHub Anda

Karena repositori Git lokal telah diinisialisasi dan di-commit pertama kali (`feat: complete IDX Stock Analyzer monorepo`), Anda hanya perlu mengunggahnya ke GitHub dengan langkah berikut:

1. Buat sebuah repositori baru di akun GitHub Anda (misal beri nama `idx-stock-analyzer`). Jangan centang inisialisasi README atau `.gitignore` karena berkas-berkas tersebut sudah tersedia di lokal.
2. Salin URL repositori GitHub baru Anda (berformat `https://github.com/USERNAME/idx-stock-analyzer.git`).
3. Jalankan perintah berikut di terminal komputer Anda (di direktori proyek ini):
   ```bash
   # 1. Daftarkan remote URL GitHub Anda sebagai 'origin'
   git remote add origin https://github.com/USERNAME/idx-stock-analyzer.git

   # 2. Setel nama branch utama menjadi 'main'
   git branch -M main

   # 3. Dorong kode lokal Anda ke repositori GitHub
   git push -u origin main
   ```
4. Selesai! Seluruh kode aplikasi Anda kini telah terdeploy aman ke GitHub.

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
