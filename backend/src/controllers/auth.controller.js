// ============================================
// Controlador de Autenticação
// ============================================

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');
const { ApiError } = require('../middleware/errorHandler');

const prisma = new PrismaClient();

/**
 * Registrar novo usuário
 * POST /api/v1/auth/registro
 */
const registro = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Erro de validação',
        details: errors.array()
      });
    }

    const { nome, email, cpf, senha, telefone } = req.body;

    // Verificar se email já existe
    const emailExiste = await prisma.usuario.findUnique({ where: { email } });
    if (emailExiste) {
      throw new ApiError(409, 'Este email já está cadastrado');
    }

    // Verificar se CPF já existe
    const cpfLimpo = cpf.replace(/\D/g, '');
    const cpfExiste = await prisma.usuario.findUnique({ where: { cpf: cpfLimpo } });
    if (cpfExiste) {
      throw new ApiError(409, 'Este CPF já está cadastrado');
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 12);

    // Criar usuário
    const usuario = await prisma.usuario.create({
      data: {
        nome,
        email,
        cpf: cpfLimpo,
        senha: senhaHash,
        telefone
      },
      select: {
        id: true,
        nome: true,
        email: true,
        cpf: true,
        telefone: true,
        createdAt: true
      }
    });

    // Gerar token
    const token = jwt.sign(
      { userId: usuario.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Criar sessão
    const expiraEm = new Date();
    expiraEm.setDate(expiraEm.getDate() + 7);

    await prisma.sessao.create({
      data: {
        usuarioId: usuario.id,
        token,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        expiraEm
      }
    });

    // Log de atividade
    await prisma.logAtividade.create({
      data: {
        usuarioId: usuario.id,
        acao: 'REGISTRO',
        entidade: 'Usuario',
        entidadeId: usuario.id,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso',
      data: {
        usuario,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login de usuário
 * POST /api/v1/auth/login
 */
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Erro de validação',
        details: errors.array()
      });
    }

    const { documento, senha } = req.body;
    const documentoLimpo = documento.replace(/\D/g, '');

    // Buscar usuário por CPF ou buscar MEI por CNPJ
    let usuario = await prisma.usuario.findUnique({
      where: { cpf: documentoLimpo }
    });

    // Se não encontrou por CPF, buscar pelo CNPJ do MEI
    if (!usuario) {
      const mei = await prisma.mEI.findUnique({
        where: { cnpj: documentoLimpo },
        include: { usuario: true }
      });
      if (mei) {
        usuario = mei.usuario;
      }
    }

    if (!usuario) {
      throw new ApiError(401, 'Credenciais inválidas');
    }

    // Verificar se conta está ativa
    if (!usuario.ativo) {
      throw new ApiError(403, 'Conta desativada. Entre em contato com o suporte.');
    }

    // Verificar senha
    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      throw new ApiError(401, 'Credenciais inválidas');
    }

    // Gerar token
    const token = jwt.sign(
      { userId: usuario.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Criar sessão
    const expiraEm = new Date();
    expiraEm.setDate(expiraEm.getDate() + 7);

    await prisma.sessao.create({
      data: {
        usuarioId: usuario.id,
        token,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        expiraEm
      }
    });

    // Buscar MEIs do usuário
    const meis = await prisma.mEI.findMany({
      where: { usuarioId: usuario.id, ativo: true },
      select: {
        id: true,
        cnpj: true,
        razaoSocial: true,
        nomeFantasia: true,
        dataAbertura: true
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
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          cpf: usuario.cpf,
          telefone: usuario.telefone
        },
        meis,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout
 * POST /api/v1/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    // Remover sessão
    await prisma.sessao.delete({
      where: { id: req.sessaoId }
    });

    // Log de atividade
    await prisma.logAtividade.create({
      data: {
        usuarioId: req.usuario.id,
        acao: 'LOGOUT',
        entidade: 'Usuario',
        entidadeId: req.usuario.id,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    res.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obter usuário atual
 * GET /api/v1/auth/me
 */
const me = async (req, res, next) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.usuario.id },
      select: {
        id: true,
        nome: true,
        email: true,
        cpf: true,
        telefone: true,
        emailVerificado: true,
        createdAt: true,
        meis: {
          where: { ativo: true },
          select: {
            id: true,
            cnpj: true,
            razaoSocial: true,
            nomeFantasia: true,
            dataAbertura: true,
            cnaePrincipal: true,
            cnaeDescricao: true,
            situacao: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: usuario
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Alterar senha
 * PUT /api/v1/auth/alterar-senha
 */
const alterarSenha = async (req, res, next) => {
  try {
    const { senhaAtual, novaSenha } = req.body;

    const usuario = await prisma.usuario.findUnique({
      where: { id: req.usuario.id }
    });

    // Verificar senha atual
    const senhaValida = await bcrypt.compare(senhaAtual, usuario.senha);
    if (!senhaValida) {
      throw new ApiError(400, 'Senha atual incorreta');
    }

    // Hash da nova senha
    const novaSenhaHash = await bcrypt.hash(novaSenha, 12);

    // Atualizar senha
    await prisma.usuario.update({
      where: { id: req.usuario.id },
      data: { senha: novaSenhaHash }
    });

    // Invalidar todas as outras sessões
    await prisma.sessao.deleteMany({
      where: {
        usuarioId: req.usuario.id,
        NOT: { id: req.sessaoId }
      }
    });

    res.json({
      success: true,
      message: 'Senha alterada com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh token
 * POST /api/v1/auth/refresh
 */
const refreshToken = async (req, res, next) => {
  try {
    // Gerar novo token
    const novoToken = jwt.sign(
      { userId: req.usuario.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Atualizar sessão
    const novaExpiracao = new Date();
    novaExpiracao.setDate(novaExpiracao.getDate() + 7);

    await prisma.sessao.update({
      where: { id: req.sessaoId },
      data: {
        token: novoToken,
        expiraEm: novaExpiracao
      }
    });

    res.json({
      success: true,
      data: { token: novoToken }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registro,
  login,
  logout,
  me,
  alterarSenha,
  refreshToken
};
