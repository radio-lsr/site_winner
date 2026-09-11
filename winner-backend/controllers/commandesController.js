const db = require('../config/db');

// Génère une référence lisible : CMD-20260911-0001
const genererReference = (id) => {
  const d = new Date();
  const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `CMD-${dateStr}-${String(id).padStart(4, '0')}`;
};

const formaterCommande = (c) => {
  let articles = [];
  try {
    articles = typeof c.articles === 'string' ? JSON.parse(c.articles) : (c.articles || []);
  } catch (e) { /* JSON invalide : on laisse vide */ }

  return {
    id: c.id,
    ref: c.ref || genererReference(c.id),
    date: c.created_at ? new Date(c.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '',
    client: c.client_nom,
    contact: c.client_telephone,
    adresse: c.adresse_livraison,
    dateLivraison: c.date_livraison,
    montant: parseFloat(c.total) || 0,
    livreur: c.livreur || '',
    statut: c.statut || 'En attente',
    articles
  };
};

// POST /api/commandes — création d'une commande depuis le panier public
exports.createOrder = async (req, res) => {
  try {
    const { nom, telephone, adresse, dateLivraison, articles, total } = req.body;

    if (!nom || !telephone || !adresse || !Array.isArray(articles) || articles.length === 0) {
      return res.status(400).json({ error: 'Nom, téléphone, adresse et au moins un article sont requis.' });
    }

    // Recalcul du total côté serveur (jamais faire confiance au client)
    const totalCalcule = articles.reduce((somme, item) => {
      const prix = parseFloat(item.prix) || 0;
      const quantite = parseInt(item.quantite, 10) || 1;
      return somme + prix * quantite;
    }, 0);

    const articlesClean = articles.map(item => ({
      id: item.id,
      nom: String(item.nom || '').slice(0, 255),
      prix: parseFloat(item.prix) || 0,
      quantite: parseInt(item.quantite, 10) || 1
    }));

    const [result] = await db.query(
      `INSERT INTO commandes (client_nom, client_telephone, adresse_livraison, date_livraison, articles, total, statut, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'En attente', NOW())`,
      [nom, telephone, adresse, dateLivraison || null, JSON.stringify(articlesClean), totalCalcule]
    );

    // Génération de la référence après insertion (utilise l'ID auto)
    const ref = genererReference(result.insertId);
    await db.query('UPDATE commandes SET ref = ? WHERE id = ?', [ref, result.insertId]);

    res.status(201).json({
      message: 'Commande enregistrée avec succès. Nous vous contacterons bientôt.',
      id: result.insertId,
      ref
    });
  } catch (error) {
    console.error("Erreur lors de la création de la commande :", error);
    res.status(500).json({ error: 'Erreur serveur lors de l\'enregistrement de la commande.' });
  }
};

// GET /api/commandes — liste pour l'admin (AdminCommandes.vue)
exports.getAllOrders = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM commandes ORDER BY created_at DESC');
    res.json(rows.map(formaterCommande));
  } catch (error) {
    console.error("Erreur lors de la récupération des commandes :", error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des commandes.' });
  }
};

// PUT /api/commandes/:id — mise à jour statut / livreur par l'admin
exports.updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { livreur, statut } = req.body;

    const statutsValides = ['En attente', 'En cours', 'Livrée', 'Annulée'];
    if (statut && !statutsValides.includes(statut)) {
      return res.status(400).json({ error: `Statut invalide. Valeurs acceptées : ${statutsValides.join(', ')}` });
    }

    const [existing] = await db.query('SELECT * FROM commandes WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Commande introuvable.' });
    }

    await db.query(
      'UPDATE commandes SET livreur = ?, statut = ? WHERE id = ?',
      [livreur ?? existing[0].livreur ?? '', statut || existing[0].statut, id]
    );

    res.json({ message: 'Commande mise à jour avec succès.' });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la commande :", error);
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour.' });
  }
};
