const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Listar clientes
router.get('/', async (req, res, next) => {
  try {
    const { meiId, search, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const where = {};

    if (req.usuario.role !== 'ADMIN') {
      const meiIds = req.usuario.meis.map(m => m.id);
      where.meiId = { in: meiIds };
    } else if (meiId) {
      where.meiId = meiId;
    }

    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { cpfCnpj: { contains: search.replace(/\D/g, '') } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [clientes, total] = await Promise.all([
      prisma.cliente.findMany({
        where,
        include: {
          mei: { select: { razaoSocial: true } },
          _count: { select: { notasFiscais: true } }
        },
        skip,
        take: Number(limit),
        orderBy: { nome: 'asc' }
      }),
      prisma.cliente.count({ where })
    ]);

    res.json({
      data: clientes,
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

// Buscar cliente por ID
router.get('/:id', async (req, res, next) => {
  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id: req.params.id },
      include: {
        mei: true,
        notasFiscais: {
          orderBy: { dataEmissao: 'desc' },
          take: 10
        }
      }
    });

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    res.json(cliente);
  } catch (error) {
    next(error);
  }
});

// Criar cliente
router.post('/', async (req, res, next) => {
  try {
    const { meiId, tipo, nome, cpfCnpj, email, telefone, endereco, cidade, estado, cep } = req.body;

    // Determinar MEI
    let meiIdFinal = meiId;
    if (req.usuario.role === 'CLIENTE') {
      meiIdFinal = req.usuario.meis[0]?.id;
    }

    if (!meiIdFinal) {
      return res.status(400).json({ error: 'MEI não especificado' });
    }

    const cliente = await prisma.cliente.create({
      data: {
        meiId: meiIdFinal,
        tipo: tipo || (cpfCnpj.replace(/\D/g, '').length === 11 ? 'PF' : 'PJ'),
        nome,
        cpfCnpj: cpfCnpj.replace(/\D/g, ''),
        email,
        telefone,
        endereco,
        cidade,
        estado,
        cep: cep?.replace(/\D/g, '')
      }
    });

    res.status(201).json(cliente);
  } catch (error) {
    next(error);
  }
});

// Atualizar cliente
router.put('/:id', async (req, res, next) => {
  try {
    const { cpfCnpj, cep, ...dados } = req.body;

    const cliente = await prisma.cliente.update({
      where: { id: req.params.id },
      data: {
        ...dados,
        cpfCnpj: cpfCnpj ? cpfCnpj.replace(/\D/g, '') : undefined,
        cep: cep ? cep.replace(/\D/g, '') : undefined
      }
    });

    res.json(cliente);
  } catch (error) {
    next(error);
  }
});

// Deletar cliente
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.cliente.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Cliente deletado com sucesso' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
