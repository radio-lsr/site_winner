const db = require('../config/db');

const genererReference = (id) => {
  const d = new Date();
  const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `CMD-${dateStr}-${String(id).padStart(4, '0')}`;
};
const formaterCommande = (c) => {
  let articles = [];
  try { articles = typeof c.articles === 'string' ? JSON.parse(c.articles) : (c.articles || []); } catch { /* donnée historique invalide */ }
  return { id: c.id, ref: c.ref || genererReference(c.id), date: c.created_at ? new Date(c.created_at).toLocaleDateString('fr-FR') : '', client: c.client_nom, contact: c.client_telephone, adresse: c.adresse_livraison, dateLivraison: c.date_livraison, montant: Number(c.total) || 0, livreur: c.livreur || '', statut: c.statut || 'En attente', articles };
};

exports.createOrder = async (req, res) => {
  try {
    const { nom, telephone, adresse, dateLivraison, articles } = req.body || {};
    const client = { nom: String(nom || '').trim(), telephone: String(telephone || '').trim(), adresse: String(adresse || '').trim() };
    let livraison = null;
    if (dateLivraison) {
      const parsedDate = new Date(`${dateLivraison}T00:00:00Z`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateLivraison)) || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== dateLivraison) {
        return res.status(400).json({ error: 'La date de livraison est invalide.' });
      }
      livraison = String(dateLivraison);
    }
    if (!client.nom || !client.telephone || !client.adresse || !Array.isArray(articles) || !articles.length || articles.length > 50) {
      return res.status(400).json({ error: 'Nom, téléphone, adresse et 1 à 50 articles sont requis.' });
    }
    if (client.nom.length > 150 || client.telephone.length > 50 || client.adresse.length > 500) return res.status(400).json({ error: 'Les coordonnées dépassent la longueur autorisée.' });

    const requested = new Map();
    for (const item of articles) {
      const id = Number(item?.id);
      const quantity = Number(item?.quantite);
      if (!Number.isSafeInteger(id) || id <= 0 || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 100) {
        return res.status(400).json({ error: 'Un produit ou une quantité de la commande est invalide.' });
      }
      requested.set(id, (requested.get(id) || 0) + quantity);
    }
    const ids = [...requested.keys()];
    const placeholders = ids.map(() => '?').join(',');
    const [products] = await db.query(`SELECT id, nom, prix, discount, en_solde, stock, statut FROM produits WHERE id IN (${placeholders})`, ids);
    const productById = new Map(products.map(product => [Number(product.id), product]));
    const safeLines = [];
    let total = 0;
    for (const [id, quantity] of requested) {
      const product = productById.get(id);
      if (!product || String(product.statut).toLowerCase() !== 'actif') return res.status(400).json({ error: 'Un produit de la commande est indisponible.' });
      if (Number(product.stock) < quantity) return res.status(409).json({ error: `Stock insuffisant pour « ${product.nom} ».` });
      const base = Number(product.prix);
      const discount = product.en_solde ? Math.min(100, Math.max(0, Number(product.discount) || 0)) : 0;
      if (!Number.isFinite(base) || base < 0) return res.status(409).json({ error: 'Prix produit invalide en base.' });
      const unitPrice = Math.round(base * (1 - discount / 100) * 100) / 100;
      total += unitPrice * quantity;
      safeLines.push({ id, nom: String(product.nom), prix: unitPrice, quantite: quantity });
    }
    total = Math.round(total * 100) / 100;
    if (!Number.isFinite(total) || total > 99999999.99) return res.status(400).json({ error: 'Le montant total dépasse la limite autorisée.' });

    const [result] = await db.query(
      `INSERT INTO commandes (client_nom, client_telephone, adresse_livraison, date_livraison, articles, total, statut, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'En attente', NOW())`,
      [client.nom, client.telephone, client.adresse, livraison, JSON.stringify(safeLines), total]
    );
    const ref = genererReference(result.insertId);
    await db.query('UPDATE commandes SET ref = ? WHERE id = ?', [ref, result.insertId]);
    res.status(201).json({ message: 'Commande enregistrée avec succès. Nous vous contacterons bientôt.', id: result.insertId, ref });
  } catch (error) {
    console.error('[ORDRE] Création impossible:', error.message);
    res.status(500).json({ error: "Erreur serveur lors de l'enregistrement de la commande." });
  }
};

exports.getAllOrders = async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM commandes ORDER BY created_at DESC');
    res.json(rows.map(formaterCommande));
  } catch (error) {
    console.error('[ORDRE] Lecture impossible:', error.message);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des commandes.' });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { livreur, statut } = req.body || {};
    const statuses = ['En attente', 'En cours', 'Livrée', 'Annulée'];
    if (statut && !statuses.includes(statut)) return res.status(400).json({ error: `Statut invalide : ${statuses.join(', ')}` });
    const [existing] = await db.query('SELECT * FROM commandes WHERE id = ?', [id]);
    if (!existing.length) return res.status(404).json({ error: 'Commande introuvable.' });
    await db.query('UPDATE commandes SET livreur = ?, statut = ? WHERE id = ?', [String(livreur ?? existing[0].livreur ?? '').slice(0, 150), statut || existing[0].statut, id]);
    res.json({ message: 'Commande mise à jour avec succès.' });
  } catch (error) {
    console.error('[ORDRE] Mise à jour impossible:', error.message);
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour.' });
  }
};
