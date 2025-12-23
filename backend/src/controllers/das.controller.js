// ============================================
// Controlador de DAS (Documento de Arrecadação)
// ============================================

const { PrismaClient } = require('@prisma/client');
const { ApiError } = require('../middleware/errorHandler');

const prisma = new PrismaClient();

// Valores DAS 2025 (baseado no salário mínimo)
const SALARIO_MINIMO = 1518; // 2025
const INSS_MEI = SALARIO_MINIMO * 0.05; // 5% do salário mínimo
const INSS_CAMINHONEIRO = SALARIO_MINIMO * 0.12; // 12% para caminhoneiro
const ICMS_MEI = 1.00;
const ISS_MEI = 5.00;

/**
 * Listar guias DAS do MEI
 */
const listar = async (req, res, next) => {
  try {
    const { meiId, ano, status } = req.query;

    const mei = await prisma.mEI.findFirst({
      where: { id: meiId, usuarioId: req.usuario.id }
    });

    if (!mei) {
      throw new ApiError(404, 'MEI não encontrado');
    }

    const where = { meiId };
    if (ano) {
      where.competencia = {
        gte: new Date(parseInt(ano), 0, 1),
        lte: new Date(parseInt(ano), 11, 31)
      };
    }
    if (status) where.status = status;

    const guias = await prisma.dASGuia.findMany({
      where,
      orderBy: { competencia: 'desc' }
    });

    res.json({
      success: true,
      data: guias
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Gerar guias DAS do ano
 */
const gerarGuias = async (req, res, next) => {
  try {
    const { meiId, ano } = req.body;

    const mei = await prisma.mEI.findFirst({
      where: { id: meiId, usuarioId: req.usuario.id }
    });

    if (!mei) {
      throw new ApiError(404, 'MEI não encontrado');
    }

    const ehCaminhoneiro = mei.cnaePrincipal?.startsWith('4930');
    const valorInss = ehCaminhoneiro ? INSS_CAMINHONEIRO : INSS_MEI;
    
    // Determinar ICMS ou ISS baseado no CNAE
    const ehComercio = mei.cnaePrincipal?.startsWith('47') || mei.cnaePrincipal?.startsWith('45');
    const valorIcms = ehComercio ? ICMS_MEI : 0;
    const valorIss = !ehComercio ? ISS_MEI : 0;
    const valorTotal = valorInss + valorIcms + valorIss;

    const guiasCriadas = [];
    const anoNum = parseInt(ano) || new Date().getFullYear();

    for (let mes = 0; mes < 12; mes++) {
      const competencia = new Date(anoNum, mes, 1);
      const vencimento = new Date(anoNum, mes, 20);

      // Verificar se já existe
      const existe = await prisma.dASGuia.findFirst({
        where: {
          meiId,
          competencia: {
            gte: new Date(anoNum, mes, 1),
            lt: new Date(anoNum, mes + 1, 1)
          }
        }
      });

      if (!existe) {
        const guia = await prisma.dASGuia.create({
          data: {
            meiId,
            competencia,
            vencimento,
            valor: valorTotal,
            valorInss,
            valorIcms,
            valorIss,
            status: vencimento < new Date() ? 'VENCIDO' : 'PENDENTE'
          }
        });
        guiasCriadas.push(guia);
      }
    }

    res.json({
      success: true,
      message: `${guiasCriadas.length} guias geradas com sucesso`,
      data: guiasCriadas
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Registrar pagamento
 */
const registrarPagamento = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { dataPagamento } = req.body;

    const guia = await prisma.dASGuia.findUnique({
      where: { id },
      include: { mei: { select: { usuarioId: true } } }
    });

    if (!guia) {
      throw new ApiError(404, 'Guia DAS não encontrada');
    }

    if (guia.mei.usuarioId !== req.usuario.id) {
      throw new ApiError(403, 'Sem permissão');
    }

    const guiaAtualizada = await prisma.dASGuia.update({
      where: { id },
      data: {
        status: 'PAGO',
        dataPagamento: new Date(dataPagamento || Date.now())
      }
    });

    res.json({
      success: true,
      message: 'Pagamento registrado com sucesso',
      data: guiaAtualizada
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listar,
  gerarGuias,
  registrarPagamento
};
