#!/bin/sh
# ============================================================
# Point d'entrée du conteneur backend
# ⚠️ Ce fichier DOIT rester en fins de ligne LF (Unix) —
#    garanti par .gitattributes et nettoyé par le Dockerfile.
#
#   1. Attend que MySQL soit prêt (si moteur MySQL)
#   2. Crée la base et les tables (idempotent)
#   3. Crée le compte administrateur (idempotent)
#   4. Démarre l'API
# ============================================================
set -e

if [ "${DB_ENGINE:-}" = "sqlite" ]; then
  echo "[entrypoint] Moteur SQLite : initialisation de la base fichier..."
  node database/init.js
else
  echo "[entrypoint] Attente de MySQL sur ${DB_HOST:-db}..."
  attempt=0
  until node database/init.js; do
    attempt=$((attempt + 1))
    if [ "$attempt" -ge 30 ]; then
      echo "[entrypoint] ❌ Impossible d'initialiser la base après 30 tentatives." >&2
      exit 1
    fi
    echo "[entrypoint] MySQL pas encore prêt, nouvelle tentative dans 2s... ($attempt/30)"
    sleep 2
  done
fi

echo "[entrypoint] Compte administrateur (ignoré s'il existe déjà)..."
node database/seed.js

echo "[entrypoint] 🚀 Démarrage de l'API..."
exec node server.js
