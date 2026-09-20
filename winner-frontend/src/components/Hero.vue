<template>
  <section id="accueil">
      <div class="slider-container" @mouseenter="pause = true" @mouseleave="pause = false">
          <div
              v-for="(image, index) in images"
              :key="image.id || index"
              :class="['slide', index === slideActif && 'active']"
              :style="{ backgroundImage: `url('${image}')` }"></div>
      </div>
      <div class="slider-overlay"></div>

      <div class="hero-content">
          <h2>L'énergie au service de votre mobilité</h2>
          <p>Partenaire de confiance pour la distribution de produits Total et la gestion experte de stations-service.</p>
          <a href="#produits" class="btn">Commander nos produits</a>
      </div>

      <!-- Flèches de navigation -->
      <button v-if="images.length > 1" class="slider-arrow gauche" aria-label="Image précédente" @click="allerA(slideActif - 1)">‹</button>
      <button v-if="images.length > 1" class="slider-arrow droite" aria-label="Image suivante" @click="allerA(slideActif + 1)">›</button>

      <!-- Puces de position -->
      <div v-if="images.length > 1" class="slider-dots">
          <button
              v-for="(image, index) in images"
              :key="'dot-' + (image.id || index)"
              :class="['dot', index === slideActif && 'active']"
              :aria-label="'Aller à l\'image ' + (index + 1)"
              @click="allerA(index)"></button>
      </div>
  </section>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import axios from 'axios';
import { API_URL, formatImageUrl } from '../services/config';

// Visuels par défaut si aucune image n'est publiée ou si l'API est indisponible
const IMAGES_DEFAUT = ['/OIP1.webp', '/prod.webp', '/telecharger.webp', '/OIP2.webp', '/prod1.webp'];

const images = ref([]);
const slideActif = ref(0);
const pause = ref(false);

let timer = null;
const DUREE = 6000; // 6 s par image

// Précharge une URL : résout true si l'image charge vraiment, false sinon.
const precharger = (src) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = src;
});

const demarrerTimer = () => {
    arreterTimer();
    timer = setInterval(() => {
        if (!pause.value && images.value.length > 1) {
            slideActif.value = (slideActif.value + 1) % images.value.length;
        }
    }, DUREE);
};

const arreterTimer = () => {
    if (timer) clearInterval(timer);
};

const allerA = (index) => {
    const n = images.value.length;
    if (n === 0) return;
    slideActif.value = (index + n) % n;
};

onMounted(async () => {
    let candidates = [];
    try {
        const { data } = await axios.get(`${API_URL}/hero`);
        if (Array.isArray(data) && data.length > 0) {
            candidates = data.map(item => formatImageUrl(item.image));
        }
    } catch (error) {
        console.warn('API hero indisponible — visuels par défaut.', error?.message);
    }
    if (candidates.length === 0) candidates = [...IMAGES_DEFAUT];

    // Ne garde que les images qui chargent réellement (évite tout fond cassé)
    const results = await Promise.all(candidates.map(precharger));
    let liste = candidates.filter((_, i) => results[i]);
    if (liste.length === 0) liste = [...IMAGES_DEFAUT];

    images.value = liste;
    slideActif.value = 0;
    demarrerTimer();
});

onUnmounted(arreterTimer);
</script>

<style scoped>
#accueil {
    position: relative;
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    color: #ffffff;
    margin-top: 80px;
}
.slider-container, .slider-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}
.slider-container {
    z-index: 1;
    background-color: #143489;
    overflow: hidden;
}
.slide {
    position: absolute;
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
    opacity: 0;
    transform: scale(1.08);
    transition: opacity 1.6s ease-in-out, transform 7s ease-out;
}
/* Fondu enchaîné + léger zoom arrière effet "Ken Burns" */
.slide.active {
    opacity: 1;
    transform: scale(1);
}
.slider-overlay {
    background: linear-gradient(rgba(20, 52, 137, 0.75), rgba(128, 20, 45, 0.75));
    z-index: 2;
}
.hero-content {
    position: relative;
    z-index: 3;
}
.hero-content h2 { font-size: 48px; margin-bottom: 20px; text-transform: uppercase; }
.hero-content p { font-size: 18px; margin-bottom: 25px; }
.btn { display: inline-block; padding: 12px 25px; background-color: #E31E24; color: #ffffff; text-decoration: none; font-weight: bold; border-radius: 5px; cursor: pointer; border: none; text-transform: uppercase; transition: 0.3s; }
.btn:hover { background-color: #80142D; }

/* Flèches */
.slider-arrow {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 4;
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.35);
    color: #ffffff;
    font-size: 30px;
    line-height: 1;
    width: 46px;
    height: 46px;
    border-radius: 50%;
    cursor: pointer;
    backdrop-filter: blur(3px);
    transition: background 0.25s;
}
.slider-arrow:hover { background: rgba(227, 30, 36, 0.8); }
.slider-arrow.gauche { left: 22px; }
.slider-arrow.droite { right: 22px; }

/* Puces */
.slider-dots {
    position: absolute;
    bottom: 26px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 4;
    display: flex;
    gap: 9px;
}
.dot {
    width: 11px;
    height: 11px;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.7);
    background: transparent;
    cursor: pointer;
    padding: 0;
    transition: background 0.25s, transform 0.25s;
}
.dot.active { background: #ffffff; transform: scale(1.25); }
.dot:hover { background: rgba(255, 255, 255, 0.6); }

@media (max-width: 768px) {
    .hero-content h2 { font-size: 32px; }
    .slider-arrow { width: 38px; height: 38px; font-size: 24px; }
    .slider-arrow.gauche { left: 10px; }
    .slider-arrow.droite { right: 10px; }
}
</style>
