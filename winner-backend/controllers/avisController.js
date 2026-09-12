const db = require('../config/db');

// ============================================================
// Avis des visiteurs sur les produits
// ============================================================

// GET /api/avis/produit/:produitId — liste publique des avis d'un produit
exports.getAvisProduit = async (req, res) => {
  try {
    const produitId = parseInt(req.params.produitId, 10);
    if (!Number.isInteger(produitId) || produitId <= 0) {
      return res.status(400).json({ error: 'Identifiant de produit invalide.' });
    }

    const [rows] = await db.query(
      'SELECT id, nom, note, commentaire, created_at FROM avis_produits WHERE produit_id = ? ORDER BY created_at DESC',
      [produitId]
    );

    res.json(rows.map(a => ({
      id: a.id,
      nom: a.nom,
      note: Number(a.note),
      commentaire: a.commentaire,
      date: a.created_at
    })));
  } catch (error) {
    console.error('Erreur lors de la récupération des avis produit :', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des avis.' });
  }
};

// POST /api/avis — un visiteur dépose un avis (note 1 à 5 + commentaire)
exports.createAvis = async (req, res) => {
  try {
    const { produitId, nom, note, commentaire } = req.body || {};

    const pid = parseInt(produitId, 10);
    const noteNum = parseInt(note, 10);
    const nomClean = String(nom || '').trim().slice(0, 150);
    const commentaireClean = String(commentaire || '').trim().slice(0, 2000);

    if (!pid || pid <= 0) {
      return res.status(400).json({ error: 'Produit invalide.' });
    }
    if (!nomClean) {
      return res.status(400).json({ error: 'Le nom est obligatoire.' });
    }
    if (!Number.isInteger(noteNum) || noteNum < 1 || noteNum > 5) {
      return res.status(400).json({ error: 'La note doit être comprise entre 1 et 5 étoiles.' });
    }
    if (commentaireClean.length < 2) {
      return res.status(400).json({ error: 'Le commentaire est trop court.' });
    }

    // Le produit doit exister
    const [produit] = await db.query('SELECT id FROM produits WHERE id = ?', [pid]);
    if (!produit || produit.length === 0) {
      return res.status(404).json({ error: 'Produit introuvable.' });
    }

    await db.query(
      'INSERT INTO avis_produits (produit_id, nom, note, commentaire) VALUES (?, ?, ?, ?)',
      [pid, nomClean, noteNum, commentaireClean]
    );

    res.status(201).json({ message: 'Merci pour votre avis !' });
  } catch (error) {
    console.error('Erreur lors de la création de l\'avis :', error);
    res.status(500).json({ error: 'Erreur serveur lors de l\'enregistrement de l\'avis.' });
  }
};

// GET /api/avis — réservé admin : tous les avis avec le nom du produit
exports.getAllAvis = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT a.id, a.nom, a.note, a.commentaire, a.created_at, a.produit_id, p.nom AS produit_nom
       FROM avis_produits a
       LEFT JOIN produits p ON p.id = a.produit_id
       ORDER BY a.created_at DESC`
    );

    res.json(rows.map(a => ({
      id: a.id,
      nom: a.nom,
      note: Number(a.note),
      commentaire: a.commentaire,
      date: a.created_at,
      produitId: a.produit_id,
      produitNom: a.produit_nom || 'Produit supprimé'
    })));
  } catch (error) {
    console.error('Erreur lors de la récupération des avis :', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des avis.' });
  }
};

// DELETE /api/avis/:id — réservé admin (modération)
exports.deleteAvis = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [result] = await db.query('DELETE FROM avis_produits WHERE id = ?', [id]);
    if (!result || result.affectedRows === 0) {
      return res.status(404).json({ error: 'Avis introuvable.' });
    }
    res.json({ message: 'Avis supprimé.' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'avis :', error);
    res.status(500).json({ error: 'Erreur serveur lors de la suppression.' });
  }
};
