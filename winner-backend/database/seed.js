/**
 * Crée le compte administrateur initial.
 *
 * Usage :
 *   node database/seed.js
 *   ADMIN_EMAIL=admin@winner.cd ADMIN_PASSWORD='MotDePasseFort!' node database/seed.js
 */
require('dotenv').config();
const db = require('../config/db');
const bcrypt = require('bcryptjs');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@winner.local';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@Winner2026';
const ADMIN_NOM = process.env.ADMIN_NOM || 'Administrateur WINNER';

(async () => {
  try {
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [ADMIN_EMAIL]);
    if (existing.length > 0) {
      console.log(`ℹ️  Un compte existe déjà pour ${ADMIN_EMAIL} — rien à faire.`);
      process.exit(0);
    }

    if (ADMIN_PASSWORD.length < 8) {
      console.error('❌ Le mot de passe admin doit contenir au moins 8 caractères.');
      process.exit(1);
    }

    const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await db.query(
      `INSERT INTO users (nom, email, password, role, statut, doitChangerMotDePasse)
       VALUES (?, ?, ?, 'Admin', 'Actif', 0)`,
      [ADMIN_NOM, ADMIN_EMAIL, hashed]
    );

    console.log('✅ Compte administrateur créé :');
    console.log(`   Email    : ${ADMIN_EMAIL}`);
    console.log(`   Password : ${ADMIN_PASSWORD}`);
    if (!process.env.ADMIN_PASSWORD) {
      console.log('⚠️  Mot de passe par défaut utilisé — changez-le rapidement (ou relancez avec ADMIN_PASSWORD=...).');
    }
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur lors du seed :', err.message);
    console.error('   Avez-vous exécuté `mysql -u root -p < database/schema.sql` avant ?');
    process.exit(1);
  }
})();
