// ============================================
// Rotas de DAS
// ============================================

const express = require('express');
const router = express.Router();

const dasController = require('../controllers/das.controller');
const { auth } = require('../middleware/auth');

router.use(auth);

router.get('/', dasController.listar);
router.post('/gerar', dasController.gerarGuias);
router.put('/:id/pagamento', dasController.registrarPagamento);

module.exports = router;
