import type { NextConfig } from "next";

const config: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  // Public creator pages live at /@handle (PRD RF-1). `@` folders are reserved
  // for parallel routes in the App Router, so we rewrite to /c/[handle].
  async rewrites() {
    return [{ source: "/@:handle", destination: "/c/:handle" }];
  },
};
export default config;
