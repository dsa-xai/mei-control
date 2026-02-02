const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Limpar dados existentes
  await prisma.logAtividade.deleteMany();
  await prisma.notificacao.deleteMany();
  await prisma.faturamento.deleteMany();
  await prisma.dAS.deleteMany();
  await prisma.notaFiscal.deleteMany();
  await prisma.solicitacaoNota.deleteMany();
  await prisma.cliente.deleteMany();
  await prisma.mEI.deleteMany();
  await prisma.sessao.deleteMany();
  await prisma.usuario.deleteMany();

  console.log('✅ Dados antigos removidos');

  // Criar senha hash
  const senhaHash = await bcrypt.hash('123456', 10);

  // Criar usuário Admin
  const admin = await prisma.usuario.create({
    data: {
      email: 'admin@meicontrol.com',
      senha: senhaHash,
      nome: 'Administrador',
      cpf: '00000000000',
      telefone: '21999999999',
      role: 'ADMIN',
      ativo: true,
      emailVerificado: true,
      primeiroAcesso: false
    }
  });
  console.log('✅ Admin criado:', admin.email);

  // Criar usuário Cliente 1
  const cliente1 = await prisma.usuario.create({
    data: {
      email: 'maria@email.com',
      senha: senhaHash,
      nome: 'Maria Silva',
      cpf: '12345678900',
      telefone: '21988881111',
      role: 'CLIENTE',
      ativo: true,
      emailVerificado: true,
      primeiroAcesso: false
    }
  });
  console.log('✅ Cliente 1 criado:', cliente1.email);

  // Criar usuário Cliente 2
  const cliente2 = await prisma.usuario.create({
    data: {
      email: 'joao@email.com',
      senha: senhaHash,
      nome: 'João Santos',
      cpf: '98765432100',
      telefone: '21988882222',
      role: 'CLIENTE',
      ativo: true,
      emailVerificado: true,
      primeiroAcesso: false
    }
  });
  console.log('✅ Cliente 2 criado:', cliente2.email);

  // Criar MEI 1
  const mei1 = await prisma.mEI.create({
    data: {
      usuarioId: cliente1.id,
      cnpj: '12345678000190',
      razaoSocial: 'Maria Silva MEI',
      nomeFantasia: 'MS Consultoria',
      atividadePrincipal: 'Consultoria em gestão empresarial',
      cnaePrincipal: '7020-4/00',
      endereco: 'Rua das Flores, 123',
      cidade: 'Rio de Janeiro',
      estado: 'RJ',
      cep: '20000000',
      dataAbertura: new Date('2023-01-15'),
      situacao: 'ATIVA'
    }
  });
  console.log('✅ MEI 1 criado:', mei1.nomeFantasia);

  // Criar MEI 2
  const mei2 = await prisma.mEI.create({
    data: {
      usuarioId: cliente2.id,
      cnpj: '98765432000110',
      razaoSocial: 'João Santos MEI',
      nomeFantasia: 'JS Tecnologia',
      atividadePrincipal: 'Desenvolvimento de software',
      cnaePrincipal: '6201-5/00',
      endereco: 'Av. Brasil, 456',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01000000',
      dataAbertura: new Date('2022-06-20'),
      situacao: 'ATIVA'
    }
  });
  console.log('✅ MEI 2 criado:', mei2.nomeFantasia);

  // Criar clientes (tomadores de serviço)
  const tomador1 = await prisma.cliente.create({
    data: {
      meiId: mei1.id,
      tipo: 'PJ',
      nome: 'Tech Solutions Ltda',
      cpfCnpj: '11222333000144',
      email: 'contato@techsolutions.com',
      telefone: '1133334444',
      cidade: 'São Paulo',
      estado: 'SP'
    }
  });

  const tomador2 = await prisma.cliente.create({
    data: {
      meiId: mei1.id,
      tipo: 'PF',
      nome: 'Carlos Oliveira',
      cpfCnpj: '11122233344',
      email: 'carlos@email.com',
      telefone: '21977776666'
    }
  });

  const tomador3 = await prisma.cliente.create({
    data: {
      meiId: mei2.id,
      tipo: 'PJ',
      nome: 'Startup Inovação SA',
      cpfCnpj: '55666777000188',
      email: 'financeiro@startup.com',
      telefone: '1144445555'
    }
  });
  console.log('✅ Clientes/Tomadores criados');

  // Criar faturamentos mensais para MEI 1 (simulando ~70% do teto)
  const anoAtual = new Date().getFullYear();
  const mesAtual = new Date().getMonth() + 1;

  for (let mes = 1; mes <= mesAtual; mes++) {
    const valor = 4500 + Math.random() * 1500; // Entre 4500 e 6000
    await prisma.faturamento.create({
      data: {
        meiId: mei1.id,
        ano: anoAtual,
        mes,
        valor,
        quantidadeNotas: Math.floor(valor / 1500)
      }
    });
  }
  console.log('✅ Faturamentos MEI 1 criados');

  // Criar faturamentos para MEI 2 (simulando ~40% do teto)
  for (let mes = 1; mes <= mesAtual; mes++) {
    const valor = 2000 + Math.random() * 1000; // Entre 2000 e 3000
    await prisma.faturamento.create({
      data: {
        meiId: mei2.id,
        ano: anoAtual,
        mes,
        valor,
        quantidadeNotas: Math.floor(valor / 1000)
      }
    });
  }
  console.log('✅ Faturamentos MEI 2 criados');

  // Criar notas fiscais de exemplo
  const nota1 = await prisma.notaFiscal.create({
    data: {
      meiId: mei1.id,
      clienteId: tomador1.id,
      numero: 1,
      dataEmissao: new Date(),
      descricao: 'Consultoria em processos empresariais - Dezembro',
      valor: 3500,
      status: 'EMITIDA',
      codigoVerificacao: 'ABC12345'
    }
  });

  const nota2 = await prisma.notaFiscal.create({
    data: {
      meiId: mei1.id,
      clienteId: tomador2.id,
      numero: 2,
      dataEmissao: new Date(),
      descricao: 'Mentoria individual - 4 sessões',
      valor: 1200,
      status: 'EMITIDA',
      codigoVerificacao: 'DEF67890'
    }
  });

  const nota3 = await prisma.notaFiscal.create({
    data: {
      meiId: mei2.id,
      clienteId: tomador3.id,
      numero: 1,
      dataEmissao: new Date(),
      descricao: 'Desenvolvimento de aplicativo mobile',
      valor: 4000,
      status: 'EMITIDA',
      codigoVerificacao: 'GHI11111'
    }
  });
  console.log('✅ Notas fiscais criadas');

  // Criar DAS pendentes
  const competenciaAtual = new Date(anoAtual, mesAtual - 1, 1);
  const vencimento = new Date(anoAtual, mesAtual - 1, 20);

  await prisma.dAS.create({
    data: {
      meiId: mei1.id,
      competencia: competenciaAtual,
      dataVencimento: vencimento,
      valor: 71.60,
      status: 'PENDENTE'
    }
  });

  await prisma.dAS.create({
    data: {
      meiId: mei2.id,
      competencia: competenciaAtual,
      dataVencimento: vencimento,
      valor: 67.00,
      status: 'PENDENTE'
    }
  });
  console.log('✅ Guias DAS criadas');

  // Criar solicitação de nota pendente
  await prisma.solicitacaoNota.create({
    data: {
      meiId: mei1.id,
      solicitanteId: cliente1.id,
      descricao: 'Serviço de consultoria para empresa ABC - Projeto de otimização',
      valor: 2500,
      tomadorNome: 'Empresa ABC Ltda',
      tomadorCpfCnpj: '99888777000166',
      tomadorEmail: 'nf@empresaabc.com',
      status: 'PENDENTE'
    }
  });
  console.log('✅ Solicitação de nota criada');

  // Criar notificações de exemplo
  await prisma.notificacao.create({
    data: {
      usuarioId: cliente1.id,
      tipo: 'TETO_ATENCAO',
      titulo: '📊 Atenção ao Teto MEI',
      mensagem: 'Você atingiu 70% do teto anual de faturamento.',
      dados: { percentual: 70 }
    }
  });

  await prisma.notificacao.create({
    data: {
      usuarioId: admin.id,
      tipo: 'NOTA_SOLICITADA',
      titulo: 'Nova Solicitação de Nota',
      mensagem: 'Maria Silva solicitou emissão de nota no valor de R$ 2.500,00',
      dados: { valor: 2500 }
    }
  });
  console.log('✅ Notificações criadas');

  console.log('\n========================================');
  console.log('🎉 Seed concluído com sucesso!');
  console.log('========================================');
  console.log('\n📋 Credenciais de acesso:');
  console.log('----------------------------------------');
  console.log('👤 Admin:');
  console.log('   CPF: 000.000.000-00');
  console.log('   Senha: 123456');
  console.log('----------------------------------------');
  console.log('👤 Cliente 1 (Maria):');
  console.log('   CPF: 123.456.789-00');
  console.log('   CNPJ: 12.345.678/0001-90');
  console.log('   Senha: 123456');
  console.log('----------------------------------------');
  console.log('👤 Cliente 2 (João):');
  console.log('   CPF: 987.654.321-00');
  console.log('   CNPJ: 98.765.432/0001-10');
  console.log('   Senha: 123456');
  console.log('========================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
