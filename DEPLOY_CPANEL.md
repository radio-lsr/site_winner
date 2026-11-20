# Déployer WINNER Multiservice sur l'hébergement cPanel

Domaine principal : **https://winnermutiservice.com**. Sur un hébergement partagé, ne lancez pas Docker : déployez le frontend comme fichiers statiques dans `public_html` et l'API comme une application Node.js cPanel séparée, idéalement sur `api.winnermutiservice.com`.

> **Vérification indispensable auprès de l'hébergeur :** le forfait doit proposer **Setup Node.js App / Application Manager / Passenger**, avec Node.js **22.18 ou plus récent**, une base MySQL et un accès Terminal/SSH. Si l'offre n'autorise pas une application Node.js persistante, le backend (commandes, administration, uploads, API) ne peut pas fonctionner sur cet hébergement. Dans ce cas, gardez le frontend sur cPanel et hébergez l'API sur un service Node/VPS, ou passez à un VPS. Le frontend seul ne remplace pas l'API.

## 0. Attendre l'intégration dans `main`

Le code produit dans Arena est poussé sur `arena/01a0900a-site-winner`; cette session Arena ne peut pas pousser directement sur `main`. La version à déployer doit être intégrée à `main` via la pull request Arena → `main`. Une fois cette PR fusionnée, c'est toujours `main` qui sert de source de production.

## 1. Préparer le domaine et SSL dans cPanel

Dans cPanel :

1. Vérifiez que `winnermutiservice.com` pointe vers l'hébergement; ajoutez `www` comme alias si vous souhaitez également l'accepter.
2. Créez le sous-domaine **`api.winnermutiservice.com`** dans *Domains / Subdomains*.
3. Dans *SSL/TLS Status* ou *AutoSSL*, lancez AutoSSL et vérifiez que les certificats couvrent le domaine racine, `www` et `api`.
4. Gardez le document root du site public sur `public_html`. Créez pour Node un répertoire applicatif **hors de `public_html`**, par exemple `winner-backend`.

Ne créez pas de `www` si vous ne pouvez pas activer SSL dessus; dans ce cas, retirez `www` des origines CORS et des commandes de certificats et utilisez seulement le domaine racine.

## 2. Créer la base MySQL cPanel

Dans **MySQL Database Wizard** :

1. Créez une base, par exemple `winnerdb`.
2. Créez un nouvel utilisateur MySQL avec un mot de passe aléatoire et fort.
3. Associez cet utilisateur à cette base et donnez-lui les permissions sur **cette base seulement**. Ne donnez jamais à l'application l'utilisateur `root`.
4. Notez les noms **complets avec le préfixe cPanel**, par exemple `compte_winnerdb` et `compte_winnerapp`.

Sur cPanel, `DB_HOST` est généralement `localhost`; confirmez sa valeur dans l'écran de base de données ou auprès de l'hébergeur.

## 3. Créer l'application Node.js pour l'API

Dans **Setup Node.js App** ou **Application Manager** :

1. Créez une application Node.js en mode **Production** avec Node **22.18+**.
2. Application root : un répertoire hors `public_html`, par exemple `winner-backend`.
3. Application URL : le sous-domaine `api.winnermutiservice.com`, chemin `/`.
4. Startup file : `server.js`.
5. Créez les variables d'environnement de l'application dans cPanel (préférable à un fichier `.env`) :

```text
NODE_ENV=production
DB_ENGINE=mysql
DB_HOST=localhost
DB_USER=PREFIXE_CPANEL_UTILISATEUR_MYSQL
DB_PASSWORD=MOT_DE_PASSE_MYSQL
DB_NAME=PREFIXE_CPANEL_BASE_MYSQL
JWT_SECRET=SECRET_ALEATOIRE_96_CARACTERES_HEXADECIMAUX
ADMIN_EMAIL=VOTRE_ADRESSE_ADMIN
ADMIN_PASSWORD=MOT_DE_PASSE_ADMIN_UNIQUE_12_CARACTERES_MINIMUM
FRONTEND_URL=https://winnermutiservice.com
COOKIE_SECURE=true
TRUST_PROXY=1
CORS_ORIGINS=https://winnermutiservice.com,https://www.winnermutiservice.com
```

`TRUST_PROXY=1` convient à une seule couche proxy de confiance; demandez à l'hébergeur le nombre de proxys à déclarer si l'application ne détecte pas le bon protocole ou l'adresse IP. Ne faites pas confiance à un nombre arbitraire de proxys.

Générez le JWT localement dans PowerShell et copiez le résultat directement dans l'interface cPanel :

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Ne mettez aucune vraie valeur dans Git, dans `DEPLOY_CPANEL.md` ou dans la conversation.

## 4. Déployer le backend

Utilisez cPanel **Git Version Control** pour cloner le dépôt après fusion dans `main`, ou téléversez le contenu de `winner-backend` dans le répertoire de l'application. Sélectionnez la branche **`main`** dans cPanel Git; n'utilisez pas la branche temporaire Arena en production.

