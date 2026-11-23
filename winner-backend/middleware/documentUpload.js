const multer = require('multer');
const path = require('path');

// ------------------------------------------------------------------
// Téléversement de documents tabulaires (CSV / Excel) pour l'import
// de produits. Le fichier est conservé en mémoire (max 5 Mo) : il est
// parsé immédiatement par le contrôleur puis ignoré, sans laisser de
// trace sur le disque.
// ------------------------------------------------------------------

const EXTENSIONS_AUTORISEES = ['.csv', '.xls', '.xlsx'];

const MIME_PAR_EXTENSION = {
  '.csv': 'text/csv',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (!EXTENSIONS_AUTORISEES.includes(ext)) {
      return cb(new Error('Seuls les fichiers CSV ou Excel (.csv, .xls, .xlsx) sont autorisés.'));
    }
    // Normalise le type déclaré pour que le contrôleur puisse s'y fier.
    file.mimetype = MIME_PAR_EXTENSION[ext];
    cb(null, true);
  }
});

const uploadDocument = upload.single('fichier');

module.exports = { uploadDocument, EXTENSIONS_AUTORISEES };
