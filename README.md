# WINNER Multiservice — site, boutique et administration

Monorepo : API Express 5 (`winner-backend`) et application Vue 3 (`winner-frontend`). Le site est prévu pour être lancé localement sous Windows/PowerShell, ou entièrement dans Docker.

**Devise :** les prix affichés et saisis dans l'administration sont en francs congolais, avec le code `CDF` après le montant. Les montants enregistrés en base sont des CDF; l'application n'applique aucune conversion automatique. Le formatage est centralisé dans `winner-frontend/src/services/currency.js`.

**Commandes :** les produits affichés par défaut si l'API est vide sont de simples exemples d'affichage. Le backend valide chaque article d'une commande contre la table `produits` (statut actif et stock suffisant) : ajoutez vos produits dans `/admin/produits` avant de tester une commande, sinon l'API répond « Un produit de la commande est indisponible ».

## 🐳 Lancement Docker (recommandé)

Prérequis : Docker Desktop démarré. Au premier lancement, créez des secrets propres à votre installation :

```powershell
cd D:\karl\site_winner
Copy-Item .env.example .env
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
notepad .env
```

Dans `.env`, remplissez `MYSQL_ROOT_PASSWORD`, `MYSQL_PASSWORD`, `JWT_SECRET`, `ADMIN_EMAIL` et `ADMIN_PASSWORD` avec des valeurs uniques. Pour `MYSQL_PASSWORD` et `JWT_SECRET`, générez des secrets hexadécimaux indépendants : `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` puis `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`. Le mot de passe admin doit faire au moins 12 caractères. Ne copiez pas de secret de cet exemple ou de l'historique Git. Pour une installation publique, remplacez aussi `CORS_ORIGINS` par l'origine exacte du site et réglez `COOKIE_SECURE=true` derrière HTTPS. Enregistrez le fichier, puis :

```powershell
docker compose up -d --build
docker compose ps
```

Site : http://localhost:8080 — administration : http://localhost:8080/admin/login.

L'application utilise un compte MySQL dédié `winner_app` limité à la base `winner_db`; elle ne se connecte pas en root. Les conteneurs backend et frontend tournent sans privilèges root. Les données sont conservées dans des volumes Docker.

Commandes utiles :

```powershell
docker compose logs -f backend
docker compose down
```

`docker compose down -v` supprime définitivement la base et les uploads. Ne l'utilisez que si vous souhaitez effacer les données.

**Base Docker existante :** les variables `MYSQL_USER` ne créent l'utilisateur applicatif que lors de l'initialisation d'un volume MySQL neuf. Sauvegardez d'abord la base. Pour un volume existant, démarrez provisoirement MySQL avec l'ancien `MYSQL_ROOT_PASSWORD` afin de garder le healthcheck valide, puis créez/renouvelez le compte applicatif depuis le client MySQL :

```powershell
docker compose exec db mysql -uroot -p
```

Dans le client MySQL, créez `winner_app` avec le mot de passe défini dans `MYSQL_PASSWORD`, puis accordez-lui seulement les droits sur `winner_db` : `CREATE USER IF NOT EXISTS 'winner_app'@'%' IDENTIFIED BY 'MOT_DE_PASSE_MYSQL_PASSWORD'; ALTER USER 'winner_app'@'%' IDENTIFIED BY 'MOT_DE_PASSE_MYSQL_PASSWORD'; GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES ON winner_db.* TO 'winner_app'@'%'; FLUSH PRIVILEGES;`. Pour faire tourner aussi le mot de passe root compromis, exécutez `ALTER USER 'root'@'localhost' IDENTIFIED BY 'NOUVEAU_MYSQL_ROOT_PASSWORD';`, mettez la même nouvelle valeur dans `.env`, puis redémarrez les services. Utilisez des secrets hexadécimaux générés aléatoirement pour éviter les problèmes de guillemets SQL.

