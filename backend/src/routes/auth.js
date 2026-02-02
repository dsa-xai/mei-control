const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { gerarToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Login por CPF/Senha
router.post('/login', async (req, res, next) => {
  try {
    const { cpf, senha } = req.body;

    if (!cpf || !senha) {
      return res.status(400).json({ error: 'CPF e senha são obrigatórios' });
    }

    // Limpar CPF
    const cpfLimpo = cpf.replace(/\D/g, '');

    const usuario = await prisma.usuario.findUnique({
      where: { cpf: cpfLimpo },
      include: {
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

    if (!usuario) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    if (!usuario.ativo) {
      return res.status(401).json({ error: 'Usuário inativo' });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Gerar token
    const token = gerarToken(usuario);

    // Registrar sessão
    await prisma.sessao.create({
      data: {
        usuarioId: usuario.id,
        token,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        expiraEm: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 dias
      }
    });

    // Log de atividade
    await prisma.logAtividade.create({
      data: {
        usuarioId: usuario.id,
        acao: 'LOGIN',
        entidade: 'Usuario',
        entidadeId: usuario.id,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    res.json({
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        cpf: usuario.cpf,
        role: usuario.role,
        meis: usuario.meis
      }
    });
  } catch (error) {
    next(error);
  }
});

// Login por CNPJ (clientes)
router.post('/login-cnpj', async (req, res, next) => {
  try {
    const { cnpj, senha } = req.body;

    if (!cnpj || !senha) {
      return res.status(400).json({ error: 'CNPJ e senha são obrigatórios' });
    }

    const cnpjLimpo = cnpj.replace(/\D/g, '');

    const mei = await prisma.mEI.findUnique({
      where: { cnpj: cnpjLimpo },
      include: {
        usuario: {
          include: {
            meis: {
              select: {
                id: true,
                cnpj: true,
                razaoSocial: true,
                nomeFantasia: true
              }
            }
          }
        }
      }
    });

    if (!mei || !mei.usuario.ativo) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const senhaValida = await bcrypt.compare(senha, mei.usuario.senha);
    if (!senhaValida) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = gerarToken(mei.usuario);

    res.json({
      token,
      usuario: {
        id: mei.usuario.id,
        nome: mei.usuario.nome,
        email: mei.usuario.email,
        cpf: mei.usuario.cpf,
        role: mei.usuario.role,
        meis: mei.usuario.meis
      },
      meiAtual: {
        id: mei.id,
        cnpj: mei.cnpj,
        razaoSocial: mei.razaoSocial,
        nomeFantasia: mei.nomeFantasia
      }
    });
  } catch (error) {
    next(error);
  }
});

// Verificar token
router.get('/me', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const token = authHeader.replace('Bearer ', '');
    const jwt = require('jsonwebtoken');
    const { JWT_SECRET } = require('../middleware/auth');
    
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const usuario = await prisma.usuario.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        nome: true,
        email: true,
        cpf: true,
        role: true,
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

    if (!usuario) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    res.json({ usuario });
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
});

// Logout
router.post('/logout', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      await prisma.sessao.deleteMany({ where: { token } });
    }
    res.json({ message: 'Logout realizado com sucesso' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
