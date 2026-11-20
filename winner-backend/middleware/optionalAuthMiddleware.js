const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Authentification facultative pour les routes de lecture publiques qui
// donnent plus de contenu à un administrateur connecté.
module.exports = async (req, _res, next) => {
  try {
    const cookies = String(req.headers.cookie || '').split(';').map(part => part.trim());
    const sessionCookie = cookies.find(part => part.startsWith('winner_session='));
    const cookieToken = sessionCookie ? decodeURIComponent(sessionCookie.slice('winner_session='.length)) : '';
    const token = cookieToken;
    if (token) {
      const claims = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
      const [rows] = await db.query('SELECT id, email, role, statut, token_version FROM users WHERE id = ?', [claims.id]);
      const user = rows[0];
      if (user && user.statut === 'Actif' && Number(claims.ver || 0) === Number(user.token_version || 0)) {
        req.user = { id: user.id, email: user.email, role: user.role };
      }
    }
  } catch {
    // Pour cette route publique, un cookie invalide donne les mêmes données qu'un visiteur anonyme.
    req.user = undefined;
  }
  return next();
};