Les anciennes valeurs root/JWT/admin ont été publiées et doivent être considérées compromises : changez-les. Modifier `.env` seul ne fait pas tourner le mot de passe d'un serveur MySQL déjà initialisé. Réglez `COOKIE_SECURE=true` derrière un HTTPS public; laissez `false` uniquement pour HTTP local.

## 🧪 Développement local (sans MySQL)

Prérequis : Node.js 22.18 ou plus récent. SQLite est inclus via le module natif `node:sqlite` : aucun serveur MySQL à installer.

1. Copiez `winner-backend/.env.example` vers `winner-backend/.env` et définissez un `JWT_SECRET` aléatoire d'au moins 64 caractères, `ADMIN_EMAIL` et un `ADMIN_PASSWORD` unique d'au moins 12 caractères.
2. Dans PowerShell :

```powershell
cd D:\karl\site_winner\winner-backend
Copy-Item .env.example .env
notepad .env
npm install
npm run db:init
npm run db:seed
npm run dev
```

3. Dans un second terminal :

```powershell
cd D:\karl\site_winner\winner-frontend
npm install
npm run dev
```

Site de développement : http://localhost:5173. Les origines locales autorisées sont listées dans le `.env.example` du backend; les appels passent normalement par le proxy Vite.

Pour générer un secret sûr :

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

La réinitialisation du mot de passe est volontairement désactivée si SMTP n'est pas configuré : aucun token de secours n'est renvoyé par l'API ni inscrit dans les logs. Renseignez les paramètres SMTP dans `.env` pour activer l'envoi par email.

## 🔐 Sécurité et exploitation

- Les comptes sont créés uniquement par un administrateur; mots de passe bcrypt (12 tours), minimum 12 caractères pour les changements/créations.
- Les sessions sont des JWT dans un cookie `HttpOnly`, `SameSite=Strict` (pas dans `localStorage`); les routes privées relisent rôle, statut et version de session en base. Désactivation, rétrogradation, déconnexion ou changement de mot de passe révoque les anciennes sessions.
- Les commandes utilisent les prix, promotions, statut et stock de la base, jamais les prix fournis par le navigateur.
- Rate limiting sur connexion, réinitialisation, contact, commandes, avis et commentaires.
- Les uploads sont limités à des formats image/vidéo autorisés, contrôlés par extension, MIME et signature de contenu, avec noms aléatoires et tailles maximales. SVG/HTML sont refusés.
- CORS est fermé par défaut; configurez `CORS_ORIGINS` uniquement pour les origines API externes réellement nécessaires. Le frontend Docker utilise le proxy same-origin.
- Nginx envoie CSP et en-têtes de sécurité. Pour une exposition publique, terminez TLS sur un reverse proxy avec certificat valide et activez HSTS sur ce proxy. Le conteneur fourni sert HTTP local sur le port 8080.
- Les secrets présents dans les anciens commits Git restent compromis tant que l'historique partagé n'a pas été purgé. Les mots de passe/JWT historiques doivent être révoqués immédiatement; la purge de l'historique GitHub exige une opération coordonnée par le propriétaire du dépôt et peut casser les clones existants.

## 🌐 Déploiement sur cPanel / hébergement partagé

Pour le domaine `winnermutiservice.com`, suivez [`DEPLOY_CPANEL.md`](DEPLOY_CPANEL.md). Le déploiement de production se fait depuis `main` après fusion de la pull request. cPanel doit proposer une application Node.js persistante (Node 22.18+) pour héberger l'API; Docker n'est généralement pas disponible sur un hébergement partagé.

Les étapes de déploiement sur VPS Ubuntu avec Docker sont disponibles séparément dans [`DEPLOY_VPS.md`](DEPLOY_VPS.md).

## Dépendances / contrôles

```powershell
cd D:\karl\site_winner\winner-backend
npm audit
cd ..\winner-frontend
npm audit
npm run build
```
