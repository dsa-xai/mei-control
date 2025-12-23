// ============================================
// Rotas de Notas Fiscais
// ============================================

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const notaFiscalController = require('../controllers/notaFiscal.controller');
const { auth } = require('../middleware/auth');
const { notaFiscalLimiter } = require('../middleware/rateLimiter');

// Validações
const validarNota = [
  body('meiId').notEmpty().withMessage('ID do MEI é obrigatório'),
  body('clienteId').notEmpty().withMessage('ID do cliente é obrigatório'),
  body('valor').isFloat({ min: 0.01 }).withMessage('Valor deve ser maior que zero'),
  body('descricao').trim().notEmpty().withMessage('Descrição é obrigatória'),
  body('dataEmissao').isISO8601().withMessage('Data de emissão inválida')
];

// Todas as rotas requerem autenticação
router.use(auth);

router.get('/', notaFiscalController.listar);
router.get('/periodo', notaFiscalController.buscarPorPeriodo);
router.get('/:id', notaFiscalController.obter);
router.get('/:id/pdf', notaFiscalController.gerarPDF);
router.post('/', notaFiscalLimiter, validarNota, notaFiscalController.emitir);
router.post('/:id/cancelar', notaFiscalController.cancelar);

module.exports = router;
