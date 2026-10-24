const AppError = require('../utils/AppError');

// Se monta después de todas las rutas: si una petición llega hasta aquí,
// ninguna ruta la atendió. No responde él mismo; delega en errorHandler.
const notFound = (req, res, next) => {
  next(new AppError(`Ruta no encontrada: ${req.method} ${req.originalUrl}`, 404));
};

module.exports = notFound;
