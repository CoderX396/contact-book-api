const AppError = require('../utils/AppError');

// Exige el header x-client-id (solo se monta en /contacts/stats/summary)
// y lo deja en req.clientId para que el controlador lo use sin volver a leer headers.
const requireClientId = (req, res, next) => {
  const clientId = req.get('x-client-id')?.trim(); // req.get no distingue mayúsculas

  if (!clientId) {
    return next(new AppError('Falta el header x-client-id', 400));
  }

  req.clientId = clientId;
  next();
};

module.exports = requireClientId;
