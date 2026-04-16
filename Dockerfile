# ---------- BUILD STAGE ----------
FROM node:20 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# ---------- PRODUCTION STAGE ----------
FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app .

EXPOSE 3000

CMD ["npm", "start"]