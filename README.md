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
- Une base de données, **au choix** :
  - 🟢 **Option A — SQLite (zéro installation, recommandé pour démarrer)** : rien à installer.
  - 🔵 **Option B — MySQL 8 ou MariaDB** : pour un environnement proche de la production.

### 1. Backend (API sur http://localhost:5000)

#### Option A — SQLite, sans rien installer

```bash
cd winner-backend

npm install

# Configuration
cp .env.example .env
# Le .env.example contient déjà DB_ENGINE=sqlite — rien d'autre à régler.
# (Optionnel : définissez JWT_SECRET, voir plus bas.)

# Créer la base (fichier winner.db) et le compte admin
npm run db:init
npm run db:seed
#   -> admin@winner.local / Admin@Winner2026
#   -> personnalisable : ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run db:seed

npm run dev
# ✅ "🚀 Serveur démarré avec succès sur le port 5000"
```

#### Option B — MySQL / MariaDB

```bash
cd winner-backend

npm install

cp .env.example .env
# Éditez .env :
#   DB_ENGINE    -> laissez vide ou mettez mysql
#   DB_PASSWORD  -> votre mot de passe MySQL
#   JWT_SECRET   -> générez-en un fort :
#                   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# Créer la base et toutes les tables (cross-platform, recommandé)
npm run db:init
# Alternative shell (Linux/macOS/cmd uniquement — PAS PowerShell) :
#   mysql -u root -p < database/schema.sql

npm run db:seed
npm run dev
```

Générer un `JWT_SECRET` fort (recommandé dans tous les cas) :

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
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
| `npm run db:init` | backend | Crée la base (SQLite ou MySQL selon `DB_ENGINE`) |
| `npm run db:seed` | backend | Crée le compte admin initial |
| `npm run dev` | frontend | Vite dev server (port 5173) |
| `npm run build` | frontend | Build de production dans `dist/` |
| `npm run lint` | frontend | ESLint + oxlint avec auto-fix |

## ⚠️ Problèmes fréquents

- **`Impossible de se connecter à MySQL`** : MySQL n'est pas installé/démarré → passez en `DB_ENGINE=sqlite` dans `.env`, ou installez MySQL.
- **`ER_ACCESS_DENIED_ERROR`** au démarrage du backend : mauvais `DB_USER`/`DB_PASSWORD` dans `.env`.
- **`Table 'winner_db.users' doesn't exist`** : vous n'avez pas exécuté `npm run db:init`.
- **Erreur sur `<` dans PowerShell** : PowerShell ne supporte pas cette redirection — utilisez `npm run db:init`.
- **Port 5000 déjà pris** : changez `PORT` dans `winner-backend/.env` puis `VITE_API_URL` côté frontend.
- **Page admin qui boucle sur le login** : vérifiez que vous vous connectez avec un compte au rôle **Admin** (celui du seed).
- **Repartir d'une base SQLite vierge** : supprimez `winner-backend/winner.db` puis relancez `npm run db:init` + `npm run db:seed`.
