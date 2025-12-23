// ============================================
// Rotas de Declaração Anual
// ============================================

const express = require('express');
const router = express.Router();

const declaracaoController = require('../controllers/declaracao.controller');
const { auth } = require('../middleware/auth');

router.use(auth);

router.get('/', declaracaoController.listarDeclaracoes);
router.post('/', declaracaoController.criarDeclaracao);
router.post('/:id/enviar', declaracaoController.enviarDeclaracao);

module.exports = router;
