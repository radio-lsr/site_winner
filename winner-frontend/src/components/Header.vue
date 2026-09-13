<template>
  <header>
      <a href="#accueil" class="logo">
          <img src="/Logo-Winner.png" alt="Logo Winner Multiservice" onerror="this.style.display='none'">
          <h1>WINNER <span>Multiservice</span></h1>
      </a>
      <nav>
          <ul>
              <li><a href="#accueil">Accueil</a></li>
              <li><a href="#services">Nos Services</a></li>
              <li><a href="#produits">Boutique</a></li>
              <li><a href="#galerie">Galerie</a></li>
              <li><a href="#articles">Conseils</a></li>
              <li><a href="#apropos">À Propos</a></li>
              <li>
                  <!-- Compte visiteur : connexion facultative (inscription désactivée) -->
                  <a v-if="!utilisateur" href="#" class="btn-compte" @click.prevent="$emit('open-auth')" title="Se connecter à votre compte">
                      👤 Se connecter
                  </a>
                  <span v-else class="compte-connecte">
                      <span class="nom-utilisateur" :title="utilisateur.email">👤 {{ utilisateur.nom }}</span>
                      <button class="btn-logout-site" title="Se déconnecter" @click="$emit('logout')">Déconnexion</button>
                  </span>
              </li>
              <li>
                  <a href="#" @click.prevent="$emit('open-cart')" class="btn-panier">
                      🛒 Panier <span v-if="cartItemCount > 0" class="badge">{{ cartItemCount }}</span>
                  </a>
              </li>
          </ul>
      </nav>
  </header>
</template>

<script setup>
defineProps({
    cartItemCount: {
        type: Number,
        default: 0
    },
    utilisateur: {
        type: Object,
        default: null
    }
});
defineEmits(['open-cart', 'open-auth', 'logout']);
</script>

<style scoped>
header { background-color: #ffffff; box-shadow: 0 2px 10px rgba(0,0,0,0.1); position: fixed; width: 100%; top: 0; z-index: 1000; display: flex; justify-content: space-between; align-items: center; padding: 15px 50px; }
.logo { display: flex; align-items: center; text-decoration: none; }
.logo img { height: 60px; margin-right: 15px; }
.logo h1 { color: #143489; font-size: 24px; font-weight: 700; }
.logo h1 span { color: #E31E24; }
nav ul { list-style: none; display: flex; align-items: center; }
nav ul li { margin-left: 30px; }
nav ul li a { text-decoration: none; color: #143489; font-weight: 600; transition: color 0.3s ease; }
nav ul li a:hover { color: #E31E24; }
.btn-panier { background: #143489; color: white !important; padding: 8px 15px; border-radius: 20px; display: flex; align-items: center; gap: 8px; }
.btn-panier:hover { background: #80142D; }
.btn-compte { background: #f4f6fb; border: 1px solid #d1d5db; color: #143489 !important; padding: 8px 15px; border-radius: 20px; display: flex; align-items: center; gap: 6px; }
.btn-compte:hover { border-color: #143489; }
.compte-connecte { display: flex; align-items: center; gap: 8px; }
.nom-utilisateur { color: #143489; font-weight: 700; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.btn-logout-site { background: none; border: none; color: #E31E24; font-size: 12px; font-weight: 700; cursor: pointer; text-decoration: underline; }
.badge { background: #E31E24; color: white; border-radius: 50%; padding: 2px 8px; font-size: 12px; }
@media (max-width: 768px) {
    header { flex-direction: column; padding: 15px 20px; }
    nav ul { margin-top: 15px; flex-wrap: wrap; justify-content: center; }
    nav ul li { margin: 5px 10px; }
}
</style>