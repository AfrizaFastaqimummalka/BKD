-- ============================================================
-- BKD Online — PostgreSQL Schema
-- ============================================================

-- ENUM types
CREATE TYPE user_role AS ENUM ('admin', 'dosen', 'reviewer');
CREATE TYPE jenis_tridharma AS ENUM ('pendidikan', 'penelitian', 'pengabdian');
CREATE TYPE aktivitas_status AS ENUM ('draft', 'pending', 'approved', 'rejected');
CREATE TYPE verifikasi_status AS ENUM ('approved', 'rejected');

-- Users
CREATE TABLE users (
  id          SERIAL PRIMARY KEY,
  nama        VARCHAR(255) NOT NULL,
  email       VARCHAR(255) UNIQUE NOT NULL,
  role        user_role NOT NULL DEFAULT 'dosen',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Aktivitas Tridharma
CREATE TABLE aktivitas (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  jenis       jenis_tridharma NOT NULL,
  judul       VARCHAR(500) NOT NULL,
  deskripsi   TEXT,
  tanggal     DATE NOT NULL,
  skor_raw    NUMERIC(5,2) NOT NULL DEFAULT 0,
  status      aktivitas_status NOT NULL DEFAULT 'draft',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dokumen Bukti
CREATE TABLE dokumen (
  id              SERIAL PRIMARY KEY,
  aktivitas_id    INTEGER NOT NULL REFERENCES aktivitas(id) ON DELETE CASCADE,
  nama_file       VARCHAR(255) NOT NULL,
  url_cloudinary  TEXT NOT NULL,
  public_id       VARCHAR(255) NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Riwayat Verifikasi (history tracking)
CREATE TABLE verifikasi (
  id              SERIAL PRIMARY KEY,
  aktivitas_id    INTEGER NOT NULL REFERENCES aktivitas(id) ON DELETE CASCADE,
  reviewer_id     INTEGER NOT NULL REFERENCES users(id),
  status          verifikasi_status NOT NULL,
  catatan         TEXT,
  verified_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Rekap Skor per Periode
CREATE TABLE rekap_skor (
  id                    SERIAL PRIMARY KEY,
  user_id               INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  periode               VARCHAR(20) NOT NULL,          -- e.g. "2024/2025-1"
  total_pendidikan      NUMERIC(7,2) NOT NULL DEFAULT 0,
  total_penelitian      NUMERIC(7,2) NOT NULL DEFAULT 0,
  total_pengabdian      NUMERIC(7,2) NOT NULL DEFAULT 0,
  total_skor            NUMERIC(7,2) GENERATED ALWAYS AS (total_pendidikan + total_penelitian + total_pengabdian) STORED,
  generated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, periode)
);

-- Indexes
CREATE INDEX idx_aktivitas_user_id   ON aktivitas(user_id);
CREATE INDEX idx_aktivitas_status    ON aktivitas(status);
CREATE INDEX idx_dokumen_aktivitas   ON dokumen(aktivitas_id);
CREATE INDEX idx_verifikasi_aktivitas ON verifikasi(aktivitas_id);
CREATE INDEX idx_rekap_user_periode  ON rekap_skor(user_id, periode);

-- Trigger: auto-update updated_at on aktivitas
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_aktivitas_updated_at
  BEFORE UPDATE ON aktivitas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Seed Data
-- ============================================================
INSERT INTO users (nama, email, role) VALUES
  ('Admin BKD',       'admin@univ.ac.id',    'admin'),
  ('Dr. Budi Santoso', 'budi@univ.ac.id',   'dosen'),
  ('Dr. Sari Dewi',   'sari@univ.ac.id',    'dosen'),
  ('Prof. Ahmad Reviewer', 'ahmad@univ.ac.id', 'reviewer');
