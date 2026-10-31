import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { env } from "./env";

let _db: Database.Database | null = null;

export function db(): Database.Database {
  if (_db) return _db;
  const file = env.databasePath;
  if (file !== ":memory:") fs.mkdirSync(path.dirname(file), { recursive: true });
  const d = new Database(file);
  d.pragma("journal_mode = WAL");
  d.pragma("foreign_keys = ON");
  d.exec(`
    CREATE TABLE IF NOT EXISTS creators (
      id           TEXT PRIMARY KEY,
      handle       TEXT NOT NULL UNIQUE COLLATE NOCASE,
      display_name TEXT NOT NULL,
      message      TEXT NOT NULL DEFAULT '',
      avatar_url   TEXT NOT NULL DEFAULT '',
      accent       TEXT NOT NULL DEFAULT '',
      wallet       TEXT NOT NULL,
      dashboard_token TEXT NOT NULL UNIQUE,
      pass_enabled INTEGER NOT NULL DEFAULT 0,
      pass_price_usd INTEGER NOT NULL DEFAULT 10,
      pass_perk    TEXT NOT NULL DEFAULT '',
      created_at   TEXT NOT NULL
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
      pass_token      TEXT,
      pass_expires_at TEXT,
      created_at      TEXT NOT NULL,
      updated_at      TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS tips_creator ON tips(creator_id, created_at DESC);
  `);
  _db = d;
  return d;
}

/** Test helper: drop the cached connection. */
export function resetDbForTests() {
  _db?.close();
  _db = null;
}
