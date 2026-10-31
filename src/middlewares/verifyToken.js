const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

// Responde "¿quién eres?". Lee el header Authorization: Bearer <token>,
// comprueba la firma y el vencimiento, y deja en req.user lo que traía el token.
const verifyToken = (req, res, next) => {
  const [scheme, token] = (req.get('authorization') ?? '').split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new AppError('Token requerido', 401));
  }

  // jwt.verify lanza una excepción si la firma no coincide o si ya venció.
  // Se fija el algoritmo para no aceptar tokens firmados con otro distinto.
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    req.user = { id: payload.sub, role: payload.role };
  } catch {
    return next(new AppError('Token inválido o expirado', 401));
  }

  next();
};

module.exports = verifyToken;
