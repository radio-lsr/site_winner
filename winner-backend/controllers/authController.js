const crypto = require('crypto');
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const TOKEN_EXPIRY = '24h';
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 heure

// Vérification minimale de la robustité du mot de passe
const motDePasseValide = (password) =>
  typeof password === 'string' && password.length >= 8;

// Remarque : l'inscription publique a été supprimée.
// Les comptes utilisateurs sont créés exclusivement par un administrateur
// via userController.createUser (POST /api/user).

// Connexion
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    }

    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    }

    const user = users[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    }

    // Le token contient désormais le rôle, utilisé par requireRole()
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role || 'Utilisateur' },
      process.env.JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    res.json({
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        nom: user.nom,
        email: user.email,
        role: user.role || 'Utilisateur',
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur lors de la connexion.' });
  }
};

// Profil de l'utilisateur connecté (utilisé par le layout admin)
exports.getMe = async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, nom, email, role, avatar FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Utilisateur introuvable.' });
    }
    res.json(users[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération du profil.' });
  }
};

// Déconnexion (le JWT est sans état : le client supprime son token)
exports.logout = async (req, res) => {
  res.json({ message: 'Déconnexion réussie.' });
};

// Demande de réinitialisation du mot de passe
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'L\'email est requis.' });
    }

    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

    // Réponse volontairement identique que le compte existe ou non
    // (évite l'énumération d'utilisateurs)
    const reponseGenerique = {
      message: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.'
    };

    if (users.length === 0) {
      return res.json(reponseGenerique);
    }

    const user = users[0];
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    // Un seul token actif par utilisateur
    await db.query('DELETE FROM password_resets WHERE user_id = ?', [user.id]);
    await db.query(
      'INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, resetToken, expiresAt]
    );

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/admin/login?reset=${resetToken}`;
    console.log(`[RESET PASSWORD] Utilisateur ${user.email} — lien valide 1h : ${resetLink}`);

    // Envoi réel par email si SMTP configuré (SMTP_HOST, SMTP_USER, SMTP_PASS)
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      });
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: user.email,
        subject: 'Réinitialisation de votre mot de passe — WINNER Multiservice',
        text: `Bonjour ${user.nom},\n\nCliquez sur ce lien pour réinitialiser votre mot de passe (valide 1 heure) :\n${resetLink}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez cet email.`,
        html: `<p>Bonjour <strong>${user.nom}</strong>,</p><p>Cliquez sur ce lien pour réinitialiser votre mot de passe (valide 1 heure) :</p><p><a href="${resetLink}">${resetLink}</a></p><p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>`
      });
      return res.json(reponseGenerique);
    }

    // Sans SMTP : en développement on renvoie le token pour pouvoir tester,
    // en production on indique simplement que l'email n'est pas configuré.
    if (process.env.NODE_ENV !== 'production') {
      return res.json({
        ...reponseGenerique,
        resetToken,
        resetLink
      });
    }

    console.warn('[RESET PASSWORD] SMTP non configuré : aucun email envoyé.');
    return res.status(503).json({ error: 'Le service d\'envoi d\'email n\'est pas configuré sur ce serveur.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur lors de la demande de réinitialisation.' });
  }
};

// Réinitialisation effective du mot de passe via le token
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token et nouveau mot de passe requis.' });
    }
    if (!motDePasseValide(newPassword)) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères.' });
    }

    const [rows] = await db.query('SELECT * FROM password_resets WHERE token = ?', [token]);
    if (rows.length === 0) {
      return res.status(400).json({ error: 'Lien de réinitialisation invalide ou expiré.' });
    }

    const reset = rows[0];
    if (new Date(reset.expires_at).getTime() < Date.now()) {
      await db.query('DELETE FROM password_resets WHERE id = ?', [reset.id]);
      return res.status(400).json({ error: 'Lien de réinitialisation invalide ou expiré.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, reset.user_id]);
    await db.query('DELETE FROM password_resets WHERE user_id = ?', [reset.user_id]);

    res.json({ message: 'Mot de passe réinitialisé avec succès. Vous pouvez vous connecter.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur lors de la réinitialisation.' });
  }
};
