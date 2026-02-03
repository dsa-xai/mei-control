require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { PrismaClient } = require('@prisma/client');

const authRoutes = require('./routes/auth');
const meiRoutes = require('./routes/mei');
const notaRoutes = require('./routes/notas');
const solicitacaoRoutes = require('./routes/solicitacoes');
const dasRoutes = require('./routes/das');
const clienteRoutes = require('./routes/clientes');
const notificacaoRoutes = require('./routes/notificacoes');
const dashboardRoutes = require('./routes/dashboard');

const errorHandler = require('./middleware/errorHandler');
const { authMiddleware } = require('./middleware/auth');
const rateLimiter = require('./middleware/rateLimiter');

const { iniciarTarefas } = require('./services/scheduler');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middlewares globais
app.set('trust proxy', 1); // Necessário para Railway/proxies
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use('/api/v1/auth', rateLimiter.auth);
app.use('/api/v1', rateLimiter.api);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Rotas públicas
app.use('/api/v1/auth', authRoutes);

// Rotas protegidas
app.use('/api/v1/meis', authMiddleware, meiRoutes);
app.use('/api/v1/notas', authMiddleware, notaRoutes);
app.use('/api/v1/solicitacoes', authMiddleware, solicitacaoRoutes);
app.use('/api/v1/das', authMiddleware, dasRoutes);
app.use('/api/v1/clientes', authMiddleware, clienteRoutes);
app.use('/api/v1/notificacoes', authMiddleware, notificacaoRoutes);
app.use('/api/v1/dashboard', authMiddleware, dashboardRoutes);

// Error handler
app.use(errorHandler);

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Iniciar servidor
async function start() {
  try {
    await prisma.$connect();
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║                                                           ║');
    console.log('║   🚀 MEI Control API Server                               ║');
    console.log('║                                                           ║');
    console.log(`║   Ambiente: ${process.env.NODE_ENV || 'development'}                              ║`);
    console.log(`║   Porta: ${PORT}                                            ║`);
    console.log(`║   URL: http://localhost:${PORT}                             ║`);
    console.log('║                                                           ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    
    // Iniciar tarefas agendadas
    console.log('📅 Iniciando tarefas agendadas...');
    iniciarTarefas();
    console.log('✅ Tarefas agendadas iniciadas com sucesso');
    
    app.listen(PORT);
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

start();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Encerrando servidor...');
  await prisma.$disconnect();
  process.exit(0);
});
