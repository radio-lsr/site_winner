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
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Tous les champs sont requis.' });
    }

    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    const user = users[0];

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Le mot de passe actuel est incorrect.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);

    res.json({ message: 'Mot de passe modifié avec succès.' });
  } catch (error) {
    console.error(error);
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
    // On alias (AS) certaines colonnes pour correspondre aux variables de votre Vue.js
    const query = `
      SELECT id, nom, email, role, statut, avatar AS photo, 
             DATE_FORMAT(created_at, '%d %b %Y') AS dateInscription, 
             doitChangerMotDePasse 
      FROM users 
      ORDER BY created_at DESC
    `;
    const [users] = await db.query(query);
    
    // Convertir 0/1 de MySQL en true/false pour Vue.js
    const formattedUsers = users.map(u => ({
      ...u,
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
    const { nom, email, role, statut, password, doitChangerMotDePasse } = req.body;
    
    const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
    }

    const motDePasseFinal = password || 'Temp#2026';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(motDePasseFinal, salt);

    const avatarPath = req.file ? `/uploads/${req.file.filename}` : null;
    const forceChangePwd = doitChangerMotDePasse === 'true' ? 1 : 0;

    const query = `
      INSERT INTO users (nom, email, role, statut, password, doitChangerMotDePasse, avatar, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    
    await db.query(query, [nom, email, role || 'Utilisateur', statut || 'Actif', hashedPassword, forceChangePwd, avatarPath]);

    res.status(201).json({ message: 'Utilisateur créé avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la création.' });
  }
};

// Mettre à jour un utilisateur depuis l'interface admin
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, email, role, statut, password, doitChangerMotDePasse } = req.body;
    const forceChangePwd = doitChangerMotDePasse === 'true' ? 1 : 0;

    let query = 'UPDATE users SET nom = ?, email = ?, role = ?, statut = ?, doitChangerMotDePasse = ?';
    const params = [nom, email, role, statut, forceChangePwd];

    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      query += ', password = ?';
      params.push(hashedPassword);
    }

    if (req.file) {
      const avatarPath = `/uploads/${req.file.filename}`;
      query += ', avatar = ?';
      params.push(avatarPath);
    }

    query += ' WHERE id = ?';
    params.push(id);

    await db.query(query, params);
    res.status(200).json({ message: 'Utilisateur mis à jour avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour.' });
  }
};

// Supprimer un utilisateur
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM users WHERE id = ?', [id]);
    res.status(200).json({ message: 'Utilisateur supprimé.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la suppression.' });
  }
};