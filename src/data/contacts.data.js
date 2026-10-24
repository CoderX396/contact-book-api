// Capa de datos: el único archivo que toca el arreglo en memoria.
// Si mañana se cambia a una base de datos, solo se reescribe este archivo
// y el controlador sigue llamando a las mismas funciones.

let nextId = 4; // siguiente id libre; nunca se reutiliza aunque se borre un contacto

const contacts = [
  {
    id: 1,
    name: 'María Pérez',
    phone: '+1 809-555-0101',
    email: 'maria.perez@example.com',
    category: 'family',
    favorite: true,
    createdAt: '2026-10-01T14:00:00.000Z',
  },
  {
    id: 2,
    name: 'Carlos Gómez',
    phone: '(829) 555-0202',
    email: 'carlos@example.com',
    category: 'friends',
    favorite: false,
    createdAt: '2026-10-05T09:30:00.000Z',
  },
  {
    id: 3,
    name: 'Laura Méndez',
    phone: '849 555 0303',
    category: 'work',
    favorite: false,
    createdAt: '2026-10-10T16:45:00.000Z',
  },
];

// Se devuelven copias para que nadie modifique el arreglo "por la espalda"
// (por ejemplo, editando un objeto que devolvió getAll).
const getAll = () => contacts.map((c) => ({ ...c }));

const getById = (id) => {
  const found = contacts.find((c) => c.id === id);
  return found ? { ...found } : null;
};

// id y createdAt los pone la API, nunca el cliente.
const create = ({ name, phone, email, category = 'other', favorite = false }) => {
  const contact = {
    id: nextId++,
    name,
    phone,
    ...(email !== undefined && { email }),
    category,
    favorite,
    createdAt: new Date().toISOString(),
  };
  contacts.push(contact);
  return { ...contact };
};

// Reemplaza los campos editables y conserva id y createdAt.
// Devuelve null si no existe, para que el controlador decida el 404.
const update = (id, fields) => {
  const index = contacts.findIndex((c) => c.id === id);
  if (index === -1) return null;
  const { id: _id, createdAt, ...rest } = fields; // por si acaso llegan, se ignoran
  contacts[index] = { id, ...rest, createdAt: contacts[index].createdAt };
  return { ...contacts[index] };
};

// Devuelve true si borró algo y false si el id no existía.
const remove = (id) => {
  const index = contacts.findIndex((c) => c.id === id);
  if (index === -1) return false;
  contacts.splice(index, 1);
  return true;
};

module.exports = { getAll, getById, create, update, remove };
