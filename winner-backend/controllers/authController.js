const crypto = require('crypto');
const db = require('../config/db');
const { enregistrerLog } = require('../services/logger');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const TOKEN_EXPIRY = '8h';
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
const motDePasseValide = (password) => typeof password === 'string' && password.length >= 12;
const echapperHtml = (value) => String(value || '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);

exports.login = async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = req.body?.password;
    if (!email || typeof password !== 'string') return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = users[0];
    if (!user || user.statut !== 'Actif' || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    }
    const role = user.role || 'Modérateur';
    const token = jwt.sign({ id: user.id, email: user.email, role, ver: Number(user.token_version || 0) }, process.env.JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
    res.cookie('winner_session', token, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: 'strict',
      path: '/',
      maxAge: 8 * 60 * 60 * 1000
    });
    await enregistrerLog({
      req,
      user: { id: user.id, nom: user.nom, email: user.email, role },
      action: 'Connexion',
      details: `Connexion réussie (${user.email})`
    });
    res.json({ message: 'Connexion réussie', user: { id: user.id, nom: user.nom, email: user.email, role, avatar: user.avatar } });
  } catch (error) {
    console.error('[AUTH] Échec connexion:', error.message);
    res.status(500).json({ error: 'Erreur serveur lors de la connexion.' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, nom, email, role, avatar FROM users WHERE id = ?', [req.user.id]);
    if (!users.length) return res.status(404).json({ error: 'Utilisateur introuvable.' });
    res.json(users[0]);
  } catch (error) {
    console.error('[AUTH] Profil indisponible:', error.message);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération du profil.' });
  }
};

exports.logout = async (req, res) => {
  try {
    await db.query('UPDATE users SET token_version = token_version + 1 WHERE id = ?', [req.user.id]);
    res.clearCookie('winner_session', { httpOnly: true, secure: process.env.COOKIE_SECURE === 'true', sameSite: 'strict', path: '/' });
    res.json({ message: 'Déconnexion réussie.' });
  } catch (error) {
    console.error('[AUTH] Déconnexion impossible:', error.message);
    res.status(500).json({ error: 'Erreur serveur lors de la déconnexion.' });
  }
};

exports.forgotPassword = async (req, res) => {
  const generic = { message: 'Si un compte existe, des instructions seront envoyées si la messagerie est configurée.' };
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ error: "L'email est requis." });
    const [users] = await db.query('SELECT id, nom, email FROM users WHERE email = ?', [email]);
    if (!users.length) return res.json(generic);

    // Ne jamais produire de lien de réinitialisation quand le courriel n'est pas configuré.
    if (!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)) {
      console.warn('[RESET PASSWORD] SMTP absent; demande ignorée (aucun lien créé).');
      return res.json(generic);
    }
    const user = users[0];
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await db.query('DELETE FROM password_resets WHERE user_id = ?', [user.id]);
    await db.query('INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)', [user.id, tokenHash, expiresAt]);

    const frontendUrl = process.env.FRONTEND_URL;
    if (!frontendUrl) throw new Error('FRONTEND_URL doit être configurée pour les liens de réinitialisation.');
    const resetLink = `${frontendUrl.replace(/\/+$/, '')}/admin/login#reset=${encodeURIComponent(token)}`;
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
    const safeName = echapperHtml(user.nom);
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: user.email,
      subject: 'Réinitialisation de votre mot de passe — WINNER Multiservice',
      text: `Bonjour ${user.nom},\n\nLien valide 1 heure :\n${resetLink}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez cet email.`,
      html: `<p>Bonjour <strong>${safeName}</strong>,</p><p>Ce lien est valide une heure :</p><p><a href="${resetLink}">Réinitialiser mon mot de passe</a></p><p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>`
    });
    return res.json(generic);
  } catch (error) {
    console.error('[RESET PASSWORD] Envoi impossible:', error.message);
    return res.json(generic);
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body || {};
    if (!token || !newPassword) return res.status(400).json({ error: 'Token et nouveau mot de passe requis.' });
    if (!motDePasseValide(newPassword)) return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 12 caractères.' });
    const tokenHash = crypto.createHash('sha256').update(String(token)).digest('hex');
    const [rows] = await db.query('SELECT * FROM password_resets WHERE token = ?', [tokenHash]);
    if (!rows.length) return res.status(400).json({ error: 'Lien de réinitialisation invalide ou expiré.' });
    const reset = rows[0];
    if (new Date(reset.expires_at).getTime() < Date.now()) {
      await db.query('DELETE FROM password_resets WHERE id = ?', [reset.id]);
      return res.status(400).json({ error: 'Lien de réinitialisation invalide ou expiré.' });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await db.query('UPDATE users SET password = ?, token_version = token_version + 1 WHERE id = ?', [hashedPassword, reset.user_id]);
    await db.query('DELETE FROM password_resets WHERE user_id = ?', [reset.user_id]);
    res.json({ message: 'Mot de passe réinitialisé avec succès. Vous pouvez vous connecter.' });
  } catch (error) {
    console.error('[RESET PASSWORD] Échec:', error.message);
    res.status(500).json({ error: 'Erreur serveur lors de la réinitialisation.' });
  }
};
