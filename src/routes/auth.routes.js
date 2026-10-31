const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const controller = require('../controllers/auth.controller');
const { validateRegister, validateLogin } = require('../validators/auth.validators');
const verifyToken = require('../middlewares/verifyToken');
const AppError = require('../utils/AppError');

const router = Router();

// 5 intentos fallidos cada 15 minutos por IP, para frenar a quien prueba
// contraseñas. skipSuccessfulRequests descuenta los login correctos (status < 400).
// Igual que el limiter de /contacts, pasa un AppError en vez de responder él mismo.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new AppError('Demasiados intentos fallidos de inicio de sesión. Intenta de nuevo en 15 minutos.', 429));
  },
});

router.post('/register', validateRegister, controller.register);
// El limiter va primero: bloqueada la IP, ni siquiera se valida ni se compara nada.
router.post('/login', loginLimiter, validateLogin, controller.login);
router.get('/me', verifyToken, controller.me);

module.exports = router;
