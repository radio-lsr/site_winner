const express = require('express');
const router = express.Router();
const avisController = require('../controllers/avisController');
const verifyToken = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

// Public : liste des avis d'un produit + dépôt d'un avis
router.get('/produit/:produitId', avisController.getAvisProduit);
router.post('/', avisController.createAvis);

// Réservé admin : modération
router.get('/', verifyToken, requireAdmin, avisController.getAllAvis);
router.delete('/:id', verifyToken, requireAdmin, avisController.deleteAvis);

module.exports = router;
