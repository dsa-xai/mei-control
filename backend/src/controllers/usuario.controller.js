// ============================================
// Controlador de Usuário
// ============================================

const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { ApiError } = require('../middleware/errorHandler');

const prisma = new PrismaClient();

/**
 * Obter perfil do usuário
 */
const obterPerfil = async (req, res, next) => {
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
        _count: {
          select: { meis: { where: { ativo: true } } }
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
 * Atualizar perfil
 */
const atualizarPerfil = async (req, res, next) => {
  try {
    const { nome, telefone } = req.body;

    const usuario = await prisma.usuario.update({
      where: { id: req.usuario.id },
      data: { nome, telefone },
      select: {
        id: true,
        nome: true,
        email: true,
        cpf: true,
        telefone: true
      }
    });

    res.json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      data: usuario
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Atualizar email
 */
const atualizarEmail = async (req, res, next) => {
  try {
    const { novoEmail, senha } = req.body;

    // Verificar senha
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.usuario.id }
    });

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      throw new ApiError(400, 'Senha incorreta');
    }

    // Verificar se email já existe
    const emailExiste = await prisma.usuario.findUnique({
      where: { email: novoEmail }
    });

    if (emailExiste) {
      throw new ApiError(409, 'Este email já está em uso');
    }

    await prisma.usuario.update({
      where: { id: req.usuario.id },
      data: {
        email: novoEmail,
        emailVerificado: false
      }
    });

    res.json({
      success: true,
      message: 'Email atualizado com sucesso. Verifique seu novo email.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Desativar conta
 */
const desativarConta = async (req, res, next) => {
  try {
    const { senha } = req.body;

    // Verificar senha
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.usuario.id }
    });

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      throw new ApiError(400, 'Senha incorreta');
    }

    // Desativar usuário e MEIs
    await prisma.$transaction([
      prisma.usuario.update({
        where: { id: req.usuario.id },
        data: { ativo: false }
      }),
      prisma.mEI.updateMany({
        where: { usuarioId: req.usuario.id },
        data: { ativo: false }
      }),
      prisma.sessao.deleteMany({
        where: { usuarioId: req.usuario.id }
      })
    ]);

    res.json({
      success: true,
      message: 'Conta desativada com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  obterPerfil,
  atualizarPerfil,
  atualizarEmail,
  desativarConta
};
