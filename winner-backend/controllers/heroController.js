const db = require('../config/db');
const fs = require('fs');
const path = require('path');

// ============================================================
// Images de la bannière d'accueil (Hero)
// ============================================================

// GET /api/hero — liste publique des images publiées (ordre stable)
exports.getHeroImages = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, image, created_at FROM hero_images ORDER BY id ASC');
    res.json(rows.map(r => ({ id: r.id, image: r.image, created_at: r.created_at })));
  } catch (error) {
    console.error('Erreur lors de la récupération des images hero :', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération.' });
  }
};

// POST /api/hero — réservé admin : publie une image (upload multer, champ "image")
exports.createHeroImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni.' });
    }

    const imagePath = `/uploads/${req.file.filename}`;
    const [result] = await db.query('INSERT INTO hero_images (image) VALUES (?)', [imagePath]);

    res.status(201).json({
      message: 'Image publiée sur la bannière d\'accueil.',
      id: result.insertId,
      image: imagePath
    });
  } catch (error) {
    console.error('Erreur lors de la publication de l\'image hero :', error);
    res.status(500).json({ error: 'Erreur serveur lors de la publication.' });
  }
};

// DELETE /api/hero/:id — réservé admin : retire une image de la bannière
exports.deleteHeroImage = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [rows] = await db.query('SELECT * FROM hero_images WHERE id = ?', [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Image introuvable.' });
    }

    const media = rows[0];
    if (media.image && media.image.startsWith('/uploads')) {
      const filePath = path.join(__dirname, '..', media.image);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    const [result] = await db.query('DELETE FROM hero_images WHERE id = ?', [id]);
    if (!result || result.affectedRows === 0) {
      return res.status(404).json({ error: 'Image introuvable.' });
    }

    res.json({ message: 'Image retirée de la bannière.' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'image hero :', error);
    res.status(500).json({ error: 'Erreur serveur lors de la suppression.' });
  }
};
