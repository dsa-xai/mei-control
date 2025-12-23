// ============================================
// Seed do Banco de Dados
// ============================================

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Limpar dados existentes (em ordem de dependência)
  await prisma.logAtividade.deleteMany();
  await prisma.notificacao.deleteMany();
  await prisma.declaracaoAnual.deleteMany();
  await prisma.dASGuia.deleteMany();
  await prisma.notaFiscal.deleteMany();
  await prisma.cliente.deleteMany();
  await prisma.mEI.deleteMany();
  await prisma.sessao.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.configuracaoSistema.deleteMany();

  console.log('✅ Dados antigos removidos');

  // Criar usuário demo
  const senhaHash = await bcrypt.hash('123456', 12);
  
  const usuario = await prisma.usuario.create({
    data: {
      nome: 'João Empreendedor',
      email: 'joao@exemplo.com',
      cpf: '12345678900',
      senha: senhaHash,
      telefone: '21999999999',
      emailVerificado: true
    }
  });

  console.log('✅ Usuário demo criado');

  // Criar MEI
  const mei = await prisma.mEI.create({
    data: {
      usuarioId: usuario.id,
      cnpj: '45123456000178',
      razaoSocial: 'JOAO EMPREENDEDOR MEI',
      nomeFantasia: 'Tech Solutions',
      dataAbertura: new Date('2024-03-15'),
      cnaePrincipal: '6201500',
      cnaeDescricao: 'Desenvolvimento de programas de computador sob encomenda',
      cep: '20040020',
      logradouro: 'Rua da Assembleia',
      numero: '100',
      complemento: 'Sala 501',
      bairro: 'Centro',
      cidade: 'Rio de Janeiro',
      uf: 'RJ',
      tetoAnual: 81000,
      alertaPercentual: 80
    }
  });

  console.log('✅ MEI demo criado');

  // Criar clientes
  const clientes = await Promise.all([
    prisma.cliente.create({
      data: {
        meiId: mei.id,
        tipo: 'PJ',
        nome: 'Tech Solutions Ltda',
        cpfCnpj: '12345678000190',
        email: 'contato@techsolutions.com',
        telefone: '21999991234',
        cidade: 'Rio de Janeiro',
        uf: 'RJ'
      }
    }),
    prisma.cliente.create({
      data: {
        meiId: mei.id,
        tipo: 'PJ',
        nome: 'Comércio Digital ME',
        cpfCnpj: '98765432000110',
        email: 'financeiro@comerciodigital.com',
        telefone: '21988885678',
        cidade: 'São Paulo',
        uf: 'SP'
      }
    }),
    prisma.cliente.create({
      data: {
        meiId: mei.id,
        tipo: 'PF',
        nome: 'Maria Silva',
        cpfCnpj: '12345678900',
        email: 'maria@email.com',
        telefone: '21977779012',
        cidade: 'Rio de Janeiro',
        uf: 'RJ'
      }
    })
  ]);

  console.log('✅ Clientes demo criados');

  // Criar notas fiscais (ano atual)
  const anoAtual = new Date().getFullYear();
  const notas = [
    { cliente: 0, valor: 3500, descricao: 'Consultoria em TI', mes: 0 },
    { cliente: 1, valor: 2800, descricao: 'Desenvolvimento de Sistema', mes: 1 },
    { cliente: 0, valor: 4200, descricao: 'Manutenção de Software', mes: 2 },
    { cliente: 2, valor: 1500, descricao: 'Suporte Técnico', mes: 3 },
    { cliente: 1, valor: 5600, descricao: 'Integração de Sistemas', mes: 4 },
    { cliente: 0, valor: 3200, descricao: 'Análise de Dados', mes: 5 },
    { cliente: 2, valor: 2100, descricao: 'Treinamento', mes: 6 },
    { cliente: 1, valor: 4800, descricao: 'Desenvolvimento Web', mes: 7 },
    { cliente: 0, valor: 6200, descricao: 'Projeto Especial', mes: 8 },
    { cliente: 1, valor: 3800, descricao: 'Consultoria', mes: 9 },
    { cliente: 2, valor: 2500, descricao: 'Suporte Mensal', mes: 10 },
    { cliente: 0, valor: 5100, descricao: 'Automação', mes: 11 }
  ];

  for (let i = 0; i < notas.length; i++) {
    const nota = notas[i];
    const dataEmissao = new Date(anoAtual, nota.mes, 15);
    
    await prisma.notaFiscal.create({
      data: {
        meiId: mei.id,
        clienteId: clientes[nota.cliente].id,
        numero: String(i + 1).padStart(6, '0'),
        valor: nota.valor,
        descricao: nota.descricao,
        dataEmissao,
        dataCompetencia: dataEmissao,
        status: 'EMITIDA'
      }
    });
  }

  console.log('✅ Notas fiscais demo criadas');

  // Criar guias DAS
  const salarioMinimo = 1518;
  const valorDAS = salarioMinimo * 0.05 + 5; // INSS + ISS

  for (let mes = 0; mes < 12; mes++) {
    const competencia = new Date(anoAtual, mes, 1);
    const vencimento = new Date(anoAtual, mes, 20);
    const hoje = new Date();

    await prisma.dASGuia.create({
      data: {
        meiId: mei.id,
        competencia,
        vencimento,
        valor: valorDAS,
        valorInss: salarioMinimo * 0.05,
        valorIcms: 0,
        valorIss: 5,
        status: vencimento < hoje ? 'PAGO' : 'PENDENTE',
        dataPagamento: vencimento < hoje ? vencimento : null
      }
    });
  }

  console.log('✅ Guias DAS demo criadas');

  // Criar notificações de exemplo
  await prisma.notificacao.createMany({
    data: [
      {
        usuarioId: usuario.id,
        tipo: 'SISTEMA',
        titulo: 'Bem-vindo ao MEI Control!',
        mensagem: 'Seu sistema de gestão de notas fiscais está pronto para uso.',
        prioridade: 'NORMAL'
      },
      {
        usuarioId: usuario.id,
        tipo: 'ALERTA_TETO',
        titulo: 'Atenção com o Faturamento',
        mensagem: 'Você atingiu 55% do teto anual do MEI. Monitore suas emissões.',
        prioridade: 'NORMAL'
      }
    ]
  });

  console.log('✅ Notificações demo criadas');

  // Criar configurações do sistema
  await prisma.configuracaoSistema.createMany({
    data: [
      { chave: 'MEI_TETO_ANUAL', valor: '81000', descricao: 'Teto anual do MEI em reais', tipo: 'NUMBER' },
      { chave: 'MEI_TETO_CAMINHONEIRO', valor: '251600', descricao: 'Teto anual do MEI Caminhoneiro', tipo: 'NUMBER' },
      { chave: 'MEI_ALERTA_PERCENTUAL', valor: '80', descricao: 'Percentual para alerta de teto', tipo: 'NUMBER' },
      { chave: 'SALARIO_MINIMO', valor: '1518', descricao: 'Valor do salário mínimo', tipo: 'NUMBER' },
      { chave: 'DAS_ISS', valor: '5', descricao: 'Valor do ISS no DAS', tipo: 'NUMBER' },
      { chave: 'DAS_ICMS', valor: '1', descricao: 'Valor do ICMS no DAS', tipo: 'NUMBER' }
    ]
  });

  console.log('✅ Configurações do sistema criadas');

  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🎉 Seed concluído com sucesso!                          ║
║                                                           ║
║   Usuário demo:                                           ║
║   Email: joao@exemplo.com                                 ║
║   CPF: 123.456.789-00                                     ║
║   Senha: 123456                                           ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
