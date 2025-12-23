// ============================================
// Controlador de Notificações
// ============================================

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const listar = async (req, res, next) => {
  try {
    const { lida, limit = 50 } = req.query;

    const where = { usuarioId: req.usuario.id };
    if (lida !== undefined) {
      where.lida = lida === 'true';
    }

    const notificacoes = await prisma.notificacao.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });

    const naoLidas = await prisma.notificacao.count({
      where: { usuarioId: req.usuario.id, lida: false }
    });

    res.json({
      success: true,
      data: {
        notificacoes,
        naoLidas
      }
    });
  } catch (error) {
    next(error);
  }
};

const marcarComoLida = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.notificacao.updateMany({
      where: {
        id,
        usuarioId: req.usuario.id
      },
      data: {
        lida: true,
        dataLeitura: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Notificação marcada como lida'
    });
  } catch (error) {
    next(error);
  }
};

const marcarTodasComoLidas = async (req, res, next) => {
  try {
    await prisma.notificacao.updateMany({
      where: {
        usuarioId: req.usuario.id,
        lida: false
      },
      data: {
        lida: true,
        dataLeitura: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Todas as notificações marcadas como lidas'
    });
  } catch (error) {
    next(error);
  }
};

const excluir = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.notificacao.deleteMany({
      where: {
        id,
        usuarioId: req.usuario.id
      }
    });

    res.json({
      success: true,
      message: 'Notificação excluída'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listar,
  marcarComoLida,
  marcarTodasComoLidas,
  excluir
};
