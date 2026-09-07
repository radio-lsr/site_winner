const multer = require('multer');

const errorHandler = (err, req, res, next) => {
  console.error('Erreur capturée :', err.stack || err);

  // Gestion spécifique des erreurs de Multer (upload de fichiers)
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Le fichier est trop volumineux (2 Mo maximum).' });
    }
    return res.status(400).json({ error: `Erreur lors du téléchargement : ${err.message}` });
  }

  // Erreur personnalisée de format de fichier
  if (err.message && err.message.includes('Seules les images')) {
    return res.status(400).json({ error: err.message });
  }

  // Erreur serveur par défaut
  res.status(500).json({
    error: 'Une erreur interne est survenue sur le serveur.',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

module.exports = errorHandler;