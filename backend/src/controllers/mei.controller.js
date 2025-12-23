// ============================================
// Controlador de MEI
// ============================================

const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');
const { ApiError } = require('../middleware/errorHandler');

const prisma = new PrismaClient();

// Constantes do MEI
const TETO_MEI_ANUAL = parseFloat(process.env.MEI_TETO_ANUAL) || 81000;
const TETO_CAMINHONEIRO = parseFloat(process.env.MEI_TETO_CAMINHONEIRO) || 251600;

/**
 * Listar MEIs do usuário
 * GET /api/v1/meis
 */
const listar = async (req, res, next) => {
  try {
    const meis = await prisma.mEI.findMany({
      where: {
        usuarioId: req.usuario.id,
        ativo: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: meis
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obter MEI por ID
 * GET /api/v1/meis/:id
 */
const obter = async (req, res, next) => {
  try {
    const mei = await prisma.mEI.findFirst({
      where: {
        id: req.params.id,
        usuarioId: req.usuario.id
      },
      include: {
        _count: {
          select: {
            clientes: { where: { ativo: true } },
            notasFiscais: { where: { status: 'EMITIDA' } }
          }
        }
      }
    });

    if (!mei) {
      throw new ApiError(404, 'MEI não encontrado');
    }

    res.json({
      success: true,
      data: mei
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cadastrar novo MEI
 * POST /api/v1/meis
 */
const criar = async (req, res, next) => {
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
      cnpj,
      razaoSocial,
      nomeFantasia,
      dataAbertura,
      cnaePrincipal,
      cnaeDescricao,
      cep,
      logradouro,
      numero,
      complemento,
      bairro,
      cidade,
      uf
    } = req.body;

    const cnpjLimpo = cnpj.replace(/\D/g, '');

    // Verificar se CNPJ já existe
    const cnpjExiste = await prisma.mEI.findUnique({ where: { cnpj: cnpjLimpo } });
    if (cnpjExiste) {
      throw new ApiError(409, 'Este CNPJ já está cadastrado no sistema');
    }

    // Definir teto baseado no CNAE (caminhoneiro tem teto diferente)
    const ehCaminhoneiro = cnaePrincipal?.startsWith('4930'); // Transporte rodoviário de carga
    const tetoAnual = ehCaminhoneiro ? TETO_CAMINHONEIRO : TETO_MEI_ANUAL;

    const mei = await prisma.mEI.create({
      data: {
        usuarioId: req.usuario.id,
        cnpj: cnpjLimpo,
        razaoSocial,
        nomeFantasia,
        dataAbertura: new Date(dataAbertura),
        cnaePrincipal,
        cnaeDescricao,
        tetoAnual,
        cep: cep?.replace(/\D/g, ''),
        logradouro,
        numero,
        complemento,
        bairro,
        cidade,
        uf
      }
    });

    // Log de atividade
    await prisma.logAtividade.create({
      data: {
        usuarioId: req.usuario.id,
        meiId: mei.id,
        acao: 'CREATE',
        entidade: 'MEI',
        entidadeId: mei.id,
        dadosNovos: mei,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    res.status(201).json({
      success: true,
      message: 'MEI cadastrado com sucesso',
      data: mei
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Atualizar MEI
 * PUT /api/v1/meis/:id
 */
const atualizar = async (req, res, next) => {
  try {
    const mei = await prisma.mEI.findFirst({
      where: {
        id: req.params.id,
        usuarioId: req.usuario.id
      }
    });

    if (!mei) {
      throw new ApiError(404, 'MEI não encontrado');
    }

    const dadosAntigos = { ...mei };

    const {
      nomeFantasia,
      cnaePrincipal,
      cnaeDescricao,
      cep,
      logradouro,
      numero,
      complemento,
      bairro,
      cidade,
      uf,
      alertaPercentual
    } = req.body;

    const meiAtualizado = await prisma.mEI.update({
      where: { id: req.params.id },
      data: {
        nomeFantasia,
        cnaePrincipal,
        cnaeDescricao,
        cep: cep?.replace(/\D/g, ''),
        logradouro,
        numero,
        complemento,
        bairro,
        cidade,
        uf,
        alertaPercentual
      }
    });

    // Log de atividade
    await prisma.logAtividade.create({
      data: {
        usuarioId: req.usuario.id,
        meiId: mei.id,
        acao: 'UPDATE',
        entidade: 'MEI',
        entidadeId: mei.id,
        dadosAntigos,
        dadosNovos: meiAtualizado,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    res.json({
      success: true,
      message: 'MEI atualizado com sucesso',
      data: meiAtualizado
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obter resumo do faturamento do MEI
 * GET /api/v1/meis/:id/faturamento
 */
const obterFaturamento = async (req, res, next) => {
  try {
    const meiId = req.params.id;
    const ano = parseInt(req.query.ano) || new Date().getFullYear();

    const mei = await prisma.mEI.findFirst({
      where: {
        id: meiId,
        usuarioId: req.usuario.id
      }
    });

    if (!mei) {
      throw new ApiError(404, 'MEI não encontrado');
    }

    // Calcular faturamento do ano
    const inicioAno = new Date(ano, 0, 1);
    const fimAno = new Date(ano, 11, 31, 23, 59, 59);

    const faturamentoAnual = await prisma.notaFiscal.aggregate({
      where: {
        meiId,
        status: 'EMITIDA',
        dataCompetencia: {
          gte: inicioAno,
          lte: fimAno
        }
      },
      _sum: { valor: true },
      _count: true
    });

    // Faturamento por mês
    const faturamentoPorMes = await prisma.$queryRaw`
      SELECT 
        EXTRACT(MONTH FROM data_competencia) as mes,
        SUM(valor) as valor,
        COUNT(*) as quantidade
      FROM notas_fiscais
      WHERE mei_id = ${meiId}
        AND status = 'EMITIDA'
        AND data_competencia >= ${inicioAno}
        AND data_competencia <= ${fimAno}
      GROUP BY EXTRACT(MONTH FROM data_competencia)
      ORDER BY mes
    `;

    const totalAnual = parseFloat(faturamentoAnual._sum.valor || 0);
    const tetoAnual = parseFloat(mei.tetoAnual);
    const percentualTeto = (totalAnual / tetoAnual) * 100;
    const valorRestante = tetoAnual - totalAnual;

    // Calcular média mensal restante
    const mesAtual = new Date().getMonth();
    const mesesRestantes = ano === new Date().getFullYear() ? 12 - (mesAtual + 1) : 0;
    const mediaMensalRestante = mesesRestantes > 0 ? valorRestante / mesesRestantes : 0;

    // Verificar situação do teto
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
        ano,
        tetoAnual,
        faturamentoAnual: totalAnual,
        notasEmitidas: faturamentoAnual._count,
        percentualTeto: Math.round(percentualTeto * 100) / 100,
        valorRestante: Math.max(0, valorRestante),
        mediaMensalRestante: Math.max(0, mediaMensalRestante),
        situacaoTeto,
        faturamentoPorMes: faturamentoPorMes.map(f => ({
          mes: parseInt(f.mes),
          valor: parseFloat(f.valor),
          quantidade: parseInt(f.quantidade)
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Desativar MEI
 * DELETE /api/v1/meis/:id
 */
const desativar = async (req, res, next) => {
  try {
    const mei = await prisma.mEI.findFirst({
      where: {
        id: req.params.id,
        usuarioId: req.usuario.id
      }
    });

    if (!mei) {
      throw new ApiError(404, 'MEI não encontrado');
    }

    await prisma.mEI.update({
      where: { id: req.params.id },
      data: { ativo: false }
    });

    // Log de atividade
    await prisma.logAtividade.create({
      data: {
        usuarioId: req.usuario.id,
        meiId: mei.id,
        acao: 'DELETE',
        entidade: 'MEI',
        entidadeId: mei.id,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    res.json({
      success: true,
      message: 'MEI desativado com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listar,
  obter,
  criar,
  atualizar,
  obterFaturamento,
  desativar
};
