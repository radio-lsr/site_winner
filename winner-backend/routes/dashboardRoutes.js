const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const verifyToken = require('../middleware/authMiddleware');
const db = require('../config/db');
const { requireAdminOrModerator } = require('../middleware/roleMiddleware');

// Enregistrement public d'une visite (1 fois par session navigateur)
router.post('/visite', async (req, res) => {
  try {
    const allowed = ['Direct', 'Réseaux Sociaux', 'Moteurs de recherche'];
    const source = allowed.includes(req.body?.source) ? req.body.source : 'Direct';
    await db.query('INSERT INTO visites (source) VALUES (?)', [source]);
    res.status(201).json({ ok: true });
  } catch (e) {
    res.status(200).json({ ok: false });
  }
});

router.get('/stats', verifyToken, requireAdminOrModerator, dashboardController.getStats);

module.exports = router;