// ============================================
// Rotas de Dashboard
// ============================================

const express = require('express');
const router = express.Router();

const dashboardController = require('../controllers/dashboard.controller');
const { auth } = require('../middleware/auth');

router.use(auth);

router.get('/notificacoes', dashboardController.obterNotificacoes);
router.get('/:meiId', dashboardController.obterDados);

module.exports = router;
