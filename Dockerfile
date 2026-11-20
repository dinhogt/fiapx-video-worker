# syntax=docker/dockerfile:1.7
# video-worker: ffmpeg/ffprobe do Debian, non-root, /work em emptyDir (ADR-014).
FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN corepack enable
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
RUN --mount=type=secret,id=npm_token NPM_TOKEN=$(cat /run/secrets/npm_token 2>/dev/null || true) yarn install --immutable
COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN yarn build && yarn workspaces focus --production

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production WORK_DIR=/work
WORKDIR /app
RUN groupadd -g 10001 app && useradd -u 10001 -g app -s /usr/sbin/nologin app \
 && printf '%s\n' 'Acquire::http::Pipeline-Depth "0";' 'Acquire::Retries "5";' > /etc/apt/apt.conf.d/99reliability \
 && apt-get update && apt-get install -y --no-install-recommends ffmpeg ca-certificates \
 && rm -rf /var/lib/apt/lists/* && mkdir -p /work && chown app:app /work
COPY --from=build --chown=app:app /app/node_modules ./node_modules
COPY --from=build --chown=app:app /app/dist ./dist
COPY --from=build --chown=app:app /app/package.json ./
USER 10001
EXPOSE 3000
CMD ["node", "dist/main.js"]
