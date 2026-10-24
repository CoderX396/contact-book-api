const { matchedData } = require('express-validator');
const Contacts = require('../data/contacts.data');
const AppError = require('../utils/AppError');

// "809-555-0101" y "(809) 555 0101" son el mismo número escrito distinto.
// Para la regla de teléfono único se comparan solo los dígitos.
const digitsOf = (phone) => phone.replace(/\D/g, '');

// ¿Hay otro contacto (distinto de exceptId) con ese teléfono?
const phoneTaken = (phone, exceptId = null) =>
  Contacts.getAll().some((c) => c.id !== exceptId && digitsOf(c.phone) === digitsOf(phone));

// Los parámetros de la URL siempre llegan como texto: "3" → 3.
// Un id que no es número entero simplemente no existe, así que acaba en 404.
const parseId = (req) => Number(req.params.id);

const notFoundError = (id) => new AppError(`No existe un contacto con id ${id}`, 404);

// GET /contacts
const listContacts = (req, res) => {
  res.status(200).json(Contacts.getAll());
};

// GET /contacts/:id
const getContact = (req, res, next) => {
  const contact = Contacts.getById(parseId(req));
  if (!contact) return next(notFoundError(req.params.id));
  res.status(200).json(contact);
};

// POST /contacts
const createContact = (req, res, next) => {
  // matchedData devuelve solo los campos que pasaron por el validador,
  // así un "id" o "createdAt" enviado por el cliente se descarta.
  const data = matchedData(req, { locations: ['body'] });
  if (phoneTaken(data.phone)) {
    return next(new AppError(`Ya existe un contacto con el teléfono ${data.phone}`, 409));
  }
  res.status(201).json(Contacts.create(data));
};

// PUT /contacts/:id — reemplaza el contacto: lo que no se envíe vuelve a su valor por defecto.
const replaceContact = (req, res, next) => {
  const id = parseId(req);
  if (!Contacts.getById(id)) return next(notFoundError(req.params.id));

  const data = matchedData(req, { locations: ['body'] });
  if (phoneTaken(data.phone, id)) {
    return next(new AppError(`Ya existe otro contacto con el teléfono ${data.phone}`, 409));
  }

  const updated = Contacts.update(id, {
    name: data.name,
    phone: data.phone,
    ...(data.email !== undefined && { email: data.email }),
    category: data.category ?? 'other',
    favorite: data.favorite ?? false,
  });
  res.status(200).json(updated);
};

// PATCH /contacts/:id/favorite — alterna true ↔ false, no recibe cuerpo.
const toggleFavorite = (req, res, next) => {
  const id = parseId(req);
  const contact = Contacts.getById(id);
  if (!contact) return next(notFoundError(req.params.id));

  const { id: _id, createdAt, ...fields } = contact;
  res.status(200).json(Contacts.update(id, { ...fields, favorite: !contact.favorite }));
};

// DELETE /contacts/:id — 204 significa "hecho, sin cuerpo que devolver".
const deleteContact = (req, res, next) => {
  if (!Contacts.remove(parseId(req))) return next(notFoundError(req.params.id));
  res.status(204).end();
};

// GET /contacts/stats/summary
const getSummary = (req, res) => {
  const all = Contacts.getAll();

  // Se parte de todas las categorías en 0 para que aparezcan aunque estén vacías.
  const byCategory = { family: 0, friends: 0, work: 0, other: 0 };
  for (const c of all) byCategory[c.category] += 1;

  res.status(200).json({
    clientId: req.clientId, // lo dejó requireClientId
    total: all.length,
    favorites: all.filter((c) => c.favorite).length,
    byCategory,
  });
};

module.exports = {
  listContacts,
  getContact,
  createContact,
  replaceContact,
  toggleFavorite,
  deleteContact,
  getSummary,
};
