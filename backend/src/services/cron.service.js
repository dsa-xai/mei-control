// ============================================
// Serviço de Tarefas Agendadas (Cron Jobs)
// ============================================

const cron = require('node-cron');
const notificacaoService = require('./notificacao.service');

/**
 * Iniciar todas as tarefas agendadas
 */
const iniciar = () => {
  console.log('📅 Iniciando tarefas agendadas...');

  // Verificar alertas de teto - todo dia às 8h
  cron.schedule('0 8 * * *', async () => {
    console.log('⏰ Executando: Verificação de alertas de teto');
    await notificacaoService.verificarAlertasTeto();
  }, {
    timezone: 'America/Sao_Paulo'
  });

  // Verificar DAS vencidas - todo dia às 9h
  cron.schedule('0 9 * * *', async () => {
    console.log('⏰ Executando: Verificação de DAS vencidas');
    await notificacaoService.verificarDASVencidas();
  }, {
    timezone: 'America/Sao_Paulo'
  });

  // Verificar declaração anual - todo dia às 10h (janeiro a maio)
  cron.schedule('0 10 * 1-5 *', async () => {
    console.log('⏰ Executando: Verificação de declaração anual');
    await notificacaoService.verificarDeclaracaoAnual();
  }, {
    timezone: 'America/Sao_Paulo'
  });

  // Limpar sessões expiradas - todo dia às 3h
  cron.schedule('0 3 * * *', async () => {
    console.log('⏰ Executando: Limpeza de sessões expiradas');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
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
  }, {
    timezone: 'America/Sao_Paulo'
  });

  // Limpar logs antigos (mais de 90 dias) - todo domingo às 4h
  cron.schedule('0 4 * * 0', async () => {
    console.log('⏰ Executando: Limpeza de logs antigos');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - 90);
    
    try {
      const resultado = await prisma.logAtividade.deleteMany({
        where: {
          createdAt: { lt: dataLimite }
        }
      });
      console.log(`✅ ${resultado.count} logs antigos removidos`);
    } catch (error) {
      console.error('❌ Erro ao limpar logs:', error);
    }
  }, {
    timezone: 'America/Sao_Paulo'
  });

  console.log('✅ Tarefas agendadas iniciadas com sucesso');
};

module.exports = {
  iniciar
};
