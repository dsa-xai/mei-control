// ============================================
// Middleware de Autenticação JWT
// ============================================

const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Middleware para verificar token JWT
 */
const auth = async (req, res, next) => {
  try {
    // Obter token do header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token de autenticação não fornecido'
      });
    }

    const token = authHeader.split(' ')[1];

    // Verificar token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Token expirado',
          code: 'TOKEN_EXPIRED'
        });
      }
      return res.status(401).json({
        success: false,
        error: 'Token inválido'
      });
    }

    // Verificar se sessão ainda é válida
    const sessao = await prisma.sessao.findUnique({
      where: { token },
      include: { usuario: true }
    });

    if (!sessao || sessao.expiraEm < new Date()) {
      return res.status(401).json({
        success: false,
        error: 'Sessão inválida ou expirada',
        code: 'SESSION_EXPIRED'
      });
    }

    // Verificar se usuário está ativo
    if (!sessao.usuario.ativo) {
      return res.status(403).json({
        success: false,
        error: 'Conta desativada'
      });
    }

    // Adicionar usuário à requisição
    req.usuario = sessao.usuario;
    req.token = token;
    req.sessaoId = sessao.id;

    next();
  } catch (error) {
    console.error('Erro no middleware de autenticação:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno de autenticação'
    });
  }
};

/**
 * Middleware para verificar se usuário tem MEI
 */
const requireMEI = async (req, res, next) => {
  try {
    const meiId = req.params.meiId || req.body.meiId || req.query.meiId;
    
    if (!meiId) {
      return res.status(400).json({
        success: false,
        error: 'ID do MEI não fornecido'
      });
    }

    // Verificar se MEI pertence ao usuário
    const mei = await prisma.mEI.findFirst({
      where: {
        id: meiId,
        usuarioId: req.usuario.id,
        ativo: true
      }
    });

    if (!mei) {
      return res.status(404).json({
        success: false,
        error: 'MEI não encontrado ou sem permissão'
      });
    }

    req.mei = mei;
    next();
  } catch (error) {
    console.error('Erro ao verificar MEI:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno ao verificar MEI'
    });
  }
};

/**
 * Middleware opcional de autenticação
 */
const authOptional = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const sessao = await prisma.sessao.findUnique({
        where: { token },
        include: { usuario: true }
      });

      if (sessao && sessao.expiraEm > new Date() && sessao.usuario.ativo) {
        req.usuario = sessao.usuario;
        req.token = token;
        req.sessaoId = sessao.id;
      }
    } catch (error) {
      // Ignora erros de token - autenticação é opcional
    }

    next();
  } catch (error) {
    next();
  }
};

module.exports = {
  auth,
  requireMEI,
  authOptional
};
