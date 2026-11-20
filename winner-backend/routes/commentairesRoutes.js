const express = require('express');
const router = express.Router();
const commentairesController = require('../controllers/commentairesController');
const verifyToken = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

// Public : liste des commentaires d'un article + dépôt d'un commentaire
router.get('/article/:articleId', commentairesController.getCommentairesArticle);
router.post('/', commentairesController.createCommentaire);

// Réservé admin : modération
router.get('/', verifyToken, requireAdmin, commentairesController.getAllCommentaires);
router.delete('/:id', verifyToken, requireAdmin, commentairesController.deleteCommentaire);

module.exports = router;
