# WINNER Backend — API Node.js / Express / MySQL

API du site **WINNER Multiservice** (site vitrine + boutique + dashboard admin).

## Installation

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer l'environnement
cp .env.example .env
#    → éditez .env (MySQL, secret JWT, compte admin)

# 3. Créer la base et les tables
mysql -u root -p < database/schema.sql     # ou : npm run db:init

# 4. Créer le compte administrateur initial
npm run db:seed
#    Email / mot de passe par défaut : admin@winner.local / Admin@Winner2026
#    (personnalisables via ADMIN_EMAIL / ADMIN_PASSWORD dans .env)

# 5. Lancer le serveur
npm run dev        # développement (nodemon)
npm start          # production
```

## Endpoints principaux

| Méthode | Route | Accès | Description |
|---|---|---|---|
| POST | `/api/auth/register` | public | Inscription (rôle Utilisateur) |
| POST | `/api/auth/login` | public | Connexion → token JWT (24 h) |
| GET | `/api/auth/me` | connecté | Profil de l'utilisateur connecté |
| POST | `/api/auth/logout` | public | Déconnexion (le client supprime son token) |
| POST | `/api/auth/forgot-password` | public | Demande de réinitialisation |
| POST | `/api/auth/reset-password` | public | Réinitialisation via token |
| GET | `/api/dashboard/stats` | Admin | Statistiques du tableau de bord |
| GET | `/api/produits` | public* | *visiteurs : produits actifs uniquement |
| POST/PUT/DELETE | `/api/produits...` | Admin | CRUD produits |
| GET | `/api/articles` | public* | *visiteurs : articles « Publié » uniquement |
| POST/PUT/DELETE | `/api/articles...` | Admin | CRUD articles & tutoriels |
| GET | `/api/galerie` | public | Médiathèque |
| POST/DELETE | `/api/galerie...` | Admin | Upload (10 fichiers max) / suppression |
| GET | `/api/services` | public | Domaines d'expertise |
| POST/DELETE | `/api/services...` | Admin | CRUD services |
| POST | `/api/commandes` | public | Passage de commande depuis le panier |
| GET/PUT | `/api/commandes...` | Admin | Suivi / mise à jour des commandes |
| GET/PUT | `/api/user/profile`, `/password`, `/avatar` | connecté | Profil personnel |
| GET/POST/PUT/DELETE | `/api/user...` | Admin | Gestion des utilisateurs |

Les fichiers uploadés sont servis sur `/uploads/...`.

## Sécurité

- Les mots de passe sont hachés avec bcrypt.
- Les routes d'administration exigent un token JWT **avec le rôle `Admin`**
  (un simple utilisateur reçoit 403).
- `.env` n'est plus versionné : ne commitez jamais de secrets.
