// ============================================
// Rotas de Usuário
// ============================================

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const usuarioController = require('../controllers/usuario.controller');
const { auth } = require('../middleware/auth');

router.use(auth);

router.get('/perfil', usuarioController.obterPerfil);
router.put('/perfil', usuarioController.atualizarPerfil);
router.put('/email', [
  body('novoEmail').isEmail().withMessage('Email inválido'),
  body('senha').notEmpty().withMessage('Senha é obrigatória')
], usuarioController.atualizarEmail);
router.post('/desativar', [
  body('senha').notEmpty().withMessage('Senha é obrigatória')
], usuarioController.desativarConta);

module.exports = router;
