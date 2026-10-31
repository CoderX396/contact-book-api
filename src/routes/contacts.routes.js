const { Router } = require('express');
const controller = require('../controllers/contacts.controller');
const { validateContact } = require('../validators/contacts.validators');
const requireClientId = require('../middlewares/requireClientId');
const verifyToken = require('../middlewares/verifyToken');
const checkRole = require('../middlewares/checkRole');

const router = Router();

// Ninguna ruta de /contacts es pública.
router.use(verifyToken);

const anyRole = checkRole('member', 'manager', 'admin');
const canDelete = checkRole('manager', 'admin');

// Express revisa las rutas en el orden en que se declaran.
// /stats/summary va antes de /:id para que "stats" nunca se tome como un id.
// (Hoy /:id solo atrapa un segmento, así que no chocarían, pero si alguien
// agrega GET /stats o cambia el patrón, el orden evita el error.)
router.get('/stats/summary', anyRole, requireClientId, controller.getSummary);

router.get('/', anyRole, controller.listContacts);
router.get('/:id', anyRole, controller.getContact);
router.post('/', anyRole, validateContact, controller.createContact);
router.put('/:id', anyRole, validateContact, controller.replaceContact);
router.patch('/:id/favorite', anyRole, controller.toggleFavorite);
// El permiso se revisa antes de buscar el contacto: sin permiso, ni siquiera
// se le dice al cliente si el id existe (403 antes que 404).
router.delete('/:id', canDelete, controller.deleteContact);

module.exports = router;
