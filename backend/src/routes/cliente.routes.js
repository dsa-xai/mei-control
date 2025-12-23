// ============================================
// Rotas de Clientes
// ============================================

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const clienteController = require('../controllers/cliente.controller');
const { auth } = require('../middleware/auth');

// Validações
const validarCliente = [
  body('meiId').notEmpty().withMessage('ID do MEI é obrigatório'),
  body('nome').trim().notEmpty().withMessage('Nome é obrigatório'),
  body('cpfCnpj').notEmpty().withMessage('CPF ou CNPJ é obrigatório')
];

// Todas as rotas requerem autenticação
router.use(auth);

router.get('/', clienteController.listar);
router.get('/:id', clienteController.obter);
router.post('/', validarCliente, clienteController.criar);
router.put('/:id', clienteController.atualizar);
router.delete('/:id', clienteController.desativar);

module.exports = router;
