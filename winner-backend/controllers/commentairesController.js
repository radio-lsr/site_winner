const db = require('../config/db');

// ============================================================
// Commentaires des visiteurs sur les Conseils & Tutos (articles)
// ============================================================

// GET /api/commentaires/article/:articleId — liste publique des commentaires d'un article
exports.getCommentairesArticle = async (req, res) => {
  try {
    const articleId = parseInt(req.params.articleId, 10);
    if (!Number.isInteger(articleId) || articleId <= 0) {
      return res.status(400).json({ error: 'Identifiant d\'article invalide.' });
    }

    const [rows] = await db.query(
      'SELECT id, nom, commentaire, created_at FROM commentaires_articles WHERE article_id = ? ORDER BY created_at DESC',
      [articleId]
    );

    res.json(rows.map(c => ({
      id: c.id,
      nom: c.nom,
      commentaire: c.commentaire,
      date: c.created_at
    })));
  } catch (error) {
    console.error('Erreur lors de la récupération des commentaires :', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des commentaires.' });
  }
};

// POST /api/commentaires — un visiteur dépose un commentaire sur un article
exports.createCommentaire = async (req, res) => {
  try {
    const { articleId, nom, commentaire } = req.body || {};

    const aid = parseInt(articleId, 10);
    const nomClean = String(nom || '').trim().slice(0, 150);
    const commentaireClean = String(commentaire || '').trim().slice(0, 2000);

    if (!aid || aid <= 0) {
      return res.status(400).json({ error: 'Article invalide.' });
    }
    if (!nomClean) {
      return res.status(400).json({ error: 'Le nom est obligatoire.' });
    }
    if (commentaireClean.length < 2) {
      return res.status(400).json({ error: 'Le commentaire est trop court.' });
    }

    // L'article doit exister
    const [article] = await db.query('SELECT id FROM articles WHERE id = ?', [aid]);
    if (!article || article.length === 0) {
      return res.status(404).json({ error: 'Article introuvable.' });
    }

    await db.query(
      'INSERT INTO commentaires_articles (article_id, nom, commentaire) VALUES (?, ?, ?)',
      [aid, nomClean, commentaireClean]
    );

    res.status(201).json({ message: 'Merci pour votre commentaire !' });
  } catch (error) {
    console.error('Erreur lors de la création du commentaire :', error);
    res.status(500).json({ error: 'Erreur serveur lors de l\'enregistrement du commentaire.' });
  }
};

// GET /api/commentaires — réservé admin : tous les commentaires avec le titre de l'article
exports.getAllCommentaires = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.id, c.nom, c.commentaire, c.created_at, c.article_id, a.titre AS article_titre
       FROM commentaires_articles c
       LEFT JOIN articles a ON a.id = c.article_id
       ORDER BY c.created_at DESC`
    );

    res.json(rows.map(c => ({
      id: c.id,
      nom: c.nom,
      commentaire: c.commentaire,
      date: c.created_at,
      articleId: c.article_id,
      articleTitre: c.article_titre || 'Article supprimé'
    })));
  } catch (error) {
    console.error('Erreur lors de la récupération des commentaires :', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des commentaires.' });
  }
};

// DELETE /api/commentaires/:id — réservé admin (modération)
exports.deleteCommentaire = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [result] = await db.query('DELETE FROM commentaires_articles WHERE id = ?', [id]);
    if (!result || result.affectedRows === 0) {
      return res.status(404).json({ error: 'Commentaire introuvable.' });
    }
    res.json({ message: 'Commentaire supprimé.' });
  } catch (error) {
    console.error('Erreur lors de la suppression du commentaire :', error);
    res.status(500).json({ error: 'Erreur serveur lors de la suppression.' });
  }
};
