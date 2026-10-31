import type { NextConfig } from "next";

const config: NextConfig = {
  // Self-contained server bundle for the Docker image (copies only the files it needs).
  output: "standalone",
  serverExternalPackages: ["pg", "@electric-sql/pglite"],
  // Public creator pages live at /@handle (PRD RF-1). `@` folders are reserved
  // for parallel routes in the App Router, so we rewrite to /c/[handle].
  async rewrites() {
    return [
      { source: "/@:handle", destination: "/c/:handle" },
      { source: "/@:handle/pass", destination: "/c/:handle/pass" },
    ];
  },
};
export default config;
