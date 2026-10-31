const { Router } = require('express');
const controller = require('../controllers/admin.controller');
const { validateRole } = require('../validators/auth.validators');
const verifyToken = require('../middlewares/verifyToken');
const checkRole = require('../middlewares/checkRole');

const router = Router();

// Se aplica a todas las rutas de este router: primero quién es, después si es admin.
router.use(verifyToken, checkRole('admin'));

router.get('/users', controller.listUsers);
router.patch('/users/:id/role', validateRole, controller.updateRole);

module.exports = router;
