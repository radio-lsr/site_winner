/**
 * Initialise la base de données en exécutant database/schema.sql.
 * Cross-platform (fonctionne sous Windows PowerShell, Linux, macOS) —
 * évite la redirection "<" que PowerShell ne supporte pas.
 *
 * Usage : npm run db:init
 * (Nécessite un fichier .env valide avec DB_HOST / DB_USER / DB_PASSWORD)
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

(async () => {
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
    } else {
      console.error('❌ Erreur lors de l\'initialisation :', err.message);
    }
    process.exit(1);
  } finally {
    if (conn) await conn.end().catch(() => {});
  }
})();
