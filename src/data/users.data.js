const bcrypt = require('bcryptjs');

// Capa de datos de usuarios: el único archivo que toca este arreglo en memoria.

let nextId = 1; // siguiente id libre; nunca se reutiliza

const users = [];

// Copia del usuario sin passwordHash. Todo lo que sale de aquí pasa por esta
// función, salvo findByEmail, para que el hash no pueda colarse en una respuesta.
const toPublic = ({ passwordHash, ...user }) => ({ ...user });

// El correo se compara en minúsculas: "Ana@x.com" y "ana@x.com" son el mismo.
const findUserByEmail = (email) => users.find((u) => u.email === email.toLowerCase());

// Es la única que devuelve passwordHash, porque el login necesita compararlo.
// Nunca se debe responder con este objeto.
const findByEmail = (email) => {
  const found = findUserByEmail(email);
  return found ? { ...found } : null;
};

const findById = (id) => {
  const found = users.find((u) => u.id === id);
  return found ? toPublic(found) : null;
};

const findAll = () => users.map(toPublic);

// id y createdAt los pone la API. Recibe el hash, nunca la contraseña.
const create = ({ name, email, passwordHash, role = 'member' }) => {
  const user = {
    id: nextId++,
    name,
    email: email.toLowerCase(),
    passwordHash,
    role,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  return toPublic(user);
};

// Devuelve null si no existe, para que el controlador decida el 404.
const updateRole = (id, role) => {
  const user = users.find((u) => u.id === id);
  if (!user) return null;
  user.role = role;
  return toPublic(user);
};

// Crea el admin inicial con los datos del .env. Si ya existe no hace nada,
// y así nunca queda duplicado aunque se llame más de una vez.
const seedAdmin = async () => {
  const email = process.env.ADMIN_EMAIL;
  if (findUserByEmail(email)) return;

  const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
  create({ name: 'Administrador', email, passwordHash, role: 'admin' });
};

module.exports = { findByEmail, findById, findAll, create, updateRole, seedAdmin };
