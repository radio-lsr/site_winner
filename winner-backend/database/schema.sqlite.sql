-- ============================================================
-- WINNER Multiservice — Schéma SQLite (mode développement sans MySQL)
-- Exécuté automatiquement par : npm run db:init  (avec DB_ENGINE=sqlite)
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nom TEXT NOT NULL,
  prenom TEXT DEFAULT '',
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Utilisateur' CHECK (role IN ('Admin', 'Utilisateur')),
  statut TEXT NOT NULL DEFAULT 'Actif',
  telephone TEXT DEFAULT '',
  bio TEXT,
  avatar TEXT DEFAULT NULL,
  doitChangerMotDePasse INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS produits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nom TEXT NOT NULL,
  categorie TEXT DEFAULT 'Lubrifiants',
  description TEXT,
  prix REAL NOT NULL DEFAULT 0,
  discount INTEGER NOT NULL DEFAULT 0,
  en_solde INTEGER NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  statut TEXT NOT NULL DEFAULT 'actif' CHECK (statut IN ('actif', 'inactif')),
  image_produit TEXT DEFAULT NULL,
  user_id INTEGER DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titre TEXT NOT NULL,
  contenu TEXT,
  type_article TEXT NOT NULL DEFAULT 'texte' CHECK (type_article IN ('texte', 'video')),
  fichier_video TEXT DEFAULT NULL,
  image_couverture TEXT DEFAULT NULL,
  user_id INTEGER DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,
  statut TEXT NOT NULL DEFAULT 'Brouillon' CHECK (statut IN ('Brouillon', 'Publié')),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS galerie (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  image TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titre TEXT NOT NULL,
  description TEXT,
  prix REAL DEFAULT NULL,
  statut TEXT NOT NULL DEFAULT 'actif' CHECK (statut IN ('actif', 'inactif')),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS commandes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ref TEXT DEFAULT NULL,
  client_nom TEXT NOT NULL,
  client_telephone TEXT NOT NULL,
  adresse_livraison TEXT NOT NULL,
  date_livraison TEXT DEFAULT NULL,
  articles TEXT NOT NULL,
  total REAL NOT NULL DEFAULT 0,
  livreur TEXT DEFAULT NULL,
  statut TEXT NOT NULL DEFAULT 'En attente' CHECK (statut IN ('En attente', 'En cours', 'Livrée', 'Annulée')),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nom TEXT NOT NULL,
  email TEXT NOT NULL,
  telephone TEXT DEFAULT '',
  message TEXT NOT NULL,
  lu INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS password_resets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_resets_token ON password_resets (token);
