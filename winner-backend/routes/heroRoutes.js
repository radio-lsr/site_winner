const express = require('express');
const router = express.Router();
const heroController = require('../controllers/heroController');
const verifyToken = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');
const { safeUpload, IMAGE_TYPES } = require('../middleware/safeUpload');
const uploadImage = safeUpload({ fields: { image: IMAGE_TYPES }, maxFiles: 1, maxTotalSize: 10 * 1024 * 1024 });

// Public : images de la bannière
router.get('/', heroController.getHeroImages);

// Réservé admin : publier / retirer une image
router.post('/', verifyToken, requireAdmin, uploadImage, heroController.createHeroImage);
router.delete('/:id', verifyToken, requireAdmin, heroController.deleteHeroImage);

module.exports = router;
