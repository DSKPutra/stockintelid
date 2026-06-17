-- =============================================================================
-- IDX App — skema database (dipakai mulai M2).
-- PostgreSQL untuk data master & relasional; TimescaleDB hypertable untuk OHLCV.
-- File ini dijalankan otomatis oleh container db saat pertama kali init.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS timescaledb;

-- ---- Sektor IDX-IC ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS sectors (
  code        TEXT PRIMARY KEY,          -- mis. 'energy'
  name_id     TEXT NOT NULL,             -- 'Energi'
  name_en     TEXT NOT NULL
);

-- ---- Grup pengendali / konglomerat -----------------------------------------
CREATE TABLE IF NOT EXISTS controlling_groups (
  id          TEXT PRIMARY KEY,          -- 'barito'
  name        TEXT NOT NULL,             -- 'Prajogo Pangestu / Barito'
  ultimate_owner TEXT,                   -- ultimate beneficial owner bila tersedia
  description TEXT
);

-- ---- Emiten -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stocks (
  ticker        TEXT PRIMARY KEY,        -- 'BREN'
  name          TEXT NOT NULL,
  sector_code   TEXT REFERENCES sectors(code),
  sub_sector    TEXT,
  listed_shares BIGINT,                  -- jumlah lembar tercatat
  listing_date  DATE,
  logo_url      TEXT
);

-- ---- Snapshot fundamental (per periode) ------------------------------------
CREATE TABLE IF NOT EXISTS fundamentals (
  ticker        TEXT REFERENCES stocks(ticker),
  as_of         DATE NOT NULL,
  per           NUMERIC,
  pbv           NUMERIC,
  roe           NUMERIC,
  der           NUMERIC,
  eps           NUMERIC,
  dividend_yield NUMERIC,
  net_margin    NUMERIC,
  market_cap    BIGINT,
  source        TEXT,                    -- sumber + untuk audit
  PRIMARY KEY (ticker, as_of)
);

-- ---- Kepemilikan saham ------------------------------------------------------
-- LEGAL: pastikan sumber (laporan tahunan, keterbukaan IDX, KSEI) sesuai ToS.
CREATE TABLE IF NOT EXISTS shareholders (
  id            BIGSERIAL PRIMARY KEY,
  ticker        TEXT REFERENCES stocks(ticker),
  holder_name   TEXT NOT NULL,
  group_id      TEXT REFERENCES controlling_groups(id),
  pct           NUMERIC NOT NULL,        -- persentase kepemilikan
  shares        BIGINT,
  is_controller BOOLEAN DEFAULT FALSE,
  as_of         DATE NOT NULL,
  source        TEXT,                    -- sumber & tanggal — wajib
  verified      BOOLEAN DEFAULT FALSE    -- tandai data belum terverifikasi
);

-- ---- OHLCV (time-series, hypertable) ---------------------------------------
CREATE TABLE IF NOT EXISTS ohlcv (
  ticker  TEXT NOT NULL,
  ts      TIMESTAMPTZ NOT NULL,
  open    NUMERIC NOT NULL,
  high    NUMERIC NOT NULL,
  low     NUMERIC NOT NULL,
  close   NUMERIC NOT NULL,
  volume  BIGINT NOT NULL,
  PRIMARY KEY (ticker, ts)
);
SELECT create_hypertable('ohlcv', 'ts', if_not_exists => TRUE);

-- ---- Pengguna & watchlist ---------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            BIGSERIAL PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  role          TEXT NOT NULL DEFAULT 'free',  -- free | premium | admin
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS watchlist_items (
  user_id   BIGINT REFERENCES users(id),
  ticker    TEXT REFERENCES stocks(ticker),
  added_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, ticker)
);

CREATE INDEX IF NOT EXISTS idx_shareholders_ticker ON shareholders(ticker);
CREATE INDEX IF NOT EXISTS idx_shareholders_group ON shareholders(group_id);
CREATE INDEX IF NOT EXISTS idx_stocks_sector ON stocks(sector_code);
