export const env = {
  auroraApiKey: process.env.AURORA_API_KEY ?? "",
  auroraApiBase: process.env.AURORA_API_BASE ?? "https://api.intents.aurora.dev",
  auroraMode: (process.env.AURORA_MODE ?? "simulated") as "live" | "simulated",
  tezeoFeeBps: Number(process.env.TEZEO_FEE_BPS ?? 100),
  databasePath: process.env.DATABASE_PATH ?? "./data/tezeo.db",
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000",
};

/** Aurora's fee floor (PRD): 10 bps on non-stable origin assets, 2 bps on stables. Cap: 500 bps total. */
export const AURORA_MIN_BPS = { stable: 2, nonStable: 10 } as const;
export const AURORA_MAX_BPS = 500;
