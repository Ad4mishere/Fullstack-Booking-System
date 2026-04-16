# ===== BUILD STAGE =====
FROM node:20 AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# ===== PRODUCTION STAGE =====
FROM node:20-alpine

WORKDIR /app

# skapa non-root user
RUN addgroup app && adduser -S -G app app

# kopiera endast det som behövs
COPY --from=builder /app /app

# ta bort dev dependencies
RUN npm prune --omit=dev

USER app

EXPOSE 3000
CMD ["npm", "start"]