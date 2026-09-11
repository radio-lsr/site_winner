/**
 * Initialise la base de données.
 * Cross-platform (Windows PowerShell, Linux, macOS) — évite la redirection
 * "<" que PowerShell ne supporte pas.
 *
 *   - DB_ENGINE=sqlite : crée le fichier winner.db et applique le schéma SQLite
 *     (aucun serveur requis — idéal pour développer sans MySQL).
 *   - sinon            : exécute database/schema.sql sur MySQL/MariaDB.
 *
 * Usage : npm run db:init
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');

(async () => {
  const engine = (process.env.DB_ENGINE || '').toLowerCase();

  if (engine === 'sqlite') {
    try {
      // require de la couche DB : elle crée et initialise winner.db automatiquement
      require('../config/db');
      console.log('✅ Base SQLite prête. Vous pouvez lancer : npm run db:seed');
      process.exit(0);
    } catch (err) {
      console.error('❌ Erreur SQLite :', err.message);
      process.exit(1);
    }
  }

  // --- Moteur par défaut : MySQL / MariaDB ---
  const mysql = require('mysql2/promise');
  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  let conn;
  try {
    conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true
    });

    await conn.query(sql);
    console.log('✅ Base "winner_db" et toutes les tables créées avec succès.');
    process.exit(0);
  } catch (err) {
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('❌ Accès refusé par MySQL : vérifiez DB_USER / DB_PASSWORD dans winner-backend/.env');
    } else if (err.code === 'ECONNREFUSED') {
      console.error('❌ Impossible de se connecter à MySQL : le serveur MySQL est-il démarré ?');
      console.error('   Astuce : pour développer sans MySQL, mettez DB_ENGINE=sqlite dans .env');
      console.error('   puis relancez : npm run db:init');
    } else {
      console.error('❌ Erreur lors de l\'initialisation :', err.message);
    }
    process.exit(1);
  } finally {
    if (conn) await conn.end().catch(() => {});
  }
})();
