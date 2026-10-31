const AppError = require('../utils/AppError');

// Responde "¿puedes hacer esto?". No es un middleware sino una función que crea
// uno: checkRole('manager', 'admin') devuelve un middleware que recuerda esa lista.
// Va siempre después de verifyToken, que es quien llena req.user.
const checkRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Token requerido', 401));
  }
  if (!roles.includes(req.user.role)) {
    return next(new AppError('No tienes permisos', 403));
  }
  next();
};

module.exports = checkRole;
