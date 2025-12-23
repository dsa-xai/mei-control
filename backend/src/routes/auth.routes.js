// ============================================
// Rotas de Autenticação
// ============================================

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { auth } = require('../middleware/auth');
const { authLimiter, createAccountLimiter } = require('../middleware/rateLimiter');

// Validações
const validarRegistro = [
  body('nome').trim().notEmpty().withMessage('Nome é obrigatório'),
  body('email').isEmail().withMessage('Email inválido'),
  body('cpf').matches(/^\d{11}$|^\d{3}\.\d{3}\.\d{3}-\d{2}$/).withMessage('CPF inválido'),
  body('senha').isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres')
];

const validarLogin = [
  body('documento').notEmpty().withMessage('CPF ou CNPJ é obrigatório'),
  body('senha').notEmpty().withMessage('Senha é obrigatória')
];

const validarAlterarSenha = [
  body('senhaAtual').notEmpty().withMessage('Senha atual é obrigatória'),
  body('novaSenha').isLength({ min: 6 }).withMessage('Nova senha deve ter no mínimo 6 caracteres')
];

// Rotas públicas
router.post('/registro', createAccountLimiter, validarRegistro, authController.registro);
router.post('/login', authLimiter, validarLogin, authController.login);

// Rotas protegidas
router.post('/logout', auth, authController.logout);
router.get('/me', auth, authController.me);
router.put('/alterar-senha', auth, validarAlterarSenha, authController.alterarSenha);
router.post('/refresh', auth, authController.refreshToken);

module.exports = router;
