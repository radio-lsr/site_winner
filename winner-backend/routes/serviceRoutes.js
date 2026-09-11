const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const verifyToken = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

// Lecture publique (section "Nos Domaines d'Expertise" du site vitrine),
// écriture réservée aux administrateurs.
router.get('/', serviceController.getAllServices);
router.post('/', verifyToken, requireAdmin, serviceController.createService);
router.delete('/:id', verifyToken, requireAdmin, serviceController.deleteService);

module.exports = router;