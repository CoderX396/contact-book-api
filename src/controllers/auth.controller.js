const bcrypt = require('bcryptjs');
const { matchedData } = require('express-validator');
const Users = require('../data/users.data');
const AppError = require('../utils/AppError');
const { signToken } = require('../utils/jwt');

// POST /auth/register
const register = async (req, res, next) => {
  const { name, email, password } = matchedData(req, { locations: ['body'] });

  // Primero el hash y después la revisión del correo: bcrypt tarda y, mientras
  // espera, pueden atenderse otras peticiones. Entre esta revisión y create no hay
  // ninguna espera, así dos registros simultáneos no pueden duplicar el correo.
  const passwordHash = await bcrypt.hash(password, 10);

  if (Users.findByEmail(email)) {
    return next(new AppError(`Ya existe un usuario con el email ${email}`, 409));
  }

  const user = Users.create({ name, email, passwordHash });
  res.status(201).json({ user, token: signToken(user) });
};

// POST /auth/login
const login = async (req, res, next) => {
  const { email, password } = matchedData(req, { locations: ['body'] });
  const found = Users.findByEmail(email);

  // Mismo mensaje en los dos casos: así no se puede averiguar qué correos existen.
  if (!found || !(await bcrypt.compare(password, found.passwordHash))) {
    return next(new AppError('Credenciales inválidas', 401));
  }

  // findById devuelve el usuario sin passwordHash.
  const user = Users.findById(found.id);
  res.status(200).json({ user, token: signToken(user) });
};

// GET /auth/me
const me = (req, res, next) => {
  const user = Users.findById(req.user.id);
  // Token bien firmado de un usuario que ya no está (los datos viven en memoria).
  if (!user) return next(new AppError('Token inválido o expirado', 401));
  res.status(200).json(user);
};

module.exports = { register, login, me };
