// ============================================
// Middleware de Tratamento de Erros
// ============================================

/**
 * Classe para erros customizados da API
 */
class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Middleware global de tratamento de erros
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  // Erro do Prisma - Unique constraint
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      error: 'Registro já existe',
      details: `O campo ${err.meta?.target?.join(', ')} já está em uso`
    });
  }

  // Erro do Prisma - Record not found
  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      error: 'Registro não encontrado'
    });
  }

  // Erro do Prisma - Foreign key constraint
  if (err.code === 'P2003') {
    return res.status(400).json({
      success: false,
      error: 'Erro de referência',
      details: 'O registro referenciado não existe'
    });
  }

  // Erro de validação do express-validator
  if (err.array && typeof err.array === 'function') {
    return res.status(400).json({
      success: false,
      error: 'Erro de validação',
      details: err.array()
    });
  }

  // JSON parse error
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: 'JSON inválido no corpo da requisição'
    });
  }

  // Erro operacional (ApiError)
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      details: err.details
    });
  }

  // Erro de JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Token inválido'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token expirado',
      code: 'TOKEN_EXPIRED'
    });
  }

  // Erro não tratado
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Erro interno do servidor'
    : err.message;

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};

/**
 * Wrapper para funções async/await
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = errorHandler;
module.exports.ApiError = ApiError;
module.exports.asyncHandler = asyncHandler;
