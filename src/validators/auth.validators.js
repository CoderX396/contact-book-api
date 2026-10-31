const { body } = require('express-validator');
const { handleValidation } = require('./contacts.validators');

const ROLES = ['member', 'manager', 'admin'];

const emailRule = body('email')
  .exists({ values: 'null' }).withMessage('email es obligatorio')
  .bail()
  .isString().withMessage('email debe ser texto')
  .bail()
  .trim()
  .isEmail().withMessage('email no es un correo válido')
  .bail()
  .toLowerCase();

// role no aparece aquí a propósito: el controlador usa matchedData(), que solo
// devuelve los campos validados, así que un "role" en el cuerpo se ignora.
const validateRegister = [
  body('name')
    .exists({ values: 'null' }).withMessage('name es obligatorio')
    .bail()
    .isString().withMessage('name debe ser texto')
    .bail()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('name debe tener entre 2 y 50 caracteres'),

  emailRule,

  body('password')
    .exists({ values: 'null' }).withMessage('password es obligatorio')
    .bail()
    .isString().withMessage('password debe ser texto')
    .bail()
    .isLength({ min: 6 }).withMessage('password debe tener al menos 6 caracteres'),

  handleValidation,
];

// En el login no se repite el mínimo de 6: una contraseña corta simplemente no
// coincide y acaba en 401, sin explicarle a nadie las reglas de las contraseñas.
const validateLogin = [
  emailRule,

  body('password')
    .exists({ values: 'null' }).withMessage('password es obligatorio')
    .bail()
    .isString().withMessage('password debe ser texto')
    .bail()
    .notEmpty().withMessage('password es obligatorio'),

  handleValidation,
];

// isString va primero porque isIn revisa cada elemento de un arreglo:
// sin él, ["admin"] pasaría la validación y se guardaría como rol.
const validateRole = [
  body('role')
    .exists({ values: 'null' }).withMessage('role es obligatorio')
    .bail()
    .isString().withMessage('role debe ser texto')
    .bail()
    .isIn(ROLES).withMessage(`role debe ser uno de: ${ROLES.join(', ')}`),

  handleValidation,
];

module.exports = { validateRegister, validateLogin, validateRole };
