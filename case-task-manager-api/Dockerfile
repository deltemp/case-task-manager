# Multi-stage build para otimização
FROM node:20-alpine AS base

# Instalar dependências necessárias
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY tsconfig*.json ./

FROM base AS deps
# Instalar dependências de produção e desenvolvimento
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build da aplicação
RUN npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Criar usuário não-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copiar arquivos necessários
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nestjs

EXPOSE 3001

CMD ["node", "dist/main"]