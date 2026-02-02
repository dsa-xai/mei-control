const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { adminMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

const TETO_MEI_ANUAL = 81000;

// Dashboard - Admin (todos os MEIs)
router.get('/admin', adminMiddleware, async (req, res, next) => {
  try {
    const anoAtual = new Date().getFullYear();
    
    // Todos os MEIs com faturamento
    const meis = await prisma.mEI.findMany({
      include: {
        usuario: {
          select: { nome: true, email: true, telefone: true }
        },
        faturamentos: {
          where: { ano: anoAtual }
        },
        notasFiscais: {
          where: {
            dataEmissao: {
              gte: new Date(anoAtual, 0, 1),
              lt: new Date(anoAtual + 1, 0, 1)
            },
            status: 'EMITIDA'
          }
        },
        solicitacoes: {
          where: { status: 'PENDENTE' }
        }
      }
    });

    // Calcular estatísticas por MEI
    const meisComEstatisticas = meis.map(mei => {
      const faturamentoAnual = mei.faturamentos.reduce((sum, f) => sum + Number(f.valor), 0);
      const percentualTeto = (faturamentoAnual / TETO_MEI_ANUAL) * 100;
      const totalNotas = mei.notasFiscais.length;
      const solicitacoesPendentes = mei.solicitacoes.length;

      return {
        id: mei.id,
        cnpj: mei.cnpj,
        razaoSocial: mei.razaoSocial,
        nomeFantasia: mei.nomeFantasia,
        usuario: mei.usuario,
        faturamentoAnual,
        percentualTeto: Math.round(percentualTeto * 100) / 100,
        valorRestante: Math.max(0, TETO_MEI_ANUAL - faturamentoAnual),
        totalNotas,
        solicitacoesPendentes,
        alertaNivel: getAlertaNivel(percentualTeto)
      };
    });

    // Estatísticas globais
    const totalMeis = meis.length;
    const meisEmAlerta = meisComEstatisticas.filter(m => m.percentualTeto >= 65).length;
    const meisCritico = meisComEstatisticas.filter(m => m.percentualTeto >= 95).length;
    const faturamentoTotal = meisComEstatisticas.reduce((sum, m) => sum + m.faturamentoAnual, 0);
    const solicitacoesPendentesTotal = meisComEstatisticas.reduce((sum, m) => sum + m.solicitacoesPendentes, 0);

    // Top 5 MEIs por faturamento
    const topMeis = [...meisComEstatisticas]
      .sort((a, b) => b.faturamentoAnual - a.faturamentoAnual)
      .slice(0, 5);

    // Faturamento por mês (agregado)
    const faturamentoMensal = await prisma.faturamento.groupBy({
      by: ['mes'],
      where: { ano: anoAtual },
      _sum: { valor: true }
    });

    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const graficoFaturamento = meses.map((nome, idx) => {
      const dados = faturamentoMensal.find(f => f.mes === idx + 1);
      return {
        mes: nome,
        valor: dados?._sum?.valor ? Number(dados._sum.valor) : 0
      };
    });

    res.json({
      estatisticas: {
        totalMeis,
        meisEmAlerta,
        meisCritico,
        faturamentoTotal,
        solicitacoesPendentesTotal,
        tetoAnual: TETO_MEI_ANUAL
      },
      meis: meisComEstatisticas,
      topMeis,
      graficoFaturamento
    });
  } catch (error) {
    next(error);
  }
});

// Dashboard - Cliente (MEI específico)
router.get('/cliente', async (req, res, next) => {
  try {
    const { meiId } = req.query;
    const usuario = req.usuario;
    const anoAtual = new Date().getFullYear();

    // Se cliente, usar primeiro MEI
    let meiIdFinal = meiId;
    if (usuario.role === 'CLIENTE') {
      meiIdFinal = usuario.meis[0]?.id;
    }

    if (!meiIdFinal) {
      return res.status(400).json({ error: 'MEI não encontrado' });
    }

    const mei = await prisma.mEI.findUnique({
      where: { id: meiIdFinal },
      include: {
        faturamentos: {
          where: { ano: anoAtual },
          orderBy: { mes: 'asc' }
        },
        notasFiscais: {
          where: {
            dataEmissao: {
              gte: new Date(anoAtual, 0, 1),
              lt: new Date(anoAtual + 1, 0, 1)
            },
            status: 'EMITIDA'
          },
          orderBy: { dataEmissao: 'desc' },
          take: 5
        },
        solicitacoes: {
          where: { 
            status: { in: ['PENDENTE', 'EM_ANDAMENTO'] }
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        das: {
          where: {
            competencia: {
              gte: new Date(anoAtual, 0, 1),
              lt: new Date(anoAtual + 1, 0, 1)
            }
          },
          orderBy: { competencia: 'desc' },
          take: 3
        }
      }
    });

    if (!mei) {
      return res.status(404).json({ error: 'MEI não encontrado' });
    }

    // Calcular faturamento anual
    const faturamentoAnual = mei.faturamentos.reduce((sum, f) => sum + Number(f.valor), 0);
    const percentualTeto = (faturamentoAnual / TETO_MEI_ANUAL) * 100;

    // Gráfico de faturamento mensal
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const graficoFaturamento = meses.map((nome, idx) => {
      const dados = mei.faturamentos.find(f => f.mes === idx + 1);
      return {
        mes: nome,
        valor: dados ? Number(dados.valor) : 0
      };
    });

    res.json({
      mei: {
        id: mei.id,
        cnpj: mei.cnpj,
        razaoSocial: mei.razaoSocial,
        nomeFantasia: mei.nomeFantasia
      },
      faturamento: {
        anual: faturamentoAnual,
        percentualTeto: Math.round(percentualTeto * 100) / 100,
        valorRestante: Math.max(0, TETO_MEI_ANUAL - faturamentoAnual),
        tetoAnual: TETO_MEI_ANUAL,
        alertaNivel: getAlertaNivel(percentualTeto)
      },
      ultimasNotas: mei.notasFiscais,
      solicitacoesPendentes: mei.solicitacoes,
      proximosDas: mei.das,
      graficoFaturamento
    });
  } catch (error) {
    next(error);
  }
});

// Helper para determinar nível de alerta
function getAlertaNivel(percentual) {
  if (percentual >= 100) return 'critical';
  if (percentual >= 95) return 'danger';
  if (percentual >= 80) return 'warning';
  if (percentual >= 65) return 'attention';
  return 'safe';
}

module.exports = router;
