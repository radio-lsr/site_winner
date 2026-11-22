const express = require('express');
const router = express.Router();
const commentairesController = require('../controllers/commentairesController');
const verifyToken = require('../middleware/authMiddleware');
const { requireAdminOrModerator } = require('../middleware/roleMiddleware');

// Public : liste des commentaires d'un article + dépôt d'un commentaire
router.get('/article/:articleId', commentairesController.getCommentairesArticle);
router.post('/', commentairesController.createCommentaire);

// Modération : administrateurs et modérateurs
router.get('/', verifyToken, requireAdminOrModerator, commentairesController.getAllCommentaires);
router.delete('/:id', verifyToken, requireAdminOrModerator, commentairesController.deleteCommentaire);

module.exports = router;
