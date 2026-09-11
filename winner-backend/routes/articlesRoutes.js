const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const articlesController = require('../controllers/articlesController');
const verifyToken = require('../middleware/authMiddleware');
const optionalAuth = require('../middleware/optionalAuthMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });
// ⚠️ Les noms de champs DOIVENT correspondre à ceux envoyés par AdminArticles.vue
// (formData.append('image_couverture', ...) et formData.append('fichier_video', ...))
const uploadFields = upload.fields([
  { name: 'image_couverture', maxCount: 1 },
  { name: 'fichier_video', maxCount: 1 }
]);

// GET public : les visiteurs ne voient que les articles "Publié",
// un admin connecté voit tout (brouillons compris).
router.get('/', optionalAuth, articlesController.getAllArticles);
router.post('/', verifyToken, requireAdmin, uploadFields, articlesController.createArticle);
router.put('/:id', verifyToken, requireAdmin, uploadFields, articlesController.updateArticle);
router.delete('/:id', verifyToken, requireAdmin, articlesController.deleteArticle);

module.exports = router;