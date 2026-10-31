const { matchedData } = require('express-validator');
const Users = require('../data/users.data');
const AppError = require('../utils/AppError');

// GET /admin/users
const listUsers = (req, res) => {
  res.status(200).json(Users.findAll());
};

// PATCH /admin/users/:id/role
const updateRole = (req, res, next) => {
  const { role } = matchedData(req, { locations: ['body'] });
  const user = Users.updateRole(Number(req.params.id), role);
  if (!user) return next(new AppError(`No existe un usuario con id ${req.params.id}`, 404));
  res.status(200).json(user);
};

module.exports = { listUsers, updateRole };
