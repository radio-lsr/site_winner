// Dans votre fichier route (ex: routes/produits.js)
const express = require('express');
const router = express.Router();
const multer = require('multer');
const productController = require('../controllers/productController');
const verifyToken = require('../middleware/authMiddleware'); // Votre middleware auth

// Configuration Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/') // Assurez-vous que ce dossier existe à la racine de votre projet backend
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + '-' + file.originalname)
  }
})
const upload = multer({ storage: storage })

// Vos routes (Notez l'ajout de upload.single('image'))
router.get('/', verifyToken, productController.getAllProducts);
router.post('/', verifyToken, upload.single('image'), productController.createProduct);
router.put('/:id', verifyToken, upload.single('image'), productController.updateProduct);
router.delete('/:id', verifyToken, productController.deleteProduct);

module.exports = router;