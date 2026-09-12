# ============================================================
# WINNER Backend — image Node.js
# Construit une API prête pour la production.
# La base de données (MySQL) et les uploads vivent dans des
# volumes Docker (voir docker-compose.yml à la racine).
# ============================================================
FROM node:22-slim

WORKDIR /app

# Dépendances d'abord (meilleure mise en cache des couches)
COPY package*.json ./
RUN npm ci --omit=dev

# Code applicatif
COPY . .

# Sécurité : si le script d'entrée a été checkouté avec des fins de ligne
# Windows (CRLF), on les retire — sinon "sh" échoue avec "Illegal option -"
RUN sed -i 's/\r$//' docker-entrypoint.sh

# Dossier des uploads (monté en volume nommé par docker-compose)
RUN mkdir -p uploads

ENV NODE_ENV=production
EXPOSE 5000

# Point d'entrée : attend MySQL, crée le schéma, seed l'admin, lance l'API
ENTRYPOINT ["sh", "docker-entrypoint.sh"]
