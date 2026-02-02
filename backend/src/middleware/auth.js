const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'mei-control-secret-2024';

// Middleware de autenticação
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Buscar usuário
      const usuario = await prisma.usuario.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          nome: true,
          cpf: true,
          role: true,
          ativo: true,
          meis: {
            select: {
              id: true,
              cnpj: true,
              razaoSocial: true,
              nomeFantasia: true
            }
          }
        }
      });

      if (!usuario || !usuario.ativo) {
        return res.status(401).json({ error: 'Usuário inativo ou não encontrado' });
      }

      req.usuario = usuario;
      req.meiAtual = usuario.meis[0] || null;
      
      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expirado' });
      }
      return res.status(401).json({ error: 'Token inválido' });
    }
  } catch (error) {
    console.error('Erro no middleware de auth:', error);
    res.status(500).json({ error: 'Erro interno de autenticação' });
  }
};

// Middleware para verificar role ADMIN
const adminMiddleware = (req, res, next) => {
  if (req.usuario.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Acesso restrito a administradores' });
  }
  next();
};

// Gerar token JWT
const gerarToken = (usuario) => {
  return jwt.sign(
    { 
      id: usuario.id, 
      email: usuario.email, 
      role: usuario.role 
    },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

module.exports = {
  authMiddleware,
  adminMiddleware,
  gerarToken,
  JWT_SECRET
};
