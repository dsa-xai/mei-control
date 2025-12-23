# 🚀 Guia Completo de Deploy - MEI Control

Este guia mostra como colocar o sistema MEI Control no ar em diferentes plataformas de hospedagem.

---

## 📋 Índice

1. [Preparação](#1-preparação)
2. [Railway (Mais Fácil)](#2-railway-mais-fácil)
3. [Render](#3-render)
4. [Vercel + Supabase](#4-vercel--supabase)
5. [DigitalOcean](#5-digitalocean)
6. [VPS Manual (Ubuntu)](#6-vps-manual-ubuntu)
7. [Domínio Personalizado](#7-domínio-personalizado)
8. [SSL/HTTPS](#8-sslhttps)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Preparação

### 1.1 Extrair o projeto

```bash
# Extrair o ZIP
unzip mei-control.zip
cd mei-control
```

### 1.2 Criar repositório no GitHub

```bash
# Inicializar Git
git init
git add .
git commit -m "Initial commit - MEI Control"

# Criar repositório no GitHub (via site ou CLI)
# Depois conectar:
git remote add origin https://github.com/SEU-USUARIO/mei-control.git
git branch -M main
git push -u origin main
```

### 1.3 Gerar chave JWT segura

Use uma chave forte para produção:

```bash
# Linux/Mac
openssl rand -base64 64

# Ou online: https://generate-secret.vercel.app/64
```

Guarde esta chave! Você vai usar como `JWT_SECRET`.

---

## 2. Railway (Mais Fácil)

Railway é a opção mais simples - detecta Docker automaticamente e oferece banco PostgreSQL gratuito.

### 2.1 Criar conta

1. Acesse [railway.app](https://railway.app)
2. Clique em "Login" → "Login with GitHub"
3. Autorize o acesso

### 2.2 Criar novo projeto

1. Clique em **"New Project"**
2. Selecione **"Deploy from GitHub repo"**
3. Escolha o repositório `mei-control`
4. Railway vai detectar o `docker-compose.yml`

### 2.3 Adicionar PostgreSQL

1. No projeto, clique em **"+ New"**
2. Selecione **"Database"** → **"PostgreSQL"**
3. Aguarde criar (30 segundos)

### 2.4 Configurar variáveis de ambiente

1. Clique no serviço **backend**
2. Vá na aba **"Variables"**
3. Adicione:

```
NODE_ENV=production
JWT_SECRET=sua-chave-gerada-no-passo-1.3
DATABASE_URL=${{Postgres.DATABASE_URL}}
FRONTEND_URL=https://seu-projeto.up.railway.app
```

> **Nota:** `${{Postgres.DATABASE_URL}}` é uma variável do Railway que conecta automaticamente ao banco.

### 2.5 Rodar migrations

1. Clique no serviço **backend**
2. Vá na aba **"Settings"**
3. Em **"Start Command"**, coloque:

```bash
npx prisma db push && npm start
```

### 2.6 Configurar domínio

1. Clique no serviço **frontend**
2. Vá em **"Settings"** → **"Networking"**
3. Clique em **"Generate Domain"**
4. Copie a URL gerada

### 2.7 Atualizar CORS

1. Volte no serviço **backend**
2. Atualize a variável:

```
FRONTEND_URL=https://mei-control-frontend.up.railway.app
```

### 2.8 Popular banco (seed)

Use o **Railway CLI**:

```bash
# Instalar CLI
npm install -g @railway/cli

# Login
railway login

# Conectar ao projeto
railway link

# Rodar seed
railway run npx prisma db seed
```

**Pronto!** Seu sistema está no ar. 🎉

**Custo estimado:** $5-10/mês após créditos gratuitos.

---

## 3. Render

Render é uma alternativa gratuita para projetos pequenos.

### 3.1 Criar conta

1. Acesse [render.com](https://render.com)
2. Clique em "Get Started" → "GitHub"

### 3.2 Criar banco PostgreSQL

1. Dashboard → **"New +"** → **"PostgreSQL"**
2. Configure:
   - Name: `mei-control-db`
   - Region: `Oregon` (mais próximo do Brasil)
   - Plan: `Free` (para teste)
3. Clique **"Create Database"**
4. Copie a **"External Database URL"**

### 3.3 Deploy do Backend

1. **"New +"** → **"Web Service"**
2. Conecte o repositório GitHub
3. Configure:
   - Name: `mei-control-api`
   - Region: `Oregon`
   - Branch: `main`
   - Root Directory: `backend`
   - Runtime: `Node`
   - Build Command: `npm install && npx prisma generate`
   - Start Command: `npx prisma db push && npm start`

4. Em **"Environment"**, adicione:

```
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:pass@host/db (a URL que você copiou)
JWT_SECRET=sua-chave-secreta
FRONTEND_URL=https://mei-control.onrender.com
```

5. Clique **"Create Web Service"**

### 3.4 Deploy do Frontend

1. **"New +"** → **"Static Site"**
2. Conecte o mesmo repositório
3. Configure:
   - Name: `mei-control`
   - Branch: `main`
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`

4. Em **"Environment"**, adicione:

```
VITE_API_URL=https://mei-control-api.onrender.com/api/v1
```

5. Clique **"Create Static Site"**

### 3.5 Configurar Redirects (SPA)

1. Crie o arquivo `frontend/_redirects`:

```
/*    /index.html   200
```

2. Ou em **"Redirects/Rewrites"** no Render:
   - Source: `/*`
   - Destination: `/index.html`
   - Action: `Rewrite`

**Custo:** Gratuito (com limitações) ou $7/mês por serviço.

---

## 4. Vercel + Supabase

Combinação gratuita e performática.

### 4.1 Criar banco no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie um projeto
3. Vá em **"Settings"** → **"Database"**
4. Copie a **"Connection string"** (URI)
5. Substitua `[YOUR-PASSWORD]` pela senha do projeto

### 4.2 Deploy Backend na Vercel

O Vercel funciona melhor com serverless. Precisamos adaptar:

1. Crie `backend/vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/server.js"
    }
  ]
}
```

2. No Vercel:
   - Import o repositório
   - Root Directory: `backend`
   - Framework: `Other`

3. Variáveis de ambiente:

```
DATABASE_URL=sua-url-supabase
JWT_SECRET=sua-chave
NODE_ENV=production
```

### 4.3 Deploy Frontend na Vercel

1. Novo projeto → mesmo repositório
2. Root Directory: `frontend`
3. Framework: `Vite`
4. Variáveis:

```
VITE_API_URL=https://mei-control-api.vercel.app/api/v1
```

**Custo:** Gratuito para projetos pessoais.

---

## 5. DigitalOcean

### 5.1 App Platform (Fácil)

1. Acesse [cloud.digitalocean.com](https://cloud.digitalocean.com)
2. **"Apps"** → **"Create App"**
3. Conecte GitHub → selecione repositório
4. DigitalOcean detecta o `docker-compose.yml`
5. Adicione **"Database"** → **"PostgreSQL"**
6. Configure variáveis de ambiente
7. Escolha plano (a partir de $5/mês)
8. **"Create Resources"**

### 5.2 Droplet (Mais controle)

1. Crie um Droplet Ubuntu 22.04 ($6/mês)
2. Siga o guia da Seção 6

---

## 6. VPS Manual (Ubuntu)

Para quem quer controle total (DigitalOcean, Vultr, Linode, AWS EC2, etc).

### 6.1 Requisitos

- Ubuntu 22.04 LTS
- 1GB RAM mínimo
- 25GB SSD

### 6.2 Conectar no servidor

```bash
ssh root@SEU_IP_DO_SERVIDOR
```

### 6.3 Atualizar sistema

```bash
apt update && apt upgrade -y
```

### 6.4 Instalar Docker

```bash
# Instalar Docker
curl -fsSL https://get.docker.com | sh

# Adicionar usuário ao grupo docker
usermod -aG docker $USER

# Instalar Docker Compose
apt install docker-compose-plugin -y

# Verificar
docker --version
docker compose version
```

### 6.5 Clonar projeto

```bash
# Instalar Git
apt install git -y

# Clonar
cd /opt
git clone https://github.com/SEU-USUARIO/mei-control.git
cd mei-control
```

### 6.6 Configurar ambiente

```bash
# Criar arquivo de ambiente
cp .env.example .env

# Editar com suas configurações
nano .env
```

Conteúdo do `.env`:

```env
DB_USER=postgres
DB_PASSWORD=SenhaForte123!
DB_NAME=mei_control
JWT_SECRET=sua-chave-super-secreta-gerada
NODE_ENV=production
FRONTEND_URL=http://SEU_IP_OU_DOMINIO
```

### 6.7 Subir containers

```bash
# Build e start
docker compose up -d --build

# Verificar status
docker compose ps

# Ver logs
docker compose logs -f
```

### 6.8 Rodar migrations e seed

```bash
# Migrations
docker compose exec backend npx prisma db push

# Seed (dados de teste)
docker compose exec backend npm run db:seed
```

### 6.9 Configurar Firewall

```bash
# Permitir SSH, HTTP, HTTPS
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable
```

### 6.10 Testar

Acesse: `http://SEU_IP`

---

## 7. Domínio Personalizado

### 7.1 Comprar domínio

Opções brasileiras:
- [Registro.br](https://registro.br) - .com.br (~R$ 40/ano)
- [Hostinger](https://hostinger.com.br)
- [GoDaddy](https://godaddy.com)

### 7.2 Configurar DNS

No painel do seu domínio, adicione:

| Tipo | Nome | Valor |
|------|------|-------|
| A | @ | IP_DO_SERVIDOR |
| A | www | IP_DO_SERVIDOR |
| A | api | IP_DO_SERVIDOR |

Se usar Railway/Render/Vercel, use CNAME:

| Tipo | Nome | Valor |
|------|------|-------|
| CNAME | @ | seu-projeto.up.railway.app |
| CNAME | www | seu-projeto.up.railway.app |

### 7.3 Aguardar propagação

DNS leva de 15 minutos a 48 horas para propagar.

Verificar: https://dnschecker.org

---

## 8. SSL/HTTPS

### 8.1 Railway/Render/Vercel

SSL automático! Não precisa fazer nada.

### 8.2 VPS com Certbot (Let's Encrypt)

```bash
# Instalar Certbot
apt install certbot python3-certbot-nginx -y

# Gerar certificado
certbot --nginx -d seudominio.com.br -d www.seudominio.com.br

# Renovação automática (já configurada)
certbot renew --dry-run
```

### 8.3 Atualizar docker-compose para HTTPS

Crie `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  nginx-proxy:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx-prod.conf:/etc/nginx/conf.d/default.conf
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - frontend
      - backend
```

---

## 9. Troubleshooting

### Problema: "Connection refused" no banco

**Solução:**
```bash
# Verificar se PostgreSQL está rodando
docker compose ps

# Ver logs do banco
docker compose logs postgres

# Reiniciar
docker compose restart postgres
```

### Problema: "CORS error" no frontend

**Solução:**
Verifique se `FRONTEND_URL` no backend está correto:
```env
FRONTEND_URL=https://seu-dominio.com
```

### Problema: "Invalid token" após deploy

**Solução:**
O `JWT_SECRET` deve ser o mesmo em todos os ambientes:
```bash
# Verificar variável
docker compose exec backend printenv | grep JWT
```

### Problema: Página em branco no frontend

**Solução:**
1. Verifique se o build funcionou:
```bash
docker compose logs frontend
```

2. Verifique redirects para SPA (React Router)

### Problema: Seed não roda

**Solução:**
```bash
# Rodar manualmente
docker compose exec backend npx prisma db push
docker compose exec backend node prisma/seed.js
```

### Problema: "Out of memory" 

**Solução:**
Aumente swap no servidor:
```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

---

## 📊 Comparativo de Custos

| Plataforma | Gratuito | Pago | Melhor para |
|------------|----------|------|-------------|
| Railway | $5 créditos/mês | $5-20/mês | Iniciantes |
| Render | Sim (limitado) | $7+/mês | Projetos pequenos |
| Vercel | Sim | $20/mês | Frontend |
| DigitalOcean | Não | $6+/mês | Controle total |
| VPS Genérico | Não | $5+/mês | Máximo controle |

---

## ✅ Checklist Pós-Deploy

- [ ] Sistema acessível via navegador
- [ ] Login funcionando (CPF: 123.456.789-00)
- [ ] Dashboard carregando dados
- [ ] Criação de notas funcionando
- [ ] SSL/HTTPS ativo (cadeado verde)
- [ ] Backup do banco configurado
- [ ] Monitoramento de erros (Sentry, LogRocket)
- [ ] Domínio personalizado configurado

---

## 🆘 Precisa de Ajuda?

1. Verifique os logs: `docker compose logs -f`
2. Abra uma issue no GitHub
3. Consulte a documentação da plataforma escolhida

---

**Bom deploy! 🚀**
