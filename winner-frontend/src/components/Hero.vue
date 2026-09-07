<template>
  <section id="accueil">
      <div class="slider-container">
          <div class="slide active" style="background-image: url('/OIP1.webp');"></div>
          <div class="slide" style="background-image: url('/prod.webp');"></div>
          <div class="slide" style="background-image: url('/telecharger.webp');"></div>
          <div class="slide" style="background-image: url('/OIP2.webp');"></div>
          <div class="slide" style="background-image: url('/prod1.webp');"></div>
      </div>
      <div class="slider-overlay"></div>
      <div class="hero-content">
          <h2>L'énergie au service de votre mobilité</h2>
          <p>Partenaire de confiance pour la distribution de produits Total et la gestion experte de stations-service.</p>
          <a href="#produits" class="btn">Commander nos produits</a>
      </div>
  </section>
</template>

<script setup>
import { onMounted } from 'vue';

onMounted(() => {
    const slides = document.querySelectorAll('.slide');
    if (slides.length > 0) {
        let currentSlide = 0;
        function changeSlide() {
            slides[currentSlide].classList.remove('active');
            currentSlide = (currentSlide + 1) % slides.length;
            slides[currentSlide].classList.add('active');
        }
        setInterval(changeSlide, 5000);
    }
});
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
/* CORRECTION ICI : z-index: 1 au lieu de -1 */
.slider-container { 
    z-index: 1; 
    background-color: #143489; 
}
.slide { 
    position: absolute; 
    width: 100%; 
    height: 100%; 
    background-size: cover; 
    background-position: center; 
    opacity: 0; 
    transition: opacity 1.5s ease-in-out; 
}
.slide.active { 
    opacity: 1; 
}
/* CORRECTION ICI : z-index: 2 pour être au-dessus des images */
.slider-overlay { 
    background: linear-gradient(rgba(20, 52, 137, 0.75), rgba(128, 20, 45, 0.75)); 
    z-index: 2; 
}
/* CORRECTION ICI : z-index: 3 pour être au-dessus du dégradé */
.hero-content { 
    position: relative; 
    z-index: 3; 
}
.hero-content h2 { font-size: 48px; margin-bottom: 20px; text-transform: uppercase; }
.hero-content p { font-size: 18px; margin-bottom: 25px; }
.btn { display: inline-block; padding: 12px 25px; background-color: #E31E24; color: #ffffff; text-decoration: none; font-weight: bold; border-radius: 5px; cursor: pointer; border: none; text-transform: uppercase; transition: 0.3s; }
.btn:hover { background-color: #80142D; }
@media (max-width: 768px) {
    .hero-content h2 { font-size: 32px; }
}
</style>