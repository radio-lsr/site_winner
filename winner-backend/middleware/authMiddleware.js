const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format : Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Accès refusé. Jeton d\'authentification manquant.' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified; // Contient { id, email, iat, exp }
    next();
  } catch (error) {
    res.status(403).json({ error: 'Jeton invalide ou expiré.' });
  }
};