// ============================================
// MEI Control - Servidor Principal
// ============================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// Importar rotas
const authRoutes = require('./routes/auth.routes');
const usuarioRoutes = require('./routes/usuario.routes');
const meiRoutes = require('./routes/mei.routes');
const clienteRoutes = require('./routes/cliente.routes');
const notaFiscalRoutes = require('./routes/notaFiscal.routes');
const dasRoutes = require('./routes/das.routes');
const declaracaoRoutes = require('./routes/declaracao.routes');
const notificacaoRoutes = require('./routes/notificacao.routes');
const relatorioRoutes = require('./routes/relatorio.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

// Importar middlewares
const errorHandler = require('./middleware/errorHandler');
const { limiter } = require('./middleware/rateLimiter');

// Importar serviços
const cronService = require('./services/cron.service');

// Inicializar Express
const app = express();

// ============================================
// MIDDLEWARES GLOBAIS
// ============================================

// Segurança HTTP headers
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
app.use(limiter);

// Parser JSON e URL encoded
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Arquivos estáticos (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ============================================
// ROTAS DA API
// ============================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// Rotas da API v1
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/usuarios', usuarioRoutes);
app.use('/api/v1/meis', meiRoutes);
app.use('/api/v1/clientes', clienteRoutes);
app.use('/api/v1/notas-fiscais', notaFiscalRoutes);
app.use('/api/v1/das', dasRoutes);
app.use('/api/v1/declaracoes', declaracaoRoutes);
app.use('/api/v1/notificacoes', notificacaoRoutes);
app.use('/api/v1/relatorios', relatorioRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

// ============================================
// TRATAMENTO DE ERROS
// ============================================

// Rota não encontrada
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Rota não encontrada',
    path: req.originalUrl
  });
});

// Error handler global
app.use(errorHandler);

// ============================================
// INICIALIZAÇÃO DO SERVIDOR
// ============================================

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 MEI Control API Server                               ║
║                                                           ║
║   Ambiente: ${process.env.NODE_ENV || 'development'}                              ║
║   Porta: ${PORT}                                            ║
║   URL: http://localhost:${PORT}                             ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);

  // Iniciar tarefas agendadas (cron jobs)
  if (process.env.NODE_ENV !== 'test') {
    cronService.iniciar();
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM recebido. Encerrando servidor...');
  server.close(() => {
    console.log('Servidor encerrado.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT recebido. Encerrando servidor...');
  server.close(() => {
    console.log('Servidor encerrado.');
    process.exit(0);
  });
});

module.exports = app;
