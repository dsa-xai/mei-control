# 📊 MEI Control - Sistema de Gestão de Notas Fiscais para MEI

Sistema completo para gestão de notas fiscais, controle de faturamento e obrigações fiscais para Microempreendedores Individuais (MEI).

![MEI Control](https://img.shields.io/badge/MEI-Control-06b6d4?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js)
![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat-square&logo=react)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-4169E1?style=flat-square&logo=postgresql)

## ✨ Funcionalidades

- 🔐 **Autenticação segura** - Login por CPF ou CNPJ com JWT
- 📊 **Dashboard completo** - Visão geral do faturamento e métricas
- 📄 **Notas Fiscais** - Emissão, listagem e cancelamento
- 👥 **Gestão de Clientes** - Cadastro PF e PJ
- ⚠️ **Alertas de Teto** - Notificações automáticas ao atingir 80%, 95% e 100%
- 📈 **Gráficos** - Visualização do faturamento mensal e acumulado
- 💰 **DAS Mensal** - Controle de pagamentos
- 📅 **Calendário** - Obrigações fiscais e vencimentos
- 📱 **Responsivo** - Funciona em desktop e mobile

## 🚀 Início Rápido

### Pré-requisitos

- [Node.js](https://nodejs.org/) 18+ 
- [Docker](https://docker.com/) e Docker Compose (recomendado)
- Ou: PostgreSQL 14+ (se rodar sem Docker)

### Opção 1: Com Docker (Recomendado)

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/mei-control.git
cd mei-control

# 2. Crie o arquivo de ambiente
cp .env.example .env

# 3. Suba os containers
docker compose up -d

# 4. Execute as migrations e seed
docker compose exec backend npx prisma db push
docker compose exec backend npm run db:seed

# 5. Acesse
# Frontend: http://localhost
# Backend: http://localhost:3001
```

### Opção 2: Desenvolvimento Local

```bash
# Backend
cd backend
cp .env.example .env
# Edite o .env com suas configurações do PostgreSQL
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev

# Frontend (em outro terminal)
cd frontend
npm install
npm run dev
```

## 🔑 Credenciais de Teste

Após rodar o seed, use:

- **CPF:** 123.456.789-00
- **Senha:** 123456

## 📁 Estrutura do Projeto

```
mei-control/
├── backend/                 # API Node.js
│   ├── prisma/             # Schema e migrations
│   │   ├── schema.prisma   # Modelo do banco
│   │   └── seed.js         # Dados iniciais
│   ├── src/
│   │   ├── controllers/    # Lógica dos endpoints
│   │   ├── middleware/     # Auth, erros, rate limit
│   │   ├── routes/         # Definição das rotas
│   │   ├── services/       # Serviços (notificações, cron)
│   │   └── server.js       # Entrada da aplicação
│   ├── Dockerfile
│   └── package.json
│
├── frontend/               # React + Vite
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── context/        # Estado global (Zustand)
│   │   ├── pages/          # Páginas da aplicação
│   │   ├── services/       # Chamadas à API
│   │   └── App.jsx
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── docker-compose.yml      # Orquestração dos containers
└── README.md
```

## ☁️ Deploy na Nuvem

### Railway (Mais Fácil)

1. Crie uma conta em [railway.app](https://railway.app)
2. Conecte seu repositório GitHub
3. Railway detecta automaticamente o docker-compose
4. Configure as variáveis de ambiente
5. Deploy automático!

### Render

1. Crie uma conta em [render.com](https://render.com)
2. Crie um PostgreSQL Database
3. Crie um Web Service para o backend (Node)
4. Crie um Static Site para o frontend
5. Configure as variáveis

### DigitalOcean App Platform

1. Crie uma conta em [digitalocean.com](https://digitalocean.com)
2. Vá em App Platform > Create App
3. Conecte o repositório
4. Configure os recursos (backend, frontend, database)
5. Deploy!

### AWS (Mais Controle)

```bash
# Com Docker em EC2
ssh usuario@seu-servidor

# Instalar Docker
curl -fsSL https://get.docker.com | sh

# Clonar e rodar
git clone https://github.com/seu-usuario/mei-control.git
cd mei-control
docker compose up -d
```

## 🔧 Variáveis de Ambiente

### Backend (.env)

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=sua-chave-secreta-muito-segura
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://seu-dominio.com
```

### Frontend

O frontend usa proxy em desenvolvimento. Em produção, configure a variável:

```env
VITE_API_URL=https://api.seu-dominio.com/api/v1
```

## 📊 Endpoints da API

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /api/v1/auth/login | Login |
| POST | /api/v1/auth/registro | Criar conta |
| GET | /api/v1/meis | Listar MEIs |
| POST | /api/v1/meis | Cadastrar MEI |
| GET | /api/v1/clientes | Listar clientes |
| POST | /api/v1/clientes | Cadastrar cliente |
| GET | /api/v1/notas-fiscais | Listar notas |
| POST | /api/v1/notas-fiscais | Emitir nota |
| GET | /api/v1/dashboard/:meiId | Dados do dashboard |
| GET | /api/v1/das | Listar guias DAS |

## 🛡️ Segurança

- Senhas hasheadas com bcrypt (12 rounds)
- Autenticação via JWT
- Rate limiting por IP
- Validação de entrada com express-validator
- Helmet para headers de segurança
- CORS configurado

## 📝 Limites do MEI (2025)

- **Teto anual:** R$ 81.000,00
- **Média mensal:** R$ 6.750,00
- **Tolerância:** Até 20% acima (R$ 97.200)
- **DAS mensal:** ~R$ 75,90 (5% do salário mínimo + ISS ou ICMS)

## 🤝 Contribuindo

1. Fork o projeto
2. Crie sua branch (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Add MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📄 Licença

MIT License - veja [LICENSE](LICENSE) para detalhes.

## 🆘 Suporte

- Abra uma [issue](https://github.com/seu-usuario/mei-control/issues)
- Entre em contato: seu-email@exemplo.com

---

Desenvolvido com ❤️ para simplificar a vida do MEI brasileiro.
