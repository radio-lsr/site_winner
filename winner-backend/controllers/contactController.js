const db = require('../config/db');

// ============================================================
// Formulaire de contact public (POST /api/contact)
// ============================================================
exports.createMessage = async (req, res) => {
  try {
    const { nom, email, telephone, message } = req.body || {};

    if (!nom || !email || !message) {
      return res.status(400).json({ error: 'Le nom, l\'email et le message sont obligatoires.' });
    }

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$$/.test(String(email).trim());
    if (!emailOk) {
      return res.status(400).json({ error: 'Adresse email invalide.' });
    }

    // Nettoyage + limites de longueur (miroir des colonnes BDD)
    const clean = {
      nom: String(nom).trim().slice(0, 150),
      email: String(email).trim().slice(0, 190),
      telephone: String(telephone || '').trim().slice(0, 50),
      message: String(message).trim().slice(0, 5000)
    };

    if (clean.message.length < 2) {
      return res.status(400).json({ error: 'Le message est trop court.' });
    }

    await db.query(
      'INSERT INTO messages (nom, email, telephone, message, lu) VALUES (?, ?, ?, ?, 0)',
      [clean.nom, clean.email, clean.telephone, clean.message]
    );

    // Notification par email si SMTP configuré (ne bloque jamais le visiteur)
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587', 10),
          secure: process.env.SMTP_SECURE === 'true',
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        });
        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: process.env.CONTACT_EMAIL || 'mavinga1@gmail.com',
          subject: `📩 Nouveau message de ${clean.nom} (site WINNER)`,
          text: `Nom : ${clean.nom}\nEmail : ${clean.email}\nTéléphone : ${clean.telephone || 'non renseigné'}\n\nMessage :\n${clean.message}`,
          replyTo: clean.email
        });
      } catch (err) {
        console.error('[CONTACT] Échec de la notification email (message enregistré quand même) :', err.message);
      }
    }

    res.status(201).json({ message: 'Merci ! Votre message a bien été envoyé. Nous vous répondrons rapidement.' });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement du message :', error);
    res.status(500).json({ error: 'Erreur serveur : votre message n\'a pas pu être enregistré. Réessayez plus tard.' });
  }
};

// ============================================================
// Administration des messages reçus
// ============================================================
exports.getAllMessages = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM messages ORDER BY created_at DESC');
    res.json(rows.map(m => ({
      id: m.id,
      nom: m.nom,
      email: m.email,
      telephone: m.telephone || '',
      message: m.message,
      lu: (m.lu === 1 || m.lu === true),
      date: m.created_at
    })));
  } catch (error) {
    console.error('Erreur lors de la récupération des messages :', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des messages.' });
  }
};

// PUT /api/messages/:id — marquer lu / non lu
exports.toggleRead = async (req, res) => {
  try {
    const { id } = req.params;
    const { lu } = req.body;

    const [existing] = await db.query('SELECT * FROM messages WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Message introuvable.' });
    }

    await db.query('UPDATE messages SET lu = ? WHERE id = ?', [lu ? 1 : 0, id]);
    res.json({ message: 'Message mis à jour.' });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du message :', error);
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour.' });
  }
};

// DELETE /api/messages/:id
exports.deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query('DELETE FROM messages WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Message introuvable.' });
    }
    res.json({ message: 'Message supprimé.' });
  } catch (error) {
    console.error('Erreur lors de la suppression du message :', error);
    res.status(500).json({ error: 'Erreur serveur lors de la suppression.' });
  }
};
