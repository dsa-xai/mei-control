const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Listar notificações do usuário
router.get('/', async (req, res, next) => {
  try {
    const { lida, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const where = { usuarioId: req.usuario.id };
    if (lida !== undefined) where.lida = lida === 'true';

    const [notificacoes, total, naoLidas] = await Promise.all([
      prisma.notificacao.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.notificacao.count({ where }),
      prisma.notificacao.count({
        where: { usuarioId: req.usuario.id, lida: false }
      })
    ]);

    res.json({
      data: notificacoes,
      naoLidas,
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

// Marcar como lida
router.put('/:id/lida', async (req, res, next) => {
  try {
    const notificacao = await prisma.notificacao.update({
      where: { id: req.params.id },
      data: {
        lida: true,
        lidaEm: new Date()
      }
    });
    res.json(notificacao);
  } catch (error) {
    next(error);
  }
});

// Marcar todas como lidas
router.put('/marcar-todas-lidas', async (req, res, next) => {
  try {
    await prisma.notificacao.updateMany({
      where: { usuarioId: req.usuario.id, lida: false },
      data: {
        lida: true,
        lidaEm: new Date()
      }
    });
    res.json({ message: 'Todas as notificações foram marcadas como lidas' });
  } catch (error) {
    next(error);
  }
});

// Deletar notificação
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.notificacao.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Notificação deletada' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
