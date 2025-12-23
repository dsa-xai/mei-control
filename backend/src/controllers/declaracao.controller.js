// ============================================
// Controlador de Declaração Anual (DASN-SIMEI)
// ============================================

const { PrismaClient } = require('@prisma/client');
const { ApiError } = require('../middleware/errorHandler');

const prisma = new PrismaClient();

const listarDeclaracoes = async (req, res, next) => {
  try {
    const { meiId } = req.query;

    const mei = await prisma.mEI.findFirst({
      where: { id: meiId, usuarioId: req.usuario.id }
    });

    if (!mei) {
      throw new ApiError(404, 'MEI não encontrado');
    }

    const declaracoes = await prisma.declaracaoAnual.findMany({
      where: { meiId },
      orderBy: { anoCalendario: 'desc' }
    });

    res.json({
      success: true,
      data: declaracoes
    });
  } catch (error) {
    next(error);
  }
};

const criarDeclaracao = async (req, res, next) => {
  try {
    const { meiId, anoCalendario } = req.body;

    const mei = await prisma.mEI.findFirst({
      where: { id: meiId, usuarioId: req.usuario.id }
    });

    if (!mei) {
      throw new ApiError(404, 'MEI não encontrado');
    }

    // Calcular receita do ano
    const inicioAno = new Date(anoCalendario, 0, 1);
    const fimAno = new Date(anoCalendario, 11, 31, 23, 59, 59);

    const faturamento = await prisma.notaFiscal.aggregate({
      where: {
        meiId,
        status: 'EMITIDA',
        dataCompetencia: { gte: inicioAno, lte: fimAno }
      },
      _sum: { valor: true }
    });

    const declaracao = await prisma.declaracaoAnual.create({
      data: {
        meiId,
        anoCalendario,
        receitaBrutaTotal: faturamento._sum.valor || 0,
        receitaServicos: faturamento._sum.valor || 0,
        status: 'RASCUNHO'
      }
    });

    res.status(201).json({
      success: true,
      message: 'Declaração criada com sucesso',
      data: declaracao
    });
  } catch (error) {
    next(error);
  }
};

const enviarDeclaracao = async (req, res, next) => {
  try {
    const { id } = req.params;

    const declaracao = await prisma.declaracaoAnual.findUnique({
      where: { id },
      include: { mei: { select: { usuarioId: true } } }
    });

    if (!declaracao) {
      throw new ApiError(404, 'Declaração não encontrada');
    }

    if (declaracao.mei.usuarioId !== req.usuario.id) {
      throw new ApiError(403, 'Sem permissão');
    }

    // Simular envio (em produção, integraria com gov.br)
    const declaracaoEnviada = await prisma.declaracaoAnual.update({
      where: { id },
      data: {
        status: 'ENVIADA',
        dataEnvio: new Date(),
        numeroRecibo: `DASN${Date.now()}`
      }
    });

    res.json({
      success: true,
      message: 'Declaração enviada com sucesso',
      data: declaracaoEnviada
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listarDeclaracoes,
  criarDeclaracao,
  enviarDeclaracao
};
