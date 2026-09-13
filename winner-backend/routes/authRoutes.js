const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const verifyToken = require('../middleware/authMiddleware');

// L'inscription publique est désactivée : les comptes sont créés
// uniquement par un administrateur (POST /api/user).
router.post('/login', authController.login);

// Profil de l'utilisateur connecté (nom/photo du layout admin)
router.get('/me', verifyToken, authController.getMe);

// Déconnexion (le JWT est sans état, le client supprime son token)
router.post('/logout', authController.logout);

// Réinitialisation du mot de passe
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
