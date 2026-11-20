const express = require('express');
const router = express.Router();
const commandesController = require('../controllers/commandesController');
const verifyToken = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

// Création publique (panier du site vitrine)
router.post('/', commandesController.createOrder);

// Consultation et gestion réservées aux administrateurs
router.get('/', verifyToken, requireAdmin, commandesController.getAllOrders);
router.put('/:id', verifyToken, requireAdmin, commandesController.updateOrder);

module.exports = router;
