const rateLimit = require('express-rate-limit');

const createLimiter = (windowMs, limit, message) => rateLimit({
  windowMs,
  limit,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: message },
  // Les proxies Docker font confiance à un seul saut dans server.js.
  handler: (_req, res) => res.status(429).json({ error: message })
});

module.exports = {
  login: createLimiter(15 * 60 * 1000, 10, 'Trop de tentatives de connexion. Réessayez dans 15 minutes.'),
  reset: createLimiter(15 * 60 * 1000, 5, 'Trop de demandes de réinitialisation. Réessayez plus tard.'),
  contact: createLimiter(60 * 60 * 1000, 5, 'Trop de messages envoyés. Réessayez plus tard.'),
  order: createLimiter(15 * 60 * 1000, 30, 'Trop de commandes envoyées. Réessayez plus tard.'),
  publicPost: createLimiter(60 * 60 * 1000, 5, 'Trop de contributions envoyées. Réessayez plus tard.')
};
