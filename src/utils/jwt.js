const jwt = require('jsonwebtoken');

// El payload se puede leer sin la clave (solo va firmado, no cifrado), así que
// lleva lo mínimo: quién es (sub) y qué puede hacer (role). La librería agrega
// por su cuenta iat (cuándo se firmó) y exp (cuándo vence).
const signToken = (user) =>
  jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

module.exports = { signToken };
