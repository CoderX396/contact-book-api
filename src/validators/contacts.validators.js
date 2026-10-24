const { body, validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

const CATEGORIES = ['family', 'friends', 'work', 'other'];

// Reglas del cuerpo de un contacto. Se usan igual en POST y en PUT,
// porque PUT reemplaza el contacto completo y exige los mismos obligatorios.
const contactRules = [
  body('name')
    .exists({ values: 'null' }).withMessage('name es obligatorio')
    .bail()
    .isString().withMessage('name debe ser texto')
    .bail()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('name debe tener entre 2 y 50 caracteres'),

  body('phone')
    .exists({ values: 'null' }).withMessage('phone es obligatorio')
    .bail()
    .isString().withMessage('phone debe ser texto')
    .bail()
    .trim()
    .matches(/^[0-9\s\-()+]+$/).withMessage('phone solo admite dígitos, espacios, guiones, paréntesis y +')
    .bail()
    .isLength({ min: 7, max: 20 }).withMessage('phone debe tener entre 7 y 20 caracteres'),

  body('email')
    .optional()
    .isString().withMessage('email debe ser texto')
    .bail()
    .trim()
    .isEmail().withMessage('email no es un correo válido'),

  body('category')
    .optional()
    .isIn(CATEGORIES).withMessage(`category debe ser una de: ${CATEGORIES.join(', ')}`),

  // isBoolean() de express-validator acepta el texto "true"; aquí se exige un booleano real.
  body('favorite')
    .optional()
    .custom((value) => typeof value === 'boolean').withMessage('favorite debe ser true o false'),
];

// Cierra la cadena de reglas: si hubo errores, los junta en un solo mensaje
// y los manda al errorHandler con 400. Si no, deja pasar al controlador.
const handleValidation = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const messages = result.array().map((e) => e.msg);
  return next(new AppError(`Datos inválidos: ${messages.join('; ')}`, 400));
};

const validateContact = [...contactRules, handleValidation];

module.exports = { validateContact };
