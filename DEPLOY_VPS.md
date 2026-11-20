# Déployer WINNER Multiservice sur un VPS Ubuntu 24.04

Ce guide met en place Docker Compose derrière Nginx du système et Certbot. Le port du frontend Docker est lié à `127.0.0.1:8080` uniquement : l'accès public passe par HTTPS sur 443. Les commandes ci-dessous sont à exécuter sur le VPS, sauf les changements DNS faits chez le fournisseur du domaine.

Remplacez `example.com` et `www.example.com` par votre domaine réel. Le dépôt doit être accessible au serveur. S'il est privé, utilisez une clé SSH de déploiement en lecture seule; ne mettez jamais un mot de passe GitHub ni un token dans une commande ou dans `.env`.

## 1. DNS et pare-feu du fournisseur

Chez le fournisseur DNS, créez les enregistrements A :

- `@` → adresse IPv4 publique du VPS
- `www` → même adresse (ou CNAME vers `@`)

Ne créez un enregistrement AAAA que si le VPS dispose d'une IPv6 publique configurée. Dans le panneau réseau du fournisseur, autorisez les ports TCP **22**, **80** et **443**; n'exposez pas 5000, 8080 ni 3306.

## 2. Installer Docker Engine + Compose

Connectez-vous en SSH avec un compte sudo :

```bash
ssh UTILISATEUR@IP_DU_VPS
sudo apt-get update
sudo apt-get install -y ca-certificates curl git nginx certbot python3-certbot-nginx
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
docker --version
sudo docker compose version
```

Activez UFW uniquement après avoir autorisé SSH :

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

Le pare-feu réseau du fournisseur doit également laisser passer 22/80/443.

## 3. Récupérer la branche et créer les secrets

```bash
sudo git clone --branch arena/01a0900a-site-winner --single-branch https://github.com/radio-lsr/site_winner.git /opt/site_winner
cd /opt/site_winner
sudo cp .env.example .env
sudo chmod 600 .env
```

Si le dépôt est privé, configurez plutôt une clé SSH de déploiement en lecture seule sur GitHub, puis clonez avec l'URL SSH. N'inscrivez jamais de credentials dans l'URL.

Générez **trois valeurs indépendantes**. Gardez les sorties dans un gestionnaire de mots de passe et ne les publiez pas :

```bash
openssl rand -hex 32   # MYSQL_ROOT_PASSWORD
openssl rand -hex 32   # MYSQL_PASSWORD, compte applicatif limité à winner_db
openssl rand -hex 48   # JWT_SECRET
```

Ouvrez le fichier de configuration :

```bash
sudo nano .env
```

Renseignez au minimum :

```dotenv
MYSQL_ROOT_PASSWORD=COLLER_LE_PREMIER_SECRET
MYSQL_PASSWORD=COLLER_LE_DEUXIEME_SECRET_HEXADECIMAL
JWT_SECRET=COLLER_LE_TROISIEME_SECRET
ADMIN_EMAIL=adresse-admin-que-vous-controlez
ADMIN_PASSWORD=choisir-un-mot-de-passe-unique-d-au-moins-12-caracteres
FRONTEND_URL=https://example.com
COOKIE_SECURE=true
TRUST_PROXY=2
CORS_ORIGINS=https://example.com,https://www.example.com
```

Les valeurs d'exemple ci-dessus sont des **noms de variables / placeholders**, pas des mots de passe. Gardez `MYSQL_PASSWORD` hexadécimal (sortie de `openssl rand -hex 32`). `ADMIN_PASSWORD` sert à créer le premier compte seulement; le seed ne remplace pas le mot de passe d'un compte déjà présent. Configurez aussi les variables SMTP si vous voulez recevoir les messages par email et autoriser la réinitialisation de mot de passe par courriel.

## 4. Démarrer la pile

```bash
cd /opt/site_winner
sudo docker compose up -d --build
sudo docker compose ps
sudo docker compose logs --tail=100 backend
```

Le premier démarrage initialise MySQL, crée le compte applicatif restreint, les tables et le compte admin. Le port 8080 est privé au VPS et doit répondre localement :

```bash
curl -I http://127.0.0.1:8080
```

Ne publiez jamais les ports MySQL ou backend. N'exécutez pas `docker compose down -v` : cela détruit les volumes de données.

## 5. Configurer le reverse proxy Nginx

Créez un hôte Nginx. Remplacez les deux noms de domaine dans la configuration :

```bash
sudo tee /etc/nginx/sites-available/winner > /dev/null <<'NGINX'
server {
    listen 80;
    listen [::]:80;
    server_name example.com www.example.com;
    client_max_body_size 101m;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_read_timeout 180s;
    }
}
NGINX
sudo ln -s /etc/nginx/sites-available/winner /etc/nginx/sites-enabled/winner
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

## 6. Activer HTTPS avec Let's Encrypt

Vérifiez d'abord que les deux DNS pointent sur le VPS et que HTTP est accessible, puis demandez le certificat :

```bash
sudo certbot --nginx -d example.com -d www.example.com
sudo certbot renew --dry-run
```

Choisissez la redirection HTTP → HTTPS si Certbot la propose. Vérifiez ensuite `https://example.com` et `https://www.example.com`. Ajoutez HSTS uniquement au bloc Nginx HTTPS après confirmation que le site fonctionne en HTTPS :

```nginx
add_header Strict-Transport-Security "max-age=31536000" always;
```

N'ajoutez `includeSubDomains` que lorsque tous les sous-domaines sont eux aussi en HTTPS.

## 7. Connexion et mise à jour

Connectez-vous sur `https://example.com/admin/login` avec l'adresse définie par `ADMIN_EMAIL`. Sur une nouvelle base, utilisez le mot de passe choisi dans `.env`, puis changez-le depuis le profil admin. Après le premier déploiement, ne gardez pas de mot de passe initial réutilisé ailleurs.

Pour publier une nouvelle version :

```bash
cd /opt/site_winner
sudo git pull origin arena/01a0900a-site-winner
sudo docker compose up -d --build
sudo docker compose ps
sudo docker compose logs --tail=100 backend
```

Pour consulter les logs en continu : `sudo docker compose logs -f backend`. Le renouvellement Certbot est géré par son timer système; contrôlez-le avec `systemctl list-timers | grep certbot`.

## 8. Sauvegarde minimale

Sauvegardez régulièrement la base et le volume `uploads_data` hors du VPS, avec un stockage chiffré et des rétentions. Une copie locale sur le même serveur ne suffit pas. Testez également la restauration avant de compter sur ces sauvegardes.
