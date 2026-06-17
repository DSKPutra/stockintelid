# StockIntelID — Platform Analisis Kepemilikan Saham IDX

StockIntelID adalah platform kecerdasan kepemilikan (*ownership intelligence*) Bursa Efek Indonesia (IDX) berbasis **cross-platform** (iOS, Android, dan Web dari satu codebase). Aplikasi ini diinspirasi oleh konsep visual *ownership intelligence* (seperti peta kepemilikan KSEI, MSCI free-float screener, peta konglomerat, dan network graph relasi UBO-ke-ticker) dengan identitas visual violet-indigo/teal/amber yang orisinal dan modern.

> ⚠️ **Disclaimer Hukum:** Platform ini dirancang murni sebagai alat informasi dan edukasi keuangan, bukan rekomendasi/ajakan transaksi jual atau beli efek keuangan. Keputusan investasi sepenuhnya merupakan tanggung jawab pengguna secara mandiri (DYOR). Data kepemilikan bersifat periodik (berdasarkan rilis KSEI/bulanan) dan bukan realtime.

---

## ⚡ Fitur Utama

1. **Instant Search Universal:** Pencarian ter-debounce dalam satu kolom untuk menyaring Ticker emiten, nama investor (mis. *Lo Kheng Hong*), maupun grup konglomerasi (mis. *Salim Group*).
2. **Peta Konglomerasi Bisnis:** Menganalisis sebaran kapitalisasi pasar dan sebaran sektor grup-grup bisnis raksasa (Salim, Djarum, Sinar Mas, Astra, Barito, Bakrie, Lippo) beserta Peta Jaringan Pengendalian (Ultimate Beneficial Owner/UBO).
3. **KSEI Shareholders & Free Float:** Visualisasi kepemilikan berdasarkan tipe investor (Corporate, Individual, Mutual Fund, dll) dan domisili Lokal vs Asing (L/F), serta perhitungan estimasi Free Float menggunakan metode MSCI (Strategic vs Portfolio Holders).
4. **Network Graph Interaktif:** Peta visual relasi pengendali akhir (UBO) ke emiten serta pemegang saham mayoritas emiten berbasis SVG Force-Directed Simulation lintas platform.
5. **Realtime Price Adapter & Heatmap:** Abstraksi data harga realtime lewat penyedia data eksternal (TradingView Web Embed / WebView Mobile, API Kustom, maupun simulasi Mock).
6. **Asisten AI Chatbot (RAG):** AI Q&A interaktif yang menjawab pertanyaan kepemilikan, perbandingan fundamental, dan free-float bursa menggunakan *tool calling* ke API internal.
7. **Tracking Reksa Dana:** Pantau porsi holding portofolio saham terbesar dari reksa dana terkemuka di Indonesia.

---

## 🏗️ Struktur Arsitektur Monorepo

Proyek ini menggunakan struktur **npm workspaces monorepo**:

```
├── apps/
│   ├── api/             # Backend API Server (NestJS, REST, WebSocket & RAG Engine)
│   └── mobile/          # Frontend Web & Mobile App (Expo + React Native Web)
├── packages/
│   └── shared/          # Library Bersama (Tipe data, generator mock, formatter)
├── infra/
│   └── db/
│       └── init/        # Skema inisialisasi basis data PostgreSQL + TimescaleDB
```

---

## ⚙️ Konfigurasi Environment (.env)

Buat berkas `.env` di direktori utama:

### 1. Provider Harga Realtime & Heatmap (`PRICE_PROVIDER`)
Pilih salah satu dari opsi berikut:
- `PRICE_PROVIDER=mock`: Menggunakan data simulasi harga realistik bergerak (Default saat development).
- `PRICE_PROVIDER=tradingview`: Menggunakan script embed widget Advanced Chart dan Heatmap gratis dari TradingView (Web: Embed Script, Mobile: WebView).
- `PRICE_PROVIDER=api`: Menggunakan integrasi API IDX kustom berbayar.
  - Setel `PRICE_API_BASE_URL` dan `PRICE_API_KEY` di env.

### 2. Provider LLM Asisten AI (`LLM_PROVIDER`)
Pilih salah satu penyedia LLM untuk chatbot:
- `LLM_PROVIDER=gemini`: Menggunakan Google Gemini API (memerlukan `LLM_API_KEY`).
- `LLM_PROVIDER=openai`: Menggunakan OpenAI GPT-4o-mini (memerlukan `LLM_API_KEY`).
- *Catatan: Jika `LLM_API_KEY` kosong, chatbot secara otomatis menggunakan **Smart Local Rule-Based Agent** yang terintegrasi dengan database kepemilikan lokal.*

---

## 🚀 Persiapan & Instalasi Lokal

1. **Clone & Install Dependensi:**
   ```bash
   npm install
   ```

2. **Kompilasi Modul Bersama:**
   ```bash
   npm run build:shared
   ```

3. **Nyalakan Database (Docker):**
   ```bash
   docker compose up -d
   ```
   *(Backend akan otomatis fallback ke in-memory mock provider apabila PostgreSQL/Redis mati).*

4. **Jalankan Aplikasi (Dev Mode):**
   ```bash
   npm run dev
   ```
   - **Backend API:** `http://localhost:4000/api`
   - **Swagger Docs:** `http://localhost:4000/api/docs`
   - **Frontend Expo Web:** `http://localhost:8081`

---

## 👨‍💻 Panduan Pengembangan

### Cara Menambahkan Grup Konglomerasi Baru
Untuk menambahkan grup bisnis baru ke dalam peta kepemilikan:
1. Buka berkas [mock-data.generator.ts](packages/shared/src/mock-data.generator.ts).
2. Tambahkan informasi grup di konstanta `MOCK_GROUPS`:
   ```typescript
   {
     id: 'grup_baru',
     name: 'Grup Baru Indonesia',
     ultimateOwner: 'Nama Pemilik Akhir',
     description: 'Deskripsi profil bisnis grup...',
     tickers: ['TICKER1', 'TICKER2'],
   }
   ```
3. Pastikan ticker-ticker baru tersebut juga didefinisikan dalam konstanta `MOCK_STOCKS`.
4. Jalankan ulang server, skema database akan memperbarui datanya secara otomatis saat startup.
