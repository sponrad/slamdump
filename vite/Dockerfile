# Build
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# Sprites/audio live in public/ (gitignored used to omit them — the image then
# shipped with no art and Pixi died on boot with "Failed to load").
RUN test -f public/sprites/titleBG.png \
  || (echo "Missing public/sprites. From vite/: npm run assets, commit public/sprites and public/audio, then rebuild." && exit 1)
RUN npm run build

# Serve static dist + shared leaderboard API
FROM node:22-alpine
WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules/sql.js ./node_modules/sql.js
COPY server ./server

RUN mkdir -p /data

ENV PORT=80
ENV DIST_DIR=/app/dist
ENV SCORES_DB=/data/scores.sqlite

VOLUME /data
EXPOSE 80
CMD ["node", "server/index.mjs"]
