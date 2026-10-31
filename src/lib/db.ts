import type { Pool } from "pg";

/**
 * PostgreSQL access. One tiny async interface so the app code never touches a driver directly.
 *
 *  - Runtime: `pg` Pool against DATABASE_URL (postgres://user:pass@host:5432/db).
 *  - Tests:   DATABASE_URL=pglite://memory runs a real in-process Postgres (PGlite), no server needed.
 *
 * The schema is created on first use, under an advisory lock so several app replicas starting at once
 * don't race each other.
 */
interface Driver {
  query(sql: string, params?: unknown[]): Promise<{ rows: unknown[] }>;
  close(): Promise<void>;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS creators (
  id              TEXT PRIMARY KEY,
  handle          TEXT NOT NULL UNIQUE,            -- always stored lowercase (see normalizeHandle)
  display_name    TEXT NOT NULL,
  message         TEXT NOT NULL DEFAULT '',
  avatar_url      TEXT NOT NULL DEFAULT '',
  accent          TEXT NOT NULL DEFAULT '',
  wallet          TEXT NOT NULL,
  dashboard_token TEXT NOT NULL UNIQUE,
  pass_enabled    INTEGER NOT NULL DEFAULT 0,
  pass_price_usd  INTEGER NOT NULL DEFAULT 10,
  pass_perk       TEXT NOT NULL DEFAULT '',
  created_at      TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS tips (
  id              TEXT PRIMARY KEY,
  creator_id      TEXT NOT NULL REFERENCES creators(id),
  status          TEXT NOT NULL,            -- pending | converting | received | failed | refunded | expired
  origin_asset_id TEXT NOT NULL,
  origin_chain    TEXT NOT NULL,
  origin_symbol   TEXT NOT NULL,
  amount_in       TEXT NOT NULL,            -- smallest unit of origin asset
  amount_out_usdc TEXT NOT NULL,            -- quoted, 6 decimals
  final_out_usdc  TEXT,                     -- actually delivered
  app_fee_bps     INTEGER NOT NULL,
  deposit_address TEXT NOT NULL UNIQUE,
  deposit_memo    TEXT,
  refund_to       TEXT NOT NULL,
  deadline        TEXT NOT NULL,
  settlement_tx   TEXT,
  fan_name        TEXT NOT NULL DEFAULT '',
  fan_message     TEXT NOT NULL DEFAULT '',
  is_pass         INTEGER NOT NULL DEFAULT 0,
  pass_token      TEXT UNIQUE,
  pass_expires_at TEXT,
  detail          TEXT,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);
-- What the creator sees per tip: market value of what the fan sent, and Aurora's delivery cost (USDC, 6 dec).
ALTER TABLE tips ADD COLUMN IF NOT EXISTS gross_usd TEXT;
ALTER TABLE tips ADD COLUMN IF NOT EXISTS delivery_fee_usdc TEXT;
CREATE INDEX IF NOT EXISTS tips_creator ON tips(creator_id, created_at DESC);
CREATE TABLE IF NOT EXISTS creator_extras (
  creator_id      TEXT PRIMARY KEY REFERENCES creators(id),
  alert_token     TEXT NOT NULL UNIQUE,
  goal_title      TEXT NOT NULL DEFAULT '',
  goal_target_usd INTEGER NOT NULL DEFAULT 0,
  goal_started_at TEXT NOT NULL DEFAULT ''
);
`;

let driver: Promise<Driver> | null = null;
let embedded = false; // true when running on PGlite (tests)

async function open(): Promise<Driver> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set (expected postgres://user:pass@host:5432/dbname).");

  if (url.startsWith("pglite://")) {
    // Test-only dependency. The specifier is a variable so Next's file tracer does not copy PGlite's WASM
    // into the production (standalone) bundle.
    const mod = "@electric-sql/pglite";
    const { PGlite } = (await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ /* @vite-ignore */ mod)) as typeof import("@electric-sql/pglite");
    embedded = true;
    const pg = new PGlite();
    await pg.exec(SCHEMA);
    return { query: (s, p) => pg.query(s, p as unknown[]), close: () => pg.close() };
  }

  const { Pool } = await import("pg");
  const pool: Pool = new Pool({ connectionString: url, max: Number(process.env.DATABASE_POOL_MAX ?? 10) });
  // Don't let an idle-connection error (e.g. the DB restarting) crash the whole process.
  pool.on("error", (e) => console.error("[db] idle client error:", e.message));
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    await c.query("SELECT pg_advisory_xact_lock(727274)");
    await c.query(SCHEMA);
    await c.query("COMMIT");
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    c.release();
  }
  return { query: (s, p) => pool.query(s, p as unknown[]), close: () => pool.end() };
}

function ready(): Promise<Driver> {
  if (!driver) driver = open().catch((e) => { driver = null; throw e; }); // retry on the next call if the DB wasn't up yet
  return driver;
}

/** Run a parameterised query ($1, $2, …) and return the rows. */
export async function q<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
  return (await (await ready()).query(sql, params)).rows as T[];
}

export async function q1<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T | undefined> {
  return (await q<T>(sql, params))[0];
}

/** Liveness for the container health check. */
export async function ping(): Promise<void> {
  await q("SELECT 1");
}

/**
 * Test helper: leave the database empty. The embedded Postgres is kept alive between tests (its WASM
 * start-up is slow) and only its tables are emptied.
 */
export async function resetDbForTests(): Promise<void> {
  if (!driver) return;
  if (embedded) await q("TRUNCATE tips, creator_extras, creators");
  else { const d = await driver; driver = null; await d.close().catch(() => {}); }
}
