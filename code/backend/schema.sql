-- ============================================================
-- Sparkline IoT Crane Monitoring Dashboard
-- PostgreSQL Schema (Neon)
-- ============================================================
-- Run with:
--   psql "$DATABASE_URL" -f schema.sql
-- or via the npm script:
--   npm run db:init
-- ============================================================

-- ------------------------------------------------------------
-- Table: readings
-- Stores every telemetry reading streamed from crane sensors.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS readings (
    id              SERIAL PRIMARY KEY,
    crane_id        VARCHAR(20)     NOT NULL,
    ts              TIMESTAMP       NOT NULL,
    load_kg         FLOAT           NOT NULL,
    motor_temp_c    FLOAT           NOT NULL,
    vibration_mm_s  FLOAT           NOT NULL,
    status          VARCHAR(20)     NOT NULL,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

-- Prevents the exact same sensor reading (crane + timestamp) from
-- being inserted twice. This is what makes the seed script safely
-- re-runnable (idempotent) via ON CONFLICT DO NOTHING.
CREATE UNIQUE INDEX IF NOT EXISTS uq_readings_crane_ts
    ON readings (crane_id, ts);

-- Speeds up "latest reading per crane" and "readings for crane X" queries.
CREATE INDEX IF NOT EXISTS idx_readings_crane_id
    ON readings (crane_id);

-- Speeds up time-range queries (?start=&end=) and ORDER BY ts.
CREATE INDEX IF NOT EXISTS idx_readings_ts
    ON readings (ts);

-- Composite index: most queries filter by crane_id AND sort/filter by ts.
-- This single index serves both predicates far more efficiently than two
-- separate single-column indexes for the GET /api/readings/:craneId route.
CREATE INDEX IF NOT EXISTS idx_readings_crane_ts
    ON readings (crane_id, ts DESC);

-- ------------------------------------------------------------
-- Table: alerts
-- Stores generated alerts whenever a reading breaches a threshold
-- (currently: motor_temp_c > 80).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alerts (
    id              SERIAL PRIMARY KEY,
    crane_id        VARCHAR(20)     NOT NULL,
    motor_temp_c    FLOAT           NOT NULL,
    message         TEXT            NOT NULL,
    reading_ts      TIMESTAMP,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

-- Prevents duplicate alerts from being raised for the same reading,
-- even if the ingestion endpoint or seed script processes it twice.
CREATE UNIQUE INDEX IF NOT EXISTS uq_alerts_crane_reading_ts
    ON alerts (crane_id, reading_ts);

-- Speeds up "alerts for crane X" lookups.
CREATE INDEX IF NOT EXISTS idx_alerts_crane_id
    ON alerts (crane_id);

-- Speeds up "newest alerts first" (GET /api/alerts ORDER BY created_at DESC).
CREATE INDEX IF NOT EXISTS idx_alerts_created_at
    ON alerts (created_at DESC);
