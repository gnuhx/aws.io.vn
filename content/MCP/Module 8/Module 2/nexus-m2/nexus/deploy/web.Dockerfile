# syntax=docker/dockerfile:1
# Image chạy web (Next standalone) + MCP server (bundle esbuild) trong CÙNG container:
# web spawn MCP server qua stdio. Tách container riêng là việc của M7 (Streamable HTTP).

FROM node:22-bookworm-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable
WORKDIR /repo

FROM base AS build
# Copy manifest trước → layer "pnpm install" được cache khi chỉ sửa code
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/mcp-server/package.json apps/mcp-server/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile
COPY packages packages
COPY apps apps
RUN pnpm --filter @nexus/mcp-server build \
 && pnpm --filter @nexus/web build \
 && pnpm --filter @nexus/mcp-server deploy --legacy --prod /out/mcp

FROM node:22-bookworm-slim AS run
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    MCP_SERVER_ENTRY=/app/mcp/dist/index.js
WORKDIR /app
COPY --from=build /repo/apps/web/.next/standalone ./
COPY --from=build /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /out/mcp/package.json ./mcp/package.json
COPY --from=build /out/mcp/dist ./mcp/dist
COPY --from=build /out/mcp/node_modules ./mcp/node_modules
USER node
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
