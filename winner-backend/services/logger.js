const db = require('../config/db');

/**
 * Enregistre une action dans la table `logs` sans jamais interrompre le flux principal.
 */
async function enregistrerLog({ req = null, user = null, action, details = '' }) {
  try {
    const acteur = user || req?.user || null;
    const ip = req
      ? (req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.socket?.remoteAddress || null)
      : null;

    await db.query(
      'INSERT INTO logs (user_id, user_nom, user_role, action, details, ip) VALUES (?, ?, ?, ?, ?, ?)',
      [
        acteur?.id || null,
        acteur?.nom || acteur?.email || 'Système',
        acteur?.role || null,
        String(action || 'ACTION').slice(0, 120),
        details ? String(details) : null,
        ip ? String(ip).slice(0, 64) : null
      ]
    );
  } catch (err) {
    console.error('[LOG] Erreur enregistrement:', err.message);
  }
}

module.exports = { enregistrerLog };
