FROM node:20-alpine

WORKDIR /app

# Instalar dependências do sistema
RUN apk add --no-cache openssl

# Copiar arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependências
RUN npm ci --only=production

# Gerar Prisma Client
RUN npx prisma generate

# Copiar código fonte
COPY src ./src

# Criar diretório para uploads
RUN mkdir -p uploads

# Expor porta
EXPOSE 3001

# Variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Comando de inicialização
CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]
