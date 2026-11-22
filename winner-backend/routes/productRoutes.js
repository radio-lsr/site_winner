const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const verifyToken = require('../middleware/authMiddleware');
const optionalAuth = require('../middleware/optionalAuthMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');
const { safeUpload, IMAGE_TYPES } = require('../middleware/safeUpload');
const { uploadDocument } = require('../middleware/documentUpload');
const uploadImage = safeUpload({ fields: { image: IMAGE_TYPES }, maxFiles: 1, maxTotalSize: 10 * 1024 * 1024 });

// Lecture : publique (uniquement les produits actifs pour les visiteurs),
// un membre du personnel connecté (admin ou modérateur) voit tout.
// Le modérateur consulte les produits en lecture seule.
router.get('/', optionalAuth, productController.getAllProducts);

// Import en masse (CSV / Excel) : réservé aux administrateurs.
router.get('/modele-import', verifyToken, requireAdmin, productController.modeleImport);
router.post('/import', verifyToken, requireAdmin, uploadDocument, productController.importProducts);

// Écriture : réservée aux administrateurs authentifiés
router.post('/', verifyToken, requireAdmin, uploadImage, productController.createProduct);
router.put('/:id', verifyToken, requireAdmin, uploadImage, productController.updateProduct);
router.delete('/:id', verifyToken, requireAdmin, productController.deleteProduct);

module.exports = router;
