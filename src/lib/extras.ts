import { randomBytes } from "node:crypto";
import { db } from "./db";
import { fromUnits } from "./domain";
import { getCreatorByToken, listTips, refreshTip, type CreatorRow, type TipRow } from "./tips";

/**
 * Phase 3 extras: stream alerts (OBS), a funding goal and a public supporter wall.
 * Kept in its own table so the core schema is untouched.
 */
export interface Extras { creator_id: string; alert_token: string; goal_title: string; goal_target_usd: number; goal_started_at: string }

function table() {
  db().exec(`CREATE TABLE IF NOT EXISTS creator_extras (
    creator_id TEXT PRIMARY KEY REFERENCES creators(id),
    alert_token TEXT NOT NULL UNIQUE,
    goal_title TEXT NOT NULL DEFAULT '',
    goal_target_usd INTEGER NOT NULL DEFAULT 0,
    goal_started_at TEXT NOT NULL DEFAULT ''
  )`);
  return db();
}

/** The OBS alert token is separate from the dashboard token: pasting it in OBS never exposes the dashboard. */
export function getExtras(creatorId: string): Extras {
  const d = table();
  const row = d.prepare("SELECT * FROM creator_extras WHERE creator_id = ?").get(creatorId) as Extras | undefined;
  if (row) return row;
  const fresh: Extras = { creator_id: creatorId, alert_token: randomBytes(18).toString("base64url"), goal_title: "", goal_target_usd: 0, goal_started_at: "" };
  d.prepare("INSERT INTO creator_extras (creator_id, alert_token) VALUES (?, ?)").run(creatorId, fresh.alert_token);
  return fresh;
}

export function getCreatorByAlertToken(token: string): CreatorRow | undefined {
  const row = table().prepare("SELECT creator_id FROM creator_extras WHERE alert_token = ?").get(token) as { creator_id: string } | undefined;
  return row ? (db().prepare("SELECT * FROM creators WHERE id = ?").get(row.creator_id) as CreatorRow) : undefined;
}

export const GOAL_MAX_USD = 1_000_000;

/** Set or clear (target 0) the goal. Progress counts only tips received after the goal was set. */
export function setGoal(dashboardToken: string, input: { title: string; targetUsd: number }): Extras | undefined {
  const c = getCreatorByToken(dashboardToken);
  if (!c) return undefined;
  const target = Math.round(input.targetUsd);
  if (!(target >= 0 && target <= GOAL_MAX_USD)) throw new Error(`Goal must be between $1 and $${GOAL_MAX_USD}.`);
  if (target > 0 && !input.title.trim()) throw new Error("Give your goal a name.");
  getExtras(c.id);
  table().prepare("UPDATE creator_extras SET goal_title=?, goal_target_usd=?, goal_started_at=? WHERE creator_id=?")
    .run(target ? input.title.trim().slice(0, 80) : "", target, target ? new Date().toISOString() : "", c.id);
  return getExtras(c.id);
}

const usdcOf = (t: TipRow) => Number(fromUnits(t.final_out_usdc ?? t.amount_out_usdc, 6, 6));

export function goalProgress(creator: CreatorRow) {
  const x = getExtras(creator.id);
  if (!x.goal_target_usd) return null;
  const raised = listTips(creator.id, 1000)
    .filter((t) => t.status === "received" && t.created_at >= x.goal_started_at)
    .reduce((s, t) => s + usdcOf(t), 0);
  return { title: x.goal_title, targetUsd: x.goal_target_usd, raisedUsd: Math.round(raised * 100) / 100, pct: Math.min(100, Math.round((raised / x.goal_target_usd) * 100)) };
}

/** Public wall: confirmed tips only, names and notes as the fan wrote them, no amounts or addresses. */
export function supporterWall(creator: CreatorRow, limit = 8) {
  return listTips(creator.id, 100)
    .filter((t) => t.status === "received" && (t.fan_name || t.fan_message))
    .slice(0, limit)
    .map((t) => ({ id: t.id, name: t.fan_name || "Someone kind", message: t.fan_message, isPass: !!t.is_pass }));
}

/** Tips confirmed after `since` (ISO). Refreshes in-flight tips first so alerts fire without the dashboard open. */
export async function alertsSince(creator: CreatorRow, since: string) {
  const open = listTips(creator.id, 30).filter((t) => t.status === "pending" || t.status === "converting");
  await Promise.allSettled(open.slice(0, 10).map((t) => refreshTip(t)));
  return listTips(creator.id, 30)
    .filter((t) => t.status === "received" && t.updated_at > since)
    .sort((a, b) => a.updated_at.localeCompare(b.updated_at))
    .map((t) => ({ id: t.id, name: t.fan_name || "Someone kind", message: t.fan_message, isPass: !!t.is_pass, usdc: usdcOf(t), at: t.updated_at }));
}
