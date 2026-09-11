# ============================================================
# WINNER Frontend — build Vue 3 puis serveur nginx
# nginx sert le SPA et relaie /api et /uploads au backend
# (service "backend" du docker-compose.yml).
# ============================================================

# --- Étape 1 : build de production ---
FROM node:22-slim AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# URL de l'API : vide = URLs relatives /api (relayées par nginx vers le backend)
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# --- Étape 2 : serveur nginx ---
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
