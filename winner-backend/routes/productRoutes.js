const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const verifyToken = require('../middleware/authMiddleware');
const optionalAuth = require('../middleware/optionalAuthMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');
const { safeUpload, IMAGE_TYPES } = require('../middleware/safeUpload');
const uploadImage = safeUpload({ fields: { image: IMAGE_TYPES }, maxFiles: 1, maxTotalSize: 10 * 1024 * 1024 });

// Lecture : publique (uniquement les produits actifs pour les visiteurs),
// un admin connecté voit tout.
router.get('/', optionalAuth, productController.getAllProducts);

// Écriture : réservée aux administrateurs authentifiés
router.post('/', verifyToken, requireAdmin, uploadImage, productController.createProduct);
router.put('/:id', verifyToken, requireAdmin, uploadImage, productController.updateProduct);
router.delete('/:id', verifyToken, requireAdmin, productController.deleteProduct);

module.exports = router;
