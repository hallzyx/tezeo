# syntax=docker/dockerfile:1
# Tezeo: Next.js 16 standalone server. Three stages so the final image has no dev tooling or source.

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Needs outbound internet once: next/font downloads the brand fonts (Google Fonts) at build time.
# No database or secrets are needed to build: every page that reads data is rendered on request.
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN addgroup -S tezeo && adduser -S tezeo -G tezeo
COPY --from=build --chown=tezeo:tezeo /app/.next/standalone ./
COPY --from=build --chown=tezeo:tezeo /app/.next/static ./.next/static
COPY --from=build --chown=tezeo:tezeo /app/public ./public
USER tezeo
EXPOSE 3000
# Healthy only when the app can reach Postgres (see src/app/api/health/route.ts).
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
