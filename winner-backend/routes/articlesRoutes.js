const express = require('express');
const router = express.Router();
const articlesController = require('../controllers/articlesController');
const verifyToken = require('../middleware/authMiddleware');
const optionalAuth = require('../middleware/optionalAuthMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');
const { safeUpload, IMAGE_TYPES, VIDEO_TYPES } = require('../middleware/safeUpload');
const uploadFields = safeUpload({
  fields: { image_couverture: IMAGE_TYPES, fichier_video: VIDEO_TYPES },
  maxFiles: 1,
  maxTotalSize: 100 * 1024 * 1024
});

// GET public : les visiteurs ne voient que les articles "Publié",
// un admin connecté voit tout (brouillons compris).
router.get('/', optionalAuth, articlesController.getAllArticles);
router.post('/', verifyToken, requireAdmin, uploadFields, articlesController.createArticle);
router.put('/:id', verifyToken, requireAdmin, uploadFields, articlesController.updateArticle);
router.delete('/:id', verifyToken, requireAdmin, articlesController.deleteArticle);

module.exports = router;