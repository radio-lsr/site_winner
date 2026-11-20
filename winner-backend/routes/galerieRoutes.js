const express = require('express');
const router = express.Router();
const galerieController = require('../controllers/galerieController');
const verifyToken = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');
const { safeUpload, IMAGE_TYPES } = require('../middleware/safeUpload');
const uploadImages = safeUpload({ fields: { fichiers: IMAGE_TYPES }, maxFiles: 10, maxTotalSize: 10 * 1024 * 1024 });

router.get('/', galerieController.getAllMedias);
router.post('/', verifyToken, requireAdmin, uploadImages, galerieController.createMedia); // Accepte jusqu'à 10 fichiers d'un coup
router.delete('/:id', verifyToken, requireAdmin, galerieController.deleteMedia);

module.exports = router;