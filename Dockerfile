FROM node:22-alpine AS base
WORKDIR /app

# Install dependencies separately for better caching
COPY package.json package-lock.json ./
RUN npm ci

# Build frontend
COPY . .
RUN npm run build

# Production image
FROM node:22-alpine AS prod
WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=base /app/dist ./dist
COPY server.ts ./server.ts
COPY server ./server
COPY .env.example ./.env.example

EXPOSE 3000

CMD ["node", "--experimental-strip-types", "server.ts"]

