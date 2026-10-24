// Error "esperado" de la API: lleva el mensaje para el cliente y el código HTTP.
// Al heredar de Error conserva el stack, y errorHandler lo distingue con instanceof
// de los errores inesperados (bugs), que nunca deben mostrar su mensaje real.
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
  }
}

module.exports = AppError;
