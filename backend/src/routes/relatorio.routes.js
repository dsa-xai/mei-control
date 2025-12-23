// ============================================
// Rotas de Relatórios
// ============================================

const express = require('express');
const router = express.Router();

const relatorioController = require('../controllers/relatorio.controller');
const { auth } = require('../middleware/auth');

router.use(auth);

router.get('/faturamento', relatorioController.relatorioFaturamento);
router.get('/clientes', relatorioController.relatorioClientes);
router.get('/das', relatorioController.relatorioDAS);

module.exports = router;
