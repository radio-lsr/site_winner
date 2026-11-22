const db = require('../config/db');

const genererReference = (id, modeRetrait = 'Livraison') => {
  const d = new Date();
  const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const prefix = modeRetrait === 'Réservation' ? 'RES' : 'CMD';
  return `${prefix}-${dateStr}-${String(id).padStart(4, '0')}`;
};
const formaterCommande = (c) => {
  let articles = [];
  try { articles = typeof c.articles === 'string' ? JSON.parse(c.articles) : (c.articles || []); } catch { /* donnée historique invalide */ }
  return { id: c.id, ref: c.ref || genererReference(c.id, c.mode_retrait), date: c.created_at ? new Date(c.created_at).toLocaleDateString('fr-FR') : '', client: c.client_nom, contact: c.client_telephone, email: c.client_email || '', modeRetrait: c.mode_retrait || 'Livraison', adresse: c.adresse_livraison, dateLivraison: c.date_livraison, montant: Number(c.total) || 0, livreur: c.livreur || '', statut: c.statut || 'En attente', articles };
};

exports.createOrder = async (req, res) => {
  try {
    const { nom, telephone, email, modeRetrait, adresse, dateLivraison, articles } = req.body || {};
    const mode = modeRetrait === 'Réservation' ? 'Réservation' : 'Livraison';
    const client = {
      nom: String(nom || '').trim(),
      telephone: String(telephone || '').trim(),
      email: String(email || '').trim().toLowerCase(),
      adresse: mode === 'Réservation' ? (String(adresse || '').trim() || 'Retrait en boutique') : String(adresse || '').trim()
    };
    let livraison = null;
    if (dateLivraison) {
      const parsedDate = new Date(`${dateLivraison}T00:00:00Z`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateLivraison)) || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== dateLivraison) {
        return res.status(400).json({ error: 'La date de livraison est invalide.' });
      }
      livraison = String(dateLivraison);
    }
    if (!client.nom || !client.telephone || !client.email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(client.email) || (mode === 'Livraison' && !client.adresse) || !Array.isArray(articles) || !articles.length || articles.length > 50) {
      return res.status(400).json({ error: 'Nom, téléphone, email valide, adresse (pour livraison) et 1 à 50 articles sont requis.' });
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
      const codeProduit = `PRD-${String(id).padStart(4, '0')}`;
      safeLines.push({ id, codeProduit, nom: String(product.nom), prix: unitPrice, quantite: quantity });
    }
    total = Math.round(total * 100) / 100;
    if (!Number.isFinite(total) || total > 99999999.99) return res.status(400).json({ error: 'Le montant total dépasse la limite autorisée.' });

    const [result] = await db.query(
      `INSERT INTO commandes (client_nom, client_telephone, client_email, mode_retrait, adresse_livraison, date_livraison, articles, total, statut, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'En attente', NOW())`,
      [client.nom, client.telephone, client.email, mode, client.adresse, livraison, JSON.stringify(safeLines), total]
    );
    const ref = genererReference(result.insertId, mode);
    await db.query('UPDATE commandes SET ref = ? WHERE id = ?', [ref, result.insertId]);

    // Envoi du code commande / réservation par email si SMTP est configuré
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587', 10),
          secure: process.env.SMTP_SECURE === 'true',
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        });
        const labelCode = mode === 'Réservation' ? 'Code de réservation' : 'Code de commande';
        const lignesHtml = safeLines
          .map(l => `<li><strong>[${l.codeProduit}]</strong> ${l.nom} × ${l.quantite} — ${(l.prix * l.quantite).toLocaleString('fr-FR')} CDF</li>`)
          .join('');
        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: client.email,
          subject: `${labelCode} ${ref} — WINNER Multiservice`,
          text: `Bonjour ${client.nom},\n\nVotre ${mode.toLowerCase()} a bien été enregistrée.\n${labelCode} : ${ref}\nTotal : ${total.toLocaleString('fr-FR')} CDF\n\nMerci pour votre confiance,\nWINNER Multiservice`,
          html: `<p>Bonjour <strong>${client.nom}</strong>,</p><p>Votre <strong>${mode.toLowerCase()}</strong> a bien été enregistrée.</p><p><strong>${labelCode} :</strong> <span style="font-size:18px;color:#1e3a8a;">${ref}</span></p><ul>${lignesHtml}</ul><p><strong>Total :</strong> ${total.toLocaleString('fr-FR')} CDF</p><p>Merci pour votre confiance,<br>WINNER Multiservice</p>`
        });
      } catch (mailErr) {
        console.warn('[ORDRE] Email non envoyé:', mailErr.message);
      }
    }

    res.status(201).json({
      message: mode === 'Réservation'
        ? `Réservation enregistrée (${ref}). Votre code a été envoyé à ${client.email}.`
        : `Commande enregistrée (${ref}). Votre code a été envoyé à ${client.email}.`,
      id: result.insertId,
      ref,
      modeRetrait: mode
    });
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
