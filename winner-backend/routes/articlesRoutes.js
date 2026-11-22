const express = require('express');
const router = express.Router();
const articlesController = require('../controllers/articlesController');
const verifyToken = require('../middleware/authMiddleware');
const optionalAuth = require('../middleware/optionalAuthMiddleware');
const { requireAdminOrModerator } = require('../middleware/roleMiddleware');
const { safeUpload, IMAGE_TYPES, VIDEO_TYPES } = require('../middleware/safeUpload');
const uploadFields = safeUpload({
  fields: { image_couverture: IMAGE_TYPES, fichier_video: VIDEO_TYPES },
  maxFiles: 1,
  maxTotalSize: 100 * 1024 * 1024
});

// GET public : les visiteurs ne voient que les articles "Publié",
// un membre du personnel connecté (admin ou modérateur) voit tout (brouillons compris).
router.get('/', optionalAuth, articlesController.getAllArticles);
// Gestion des articles : administrateurs et modérateurs
router.post('/', verifyToken, requireAdminOrModerator, uploadFields, articlesController.createArticle);
router.put('/:id', verifyToken, requireAdminOrModerator, uploadFields, articlesController.updateArticle);
router.delete('/:id', verifyToken, requireAdminOrModerator, articlesController.deleteArticle);

module.exports = router;