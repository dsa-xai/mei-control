const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { adminMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Listar DAS
router.get('/', async (req, res, next) => {
  try {
    const { meiId, status, ano, page = 1, limit = 12 } = req.query;
    const skip = (page - 1) * limit;

    const where = {};

    if (req.usuario.role !== 'ADMIN') {
      const meiIds = req.usuario.meis.map(m => m.id);
      where.meiId = { in: meiIds };
    } else if (meiId) {
      where.meiId = meiId;
    }

    if (status) where.status = status;
    if (ano) {
      where.competencia = {
        gte: new Date(ano, 0, 1),
        lt: new Date(Number(ano) + 1, 0, 1)
      };
    }

    const [guias, total] = await Promise.all([
      prisma.dAS.findMany({
        where,
        include: {
          mei: { select: { razaoSocial: true, cnpj: true } }
        },
        skip,
        take: Number(limit),
        orderBy: { competencia: 'desc' }
      }),
      prisma.dAS.count({ where })
    ]);

    res.json({
      data: guias,
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

// Buscar DAS por ID
router.get('/:id', async (req, res, next) => {
  try {
    const das = await prisma.dAS.findUnique({
      where: { id: req.params.id },
      include: {
        mei: true
      }
    });

    if (!das) {
      return res.status(404).json({ error: 'DAS não encontrado' });
    }

    res.json(das);
  } catch (error) {
    next(error);
  }
});

// Criar DAS (Admin)
router.post('/', adminMiddleware, async (req, res, next) => {
  try {
    const { meiId, competencia, valor, dataVencimento, codigoBarras, linhaDigitavel } = req.body;

    const das = await prisma.dAS.create({
      data: {
        meiId,
        competencia: new Date(competencia),
        valor: Number(valor),
        dataVencimento: new Date(dataVencimento),
        codigoBarras,
        linhaDigitavel
      }
    });

    res.status(201).json(das);
  } catch (error) {
    next(error);
  }
});

// Registrar pagamento
router.post('/:id/pagar', async (req, res, next) => {
  try {
    const { valorPago, dataPagamento } = req.body;

    const das = await prisma.dAS.findUnique({
      where: { id: req.params.id }
    });

    if (!das) {
      return res.status(404).json({ error: 'DAS não encontrado' });
    }

    // Verificar permissão
    if (req.usuario.role !== 'ADMIN') {
      const meiIds = req.usuario.meis.map(m => m.id);
      if (!meiIds.includes(das.meiId)) {
        return res.status(403).json({ error: 'Acesso negado' });
      }
    }

    const dasAtualizado = await prisma.dAS.update({
      where: { id: req.params.id },
      data: {
        status: 'PAGO',
        valorPago: valorPago ? Number(valorPago) : Number(das.valor),
        dataPagamento: dataPagamento ? new Date(dataPagamento) : new Date()
      }
    });

    res.json(dasAtualizado);
  } catch (error) {
    next(error);
  }
});

// Gerar DAS mensal para todos os MEIs (Admin)
router.post('/gerar-mensal', adminMiddleware, async (req, res, next) => {
  try {
    const { ano, mes, valor } = req.body;

    const meis = await prisma.mEI.findMany({
      where: { situacao: 'ATIVA' }
    });

    const competencia = new Date(ano, mes - 1, 1);
    const dataVencimento = new Date(ano, mes - 1, 20); // Vencimento dia 20

    const guiasCriadas = [];

    for (const mei of meis) {
      // Verificar se já existe
      const existente = await prisma.dAS.findFirst({
        where: {
          meiId: mei.id,
          competencia
        }
      });

      if (!existente) {
        const das = await prisma.dAS.create({
          data: {
            meiId: mei.id,
            competencia,
            valor: Number(valor),
            dataVencimento
          }
        });
        guiasCriadas.push(das);
      }
    }

    res.json({
      message: `${guiasCriadas.length} guias DAS criadas`,
      guias: guiasCriadas
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
