// ============================================
// Rotas de MEI
// ============================================

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const meiController = require('../controllers/mei.controller');
const { auth } = require('../middleware/auth');

// Validações
const validarMEI = [
  body('cnpj').matches(/^\d{14}$|^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/).withMessage('CNPJ inválido'),
  body('razaoSocial').trim().notEmpty().withMessage('Razão social é obrigatória'),
  body('dataAbertura').isISO8601().withMessage('Data de abertura inválida'),
  body('cnaePrincipal').notEmpty().withMessage('CNAE principal é obrigatório')
];

// Todas as rotas requerem autenticação
router.use(auth);

router.get('/', meiController.listar);
router.get('/:id', meiController.obter);
router.get('/:id/faturamento', meiController.obterFaturamento);
router.post('/', validarMEI, meiController.criar);
router.put('/:id', meiController.atualizar);
router.delete('/:id', meiController.desativar);

module.exports = router;
