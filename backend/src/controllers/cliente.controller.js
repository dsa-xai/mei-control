// ============================================
// Controlador de Clientes
// ============================================

const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');
const { ApiError } = require('../middleware/errorHandler');

const prisma = new PrismaClient();

/**
 * Listar clientes do MEI
 * GET /api/v1/clientes
 */
const listar = async (req, res, next) => {
  try {
    const { meiId, busca, tipo, page = 1, limit = 50 } = req.query;

    const mei = await prisma.mEI.findFirst({
      where: { id: meiId, usuarioId: req.usuario.id }
    });

    if (!mei) {
      throw new ApiError(404, 'MEI não encontrado');
    }

    const where = { meiId, ativo: true };

    if (tipo) where.tipo = tipo;
    if (busca) {
      where.OR = [
        { nome: { contains: busca, mode: 'insensitive' } },
        { cpfCnpj: { contains: busca.replace(/\D/g, '') } },
        { email: { contains: busca, mode: 'insensitive' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [clientes, total] = await Promise.all([
      prisma.cliente.findMany({
        where,
        orderBy: { nome: 'asc' },
        skip,
        take: parseInt(limit),
        include: {
          _count: {
            select: {
              notasFiscais: { where: { status: 'EMITIDA' } }
            }
          }
        }
      }),
      prisma.cliente.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        clientes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obter cliente por ID
 * GET /api/v1/clientes/:id
 */
const obter = async (req, res, next) => {
  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id: req.params.id },
      include: {
        mei: { select: { usuarioId: true } },
        notasFiscais: {
          where: { status: 'EMITIDA' },
          orderBy: { dataEmissao: 'desc' },
          take: 10
        },
        _count: {
          select: { notasFiscais: true }
        }
      }
    });

    if (!cliente) {
      throw new ApiError(404, 'Cliente não encontrado');
    }

    if (cliente.mei.usuarioId !== req.usuario.id) {
      throw new ApiError(403, 'Sem permissão para acessar este cliente');
    }

    // Calcular total faturado com este cliente
    const totalFaturado = await prisma.notaFiscal.aggregate({
      where: { clienteId: req.params.id, status: 'EMITIDA' },
      _sum: { valor: true }
    });

    res.json({
      success: true,
      data: {
        ...cliente,
        totalFaturado: parseFloat(totalFaturado._sum.valor || 0)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Criar novo cliente
 * POST /api/v1/clientes
 */
const criar = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Erro de validação',
        details: errors.array()
      });
    }

    const {
      meiId,
      tipo,
      nome,
      cpfCnpj,
      email,
      telefone,
      cep,
      logradouro,
      numero,
      complemento,
      bairro,
      cidade,
      uf,
      observacoes
    } = req.body;

    // Verificar MEI
    const mei = await prisma.mEI.findFirst({
      where: { id: meiId, usuarioId: req.usuario.id }
    });

    if (!mei) {
      throw new ApiError(404, 'MEI não encontrado');
    }

    const cpfCnpjLimpo = cpfCnpj.replace(/\D/g, '');

    // Verificar se cliente já existe para este MEI
    const clienteExiste = await prisma.cliente.findFirst({
      where: { meiId, cpfCnpj: cpfCnpjLimpo }
    });

    if (clienteExiste) {
      if (clienteExiste.ativo) {
        throw new ApiError(409, 'Este cliente já está cadastrado');
      }
      // Reativar cliente inativo
      const clienteReativado = await prisma.cliente.update({
        where: { id: clienteExiste.id },
        data: {
          ativo: true,
          nome,
          email,
          telefone,
          cep: cep?.replace(/\D/g, ''),
          logradouro,
          numero,
          complemento,
          bairro,
          cidade,
          uf,
          observacoes
        }
      });

      return res.json({
        success: true,
        message: 'Cliente reativado com sucesso',
        data: clienteReativado
      });
    }

    const cliente = await prisma.cliente.create({
      data: {
        meiId,
        tipo: tipo || (cpfCnpjLimpo.length === 11 ? 'PF' : 'PJ'),
        nome,
        cpfCnpj: cpfCnpjLimpo,
        email,
        telefone,
        cep: cep?.replace(/\D/g, ''),
        logradouro,
        numero,
        complemento,
        bairro,
        cidade,
        uf,
        observacoes
      }
    });

    // Log de atividade
    await prisma.logAtividade.create({
      data: {
        usuarioId: req.usuario.id,
        meiId,
        acao: 'CREATE',
        entidade: 'Cliente',
        entidadeId: cliente.id,
        dadosNovos: cliente,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    res.status(201).json({
      success: true,
      message: 'Cliente cadastrado com sucesso',
      data: cliente
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Atualizar cliente
 * PUT /api/v1/clientes/:id
 */
const atualizar = async (req, res, next) => {
  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id: req.params.id },
      include: { mei: { select: { usuarioId: true } } }
    });

    if (!cliente) {
      throw new ApiError(404, 'Cliente não encontrado');
    }

    if (cliente.mei.usuarioId !== req.usuario.id) {
      throw new ApiError(403, 'Sem permissão para editar este cliente');
    }

    const {
      nome,
      email,
      telefone,
      cep,
      logradouro,
      numero,
      complemento,
      bairro,
      cidade,
      uf,
      observacoes
    } = req.body;

    const clienteAtualizado = await prisma.cliente.update({
      where: { id: req.params.id },
      data: {
        nome,
        email,
        telefone,
        cep: cep?.replace(/\D/g, ''),
        logradouro,
        numero,
        complemento,
        bairro,
        cidade,
        uf,
        observacoes
      }
    });

    res.json({
      success: true,
      message: 'Cliente atualizado com sucesso',
      data: clienteAtualizado
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Desativar cliente
 * DELETE /api/v1/clientes/:id
 */
const desativar = async (req, res, next) => {
  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id: req.params.id },
      include: { mei: { select: { usuarioId: true } } }
    });

    if (!cliente) {
      throw new ApiError(404, 'Cliente não encontrado');
    }

    if (cliente.mei.usuarioId !== req.usuario.id) {
      throw new ApiError(403, 'Sem permissão para desativar este cliente');
    }

    await prisma.cliente.update({
      where: { id: req.params.id },
      data: { ativo: false }
    });

    res.json({
      success: true,
      message: 'Cliente desativado com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listar,
  obter,
  criar,
  atualizar,
  desativar
};
