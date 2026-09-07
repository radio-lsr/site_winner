const db = require('../config/db');
const fs = require('fs');
const path = require('path');

// 1. Récupérer tous les articles
exports.getAllArticles = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM articles ORDER BY id DESC');
    res.json(rows);
  } catch (error) {
    console.error("Erreur lors de la récupération des articles :", error);
    res.status(500).json({ error: "Erreur serveur lors de la récupération." });
  }
};

// 2. Créer un article / tuto
exports.createArticle = async (req, res) => {
  try {
    const { titre, type_article, statut, contenu } = req.body;
    
    // Récupération sécurisée du user_id depuis le middleware d'authentification
    const userId = req.user ? (req.user.id || req.user.userId) : null;

    if (!userId) {
      return res.status(401).json({ error: "Utilisateur non authentifié ou ID manquant." });
    }

    const imagePath = req.files && req.files['image_couverture'] ? `/uploads/${req.files['image_couverture'][0].filename}` : null;
    const videoPath = req.files && req.files['fichier_video'] ? `/uploads/${req.files['fichier_video'][0].filename}` : null;

    const query = `
      INSERT INTO articles (titre, contenu, type_article, fichier_video, image_couverture, user_id, statut, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    
    const [result] = await db.query(query, [
      titre, 
      contenu, 
      type_article || 'texte', 
      videoPath, 
      imagePath, 
      userId, 
      statut || 'Brouillon'
    ]);

    res.status(201).json({ message: "Article créé avec succès", id: result.insertId });
  } catch (error) {
    console.error("Erreur lors de la création de l'article :", error);
    res.status(500).json({ error: error.message });
  }
};
// 3. Modifier un article / tuto
exports.updateArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const { titre, type_article, user_id, statut, contenu, created_at } = req.body;

    const [rows] = await db.query('SELECT * FROM articles WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Article non trouvé." });
    }
    const article = rows[0];

    const imagePath = req.files && req.files['image'] ? `/uploads/${req.files['image'][0].filename}` : article.image_couverture;
    const videoNom = req.files && req.files['video'] ? req.files['video'][0].originalname : article.fichier_video;

    const query = `UPDATE articles SET titre = ?, type_article = ?, user_id = ?, statut = ?, contenu = ?, created_at = ?, image_couverture = ?, fichier_video = ? WHERE id = ?`;
    await db.query(query, [titre, type_article, user_id, statut, contenu, created_at, imagePath, videoNom, id]);

    res.json({ message: "Article mis à jour avec succès." });
  } catch (error) {
    console.error("Erreur lors de la mise à jour :", error);
    res.status(500).json({ error: "Erreur serveur lors de la mise à jour." });
  }
};

// 4. Supprimer un article / tuto
exports.deleteArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM articles WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Article non trouvé." });
    }

    await db.query('DELETE FROM articles WHERE id = ?', [id]);
    res.json({ message: "Article supprimé avec succès." });
  } catch (error) {
    console.error("Erreur lors de la suppression :", error);
    res.status(500).json({ error: "Erreur serveur lors de la suppression." });
  }
};