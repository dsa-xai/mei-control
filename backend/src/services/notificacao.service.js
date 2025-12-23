// ============================================
// Serviço de Notificações
// ============================================

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Criar nova notificação
 */
const criar = async ({ usuarioId, tipo, titulo, mensagem, prioridade = 'NORMAL', linkAcao = null }) => {
  try {
    const notificacao = await prisma.notificacao.create({
      data: {
        usuarioId,
        tipo,
        titulo,
        mensagem,
        prioridade,
        linkAcao
      }
    });

    return notificacao;
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    throw error;
  }
};

/**
 * Criar notificações em lote
 */
const criarEmLote = async (notificacoes) => {
  try {
    const resultado = await prisma.notificacao.createMany({
      data: notificacoes
    });

    return resultado;
  } catch (error) {
    console.error('Erro ao criar notificações em lote:', error);
    throw error;
  }
};

/**
 * Verificar e criar alertas de teto para todos os MEIs
 */
const verificarAlertasTeto = async () => {
  try {
    const meis = await prisma.mEI.findMany({
      where: { ativo: true },
      include: { usuario: true }
    });

    const anoAtual = new Date().getFullYear();
    const inicioAno = new Date(anoAtual, 0, 1);
    const fimAno = new Date(anoAtual, 11, 31, 23, 59, 59);

    for (const mei of meis) {
      const faturamento = await prisma.notaFiscal.aggregate({
        where: {
          meiId: mei.id,
          status: 'EMITIDA',
          dataCompetencia: { gte: inicioAno, lte: fimAno }
        },
        _sum: { valor: true }
      });

      const totalAnual = parseFloat(faturamento._sum.valor || 0);
      const tetoAnual = parseFloat(mei.tetoAnual);
      const percentual = (totalAnual / tetoAnual) * 100;

      // Verificar se já existe notificação recente do mesmo tipo
      const notificacaoExistente = await prisma.notificacao.findFirst({
        where: {
          usuarioId: mei.usuarioId,
          tipo: 'ALERTA_TETO',
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // últimas 24h
        }
      });

      if (!notificacaoExistente) {
        if (percentual >= 100) {
          await criar({
            usuarioId: mei.usuarioId,
            tipo: 'ALERTA_TETO',
            titulo: totalAnual > tetoAnual * 1.2 ? 'DESENQUADRAMENTO IMINENTE!' : 'TETO ANUAL ULTRAPASSADO!',
            mensagem: `MEI ${mei.razaoSocial}: Faturamento de R$ ${totalAnual.toLocaleString('pt-BR')} ultrapassou o teto de R$ ${tetoAnual.toLocaleString('pt-BR')}.`,
            prioridade: 'CRITICA'
          });
        } else if (percentual >= 95) {
          await criar({
            usuarioId: mei.usuarioId,
            tipo: 'ALERTA_TETO',
            titulo: 'ATENÇÃO CRÍTICA - Quase no Limite!',
            mensagem: `MEI ${mei.razaoSocial}: Você atingiu ${percentual.toFixed(1)}% do teto anual.`,
            prioridade: 'ALTA'
          });
        } else if (percentual >= mei.alertaPercentual) {
          await criar({
            usuarioId: mei.usuarioId,
            tipo: 'ALERTA_TETO',
            titulo: 'Atenção com o Faturamento',
            mensagem: `MEI ${mei.razaoSocial}: Você atingiu ${percentual.toFixed(1)}% do teto anual.`,
            prioridade: 'NORMAL'
          });
        }
      }
    }

    console.log(`Verificação de alertas de teto concluída para ${meis.length} MEIs`);
  } catch (error) {
    console.error('Erro ao verificar alertas de teto:', error);
  }
};

/**
 * Verificar e criar alertas de DAS vencido
 */
const verificarDASVencidas = async () => {
  try {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    // Buscar guias pendentes com vencimento passado
    const guiasVencidas = await prisma.dASGuia.findMany({
      where: {
        status: 'PENDENTE',
        vencimento: { lt: hoje }
      },
      include: {
        mei: { include: { usuario: true } }
      }
    });

    for (const guia of guiasVencidas) {
      // Atualizar status para VENCIDO
      await prisma.dASGuia.update({
        where: { id: guia.id },
        data: { status: 'VENCIDO' }
      });

      // Criar notificação
      await criar({
        usuarioId: guia.mei.usuarioId,
        tipo: 'VENCIMENTO_DAS',
        titulo: 'DAS Vencido!',
        mensagem: `O DAS de ${guia.competencia.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })} do MEI ${guia.mei.razaoSocial} está vencido.`,
        prioridade: 'ALTA'
      });
    }

    // Buscar guias que vencem em 5 dias
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() + 5);

    const guiasProximasVencer = await prisma.dASGuia.findMany({
      where: {
        status: 'PENDENTE',
        vencimento: {
          gte: hoje,
          lte: dataLimite
        }
      },
      include: {
        mei: { include: { usuario: true } }
      }
    });

    for (const guia of guiasProximasVencer) {
      const diasRestantes = Math.ceil((guia.vencimento - hoje) / (1000 * 60 * 60 * 24));

      // Verificar se já existe notificação recente
      const notificacaoExistente = await prisma.notificacao.findFirst({
        where: {
          usuarioId: guia.mei.usuarioId,
          tipo: 'VENCIMENTO_DAS',
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      });

      if (!notificacaoExistente) {
        await criar({
          usuarioId: guia.mei.usuarioId,
          tipo: 'VENCIMENTO_DAS',
          titulo: 'DAS Próximo do Vencimento',
          mensagem: `O DAS de ${guia.competencia.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })} vence em ${diasRestantes} dia(s).`,
          prioridade: 'NORMAL'
        });
      }
    }

    console.log(`Verificação de DAS vencidas concluída. ${guiasVencidas.length} guias atualizadas.`);
  } catch (error) {
    console.error('Erro ao verificar DAS vencidas:', error);
  }
};

/**
 * Verificar prazo da declaração anual
 */
const verificarDeclaracaoAnual = async () => {
  try {
    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    const prazoDeclaracao = new Date(anoAtual, 4, 31); // 31 de maio

    // Só verificar entre janeiro e maio
    if (hoje.getMonth() > 4) return;

    const diasRestantes = Math.ceil((prazoDeclaracao - hoje) / (1000 * 60 * 60 * 24));

    // Alertar se faltam 30, 15, 7 ou 3 dias
    if (![30, 15, 7, 3].includes(diasRestantes)) return;

    const meis = await prisma.mEI.findMany({
      where: { ativo: true },
      include: {
        usuario: true,
        declaracoes: {
          where: {
            anoCalendario: anoAtual - 1,
            status: 'ENVIADA'
          }
        }
      }
    });

    for (const mei of meis) {
      // Se já enviou a declaração, pular
      if (mei.declaracoes.length > 0) continue;

      await criar({
        usuarioId: mei.usuarioId,
        tipo: 'DECLARACAO_ANUAL',
        titulo: 'Prazo da Declaração Anual (DASN-SIMEI)',
        mensagem: `Faltam ${diasRestantes} dias para o prazo de entrega da Declaração Anual do MEI ${mei.razaoSocial}. O prazo termina em 31 de maio.`,
        prioridade: diasRestantes <= 7 ? 'ALTA' : 'NORMAL'
      });
    }

    console.log('Verificação de declaração anual concluída');
  } catch (error) {
    console.error('Erro ao verificar declaração anual:', error);
  }
};

module.exports = {
  criar,
  criarEmLote,
  verificarAlertasTeto,
  verificarDASVencidas,
  verificarDeclaracaoAnual
};
