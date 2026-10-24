const AppError = require('../utils/AppError');

// Único lugar que responde errores. Express lo reconoce como manejador de
// errores porque tiene 4 parámetros; por eso "next" debe estar aunque no se use
// para la respuesta normal.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Si la respuesta ya empezó a enviarse, no se puede cambiar: se lo deja a Express.
  if (res.headersSent) return next(err);

  // Error esperado: su mensaje está pensado para el cliente.
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // express.json() lanza este error cuando el cuerpo no es JSON válido.
  // Es culpa del cliente, así que es 400 y no 500.
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo no es un JSON válido' });
  }

  // Cualquier otro error es un fallo nuestro: se registra completo en la consola
  // y al cliente solo le llega un mensaje genérico (no se filtran detalles internos).
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
};

module.exports = errorHandler;
