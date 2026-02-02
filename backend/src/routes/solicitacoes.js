const express = require('express');
const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { adminMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Configurar upload de áudio
const uploadDir = path.join(__dirname, '../../uploads/audios');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `audio-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['audio/webm', 'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Formato de áudio não suportado'));
    }
  }
});

// Listar solicitações
router.get('/', async (req, res, next) => {
  try {
    const { meiId, status, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const where = {};

    if (req.usuario.role !== 'ADMIN') {
      where.solicitanteId = req.usuario.id;
    } else if (meiId) {
      where.meiId = meiId;
    }

    if (status) where.status = status;

    const [solicitacoes, total] = await Promise.all([
      prisma.solicitacaoNota.findMany({
        where,
        include: {
          mei: { select: { razaoSocial: true, cnpj: true } },
          cliente: { select: { nome: true, cpfCnpj: true } },
          solicitante: { select: { nome: true } },
          notaFiscal: { select: { numero: true, id: true } }
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.solicitacaoNota.count({ where })
    ]);

    res.json({
      data: solicitacoes,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Buscar solicitação por ID
router.get('/:id', async (req, res, next) => {
  try {
    const solicitacao = await prisma.solicitacaoNota.findUnique({
      where: { id: req.params.id },
      include: {
        mei: true,
        cliente: true,
        solicitante: { select: { nome: true, email: true } },
        notaFiscal: true
      }
    });

    if (!solicitacao) {
      return res.status(404).json({ error: 'Solicitação não encontrada' });
    }

    res.json(solicitacao);
  } catch (error) {
    next(error);
  }
});

// Criar solicitação (Cliente ou Admin)
router.post('/', upload.single('audio'), async (req, res, next) => {
  try {
    const {
      meiId, clienteId, descricao, valor,
      tomadorNome, tomadorCpfCnpj, tomadorEmail, observacao
    } = req.body;

    // Determinar MEI
    let meiIdFinal = meiId;
    if (req.usuario.role === 'CLIENTE') {
      meiIdFinal = req.usuario.meis[0]?.id;
    }

    if (!meiIdFinal) {
      return res.status(400).json({ error: 'MEI não especificado' });
    }

    const solicitacao = await prisma.solicitacaoNota.create({
      data: {
        meiId: meiIdFinal,
        clienteId,
        solicitanteId: req.usuario.id,
        descricao,
        valor: Number(valor),
        audioUrl: req.file ? `/uploads/audios/${req.file.filename}` : null,
        tomadorNome,
        tomadorCpfCnpj: tomadorCpfCnpj?.replace(/\D/g, ''),
        tomadorEmail,
        observacao
      },
      include: {
        mei: { select: { razaoSocial: true } }
      }
    });

    // Notificar admins
    const admins = await prisma.usuario.findMany({
      where: { role: 'ADMIN', ativo: true }
    });

    for (const admin of admins) {
      await prisma.notificacao.create({
        data: {
          usuarioId: admin.id,
          tipo: 'NOTA_SOLICITADA',
          titulo: 'Nova Solicitação de Nota',
          mensagem: `${req.usuario.nome} solicitou emissão de nota no valor de R$ ${Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          dados: { solicitacaoId: solicitacao.id, meiId: meiIdFinal }
        }
      });
    }

    res.status(201).json(solicitacao);
  } catch (error) {
    next(error);
  }
});

// Atualizar status da solicitação (Admin)
router.put('/:id/status', adminMiddleware, async (req, res, next) => {
  try {
    const { status, observacao, motivoRejeicao } = req.body;

    const statusValidos = ['PENDENTE', 'EM_ANDAMENTO', 'EMITIDA', 'REJEITADA'];
    if (!statusValidos.includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    const solicitacao = await prisma.solicitacaoNota.update({
      where: { id: req.params.id },
      data: {
        status,
        observacao,
        motivoRejeicao: status === 'REJEITADA' ? motivoRejeicao : null,
        processadoPor: req.usuario.id,
        processadoEm: new Date()
      },
      include: {
        solicitante: { select: { id: true, nome: true } }
      }
    });

    // Notificar solicitante
    let mensagem = '';
    if (status === 'EM_ANDAMENTO') {
      mensagem = 'Sua solicitação está sendo processada.';
    } else if (status === 'REJEITADA') {
      mensagem = `Sua solicitação foi rejeitada. Motivo: ${motivoRejeicao}`;
    }

    if (mensagem) {
      await prisma.notificacao.create({
        data: {
          usuarioId: solicitacao.solicitante.id,
          tipo: status === 'REJEITADA' ? 'SOLICITACAO_REJEITADA' : 'SOLICITACAO_ATUALIZADA',
          titulo: status === 'REJEITADA' ? 'Solicitação Rejeitada' : 'Solicitação em Andamento',
          mensagem,
          dados: { solicitacaoId: solicitacao.id }
        }
      });
    }

    res.json(solicitacao);
  } catch (error) {
    next(error);
  }
});

// Gerar link WhatsApp
router.post('/whatsapp/link', async (req, res, next) => {
  try {
    const { telefone, mensagem } = req.body;

    if (!telefone || !mensagem) {
      return res.status(400).json({ error: 'Telefone e mensagem são obrigatórios' });
    }

    const telefoneLimpo = telefone.replace(/\D/g, '');
    const telefoneFormatado = telefoneLimpo.startsWith('55') ? telefoneLimpo : `55${telefoneLimpo}`;
    const mensagemEncoded = encodeURIComponent(mensagem);

    res.json({
      link: `https://wa.me/${telefoneFormatado}?text=${mensagemEncoded}`
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
