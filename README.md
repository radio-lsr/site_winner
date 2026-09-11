# WINNER Multiservice — Site vitrine + boutique + dashboard admin

Monorepo avec deux applications :

| Dossier | Rôle | Stack |
|---|---|---|
| `winner-backend` | API REST | Node.js / Express 5 / MySQL |
| `winner-frontend` | Site public + back-office admin | Vue 3 / Vite / Vue Router / Axios |

---

## 🚀 Lancer le projet en local

### Prérequis

- **Node.js ≥ 22.18** (vérifier : `node --version`)
- **MySQL 8** ou **MariaDB** installé et démarré
- Git

### 1. Backend (API sur http://localhost:5000)

```bash
cd winner-backend

# Dépendances
npm install

# Configuration
cp .env.example .env
# Éditez .env :
#   DB_PASSWORD  -> votre mot de passe MySQL
#   JWT_SECRET   -> générez-en un fort :
#                   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# Créer la base et toutes les tables (cross-platform, recommandé)
npm run db:init
# Alternative shell (Linux/macOS/cmd uniquement — PAS PowerShell) :
#   mysql -u root -p < database/schema.sql

# Créer le compte administrateur initial
npm run db:seed
#   -> admin@winner.local / Admin@Winner2026 par défaut
#   -> personnalisable : ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run db:seed

# Lancer (rechargement auto avec nodemon)
npm run dev
# ✅ "🚀 Serveur démarré avec succès sur le port 5000"
```

Test rapide : http://localhost:5000/ doit répondre
`{"message":"API WINNER en cours d'exécution..."}`

### 2. Frontend (site sur http://localhost:5173)

Dans un **second terminal** :

```bash
cd winner-frontend

npm install
npm run dev
# ✅ Vite affiche Local: http://localhost:5173/
```

Ouvrez http://localhost:5173 dans votre navigateur.

Par défaut le frontend appelle l'API sur `http://localhost:5000`.
Pour viser une autre API : créez `winner-frontend/.env.local` contenant

```
VITE_API_URL=http://localhost:5050
```

(ou `VITE_API_URL=` vide pour passer par le proxy Vite `/api` → `VITE_PROXY_TARGET`).

### 3. Se connecter au dashboard admin

- URL : http://localhost:5173/admin/login
- Email : `admin@winner.local`
- Mot de passe : `Admin@Winner2026` (celui du seed — à changer en production)

---

## 📌 Parcours de test rapide

1. **Site public** : les produits, services et conseils s'affichent depuis l'API.
2. **Commande** : ajoutez un produit au panier 🛒 → validez → elle apparaît dans
   l'admin, page **Commandes** (statut « En attente », livreur assignable).
3. **Produits** : créez un produit dans l'admin avec image → il apparaît sur le site.
4. **Articles** : créez un article avec image de couverture et passez-le en
   « Publié » → visible dans la section Conseils du site.
5. **Profil** : /admin/profil — changement de nom, avatar, mot de passe.

## 🔧 Scripts utiles

| Commande | Dossier | Effet |
|---|---|---|
| `npm run dev` | backend | API en mode développement (nodemon) |
| `npm start` | backend | API en production |
| `npm run db:init` | backend | Exécute `database/schema.sql` |
| `npm run db:seed` | backend | Crée le compte admin initial |
| `npm run dev` | frontend | Vite dev server (port 5173) |
| `npm run build` | frontend | Build de production dans `dist/` |
| `npm run lint` | frontend | ESLint + oxlint avec auto-fix |

## ⚠️ Problèmes fréquents

- **`ER_ACCESS_DENIED_ERROR`** au démarrage du backend : mauvais `DB_USER`/`DB_PASSWORD` dans `.env`.
- **`Table 'winner_db.users' doesn't exist`** : vous n'avez pas exécuté `schema.sql`.
- **Port 5000 déjà pris** : changez `PORT` dans `winner-backend/.env` puis `VITE_API_URL` côté frontend.
- **Page admin qui boucle sur le login** : vérifiez que vous vous connectez avec un compte au rôle **Admin** (celui du seed).
