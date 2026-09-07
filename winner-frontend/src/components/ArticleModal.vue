<template>
  <div class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-content article-modal">
          <button class="close-btn" @click="$emit('close')">✖</button>
          <div v-if="article">
              <h2>{{ article.titre }}</h2>
              
              <!-- Si l'article est une vidéo (Tutoriel vidéo) -->
              <div v-if="article.type === 'video'" class="video-container">
                  <video controls autoplay class="modal-video">
                      <source :src="article.urlVideo" type="video/mp4">
                      Votre navigateur ne supporte pas la vidéo.
                  </video>
              </div>
              
              <!-- Si l'article est un article textuel classique -->
              <div v-else class="article-body">
                  <img :src="article.image" :alt="article.titre" class="modal-img">
                  <p class="article-full-text">{{ article.contenu }}</p>
              </div>
          </div>
      </div>
  </div>
</template>

<script setup>
defineProps({
    article: {
        type: Object,
        default: null
    }
});

defineEmits(['close']);
</script>

<style scoped>
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 2000; }
.modal-content { background: white; padding: 30px; border-radius: 10px; max-width: 800px; width: 90%; position: relative; max-height: 90vh; overflow-y: auto; text-align: left; }
.close-btn { position: absolute; top: 15px; right: 15px; background: none; border: none; font-size: 24px; cursor: pointer; color: #999; }
.close-btn:hover { color: #E31E24; }
.article-modal h2 { color: #143489; margin-bottom: 20px; font-size: 24px; }
.modal-video { width: 100%; max-height: 400px; border-radius: 8px; background: #000; margin-top: 15px; outline: none; }
.modal-img { width: 100%; max-height: 300px; object-fit: cover; border-radius: 8px; margin-bottom: 20px; }
.article-full-text { color: #444; line-height: 1.8; font-size: 16px; white-space: pre-line; }
</style>