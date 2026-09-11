-- ============================================================
-- WINNER Multiservice — Schéma de base de données MySQL
-- Exécution : mysql -u root -p < database/schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS winner_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE winner_db;

-- ------------------------------------------------------------
-- Utilisateurs (admins + employés + comptes classiques)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(150) NOT NULL,
  prenom VARCHAR(150) DEFAULT '',
  email VARCHAR(190) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('Admin', 'Utilisateur') NOT NULL DEFAULT 'Utilisateur',
  statut ENUM('Actif', 'Inactif') NOT NULL DEFAULT 'Actif',
  telephone VARCHAR(50) DEFAULT '',
  bio TEXT,
  avatar VARCHAR(255) DEFAULT NULL,
  doitChangerMotDePasse TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Produits (boutique)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS produits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(200) NOT NULL,
  categorie VARCHAR(100) DEFAULT 'Lubrifiants',
  description TEXT,
  prix DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount INT NOT NULL DEFAULT 0,
  en_solde TINYINT(1) NOT NULL DEFAULT 0,
  stock INT NOT NULL DEFAULT 0,
  statut ENUM('actif', 'inactif') NOT NULL DEFAULT 'actif',
  image_produit VARCHAR(255) DEFAULT NULL,
  user_id INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_produits_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Articles & tutoriels (Conseils)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS articles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titre VARCHAR(255) NOT NULL,
  contenu LONGTEXT,
  type_article ENUM('texte', 'video') NOT NULL DEFAULT 'texte',
  fichier_video VARCHAR(255) DEFAULT NULL,
  image_couverture VARCHAR(255) DEFAULT NULL,
  user_id INT DEFAULT NULL,
  statut ENUM('Brouillon', 'Publié') NOT NULL DEFAULT 'Brouillon',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_articles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Galerie (médiathèque du site)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS galerie (
  id INT AUTO_INCREMENT PRIMARY KEY,
  image VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Services (domaines d'expertise affichés sur le site)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titre VARCHAR(200) NOT NULL,
  description TEXT,
  prix DECIMAL(10,2) DEFAULT NULL,
  statut ENUM('actif', 'inactif') NOT NULL DEFAULT 'actif',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Commandes (passées depuis le panier du site public)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS commandes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ref VARCHAR(50) DEFAULT NULL,
  client_nom VARCHAR(150) NOT NULL,
  client_telephone VARCHAR(50) NOT NULL,
  adresse_livraison TEXT NOT NULL,
  date_livraison DATE DEFAULT NULL,
  articles JSON NOT NULL,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  livreur VARCHAR(150) DEFAULT NULL,
  statut ENUM('En attente', 'En cours', 'Livrée', 'Annulée') NOT NULL DEFAULT 'En attente',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Réinitialisation de mot de passe
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(100) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_resets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_resets_token (token)
) ENGINE=InnoDB;
