const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRouter = require('./routes/auth.routes');
const adminRouter = require('./routes/admin.routes');
const contactsRouter = require('./routes/contacts.routes');
const requestTimer = require('./middlewares/requestTimer');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');
const AppError = require('./utils/AppError');

const app = express();

// El orden importa: cada petición pasa por estos middlewares de arriba abajo.

// 1. Cabeceras de seguridad (oculta X-Powered-By, agrega CSP, nosniff, etc.).
app.use(helmet());

// 2. Solo el frontend de desarrollo (Vite en el puerto 5173) puede llamar a la API
//    desde un navegador. Postman y curl no aplican CORS, por eso igual funcionan.
app.use(cors({ origin: 'http://localhost:5173' }));

// 3. Log de cada petición: método, ruta, código y tiempo, con colores.
app.use(morgan('dev'));

// 4. Convierte el cuerpo JSON en req.body.
app.use(express.json());

// 5. Middleware propio que mide la duración de cada petición.
app.use(requestTimer);

// 6. Máximo 50 peticiones cada 10 minutos por IP, solo en /contacts.
//    En vez de responder él mismo, pasa un AppError al errorHandler,
//    así el 429 sale con el mismo formato que los demás errores.
const contactsLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 50,
  standardHeaders: 'draft-8', // informa el límite en la cabecera RateLimit
  legacyHeaders: false, // sin las viejas X-RateLimit-*
  handler: (req, res, next) => {
    next(new AppError('Demasiadas peticiones: el límite es 50 cada 10 minutos. Intente más tarde.', 429));
  },
});
app.use('/contacts', contactsLimiter);

// 7. Rutas (los middlewares de ruta verifyToken, checkRole y requireClientId van dentro).
app.use('/auth', authRouter);
app.use('/admin', adminRouter);
app.use('/contacts', contactsRouter);

// 8. Si nada respondió, 404. Y al final, el manejador central de errores.
app.use(notFound);
app.use(errorHandler);

module.exports = app;
