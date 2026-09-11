const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const productController = require('../controllers/productController');
const verifyToken = require('../middleware/authMiddleware');
const optionalAuth = require('../middleware/optionalAuthMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

// Dossier d'upload unique du backend
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Lecture : publique (uniquement les produits actifs pour les visiteurs),
// un admin connecté voit tout.
router.get('/', optionalAuth, productController.getAllProducts);

// Écriture : réservée aux administrateurs authentifiés
router.post('/', verifyToken, requireAdmin, upload.single('image'), productController.createProduct);
router.put('/:id', verifyToken, requireAdmin, upload.single('image'), productController.updateProduct);
router.delete('/:id', verifyToken, requireAdmin, productController.deleteProduct);

module.exports = router;
