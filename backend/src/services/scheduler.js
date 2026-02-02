const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const TETO_MEI_ANUAL = 81000;

// Verificar MEIs próximos do teto (todos os dias às 8h)
const verificarTetoMeis = cron.schedule('0 8 * * *', async () => {
  console.log('⏰ Executando verificação de teto MEI...');
  
  try {
    const anoAtual = new Date().getFullYear();
    
    const meis = await prisma.mEI.findMany({
      include: {
        usuario: true,
        faturamentos: {
          where: { ano: anoAtual }
        }
      }
    });

    for (const mei of meis) {
      const faturamentoAnual = mei.faturamentos.reduce((sum, f) => sum + Number(f.valor), 0);
      const percentual = (faturamentoAnual / TETO_MEI_ANUAL) * 100;

      // Alertar em 65%, 80%, 95% e 100%
      let tipo = null;
      let titulo = null;
      let mensagem = null;

      if (percentual >= 100) {
        tipo = 'TETO_EXCEDIDO';
        titulo = '🚨 TETO MEI EXCEDIDO!';
        mensagem = `${mei.razaoSocial} ultrapassou o teto de R$ 81.000,00. Faturamento: R$ ${faturamentoAnual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      } else if (percentual >= 95) {
        tipo = 'TETO_CRITICO';
        titulo = '⚠️ Teto MEI Crítico';
        mensagem = `${mei.razaoSocial} atingiu ${percentual.toFixed(1)}% do teto. Restam R$ ${(TETO_MEI_ANUAL - faturamentoAnual).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      } else if (percentual >= 80) {
        tipo = 'TETO_ALERTA';
        titulo = '⚡ Alerta de Teto MEI';
        mensagem = `${mei.razaoSocial} atingiu ${percentual.toFixed(1)}% do teto anual.`;
      } else if (percentual >= 65) {
        tipo = 'TETO_ATENCAO';
        titulo = '📊 Atenção ao Teto MEI';
        mensagem = `${mei.razaoSocial} atingiu ${percentual.toFixed(1)}% do teto anual.`;
      }

      if (tipo) {
        // Verificar se já existe notificação recente (últimas 24h)
        const notificacaoRecente = await prisma.notificacao.findFirst({
          where: {
            usuarioId: mei.usuarioId,
            tipo,
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
          }
        });

        if (!notificacaoRecente) {
          await prisma.notificacao.create({
            data: {
              usuarioId: mei.usuarioId,
              tipo,
              titulo,
              mensagem,
              dados: { meiId: mei.id, percentual, faturamentoAnual }
            }
          });
          console.log(`✅ Notificação criada para ${mei.razaoSocial}: ${tipo}`);
        }
      }
    }
  } catch (error) {
    console.error('❌ Erro ao verificar teto MEIs:', error);
  }
}, { scheduled: false });

// Verificar DAS vencendo (todos os dias às 9h)
const verificarDasVencendo = cron.schedule('0 9 * * *', async () => {
  console.log('⏰ Verificando DAS próximos do vencimento...');
  
  try {
    const hoje = new Date();
    const em5Dias = new Date(hoje.getTime() + 5 * 24 * 60 * 60 * 1000);

    const guiasVencendo = await prisma.dAS.findMany({
      where: {
        status: 'PENDENTE',
        dataVencimento: {
          gte: hoje,
          lte: em5Dias
        }
      },
      include: {
        mei: {
          include: { usuario: true }
        }
      }
    });

    for (const das of guiasVencendo) {
      const diasRestantes = Math.ceil((das.dataVencimento - hoje) / (1000 * 60 * 60 * 24));

      // Verificar notificação recente
      const notificacaoRecente = await prisma.notificacao.findFirst({
        where: {
          usuarioId: das.mei.usuarioId,
          tipo: 'DAS_VENCENDO',
          dados: { path: ['dasId'], equals: das.id },
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      });

      if (!notificacaoRecente) {
        await prisma.notificacao.create({
          data: {
            usuarioId: das.mei.usuarioId,
            tipo: 'DAS_VENCENDO',
            titulo: `📅 DAS vence em ${diasRestantes} dia(s)`,
            mensagem: `A guia DAS de ${das.mei.razaoSocial} no valor de R$ ${Number(das.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} vence em ${das.dataVencimento.toLocaleDateString('pt-BR')}.`,
            dados: { dasId: das.id, meiId: das.meiId, diasRestantes }
          }
        });
      }
    }

    // Marcar DAS atrasadas
    await prisma.dAS.updateMany({
      where: {
        status: 'PENDENTE',
        dataVencimento: { lt: hoje }
      },
      data: { status: 'ATRASADO' }
    });

  } catch (error) {
    console.error('❌ Erro ao verificar DAS:', error);
  }
}, { scheduled: false });

// Limpar sessões expiradas (todo domingo às 3h)
const limparSessoes = cron.schedule('0 3 * * 0', async () => {
  console.log('🧹 Limpando sessões expiradas...');
  
  try {
    const resultado = await prisma.sessao.deleteMany({
      where: {
        expiraEm: { lt: new Date() }
      }
    });
    console.log(`✅ ${resultado.count} sessões expiradas removidas`);
  } catch (error) {
    console.error('❌ Erro ao limpar sessões:', error);
  }
}, { scheduled: false });

// Iniciar todas as tarefas
function iniciarTarefas() {
  verificarTetoMeis.start();
  verificarDasVencendo.start();
  limparSessoes.start();
}

module.exports = { iniciarTarefas };
