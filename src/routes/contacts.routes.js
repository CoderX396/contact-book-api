const { Router } = require('express');
const controller = require('../controllers/contacts.controller');
const { validateContact } = require('../validators/contacts.validators');
const requireClientId = require('../middlewares/requireClientId');
const validateApiKey = require('../middlewares/validateApiKey');

const router = Router();

// Express revisa las rutas en el orden en que se declaran.
// /stats/summary va antes de /:id para que "stats" nunca se tome como un id.
// (Hoy /:id solo atrapa un segmento, así que no chocarían, pero si alguien
// agrega GET /stats o cambia el patrón, el orden evita el error.)
router.get('/stats/summary', requireClientId, controller.getSummary);

router.get('/', controller.listContacts);
router.get('/:id', controller.getContact);
router.post('/', validateContact, controller.createContact);
router.put('/:id', validateContact, controller.replaceContact);
router.patch('/:id/favorite', controller.toggleFavorite);
// La API key se revisa antes de buscar el contacto: sin permiso, ni siquiera
// se le dice al cliente si el id existe (401 antes que 404).
router.delete('/:id', validateApiKey, controller.deleteContact);

module.exports = router;
