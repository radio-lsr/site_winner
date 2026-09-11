const jwt = require('jsonwebtoken');

/**
 * Middleware d'authentification "douce" :
 * - Si un token JWT valide est présent, il est décodé dans req.user.
 * - Sinon, la requête passe quand même (req.user reste undefined).
 *
 * Utilisé pour les routes publiques qui renvoient plus de données
 * à un administrateur connecté (ex: liste des produits / articles).
 */
module.exports = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format : Bearer TOKEN

  if (token) {
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      // Token invalide ou expiré : on continue simplement sans utilisateur
      req.user = undefined;
    }
  }
  next();
};
