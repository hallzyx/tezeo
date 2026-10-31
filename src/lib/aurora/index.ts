import { env } from "../env";
import { liveAurora } from "./live";
import { simulatedAurora } from "./simulator";
import type { AuroraProvider } from "./types";

export function getAurora(): AuroraProvider {
  return env.auroraMode === "live" ? liveAurora : simulatedAurora;
}
export * from "./types";
