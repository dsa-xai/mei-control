// ============================================
// Rotas de Notificação
// ============================================

const express = require('express');
const router = express.Router();

const notificacaoController = require('../controllers/notificacao.controller');
const { auth } = require('../middleware/auth');

router.use(auth);

router.get('/', notificacaoController.listar);
router.put('/:id/lida', notificacaoController.marcarComoLida);
router.put('/marcar-todas-lidas', notificacaoController.marcarTodasComoLidas);
router.delete('/:id', notificacaoController.excluir);

module.exports = router;
