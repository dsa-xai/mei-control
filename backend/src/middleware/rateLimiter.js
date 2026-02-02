const rateLimit = require('express-rate-limit');

// Rate limiter para autenticação (mais restritivo)
const auth = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // 10 tentativas
  message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter para API geral
const api = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100, // 100 requisições por minuto
  message: { error: 'Muitas requisições. Tente novamente em alguns segundos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { auth, api };
