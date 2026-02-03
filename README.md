# MEI Control v2.0

Sistema completo de gestão de notas fiscais para Microempreendedores Individuais (MEI).

![Node.js](https://img.shields.io/badge/Node.js-20-green)
![React](https://img.shields.io/badge/React-18-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)
![Docker](https://img.shields.io/badge/Docker-Ready-blue)

## 🚀 Funcionalidades

### Para Administradores (Contadores)
- ✅ Dashboard global com estatísticas de todos os MEIs
- ✅ Gerenciamento completo de múltiplos MEIs
- ✅ Emissão e cancelamento de notas fiscais
- ✅ Validação de solicitações de clientes
- ✅ Controle de DAS (pagamentos mensais)
- ✅ Alertas progressivos de teto de faturamento

### Para Clientes (MEI)
- ✅ Dashboard personalizado com faturamento
- ✅ Visualização de notas e DAS
- ✅ Solicitação de notas com gravação de áudio
- ✅ Acompanhamento de solicitações
- ✅ Notificações em tempo real

### Sistema de Alertas
| Nível | Percentual | Cor | Comportamento |
|-------|------------|-----|---------------|
| Seguro | 0-64% | Verde | Normal |
| Atenção | 65-79% | Amarelo | Alerta visual |
| Aviso | 80-94% | Laranja | Animação pulse |
| Perigo | 95-99% | Vermelho | Urgente |
| Crítico | 100%+ | Vermelho escuro | Bloqueia ações |

## 🛠️ Tecnologias

**Backend:**
- Node.js 20 + Express
- Prisma ORM + PostgreSQL
- JWT Authentication
- Multer (uploads)
- Node-cron (tarefas agendadas)

**Frontend:**
- React 18 + Vite
- Tailwind CSS
- Zustand (state)
- React Router
- Recharts (gráficos)
- Lucide Icons

## 📦 Instalação

### Com Docker (Recomendado)

```bash
# Clonar repositório
git clone <repo-url>
cd mei-control

# Copiar variáveis de ambiente
cp .env.example .env

# Editar .env com suas configurações
nano .env

# Subir containers
docker-compose up -d

# Executar seed (primeira vez)
docker-compose exec backend npx prisma db seed
```

Acesse: http://localhost

### Desenvolvimento Local

```bash
# Backend
cd backend
npm install
cp .env.example .env
npx prisma migrate dev
npx prisma db seed
npm run dev

# Frontend (outro terminal)
cd frontend
npm install
npm run dev
```

Backend: http://localhost:3001
Frontend: http://localhost:5173

## 🔑 Credenciais de Teste

| Tipo | CPF | CNPJ | Senha |
|------|-----|------|-------|
| Admin | 000.000.000-00 | - | 123456 |
| Cliente (Maria) | 123.456.789-00 | 12.345.678/0001-90 | 123456 |
| Cliente (João) | 987.654.321-00 | 98.765.432/0001-10 | 123456 |

## 🌐 Deploy

### Railway (Recomendado)

#### Passo 1: Backend

1. Crie um novo projeto no Railway
2. Adicione um **PostgreSQL** database
3. Crie um serviço conectando seu repo, pasta `backend/`
4. Configure as variáveis:

| Variável | Valor |
|----------|-------|
| `DATABASE_URL` | (automático do PostgreSQL) |
| `JWT_SECRET` | `sua-chave-secreta-aqui` |
| `NODE_ENV` | `production` |

5. Em **Settings > Deploy > Start Command**:
```bash
npx prisma db push && node prisma/seed.js && node src/server.js
```

6. **Após primeiro deploy**, mude o Start Command para:
```bash
node src/server.js
```

7. Anote a URL do backend (ex: `https://mei-backend-xxx.up.railway.app`)

#### Passo 2: Frontend

1. Crie outro serviço, pasta `frontend/`
2. Em **Variables**, adicione:

| Variável | Valor |
|----------|-------|
| `VITE_API_URL` | `https://SEU-BACKEND.up.railway.app/api/v1` |

3. Deploy automático!

#### Passo 3: CORS

Volte no backend e adicione:

| Variável | Valor |
|----------|-------|
| `FRONTEND_URL` | `https://SEU-FRONTEND.up.railway.app` |

### Render

1. Crie Web Service para backend
2. Crie Static Site para frontend
3. Crie PostgreSQL database
4. Configure variáveis

### DigitalOcean App Platform

1. Conecte repositório
2. Configure componentes:
   - Backend: Docker
   - Frontend: Static
   - Database: PostgreSQL
3. Deploy

## 📁 Estrutura

```
mei-control/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── src/
│   │   ├── server.js
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── services/
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── services/
│   │   └── App.jsx
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml
└── README.md
```

## 📝 API Endpoints

### Autenticação
- `POST /api/v1/auth/login` - Login com CPF
- `POST /api/v1/auth/login-cnpj` - Login com CNPJ
- `GET /api/v1/auth/me` - Usuário atual

### Dashboard
- `GET /api/v1/dashboard/admin` - Dashboard admin
- `GET /api/v1/dashboard/cliente` - Dashboard cliente

### MEIs
- `GET /api/v1/meis` - Listar MEIs
- `POST /api/v1/meis` - Criar MEI
- `PUT /api/v1/meis/:id` - Atualizar MEI
- `DELETE /api/v1/meis/:id` - Deletar MEI

### Notas Fiscais
- `GET /api/v1/notas` - Listar notas
- `POST /api/v1/notas` - Emitir nota
- `POST /api/v1/notas/:id/cancelar` - Cancelar nota

### Solicitações
- `GET /api/v1/solicitacoes` - Listar solicitações
- `POST /api/v1/solicitacoes` - Criar solicitação (multipart)
- `PUT /api/v1/solicitacoes/:id/status` - Atualizar status

### DAS
- `GET /api/v1/das` - Listar DAS
- `POST /api/v1/das/:id/pagar` - Registrar pagamento

### Clientes
- `GET /api/v1/clientes` - Listar clientes
- `POST /api/v1/clientes` - Criar cliente
- `PUT /api/v1/clientes/:id` - Atualizar
- `DELETE /api/v1/clientes/:id` - Deletar

## 🔒 Segurança

- JWT com expiração configurável
- Rate limiting por IP
- Helmet para headers HTTP
- CORS configurável
- Senhas com bcrypt
- Validação de roles

## 📄 Licença

MIT © 2024

---

Desenvolvido com ❤️ para simplificar a gestão de MEIs
