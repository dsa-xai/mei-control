const errorHandler = (err, req, res, next) => {
  console.error('Erro:', err);

  // Erro do Prisma
  if (err.code?.startsWith('P')) {
    switch (err.code) {
      case 'P2002':
        return res.status(409).json({ 
          error: 'Registro duplicado',
          campo: err.meta?.target?.[0]
        });
      case 'P2025':
        return res.status(404).json({ error: 'Registro não encontrado' });
      default:
        return res.status(400).json({ error: 'Erro de banco de dados' });
    }
  }

  // Erro de validação
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  // Erro JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Token inválido' });
  }

  // Erro genérico
  res.status(err.status || 500).json({ 
    error: err.message || 'Erro interno do servidor' 
  });
};

module.exports = errorHandler;
