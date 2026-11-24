<template>
  <section class="redirection-externe">
      <h1>Redirection en cours…</h1>
      <p>
          Vous êtes redirigé vers notre page Facebook.
          <a :href="cible" rel="noopener noreferrer">Cliquez ici</a> si le
          navigateur ne vous redirige pas automatiquement.
      </p>
  </section>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { FACEBOOK_URL } from '../services/config';

// Adresses courtes -> destinations réelles.
const DESTINATIONS = {
    FacebookRedirect: FACEBOOK_URL
};

const route = useRoute();

const cible = computed(() => DESTINATIONS[route.name] || '/');

// Redirection immédiate vers la destination (l'adresse courte reste ainsi
// la seule visible dans les liens du site).
onMounted(() => {
    window.location.replace(cible.value);
});
</script>

<style scoped>
.redirection-externe {
    min-height: 60vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    text-align: center;
    padding: 40px 20px;
}
.redirection-externe h1 { color: #143489; font-size: 26px; }
.redirection-externe p { color: #555555; font-size: 15px; }
.redirection-externe a { color: #1877F2; font-weight: 700; }
</style>
