const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const heroController = require('../controllers/heroController');
const verifyToken = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

// Dossier de stockage partagé avec la galerie
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
    // Nom de fichier assaini : évite apostrophes/espaces/accents dans les URLs
    const safeName = String(file.originalname || 'image').replace(/[^a-zA-Z0-9.\-]+/g, '-');
    cb(null, 'hero-' + uniqueSuffix + '-' + safeName);
  }
});

const upload = multer({ storage: storage });

// Public : images de la bannière
router.get('/', heroController.getHeroImages);

// Réservé admin : publier / retirer une image
router.post('/', verifyToken, requireAdmin, upload.single('image'), heroController.createHeroImage);
router.delete('/:id', verifyToken, requireAdmin, heroController.deleteHeroImage);

module.exports = router;
