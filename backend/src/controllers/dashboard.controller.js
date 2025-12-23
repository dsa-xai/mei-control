// ============================================
// Controlador de Dashboard
// ============================================

const { PrismaClient } = require('@prisma/client');
const { ApiError } = require('../middleware/errorHandler');

const prisma = new PrismaClient();

/**
 * Obter dados do dashboard
 * GET /api/v1/dashboard/:meiId
 */
const obterDados = async (req, res, next) => {
  try {
    const { meiId } = req.params;
    const ano = parseInt(req.query.ano) || new Date().getFullYear();

    // Verificar MEI
    const mei = await prisma.mEI.findFirst({
      where: { id: meiId, usuarioId: req.usuario.id }
    });

    if (!mei) {
      throw new ApiError(404, 'MEI não encontrado');
    }

    const tetoAnual = parseFloat(mei.tetoAnual);
    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const inicioAno = new Date(ano, 0, 1);
    const fimAno = new Date(ano, 11, 31, 23, 59, 59);
    const inicioMes = new Date(ano, mesAtual, 1);
    const fimMes = new Date(ano, mesAtual + 1, 0, 23, 59, 59);

    // Faturamento anual
    const faturamentoAnual = await prisma.notaFiscal.aggregate({
      where: {
        meiId,
        status: 'EMITIDA',
        dataCompetencia: { gte: inicioAno, lte: fimAno }
      },
      _sum: { valor: true },
      _count: true
    });

    // Faturamento mensal
    const faturamentoMensal = await prisma.notaFiscal.aggregate({
      where: {
        meiId,
        status: 'EMITIDA',
        dataCompetencia: { gte: inicioMes, lte: fimMes }
      },
      _sum: { valor: true },
      _count: true
    });

    // Faturamento por mês
    const faturamentoPorMes = await prisma.$queryRaw`
      SELECT 
        EXTRACT(MONTH FROM data_competencia)::int as mes,
        COALESCE(SUM(valor), 0)::float as valor,
        COUNT(*)::int as quantidade
      FROM notas_fiscais
      WHERE mei_id = ${meiId}
        AND status = 'EMITIDA'
        AND data_competencia >= ${inicioAno}
        AND data_competencia <= ${fimAno}
      GROUP BY EXTRACT(MONTH FROM data_competencia)
      ORDER BY mes
    `;

    // Preencher meses sem faturamento
    const mesesCompletos = [];
    for (let i = 1; i <= 12; i++) {
      const dadosMes = faturamentoPorMes.find(f => f.mes === i);
      mesesCompletos.push({
        mes: i,
        valor: dadosMes ? parseFloat(dadosMes.valor) : 0,
        quantidade: dadosMes ? dadosMes.quantidade : 0
      });
    }

    // Calcular acumulado
    let acumulado = 0;
    const dadosAcumulados = mesesCompletos.map((item, index) => {
      acumulado += item.valor;
      return {
        ...item,
        acumulado,
        tetoAcumulado: (tetoAnual / 12) * (index + 1)
      };
    });

    // Top clientes
    const topClientes = await prisma.$queryRaw`
      SELECT 
        c.id,
        c.nome,
        c.cpf_cnpj as "cpfCnpj",
        COALESCE(SUM(n.valor), 0)::float as total,
        COUNT(n.id)::int as quantidade
      FROM clientes c
      LEFT JOIN notas_fiscais n ON n.cliente_id = c.id 
        AND n.status = 'EMITIDA'
        AND n.data_competencia >= ${inicioAno}
        AND n.data_competencia <= ${fimAno}
      WHERE c.mei_id = ${meiId} AND c.ativo = true
      GROUP BY c.id, c.nome, c.cpf_cnpj
      ORDER BY total DESC
      LIMIT 5
    `;

    // Últimas notas
    const ultimasNotas = await prisma.notaFiscal.findMany({
      where: { meiId, status: 'EMITIDA' },
      include: {
        cliente: { select: { id: true, nome: true } }
      },
      orderBy: { dataEmissao: 'desc' },
      take: 10
    });

    // Contadores
    const [totalClientes, totalNotas] = await Promise.all([
      prisma.cliente.count({ where: { meiId, ativo: true } }),
      prisma.notaFiscal.count({ where: { meiId, status: 'EMITIDA' } })
    ]);

    // DAS pendentes
    const dasPendentes = await prisma.dASGuia.findMany({
      where: {
        meiId,
        status: { in: ['PENDENTE', 'VENCIDO'] }
      },
      orderBy: { vencimento: 'asc' },
      take: 3
    });

    // Calcular métricas
    const totalAnual = parseFloat(faturamentoAnual._sum.valor || 0);
    const totalMensal = parseFloat(faturamentoMensal._sum.valor || 0);
    const percentualTeto = (totalAnual / tetoAnual) * 100;
    const valorRestante = tetoAnual - totalAnual;
    const mesesRestantes = ano === hoje.getFullYear() ? 12 - (mesAtual + 1) : 0;
    const mediaMensalRestante = mesesRestantes > 0 ? valorRestante / mesesRestantes : 0;
    const ticketMedio = faturamentoAnual._count > 0 ? totalAnual / faturamentoAnual._count : 0;

    // Situação do teto
    let situacaoTeto = 'NORMAL';
    if (percentualTeto >= 100) {
      situacaoTeto = totalAnual > tetoAnual * 1.2 ? 'EXCESSO_CRITICO' : 'EXCESSO_20';
    } else if (percentualTeto >= 95) {
      situacaoTeto = 'CRITICO';
    } else if (percentualTeto >= 80) {
      situacaoTeto = 'ALERTA';
    }

    res.json({
      success: true,
      data: {
        mei: {
          id: mei.id,
          cnpj: mei.cnpj,
          razaoSocial: mei.razaoSocial,
          nomeFantasia: mei.nomeFantasia,
          dataAbertura: mei.dataAbertura,
          tetoAnual
        },
        resumo: {
          ano,
          faturamentoAnual: totalAnual,
          faturamentoMensal: totalMensal,
          notasEmitidas: faturamentoAnual._count,
          notasMes: faturamentoMensal._count,
          totalClientes,
          ticketMedio: Math.round(ticketMedio * 100) / 100
        },
        teto: {
          valor: tetoAnual,
          utilizado: totalAnual,
          percentual: Math.round(percentualTeto * 100) / 100,
          restante: Math.max(0, valorRestante),
          mediaMensalRestante: Math.max(0, mediaMensalRestante),
          situacao: situacaoTeto,
          mesesRestantes
        },
        graficos: {
          faturamentoPorMes: mesesCompletos,
          faturamentoAcumulado: dadosAcumulados
        },
        topClientes: topClientes.map(c => ({
          ...c,
          total: parseFloat(c.total)
        })),
        ultimasNotas,
        dasPendentes
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obter notificações recentes
 * GET /api/v1/dashboard/notificacoes
 */
const obterNotificacoes = async (req, res, next) => {
  try {
    const notificacoes = await prisma.notificacao.findMany({
      where: { usuarioId: req.usuario.id },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    const naoLidas = notificacoes.filter(n => !n.lida).length;

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

module.exports = {
  obterDados,
  obterNotificacoes
};
