const db = require('../config/db');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// ==========================================
// PARTIE 1 : GESTION DU PROFIL (Utilisateur connecté)
// ==========================================

// Récupérer les données du profil
exports.getProfile = async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, nom, prenom, email, telephone, role, bio, avatar, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé.' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération du profil.' });
  }
};

// Mettre à jour les informations textuelles du profil
exports.updateProfile = async (req, res) => {
  try {
    const { nom, email, prenom, telephone, bio } = req.body;

    if (!nom || !email) {
      return res.status(400).json({ error: 'Le nom et l\'email sont requis.' });
    }

    const [existing] = await db.query(
      'SELECT * FROM users WHERE email = ? AND id != ?',
      [email, req.user.id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé par un autre compte.' });
    }

    await db.query(
      'UPDATE users SET nom = ?, email = ?, prenom = ?, telephone = ?, bio = ? WHERE id = ?',
      [nom, email, prenom || '', telephone || '', bio || '', req.user.id]
    );

    res.json({ message: 'Profil mis à jour avec succès.', user: { nom, email, prenom, telephone, bio } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour.' });
  }
};

// Changer le mot de passe
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') return res.status(400).json({ error: 'Tous les champs sont requis.' });
    if (newPassword.length < 12) return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 12 caractères.' });
    const [users] = await db.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    if (!users.length || !(await bcrypt.compare(currentPassword, users[0].password))) return res.status(400).json({ error: 'Le mot de passe actuel est incorrect.' });
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await db.query('UPDATE users SET password = ?, token_version = token_version + 1 WHERE id = ?', [hashedPassword, req.user.id]);
    res.json({ message: 'Mot de passe modifié. Reconnectez-vous avec votre nouveau mot de passe.' });
  } catch (error) {
    console.error('[USER] Changement de mot de passe impossible:', error.message);
    res.status(500).json({ error: 'Erreur serveur lors du changement de mot de passe.' });
  }
};

// Résout un chemin d'image stocké en BDD vers un chemin disque absolu.
// Supporte l'ancien format ("public/uploads/x.png") et le nouveau ("/uploads/x.png").
const resoudreCheminUpload = (storedPath) => {
  if (!storedPath) return null;
  const clean = storedPath.replace(/^public\//, '').replace(/^\//, '');
  return path.join(__dirname, '..', clean);
};

// Mettre à jour l'avatar
exports.updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier valide fourni.' });
    }

    // Format unifié : URL servie par Express via /uploads
    const avatarPath = `/uploads/${req.file.filename}`;

    const [users] = await db.query('SELECT avatar FROM users WHERE id = ?', [req.user.id]);
    const oldAvatar = users[0]?.avatar;

    if (oldAvatar) {
      const oldFullPath = resoudreCheminUpload(oldAvatar);
      if (oldFullPath && fs.existsSync(oldFullPath)) {
        fs.unlinkSync(oldFullPath);
      }
    }

    await db.query('UPDATE users SET avatar = ? WHERE id = ?', [avatarPath, req.user.id]);

    res.json({ message: 'Avatar mis à jour avec succès.', avatar: avatarPath });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur lors de l\'enregistrement de l\'avatar.' });
  }
};

// ==========================================
// PARTIE 2 : ADMINISTRATION (CRUD Tableau)
// ==========================================

