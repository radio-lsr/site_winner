const express = require('express');
const router = express.Router();
const commandesController = require('../controllers/commandesController');
const verifyToken = require('../middleware/authMiddleware');
const { requireAdminOrModerator } = require('../middleware/roleMiddleware');

// Création publique (panier du site vitrine)
router.post('/', commandesController.createOrder);

// Réception et gestion des commandes : administrateurs et modérateurs
router.get('/', verifyToken, requireAdminOrModerator, commandesController.getAllOrders);
router.put('/:id', verifyToken, requireAdminOrModerator, commandesController.updateOrder);

module.exports = router;
