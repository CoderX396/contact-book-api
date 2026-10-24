const AppError = require('../utils/AppError');

// La clave fija la pide el enunciado. En un proyecto real vendría de una
// variable de entorno (process.env.API_KEY) y nunca se subiría al repositorio.
const API_KEY = 'talendig-123';

// Protege DELETE: sin x-api-key, o con una distinta, responde 401 (no autenticado).
const validateApiKey = (req, res, next) => {
  if (req.get('x-api-key') !== API_KEY) {
    return next(new AppError('API key ausente o inválida', 401));
  }
  next();
};

module.exports = validateApiKey;