// Récupérer tous les utilisateurs pour le tableau d'administration
exports.getAllUsers = async (req, res) => {
  try {
    // Le formatage de la date se fait en JS (compatible MySQL et SQLite)
    const query = `
      SELECT id, nom, email, role, statut, avatar AS photo,
             created_at, doitChangerMotDePasse
      FROM users
      ORDER BY created_at DESC
    `;
    const [users] = await db.query(query);

    const formatageDate = (d) => {
      if (!d) return '';
      const date = new Date(d);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    // Convertir 0/1 de la BDD en true/false pour Vue.js
    const formattedUsers = users.map(u => ({
      id: u.id,
      nom: u.nom,
      email: u.email,
      role: u.role,
      statut: u.statut,
      photo: u.photo,
      dateInscription: formatageDate(u.created_at),
      doitChangerMotDePasse: u.doitChangerMotDePasse === 1
    }));

    res.status(200).json(formattedUsers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs.' });
  }
};

// Créer un utilisateur depuis l'interface admin
exports.createUser = async (req, res) => {
  try {
    const { nom, email, role, statut, password, doitChangerMotDePasse } = req.body || {};
    const roles = ['Admin', 'Modérateur'];
    const statuts = ['Actif', 'Inactif'];
    const nomClean = String(nom || '').trim();
    const emailClean = String(email || '').trim().toLowerCase();
    const roleClean = role || 'Modérateur';
    const statutClean = statut || 'Actif';
    if (!nomClean || nomClean.length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailClean)) return res.status(400).json({ message: 'Nom ou adresse email invalide.' });
    if (!roles.includes(roleClean) || !statuts.includes(statutClean)) return res.status(400).json({ message: 'Rôle ou statut invalide.' });
    if (typeof password !== 'string' || password.length < 12) return res.status(400).json({ message: 'Un mot de passe d’au moins 12 caractères est obligatoire.' });
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [emailClean]);
    if (existing.length) return res.status(409).json({ message: 'Cet email est déjà utilisé.' });
    const hashedPassword = await bcrypt.hash(password, 12);
    const avatarPath = req.file ? `/uploads/${req.file.filename}` : null;
    const forceChangePwd = doitChangerMotDePasse === 'true' ? 1 : 0;
    await db.query(
      `INSERT INTO users (nom, email, role, statut, password, doitChangerMotDePasse, avatar, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [nomClean, emailClean, roleClean, statutClean, hashedPassword, forceChangePwd, avatarPath]
    );
    res.status(201).json({ message: 'Utilisateur créé avec succès.' });
  } catch (error) {
    console.error('[USER] Création impossible:', error.message);
    res.status(500).json({ message: 'Erreur lors de la création.' });
  }
};

// Mettre à jour un utilisateur depuis l'interface admin
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, email, role, statut, password, doitChangerMotDePasse } = req.body || {};
    const roles = ['Admin', 'Modérateur'];
    const statuts = ['Actif', 'Inactif'];
    if (!String(nom || '').trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email || '').trim())) return res.status(400).json({ message: 'Nom ou email invalide.' });
    if (!roles.includes(role) || !statuts.includes(statut)) return res.status(400).json({ message: 'Rôle ou statut invalide.' });
    if (password && (typeof password !== 'string' || password.length < 12)) return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 12 caractères.' });
    const [targets] = await db.query('SELECT id, role, statut FROM users WHERE id = ?', [id]);
    if (!targets.length) return res.status(404).json({ message: 'Utilisateur introuvable.' });
    const target = targets[0];
    if (Number(id) === Number(req.user.id) && (role !== target.role || statut !== target.statut)) return res.status(400).json({ message: 'Vous ne pouvez pas modifier votre propre rôle ou statut.' });
    if (target.role === 'Admin' && target.statut === 'Actif' && (role !== 'Admin' || statut !== 'Actif')) {
      const [admins] = await db.query("SELECT COUNT(*) AS total FROM users WHERE role = 'Admin' AND statut = 'Actif'");
      if (Number(admins[0].total) <= 1) return res.status(409).json({ message: 'Impossible de désactiver ou rétrograder le dernier administrateur actif.' });
    }
    const [duplicates] = await db.query('SELECT id FROM users WHERE email = ? AND id != ?', [String(email).trim().toLowerCase(), id]);
    if (duplicates.length) return res.status(409).json({ message: 'Cet email est déjà utilisé.' });
    let query = 'UPDATE users SET nom = ?, email = ?, role = ?, statut = ?, doitChangerMotDePasse = ?, token_version = token_version + 1';
    const params = [String(nom).trim(), String(email).trim().toLowerCase(), role, statut, doitChangerMotDePasse === 'true' ? 1 : 0];
    if (password) { query += ', password = ?'; params.push(await bcrypt.hash(password, 12)); }
    if (req.file) { query += ', avatar = ?'; params.push(`/uploads/${req.file.filename}`); }
    query += ' WHERE id = ?'; params.push(id);
    await db.query(query, params);
    res.status(200).json({ message: 'Utilisateur mis à jour. Sa session précédente a été révoquée.' });
  } catch (error) {
    console.error('[USER] Mise à jour impossible:', error.message);
    res.status(500).json({ message: 'Erreur lors de la mise à jour.' });
  }
};

// Supprimer un utilisateur
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (Number(id) === Number(req.user.id)) return res.status(400).json({ message: 'Vous ne pouvez pas supprimer votre propre compte.' });
    const [targets] = await db.query('SELECT id, role, statut FROM users WHERE id = ?', [id]);
    if (!targets.length) return res.status(404).json({ message: 'Utilisateur introuvable.' });
    if (targets[0].role === 'Admin' && targets[0].statut === 'Actif') {
      const [admins] = await db.query("SELECT COUNT(*) AS total FROM users WHERE role = 'Admin' AND statut = 'Actif'");
      if (Number(admins[0].total) <= 1) return res.status(409).json({ message: 'Impossible de supprimer le dernier administrateur actif.' });
    }
    await db.query('DELETE FROM users WHERE id = ?', [id]);
    res.status(200).json({ message: 'Utilisateur supprimé.' });
  } catch (error) {
    console.error('[USER] Suppression impossible:', error.message);
    res.status(500).json({ message: 'Erreur lors de la suppression.' });
  }
};