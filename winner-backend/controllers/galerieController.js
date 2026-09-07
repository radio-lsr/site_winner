const db = require('../config/db');
const fs = require('fs');
const path = require('path');

// 1. Récupérer tous les médias
exports.getAllMedias = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM galerie ORDER BY id DESC');
    const medias = rows.map(item => ({
      ...item,
      image: item.image || '/prod.webp'
    }));
    res.json(medias);
  } catch (error) {
    console.error("Erreur lors de la récupération des médias :", error);
    res.status(500).json({ error: "Erreur serveur lors de la récupération des médias." });
  }
};

// 2. Créer / Uploader plusieurs médias à la fois (Sans titre ni description)
exports.createMedia = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "Aucun fichier n'a été fourni." });
    }

    const insertedMedias = [];

    for (const file of req.files) {
      const imagePath = `/uploads/${file.filename}`;

      // Insertion uniquement de l'image (et created_at si la colonne existe)
      const query = 'INSERT INTO galerie (image, created_at) VALUES (?, NOW())';
      const [result] = await db.query(query, [imagePath]);
      
      insertedMedias.push({
        id: result.insertId,
        image: imagePath
      });
    }

    res.status(201).json({ 
      message: "Fichiers uploadés avec succès", 
      medias: insertedMedias 
    });
  } catch (error) {
    console.error("Erreur lors de l'upload des fichiers :", error);
    res.status(500).json({ error: "Erreur serveur lors de l'upload." });
  }
};

// 3. Supprimer un média
exports.deleteMedia = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query('SELECT * FROM galerie WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Média non trouvé." });
    }

    const media = rows[0];

    if (media.image && media.image.startsWith('/uploads')) {
      const filePath = path.join(__dirname, '../public', media.image);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await db.query('DELETE FROM galerie WHERE id = ?', [id]);
    res.json({ message: "Média supprimé avec succès." });
  } catch (error) {
    console.error("Erreur lors de la suppression du média :", error);
    res.status(500).json({ error: "Erreur serveur lors de la suppression." });
  }
};