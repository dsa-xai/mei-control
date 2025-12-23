// ============================================
// Controlador de Notas Fiscais
// ============================================

const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');
const { ApiError } = require('../middleware/errorHandler');
const notificacaoService = require('../services/notificacao.service');

const prisma = new PrismaClient();

/**
 * Listar notas fiscais do MEI
 * GET /api/v1/notas-fiscais
 */
const listar = async (req, res, next) => {
  try {
    const { meiId, clienteId, status, dataInicio, dataFim, page = 1, limit = 20 } = req.query;

    // Verificar se MEI pertence ao usuário
    const mei = await prisma.mEI.findFirst({
      where: { id: meiId, usuarioId: req.usuario.id }
    });

    if (!mei) {
      throw new ApiError(404, 'MEI não encontrado');
    }

    const where = { meiId };

    if (clienteId) where.clienteId = clienteId;
    if (status) where.status = status;
    if (dataInicio || dataFim) {
      where.dataEmissao = {};
      if (dataInicio) where.dataEmissao.gte = new Date(dataInicio);
      if (dataFim) where.dataEmissao.lte = new Date(dataFim);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [notas, total] = await Promise.all([
      prisma.notaFiscal.findMany({
        where,
        include: {
          cliente: {
            select: { id: true, nome: true, cpfCnpj: true, tipo: true }
          }
        },
        orderBy: { dataEmissao: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.notaFiscal.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        notas,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obter nota fiscal por ID
 * GET /api/v1/notas-fiscais/:id
 */
const obter = async (req, res, next) => {
  try {
    const nota = await prisma.notaFiscal.findUnique({
      where: { id: req.params.id },
      include: {
        cliente: true,
        mei: {
          select: { id: true, cnpj: true, razaoSocial: true, usuarioId: true }
        }
      }
    });

    if (!nota) {
      throw new ApiError(404, 'Nota fiscal não encontrada');
    }

    // Verificar permissão
    if (nota.mei.usuarioId !== req.usuario.id) {
      throw new ApiError(403, 'Sem permissão para acessar esta nota');
    }

    res.json({
      success: true,
      data: nota
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Emitir nova nota fiscal
 * POST /api/v1/notas-fiscais
 */
const emitir = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Erro de validação',
        details: errors.array()
      });
    }

    const {
      meiId,
      clienteId,
      valor,
      descricao,
      dataEmissao,
      dataCompetencia,
      observacoes
    } = req.body;

    // Verificar MEI
    const mei = await prisma.mEI.findFirst({
      where: { id: meiId, usuarioId: req.usuario.id, ativo: true }
    });

    if (!mei) {
      throw new ApiError(404, 'MEI não encontrado');
    }

    // Verificar cliente
    const cliente = await prisma.cliente.findFirst({
      where: { id: clienteId, meiId, ativo: true }
    });

    if (!cliente) {
      throw new ApiError(404, 'Cliente não encontrado');
    }

    // Calcular próximo número da nota
    const ultimaNota = await prisma.notaFiscal.findFirst({
      where: { meiId },
      orderBy: { numero: 'desc' }
    });

    const proximoNumero = ultimaNota
      ? String(parseInt(ultimaNota.numero) + 1).padStart(6, '0')
      : '000001';

    // Verificar impacto no faturamento
    const anoCompetencia = new Date(dataCompetencia || dataEmissao).getFullYear();
    const inicioAno = new Date(anoCompetencia, 0, 1);
    const fimAno = new Date(anoCompetencia, 11, 31, 23, 59, 59);

    const faturamentoAtual = await prisma.notaFiscal.aggregate({
      where: {
        meiId,
        status: 'EMITIDA',
        dataCompetencia: { gte: inicioAno, lte: fimAno }
      },
      _sum: { valor: true }
    });

    const totalAtual = parseFloat(faturamentoAtual._sum.valor || 0);
    const novoTotal = totalAtual + parseFloat(valor);
    const tetoAnual = parseFloat(mei.tetoAnual);
    const percentualAposEmissao = (novoTotal / tetoAnual) * 100;

    // Criar nota fiscal
    const nota = await prisma.notaFiscal.create({
      data: {
        meiId,
        clienteId,
        numero: proximoNumero,
        valor: parseFloat(valor),
        descricao,
        dataEmissao: new Date(dataEmissao),
        dataCompetencia: new Date(dataCompetencia || dataEmissao),
        observacoes,
        status: 'EMITIDA'
      },
      include: {
        cliente: {
          select: { id: true, nome: true, cpfCnpj: true }
        }
      }
    });

    // Verificar alertas de teto
    if (percentualAposEmissao >= 100) {
      // Ultrapassou o teto
      await notificacaoService.criar({
        usuarioId: req.usuario.id,
        tipo: 'ALERTA_TETO',
        titulo: novoTotal > tetoAnual * 1.2 ? 'DESENQUADRAMENTO IMINENTE!' : 'TETO ANUAL ULTRAPASSADO!',
        mensagem: novoTotal > tetoAnual * 1.2
          ? `Você ultrapassou 20% do teto do MEI. O desenquadramento será RETROATIVO. Procure um contador imediatamente.`
          : `Você ultrapassou o teto de R$ ${tetoAnual.toLocaleString('pt-BR')}. Será necessário pagar DAS complementar e migrar para ME.`,
        prioridade: 'CRITICA'
      });
    } else if (percentualAposEmissao >= 95) {
      await notificacaoService.criar({
        usuarioId: req.usuario.id,
        tipo: 'ALERTA_TETO',
        titulo: 'ATENÇÃO CRÍTICA - Quase no Limite!',
        mensagem: `Você atingiu ${percentualAposEmissao.toFixed(1)}% do teto anual. Restam apenas R$ ${(tetoAnual - novoTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
        prioridade: 'ALTA'
      });
    } else if (percentualAposEmissao >= 80 && totalAtual / tetoAnual * 100 < 80) {
      // Primeira vez que atinge 80%
      await notificacaoService.criar({
        usuarioId: req.usuario.id,
        tipo: 'ALERTA_TETO',
        titulo: 'Atenção com o Faturamento',
        mensagem: `Você atingiu ${percentualAposEmissao.toFixed(1)}% do teto anual do MEI. Monitore suas emissões.`,
        prioridade: 'NORMAL'
      });
    }

    // Log de atividade
    await prisma.logAtividade.create({
      data: {
        usuarioId: req.usuario.id,
        meiId,
        acao: 'CREATE',
        entidade: 'NotaFiscal',
        entidadeId: nota.id,
        dadosNovos: nota,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    res.status(201).json({
      success: true,
      message: 'Nota fiscal emitida com sucesso',
      data: {
        nota,
        faturamento: {
          totalAnterior: totalAtual,
          totalAtual: novoTotal,
          tetoAnual,
          percentualTeto: Math.round(percentualAposEmissao * 100) / 100,
          valorRestante: Math.max(0, tetoAnual - novoTotal)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancelar nota fiscal
 * POST /api/v1/notas-fiscais/:id/cancelar
 */
const cancelar = async (req, res, next) => {
  try {
    const { motivo } = req.body;

    const nota = await prisma.notaFiscal.findUnique({
      where: { id: req.params.id },
      include: {
        mei: { select: { usuarioId: true } }
      }
    });

    if (!nota) {
      throw new ApiError(404, 'Nota fiscal não encontrada');
    }

    if (nota.mei.usuarioId !== req.usuario.id) {
      throw new ApiError(403, 'Sem permissão para cancelar esta nota');
    }

    if (nota.status === 'CANCELADA') {
      throw new ApiError(400, 'Esta nota já está cancelada');
    }

    const notaCancelada = await prisma.notaFiscal.update({
      where: { id: req.params.id },
      data: {
        status: 'CANCELADA',
        motivoCancelamento: motivo || 'Cancelamento solicitado pelo emitente',
        dataCancelamento: new Date()
      }
    });

    // Log de atividade
    await prisma.logAtividade.create({
      data: {
        usuarioId: req.usuario.id,
        meiId: nota.meiId,
        acao: 'CANCEL',
        entidade: 'NotaFiscal',
        entidadeId: nota.id,
        dadosAntigos: nota,
        dadosNovos: notaCancelada,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    res.json({
      success: true,
      message: 'Nota fiscal cancelada com sucesso',
      data: notaCancelada
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Gerar PDF da nota fiscal
 * GET /api/v1/notas-fiscais/:id/pdf
 */
const gerarPDF = async (req, res, next) => {
  try {
    const nota = await prisma.notaFiscal.findUnique({
      where: { id: req.params.id },
      include: {
        cliente: true,
        mei: true
      }
    });

    if (!nota) {
      throw new ApiError(404, 'Nota fiscal não encontrada');
    }

    if (nota.mei.usuarioId !== req.usuario.id) {
      throw new ApiError(403, 'Sem permissão para acessar esta nota');
    }

    // Aqui seria integrado com a geração real de PDF
    // Por enquanto, retorna dados para o frontend gerar
    res.json({
      success: true,
      data: {
        nota,
        geradorPDF: 'frontend' // Indica que o PDF deve ser gerado no frontend
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Buscar notas por período
 * GET /api/v1/notas-fiscais/periodo
 */
const buscarPorPeriodo = async (req, res, next) => {
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

    const notas = await prisma.notaFiscal.findMany({
      where: {
        meiId,
        dataCompetencia: {
          gte: dataInicio,
          lte: dataFim
        }
      },
      include: {
        cliente: {
          select: { id: true, nome: true, cpfCnpj: true }
        }
      },
      orderBy: { dataEmissao: 'asc' }
    });

    const totais = {
      emitidas: notas.filter(n => n.status === 'EMITIDA').reduce((acc, n) => acc + parseFloat(n.valor), 0),
      canceladas: notas.filter(n => n.status === 'CANCELADA').reduce((acc, n) => acc + parseFloat(n.valor), 0),
      quantidade: notas.length,
      quantidadeEmitidas: notas.filter(n => n.status === 'EMITIDA').length
    };

    res.json({
      success: true,
      data: {
        periodo: { ano: parseInt(ano), mes: mes ? parseInt(mes) : null },
        notas,
        totais
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listar,
  obter,
  emitir,
  cancelar,
  gerarPDF,
  buscarPorPeriodo
};