Dans cPanel Terminal/SSH, depuis le répertoire backend réel :

```bash
cd ~/winner-backend
npm ci --omit=dev
mkdir -p uploads
chmod 750 uploads
npm run db:init
npm run db:seed
```

Le compte MySQL doit pouvoir créer/modifier les tables de sa base pour l'initialisation et les migrations. `db:seed` crée le compte admin la première fois seulement; il ne remplace pas le mot de passe d'un compte existant. Dans Setup Node.js App, cliquez ensuite sur **Restart**.

Si cPanel ne transmet pas ses variables Node au Terminal, définissez aussi temporairement les mêmes variables dans la session shell ou exécutez les commandes depuis le Terminal fourni pour l'application. Ne placez pas de `.env` dans `public_html`. Si vous devez en utiliser un dans le répertoire Node privé, appliquez `chmod 600 .env`.

Vérifiez l'API :

```text
https://api.winnermutiservice.com/
```

Elle doit renvoyer le JSON de statut de l'API. Les fichiers `/uploads/...` seront servis par l'API sur le sous-domaine `api`.

## 5. Construire le frontend sur Windows PowerShell

Sur votre ordinateur, après fusion de la pull request dans `main` :

```powershell
cd D:\site_winner
git fetch origin
git switch main
git pull origin main
cd winner-frontend
npm ci
$env:VITE_API_URL = "https://api.winnermutiservice.com"
npm run build
Remove-Item Env:VITE_API_URL
```

Le build de Vite se trouve dans `winner-frontend\dist`. Le fichier `.htaccess` est un fichier caché : vérifiez qu'il est inclus lors du transfert.

## 6. Publier dans `public_html`

Dans cPanel File Manager ou par SFTP, téléversez **le contenu** de `winner-frontend\dist` vers `public_html` (pas le dossier `dist` lui-même). Remplacez les anciens assets du build précédent, mais ne touchez pas aux fichiers de configuration de l'API ni à la base.

Le `.htaccess` livré avec le build :

- redirige HTTP et `www` vers `https://winnermutiservice.com`;
- renvoie `index.html` pour les routes Vue;
- ajoute `X-Robots-Tag: noindex` aux routes `/admin` et `/login`;
- bloque l'indexation des dossiers.

Si cPanel renvoie une erreur 500 après l'upload, vérifiez les journaux Apache et demandez à l'hébergeur si `mod_rewrite`, `mod_headers` et `mod_setenvif` sont autorisés dans `.htaccess`. Ne retirez pas silencieusement la protection `X-Robots-Tag` pour résoudre l'erreur.

## 7. Vérifier le site et le référencement

Ouvrez :

- `https://winnermutiservice.com/`
- `https://winnermutiservice.com/robots.txt`
- `https://winnermutiservice.com/sitemap.xml`
- `https://api.winnermutiservice.com/`

Le sitemap contient actuellement uniquement la page publique `/`. Il ne faut **pas** ajouter `/admin`, `/login`, les routes privées ou les URL d'API au sitemap.

Dans Google Search Console :

1. Ajoutez une propriété pour `winnermutiservice.com` et validez-la, de préférence par DNS TXT.
2. Soumettez `https://winnermutiservice.com/sitemap.xml`.
3. Vérifiez l'inspection de l'URL de la page publique et de `/admin/login`; cette dernière doit renvoyer `X-Robots-Tag: noindex, nofollow, noarchive`.

`robots.txt` interdit le crawl des routes admin/login et le header `X-Robots-Tag` leur interdit l'indexation si elles sont visitées. Cela n'empêche pas l'API de protéger ces routes : l'authentification backend reste obligatoire. Si une URL admin est déjà dans l'index, utilisez aussi l'outil de suppression temporaire de Search Console pendant que Google recrawl le `noindex`.

## 8. Mises à jour et maintenance

Après qu'une nouvelle version a été fusionnée dans `main` :

1. Dans cPanel Git Version Control, faites **Update from Remote** sur `main`.
2. Pour une mise à jour du backend, exécutez `npm ci --omit=dev` puis **Restart** dans Setup Node.js App.
3. Sur Windows, reconstruisez le frontend avec `VITE_API_URL` ci-dessus, puis téléversez le nouveau contenu de `dist` dans `public_html`.
4. Ne téléversez jamais `.env`, `node_modules`, SQLite `*.db`, ou le contenu privé de l'application Node dans `public_html`.

Configurez des sauvegardes cPanel de la base MySQL et du dossier `uploads` et stockez une copie hors de l'hébergement. Testez la restauration. Si votre forfait ne fournit pas une application Node.js durable, l'API doit être déplacée vers un VPS/service Node; l'hébergement partagé ne peut alors servir que les fichiers frontend statiques.
