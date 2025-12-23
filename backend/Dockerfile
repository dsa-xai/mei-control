# ============================================
# MEI Control - Backend Dockerfile
# ============================================

FROM node:20-slim

# Instalar OpenSSL (necessário para Prisma)
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Criar diretório da aplicação
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependências
RUN npm install --omit=dev

# Gerar cliente Prisma
RUN npx prisma generate

# Copiar código fonte
COPY . .

# Expor porta
EXPOSE 3001

# Variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=3001

# Comando para iniciar
CMD ["node", "src/server.js"]