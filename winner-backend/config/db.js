require('dotenv').config();
const path = require('path');

/**
 * Couche d'accès aux données.
 *
 * Deux moteurs supportés, au choix via la variable d'environnement DB_ENGINE :
 *
 *   - (défaut) MySQL/MariaDB via mysql2 — production et développement classique.
 *   - DB_ENGINE=sqlite : base SQLite locale (fichier winner.db) via le module
 *     natif node:sqlite (Node >= 22.13), pratique pour développer sans installer
 *     de serveur MySQL. Aucune dépendance ni compilation requise.
 *
 * Dans les deux cas, le module expose la même interface que mysql2/promise :
 *   const [rows]  = await db.query('SELECT ...', [params]);
 *   const [result] = await db.query('INSERT ...', [params]); // result.insertId
 */

if ((process.env.DB_ENGINE || '').toLowerCase() === 'sqlite') {
  // ------------------------------------------------------------------
  // Moteur SQLite (développement sans serveur MySQL)
  // Utilise le module natif de Node.js (>= 22.13) : aucune dépendance
  // externe ni compilation requise.
  // ------------------------------------------------------------------
  const { DatabaseSync } = require('node:sqlite');
  const fs = require('fs');

  const dbFile = process.env.DB_SQLITE_PATH || path.join(__dirname, '..', 'winner.db');
  const sqlite = new DatabaseSync(dbFile);
  sqlite.exec('PRAGMA journal_mode = WAL;');
  sqlite.exec('PRAGMA foreign_keys = ON;');

  // Si la base est vide, on applique le schéma SQLite automatiquement
  const tableCount = sqlite
    .prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type = 'table' AND name = 'users'")
    .get().n;
  if (!tableCount) {
    const schema = fs.readFileSync(path.join(__dirname, '..', 'database', 'schema.sqlite.sql'), 'utf8');
    sqlite.exec(schema);
    console.log(`[DB] Base SQLite initialisée automatiquement : ${dbFile}`);
  } else {
    console.log(`[DB] Moteur SQLite : ${dbFile}`);
  }

  // Adaptations SQL légères MySQL -> SQLite
  const adapterSQL = (sql) =>
    sql
      .replace(/\bNOW\(\)/gi, 'CURRENT_TIMESTAMP')
      .replace(/\s+/g, ' ')
      .trim();

  // node:sqlite n'accepte pas les objets Date : on les convertit en chaîne
  const adapterParams = (params) =>
    (params || []).map(p => {
      if (p instanceof Date) {
        const pad = n => String(n).padStart(2, '0');
        return `${p.getFullYear()}-${pad(p.getMonth() + 1)}-${pad(p.getDate())} ` +
               `${pad(p.getHours())}:${pad(p.getMinutes())}:${pad(p.getSeconds())}`;
      }
      return p;
    });

  module.exports = {
    async query(sql, params = []) {
      const s = adapterSQL(sql);
      const p = adapterParams(params);

      if (/^(SELECT|PRAGMA|WITH)/i.test(s)) {
        const rows = sqlite.prepare(s).all(...p);
        return [rows, []];
      }

      const info = sqlite.prepare(s).run(...p);
      if (/^INSERT/i.test(s)) {
        return [{ insertId: Number(info.lastInsertRowid), affectedRows: Number(info.changes) }, []];
      }
      return [{ affectedRows: Number(info.changes) }, []];
    }
  };
} else {
  // ------------------------------------------------------------------
  // Moteur MySQL / MariaDB (défaut)
  // ------------------------------------------------------------------
  const mysql = require('mysql2');

  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  module.exports = pool.promise();
}
