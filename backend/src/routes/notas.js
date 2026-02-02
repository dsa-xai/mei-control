const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { adminMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Listar notas fiscais
router.get('/', async (req, res, next) => {
  try {
    const { meiId, clienteId, status, dataInicio, dataFim, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const where = {};

    // Filtro por permissão
    if (req.usuario.role !== 'ADMIN') {
      const meiIds = req.usuario.meis.map(m => m.id);
      where.meiId = { in: meiIds };
    } else if (meiId) {
      where.meiId = meiId;
    }

    if (clienteId) where.clienteId = clienteId;
    if (status) where.status = status;

    if (dataInicio || dataFim) {
      where.dataEmissao = {};
      if (dataInicio) where.dataEmissao.gte = new Date(dataInicio);
      if (dataFim) where.dataEmissao.lte = new Date(dataFim);
    }

    const [notas, total] = await Promise.all([
      prisma.notaFiscal.findMany({
        where,
        include: {
          mei: { select: { razaoSocial: true, cnpj: true } },
          cliente: { select: { nome: true, cpfCnpj: true } }
        },
        skip,
        take: Number(limit),
        orderBy: { dataEmissao: 'desc' }
      }),
      prisma.notaFiscal.count({ where })
    ]);

    res.json({
      data: notas,
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

// Buscar nota por ID
router.get('/:id', async (req, res, next) => {
  try {
    const nota = await prisma.notaFiscal.findUnique({
      where: { id: req.params.id },
      include: {
        mei: true,
        cliente: true,
        solicitacao: true
      }
    });

    if (!nota) {
      return res.status(404).json({ error: 'Nota fiscal não encontrada' });
    }

    res.json(nota);
  } catch (error) {
    next(error);
  }
});

// Emitir nota fiscal (Admin)
router.post('/', adminMiddleware, async (req, res, next) => {
  try {
    const { 
      meiId, clienteId, solicitacaoId,
      descricao, valor, dataCompetencia,
      aliquotaIss
    } = req.body;

    // Obter próximo número da nota
    const ultimaNota = await prisma.notaFiscal.findFirst({
      where: { meiId },
      orderBy: { numero: 'desc' }
    });
    const proximoNumero = (ultimaNota?.numero || 0) + 1;

    // Calcular ISS
    const valorDecimal = Number(valor);
    const iss = aliquotaIss ? valorDecimal * (aliquotaIss / 100) : null;

    const nota = await prisma.notaFiscal.create({
      data: {
        meiId,
        clienteId,
        solicitacaoId,
        numero: proximoNumero,
        dataEmissao: new Date(),
        dataCompetencia: dataCompetencia ? new Date(dataCompetencia) : new Date(),
        descricao,
        valor: valorDecimal,
        aliquotaIss,
        impostoIss: iss,
        codigoVerificacao: Math.random().toString(36).substring(2, 10).toUpperCase()
      },
      include: {
        mei: true,
        cliente: true
      }
    });

    // Atualizar faturamento
    const mes = nota.dataEmissao.getMonth() + 1;
    const ano = nota.dataEmissao.getFullYear();

    await prisma.faturamento.upsert({
      where: {
        meiId_ano_mes: { meiId, ano, mes }
      },
      update: {
        valor: { increment: valorDecimal },
        quantidadeNotas: { increment: 1 }
      },
      create: {
        meiId,
        ano,
        mes,
        valor: valorDecimal,
        quantidadeNotas: 1
      }
    });

    // Se veio de solicitação, atualizar status
    if (solicitacaoId) {
      await prisma.solicitacaoNota.update({
        where: { id: solicitacaoId },
        data: {
          status: 'EMITIDA',
          processadoPor: req.usuario.id,
          processadoEm: new Date()
        }
      });

      // Notificar cliente
      const solicitacao = await prisma.solicitacaoNota.findUnique({
        where: { id: solicitacaoId },
        include: { mei: { include: { usuario: true } } }
      });

      if (solicitacao) {
        await prisma.notificacao.create({
          data: {
            usuarioId: solicitacao.solicitanteId,
            tipo: 'NOTA_EMITIDA',
            titulo: 'Nota Fiscal Emitida',
            mensagem: `Sua nota fiscal nº ${nota.numero} foi emitida com sucesso.`,
            dados: { notaId: nota.id, numero: nota.numero, valor: nota.valor }
          }
        });
      }
    }

    res.status(201).json(nota);
  } catch (error) {
    next(error);
  }
});

// Cancelar nota (Admin)
router.post('/:id/cancelar', adminMiddleware, async (req, res, next) => {
  try {
    const { motivo } = req.body;

    if (!motivo) {
      return res.status(400).json({ error: 'Motivo do cancelamento é obrigatório' });
    }

    const nota = await prisma.notaFiscal.findUnique({
      where: { id: req.params.id }
    });

    if (!nota) {
      return res.status(404).json({ error: 'Nota não encontrada' });
    }

    if (nota.status === 'CANCELADA') {
      return res.status(400).json({ error: 'Nota já está cancelada' });
    }

    const notaAtualizada = await prisma.notaFiscal.update({
      where: { id: req.params.id },
      data: {
        status: 'CANCELADA',
        motivoCancelamento: motivo
      }
    });

    // Reverter faturamento
    const mes = nota.dataEmissao.getMonth() + 1;
    const ano = nota.dataEmissao.getFullYear();

    await prisma.faturamento.update({
      where: {
        meiId_ano_mes: { meiId: nota.meiId, ano, mes }
      },
      data: {
        valor: { decrement: Number(nota.valor) },
        quantidadeNotas: { decrement: 1 }
      }
    });

    res.json(notaAtualizada);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
