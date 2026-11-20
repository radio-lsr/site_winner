/**
 * Middleware de contrôle de rôle.
 * À placer APRÈS verifyToken. Vérifie que l'utilisateur authentifié
 * possède bien le rôle requis (champ "role" du token JWT).
 *
 * Utilisation : router.post('/', verifyToken, requireRole('Admin'), controller.action)
 */
const requireRole = (...rolesAutorises) => {
  return (req, res, next) => {
    const role = req.user && req.user.role;

    if (!role || !rolesAutorises.includes(role)) {
      return res.status(403).json({
        error: 'Accès refusé : vous n\'avez pas les permissions nécessaires.'
      });
    }
    next();
  };
};

// Raccourci pratique pour le rôle administrateur
const requireAdmin = requireRole('Admin');

module.exports = { requireRole, requireAdmin };
