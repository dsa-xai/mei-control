const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { adminMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Listar MEIs
router.get('/', async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const where = req.usuario.role === 'ADMIN' 
      ? {} 
      : { usuarioId: req.usuario.id };

    if (search) {
      where.OR = [
        { razaoSocial: { contains: search, mode: 'insensitive' } },
        { nomeFantasia: { contains: search, mode: 'insensitive' } },
        { cnpj: { contains: search.replace(/\D/g, '') } }
      ];
    }

    const [meis, total] = await Promise.all([
      prisma.mEI.findMany({
        where,
        include: {
          usuario: {
            select: { nome: true, email: true, telefone: true }
          },
          _count: {
            select: { notasFiscais: true, solicitacoes: true }
          }
        },
        skip,
        take: Number(limit),
        orderBy: { razaoSocial: 'asc' }
      }),
      prisma.mEI.count({ where })
    ]);

    res.json({
      data: meis,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Buscar MEI por ID
router.get('/:id', async (req, res, next) => {
  try {
    const mei = await prisma.mEI.findUnique({
      where: { id: req.params.id },
      include: {
        usuario: {
          select: { nome: true, email: true, telefone: true, cpf: true }
        }
      }
    });

    if (!mei) {
      return res.status(404).json({ error: 'MEI não encontrado' });
    }

    // Verificar acesso
    if (req.usuario.role !== 'ADMIN' && mei.usuarioId !== req.usuario.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    res.json(mei);
  } catch (error) {
    next(error);
  }
});

// Criar MEI (Admin)
router.post('/', adminMiddleware, async (req, res, next) => {
  try {
    const { 
      usuarioId, cnpj, razaoSocial, nomeFantasia,
      atividadePrincipal, cnaePrincipal, endereco,
      cidade, estado, cep, inscricaoMunicipal,
      inscricaoEstadual, dataAbertura
    } = req.body;

    const cnpjLimpo = cnpj.replace(/\D/g, '');

    const mei = await prisma.mEI.create({
      data: {
        usuarioId,
        cnpj: cnpjLimpo,
        razaoSocial,
        nomeFantasia,
        atividadePrincipal,
        cnaePrincipal,
        endereco,
        cidade,
        estado,
        cep: cep?.replace(/\D/g, ''),
        inscricaoMunicipal,
        inscricaoEstadual,
        dataAbertura: dataAbertura ? new Date(dataAbertura) : null
      }
    });

    res.status(201).json(mei);
  } catch (error) {
    next(error);
  }
});

// Atualizar MEI
router.put('/:id', async (req, res, next) => {
  try {
    const mei = await prisma.mEI.findUnique({
      where: { id: req.params.id }
    });

    if (!mei) {
      return res.status(404).json({ error: 'MEI não encontrado' });
    }

    if (req.usuario.role !== 'ADMIN' && mei.usuarioId !== req.usuario.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const { cnpj, cep, ...dados } = req.body;

    const meiAtualizado = await prisma.mEI.update({
      where: { id: req.params.id },
      data: {
        ...dados,
        cnpj: cnpj ? cnpj.replace(/\D/g, '') : undefined,
        cep: cep ? cep.replace(/\D/g, '') : undefined
      }
    });

    res.json(meiAtualizado);
  } catch (error) {
    next(error);
  }
});

// Deletar MEI (Admin)
router.delete('/:id', adminMiddleware, async (req, res, next) => {
  try {
    await prisma.mEI.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'MEI deletado com sucesso' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
