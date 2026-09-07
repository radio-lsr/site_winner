<template>
  <section id="galerie">
      <h2 class="section-title">Notre Galerie</h2>
      <p style="text-align: center; margin-bottom: 40px; color: #555;">Découvrez nos installations, nos produits et nos vidéos en action.</p>
      <div class="galerie-container">
          <div v-for="(item, index) in listeGalerie" :key="index" class="galerie-item">
              <img v-if="item.type === 'image'" :src="item.url" :alt="item.titre">
              <video v-if="item.type === 'video'" controls preload="metadata">
                  <source :src="item.url" type="video/mp4">
                  Votre navigateur ne supporte pas la vidéo.
              </video>
              <div v-if="item.type === 'image'" class="galerie-overlay">
                  <span>{{ item.titre }}</span>
              </div>
          </div>
      </div>
  </section>
</template>

<script setup>
defineProps({
    listeGalerie: {
        type: Array,
        required: true
    }
});
</script>

<style scoped>
#galerie { padding: 80px 50px; background-color: #f4f4f4; text-align: center; }
.section-title { color: #143489; font-size: 36px; margin-bottom: 50px; }
.galerie-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    max-width: 1200px;
    margin: 0 auto;
}
.galerie-item {
    position: relative;
    border-radius: 8px;
    overflow: hidden;
    height: 250px;
    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    background: #000;
}
.galerie-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.4s ease;
}
.galerie-item:hover img {
    transform: scale(1.1);
}
.galerie-item video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    outline: none;
}
.galerie-overlay {
    position: absolute;
    bottom: -100%;
    left: 0;
    width: 100%;
    background: rgba(20, 52, 137, 0.85);
    color: white;
    padding: 15px;
    transition: bottom 0.3s ease;
    font-weight: bold;
    font-size: 18px;
}
.galerie-item:hover .galerie-overlay {
    bottom: 0;
}
</style>