const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const galerieController = require('../controllers/galerieController');
const verifyToken = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

// Configuration du dossier de stockage (dossier uploads unique du backend)
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

// Utilisation de .array() pour accepter plusieurs fichiers sous la clé 'fichiers'
const upload = multer({ storage: storage });

router.get('/', galerieController.getAllMedias);
router.post('/', verifyToken, requireAdmin, upload.array('fichiers', 10), galerieController.createMedia); // Accepte jusqu'à 10 fichiers d'un coup
router.delete('/:id', verifyToken, requireAdmin, galerieController.deleteMedia);

module.exports = router;