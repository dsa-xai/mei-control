// ============================================
// Controlador de Relatórios
// ============================================

const { PrismaClient } = require('@prisma/client');
const { ApiError } = require('../middleware/errorHandler');

const prisma = new PrismaClient();

/**
 * Relatório de faturamento
 */
const relatorioFaturamento = async (req, res, next) => {
  try {
    const { meiId, ano, mes } = req.query;

    const mei = await prisma.mEI.findFirst({
      where: { id: meiId, usuarioId: req.usuario.id }
    });

    if (!mei) {
      throw new ApiError(404, 'MEI não encontrado');
    }

    let dataInicio, dataFim;
    if (mes) {
      dataInicio = new Date(parseInt(ano), parseInt(mes) - 1, 1);
      dataFim = new Date(parseInt(ano), parseInt(mes), 0, 23, 59, 59);
    } else {
      dataInicio = new Date(parseInt(ano), 0, 1);
      dataFim = new Date(parseInt(ano), 11, 31, 23, 59, 59);
    }

    // Notas do período
    const notas = await prisma.notaFiscal.findMany({
      where: {
        meiId,
        dataCompetencia: { gte: dataInicio, lte: dataFim }
      },
      include: {
        cliente: { select: { nome: true, cpfCnpj: true, tipo: true } }
      },
      orderBy: { dataEmissao: 'asc' }
    });

    // Totais
    const emitidas = notas.filter(n => n.status === 'EMITIDA');
    const canceladas = notas.filter(n => n.status === 'CANCELADA');

    const totalEmitidas = emitidas.reduce((acc, n) => acc + parseFloat(n.valor), 0);
    const totalCanceladas = canceladas.reduce((acc, n) => acc + parseFloat(n.valor), 0);

    // Por cliente
    const porCliente = {};
    emitidas.forEach(n => {
      if (!porCliente[n.clienteId]) {
        porCliente[n.clienteId] = {
          cliente: n.cliente,
          total: 0,
          quantidade: 0
        };
      }
      porCliente[n.clienteId].total += parseFloat(n.valor);
      porCliente[n.clienteId].quantidade += 1;
    });

    const clientesOrdenados = Object.values(porCliente)
      .sort((a, b) => b.total - a.total);

    res.json({
      success: true,
      data: {
        periodo: {
          ano: parseInt(ano),
          mes: mes ? parseInt(mes) : null,
          dataInicio,
          dataFim
        },
        resumo: {
          totalEmitidas,
          totalCanceladas,
          quantidadeEmitidas: emitidas.length,
          quantidadeCanceladas: canceladas.length,
          ticketMedio: emitidas.length > 0 ? totalEmitidas / emitidas.length : 0
        },
        porCliente: clientesOrdenados,
        notas
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Relatório de clientes
 */
const relatorioClientes = async (req, res, next) => {
  try {
    const { meiId, ano } = req.query;

    const mei = await prisma.mEI.findFirst({
      where: { id: meiId, usuarioId: req.usuario.id }
    });

    if (!mei) {
      throw new ApiError(404, 'MEI não encontrado');
    }

    const dataInicio = new Date(parseInt(ano), 0, 1);
    const dataFim = new Date(parseInt(ano), 11, 31, 23, 59, 59);

    const clientes = await prisma.$queryRaw`
      SELECT 
        c.id,
        c.nome,
        c.tipo,
        c.cpf_cnpj as "cpfCnpj",
        c.email,
        c.telefone,
        COALESCE(SUM(CASE WHEN n.status = 'EMITIDA' THEN n.valor ELSE 0 END), 0)::float as "totalFaturado",
        COUNT(CASE WHEN n.status = 'EMITIDA' THEN 1 END)::int as "quantidadeNotas",
        MAX(n.data_emissao) as "ultimaNota"
      FROM clientes c
      LEFT JOIN notas_fiscais n ON n.cliente_id = c.id 
        AND n.data_competencia >= ${dataInicio}
        AND n.data_competencia <= ${dataFim}
      WHERE c.mei_id = ${meiId} AND c.ativo = true
      GROUP BY c.id, c.nome, c.tipo, c.cpf_cnpj, c.email, c.telefone
      ORDER BY "totalFaturado" DESC
    `;

    const totalGeral = clientes.reduce((acc, c) => acc + c.totalFaturado, 0);

    res.json({
      success: true,
      data: {
        ano: parseInt(ano),
        totalClientes: clientes.length,
        totalFaturado: totalGeral,
        clientes: clientes.map(c => ({
          ...c,
          participacao: totalGeral > 0 ? (c.totalFaturado / totalGeral) * 100 : 0
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Relatório DAS
 */
const relatorioDAS = async (req, res, next) => {
  try {
    const { meiId, ano } = req.query;

    const mei = await prisma.mEI.findFirst({
      where: { id: meiId, usuarioId: req.usuario.id }
    });

    if (!mei) {
      throw new ApiError(404, 'MEI não encontrado');
    }

    const guias = await prisma.dASGuia.findMany({
      where: {
        meiId,
        competencia: {
          gte: new Date(parseInt(ano), 0, 1),
          lte: new Date(parseInt(ano), 11, 31)
        }
      },
      orderBy: { competencia: 'asc' }
    });

    const pagas = guias.filter(g => g.status === 'PAGO');
    const pendentes = guias.filter(g => g.status === 'PENDENTE');
    const vencidas = guias.filter(g => g.status === 'VENCIDO');

    res.json({
      success: true,
      data: {
        ano: parseInt(ano),
        resumo: {
          totalGuias: guias.length,
          totalPago: pagas.reduce((acc, g) => acc + parseFloat(g.valor), 0),
          totalPendente: pendentes.reduce((acc, g) => acc + parseFloat(g.valor), 0),
          totalVencido: vencidas.reduce((acc, g) => acc + parseFloat(g.valor), 0),
          quantidadePagas: pagas.length,
          quantidadePendentes: pendentes.length,
          quantidadeVencidas: vencidas.length
        },
        guias
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  relatorioFaturamento,
  relatorioClientes,
  relatorioDAS
};
