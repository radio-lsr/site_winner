const jwt = require('jsonwebtoken');
const db = require('../config/db');

module.exports = async (req, res, next) => {
  const cookies = String(req.headers.cookie || '').split(';').map(part => part.trim());
  const sessionCookie = cookies.find(part => part.startsWith('winner_session='));
  let cookieToken = '';
  try { cookieToken = sessionCookie ? decodeURIComponent(sessionCookie.slice('winner_session='.length)) : ''; } catch { cookieToken = ''; }
  const token = cookieToken;
  if (!token) return res.status(401).json({ error: "Accès refusé. Session d'authentification manquante." });
  try {
    const claims = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    const [rows] = await db.query('SELECT id, email, role, statut, token_version FROM users WHERE id = ?', [claims.id]);
    const user = rows[0];
    if (!user || user.statut !== 'Actif') return res.status(401).json({ error: 'Compte désactivé ou introuvable.' });
    if (Number(claims.ver || 0) !== Number(user.token_version || 0)) return res.status(401).json({ error: 'Session révoquée. Veuillez vous reconnecter.' });
    // Les autorisations sont basées sur le rôle courant en base, pas sur une ancienne valeur du JWT.
    req.user = { id: user.id, email: user.email, role: user.role };
    return next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') return res.status(401).json({ error: 'Jeton invalide ou expiré.' });
    return next(error);
  }
};
