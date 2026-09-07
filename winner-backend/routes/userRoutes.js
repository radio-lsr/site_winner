const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const verifyToken = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// ==========================
// ROUTES DU PROFIL PERSONNEL
// ==========================
router.get('/profile', verifyToken, userController.getProfile);
router.put('/profile', verifyToken, userController.updateProfile);
router.put('/password', verifyToken, userController.updatePassword);
// Le profil utilise "avatar"
router.post('/avatar', verifyToken, upload.single('avatar'), userController.updateAvatar);

// ==========================
// ROUTES D'ADMINISTRATION
// (Pour AdminUtilisateurs.vue)
// ==========================
router.get('/', verifyToken, userController.getAllUsers);

// L'administration utilise "photo" côté Vue.js (formData.append('photo', fichier))
router.post('/', verifyToken, upload.single('photo'), userController.createUser);
router.put('/:id', verifyToken, upload.single('photo'), userController.updateUser);
router.delete('/:id', verifyToken, userController.deleteUser);

module.exports = router;