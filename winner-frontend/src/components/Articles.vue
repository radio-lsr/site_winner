<template>
  <section id="articles">
      <h2 class="section-title">Conseils & Tutoriels</h2>
      <div class="articles-container">
          <div v-for="article in articlesPagines" :key="article.id" class="article-card" @click="$emit('select-article', article)">
              <img :src="article.image" :alt="article.titre">
              <div class="article-content">
                  <h3>{{ article.titre }}</h3>
                  <p>{{ article.extrait }}</p>
                  <button class="btn-sm">Lire l'article</button>
              </div>
          </div>
      </div>

      <!-- Pagination dès que les conseils et tutoriels dépassent 12 -->
      <Pagination v-model="pageCourante" :total-elements="listeArticles.length" />
  </section>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import Pagination from './Pagination.vue';

const props = defineProps({
    listeArticles: {
        type: Array,
        required: true
    }
});
defineEmits(['select-article']);

// Nombre de conseils / tutoriels affichés par page.
const PAR_PAGE = 12;
const pageCourante = ref(1);

const articlesPagines = computed(() => {
    const debut = (pageCourante.value - 1) * PAR_PAGE;
    return props.listeArticles.slice(debut, debut + PAR_PAGE);
});

// Tout changement de liste repart de la première page.
watch(() => props.listeArticles, () => { pageCourante.value = 1; });
</script>

<style scoped>
#articles { padding: 80px 50px; background-color: #ffffff; text-align: center; }
.section-title { color: #143489; font-size: 36px; margin-bottom: 50px; }
.articles-container {
    display: flex;
    justify-content: center;
    gap: 30px;
    flex-wrap: wrap;
    max-width: 1200px;
    margin: 0 auto;
}
.article-card {
    background: #f4f4f4;
    border-radius: 10px;
    overflow: hidden;
    width: 350px;
    text-align: left;
    box-shadow: 0 5px 15px rgba(0,0,0,0.05);
    transition: transform 0.3s ease;
    cursor: pointer;
}
.article-card:hover {
    transform: translateY(-8px);
}
.article-card img {
    width: 100%;
    height: 200px;
    object-fit: cover;
}
.article-content {
    padding: 20px;
}
.article-content h3 {
    color: #143489;
    font-size: 20px;
    margin-bottom: 12px;
}
.article-content p {
    color: #555;
    line-height: 1.6;
    margin-bottom: 20px;
}
.btn-sm { background: #143489; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; transition: 0.3s; }
.btn-sm:hover { background: #E31E24; }
</style>