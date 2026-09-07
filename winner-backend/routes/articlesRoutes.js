const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const articlesController = require('../controllers/articlesController');
const verifyToken = require('../middleware/authMiddleware');

const uploadDir = path.join(__dirname, '../public/uploads');
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
const uploadFields = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]);

router.get('/', articlesController.getAllArticles);
router.post('/', verifyToken, uploadFields, articlesController.createArticle);
router.put('/:id', verifyToken, uploadFields, articlesController.updateArticle);
router.delete('/:id', verifyToken, articlesController.deleteArticle);

module.exports = router;