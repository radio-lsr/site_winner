const db = require('../config/db');

// 1. Récupérer les produits (GET)
// - Visiteur anonyme : uniquement les produits actifs (visibles en boutique)
// - Admin connecté : tous les produits
exports.getAllProducts = async (req, res) => {
  try {
    const estAdmin = req.user && req.user.role === 'Admin';
    // Note moyenne + nombre d'avis par produit (affichés en boutique)
    const selectAvis = `SELECT p.*,
      (SELECT ROUND(AVG(a.note), 1) FROM avis_produits a WHERE a.produit_id = p.id) AS note_moyenne,
      (SELECT COUNT(*) FROM avis_produits a WHERE a.produit_id = p.id) AS nb_avis
      FROM produits p`;
    const [produits] = estAdmin
      ? await db.query(`${selectAvis} ORDER BY p.created_at DESC`)
      : await db.query(`${selectAvis} WHERE p.statut = 'actif' ORDER BY p.created_at DESC`);
    
    const formattedProduits = produits.map(p => ({
      id: p.id,
      nom: p.nom,
      categorie: p.categorie || 'Lubrifiants',
      description: p.description || '',
      prix: parseFloat(p.prix),
      discount: p.discount || 0,
      enSolde: Boolean(p.en_solde || p.discount > 0),
      stock: p.stock || 0,
      disponible: p.statut === 'actif',
      statut: p.statut,
      image: p.image_produit || '/prod.webp',
      noteMoyenne: parseFloat(p.note_moyenne) || 0,
      nbAvis: parseInt(p.nb_avis, 10) || 0,
      created_at: p.created_at
    }));

    res.json(formattedProduits);
  } catch (error) {
    console.error("Erreur lors de la récupération des produits :", error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération.' });
  }
};

// 2. Créer un nouveau produit (POST)
exports.createProduct = async (req, res) => {
  try {
    const { nom, categorie, prix, discount, stock, description, disponible } = req.body;
    const userId = req.user ? req.user.id : 1; 

    const statut = (disponible === 'false' || disponible === false) ? 'inactif' : 'actif';
    const discountVal = parseInt(discount) || 0;
    const enSoldeVal = discountVal > 0 ? 1 : 0;
    const descVal = description || '';
    const catVal = categorie || 'Lubrifiants';
    
    // Si un fichier a été uploadé via Multer, on crée le chemin, sinon image par défaut
    let imgVal = '/prod.webp';
    if (req.file) {
      // Ajustez le chemin de l'image selon la configuration de votre serveur (ex: dossier 'public/uploads')
      imgVal = `/uploads/${req.file.filename}`;
    }

    const [result] = await db.query(
      `INSERT INTO produits (nom, categorie, description, prix, discount, en_solde, stock, statut, image_produit, user_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nom, catVal, descVal, parseFloat(prix), discountVal, enSoldeVal, parseInt(stock) || 0, statut, imgVal, userId]
    );

    res.status(201).json({ message: 'Produit créé avec succès', id: result.insertId });
  } catch (error) {
    console.error("Erreur lors de la création du produit :", error);
    res.status(500).json({ error: 'Erreur serveur lors de la création.' });
  }
};

// 3. Mettre à jour un produit (PUT)
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    // Cas A : Modification rapide via le Switch ON/OFF (Requête JSON sans fichier)
    if (body.disponible !== undefined && Object.keys(body).length === 1) {
      const nouveauStatut = body.disponible ? 'actif' : 'inactif';
      await db.query('UPDATE produits SET statut = ? WHERE id = ?', [nouveauStatut, id]);
      return res.json({ message: 'Statut mis à jour.' });
    }

    // Cas B : Modification complète via la Modale (Requête FormData)
    const { nom, categorie, prix, discount, stock, description } = body;
    
    let updateFields = 'nom = ?, categorie = ?, description = ?, prix = ?, discount = ?, en_solde = ?, stock = ?';
    const params = [nom, categorie, description || '', parseFloat(prix), parseInt(discount) || 0, (parseInt(discount) || 0) > 0 ? 1 : 0, parseInt(stock) || 0];

    // Si une nouvelle image a été envoyée, on l'ajoute à la mise à jour
    if (req.file) {
      updateFields += ', image_produit = ?';
      params.push(`/uploads/${req.file.filename}`);
    }

    params.push(id);

    await db.query(`UPDATE produits SET ${updateFields} WHERE id = ?`, params);

    res.json({ message: 'Produit mis à jour avec succès.' });
  } catch (error) {
    console.error("Erreur lors de la modification :", error);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

// 4. Supprimer un produit (DELETE)
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM produits WHERE id = ?', [id]);
    res.json({ message: 'Produit supprimé avec succès.' });
  } catch (error) {
    console.error("Erreur lors de la suppression :", error);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};