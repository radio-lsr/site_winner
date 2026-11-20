# API WINNER Multiservice

## Développement local sous Windows / PowerShell

1. Copiez `.env.example` en `.env`, puis renseignez `JWT_SECRET` avec 64 caractères aléatoires ou plus, `ADMIN_EMAIL` et `ADMIN_PASSWORD` (12 caractères minimum).
2. Avec Node.js 22.18+ :

```powershell
Copy-Item .env.example .env
notepad .env
npm install
npm run db:init
npm run db:seed
npm run dev
```

SQLite est le moteur local par défaut. Il n'exige aucun serveur ou logiciel MySQL. Pour générer un secret JWT :

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

En mode MySQL, configurez un compte applicatif dédié à `winner_db` (`DB_USER` ne doit jamais être `root`) et fournissez `DB_PASSWORD`. L'API échoue au démarrage sans JWT sûr; l'initialisation exige explicitement `ADMIN_EMAIL` et `ADMIN_PASSWORD`.

## Réinitialisation du mot de passe

SMTP valide (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `CONTACT_EMAIL` selon l'usage) requis. En l'absence de SMTP, aucun token n'est créé, retourné ou journalisé. Les tokens de reset stockés dans la base sont hachés SHA-256 et expirent après une heure.

## Principes de sécurité

Routes admin vérifiées côté API; le rôle/statut/version de session sont relus en base à chaque appel authentifié. La session est stockée dans un cookie HttpOnly/SameSite=Strict, et non dans localStorage. Les uploads acceptent uniquement les images JPEG/PNG/WebP et médias MP4/WebM dont extension, MIME et signature correspondent. Les mots de passe sont hachés avec bcrypt; les actions sensibles ont des limites de débit.
