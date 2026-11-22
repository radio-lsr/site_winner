const express = require('express');
const router = express.Router();
const db = require('../config/db');
const verifyToken = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

// Consultation des logs réservée exclusivement à l'Admin
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 200, 1), 500);
    const [rows] = await db.query(
      'SELECT id, user_id, user_nom, user_role, action, details, ip, created_at FROM logs ORDER BY created_at DESC, id DESC LIMIT ?',
      [limit]
    );
    res.json(rows);
  } catch (err) {
    console.error('[LOGS] Erreur lecture:', err.message);
    res.status(500).json({ error: 'Impossible de récupérer les logs.' });
  }
});

module.exports = router;
