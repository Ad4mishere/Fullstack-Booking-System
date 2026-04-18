# ===== BUILD STAGE =====
FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# ===== PRODUCTION STAGE =====
FROM node:20-slim

WORKDIR /app

# installera nödvändiga system libs
RUN apt-get update && apt-get install -y \
  python3 \
  build-essential \
  && rm -rf /var/lib/apt/lists/*

# skapa non-root user
RUN useradd -m appuser

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/src ./src

USER appuser

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "src/server.js"]