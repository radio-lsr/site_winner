require('dotenv').config();
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const ADMIN_EMAIL = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const ADMIN_NOM = process.env.ADMIN_NOM || 'Administrateur WINNER';

(async () => {
  try {
    if (!ADMIN_EMAIL || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(ADMIN_EMAIL)) throw new Error('ADMIN_EMAIL absent ou invalide.');
    const knownDemoPasswordHash = '77daf0c7023ab3896105d3642a9ec9da13aca9c0df85193fa3fef92fc2f3ae1c';
    const passwordHash = crypto.createHash('sha256').update(ADMIN_PASSWORD).digest('hex');
    if (ADMIN_PASSWORD.length < 12 || passwordHash === knownDemoPasswordHash) throw new Error('ADMIN_PASSWORD doit avoir au moins 12 caractères et ne peut pas être une valeur de démonstration connue.');
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [ADMIN_EMAIL]);
    if (existing.length) {
      console.log(`ℹ️  Un compte existe déjà pour ${ADMIN_EMAIL} — rien à faire.`);
      process.exit(0);
    }
    const hashed = await bcrypt.hash(ADMIN_PASSWORD, 12);
    await db.query(
      `INSERT INTO users (nom, email, password, role, statut, doitChangerMotDePasse)
       VALUES (?, ?, ?, 'Admin', 'Actif', 0)`,
      [ADMIN_NOM, ADMIN_EMAIL, hashed]
    );
    console.log(`✅ Compte administrateur initial créé (${ADMIN_EMAIL}); aucun mot de passe n'est journalisé.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Initialisation admin impossible :', err.message);
    process.exit(1);
  }
})();
