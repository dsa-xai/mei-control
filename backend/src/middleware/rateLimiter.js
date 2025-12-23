// ============================================
// Middleware de Rate Limiting
// ============================================

const rateLimit = require('express-rate-limit');

// Rate limiter geral
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // 100 requests por janela
  message: {
    success: false,
    error: 'Muitas requisições. Tente novamente mais tarde.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.headers['x-forwarded-for'] || 'unknown';
  }
});

// Rate limiter para autenticação (mais restritivo)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas de login
  message: {
    success: false,
    error: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiter para criação de contas
const createAccountLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // 3 contas por hora
  message: {
    success: false,
    error: 'Muitas contas criadas. Tente novamente mais tarde.',
    code: 'CREATE_ACCOUNT_LIMIT_EXCEEDED'
  }
});

// Rate limiter para emissão de notas
const notaFiscalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // 10 notas por minuto
  message: {
    success: false,
    error: 'Muitas notas emitidas. Aguarde um momento.',
    code: 'NOTA_FISCAL_LIMIT_EXCEEDED'
  }
});

module.exports = {
  limiter,
  authLimiter,
  createAccountLimiter,
  notaFiscalLimiter
};
