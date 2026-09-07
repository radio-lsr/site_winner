<template>
  <section id="produits">
      <h2 class="section-title">Nos Produits en Vente</h2>
      <div class="produits-container">
          <div v-for="produit in listeProduits" :key="produit.id" class="produit-card" @click="$emit('select-product', produit)">
              <div class="produit-img-container">
                  <img :src="produit.image" :alt="produit.nom">
              </div>
              <h3>{{ produit.nom }}</h3>
              <p class="prix">{{ produit.prix }} $</p>
              <button class="btn-sm">Voir les détails</button>
          </div>
      </div>
  </section>
</template>

<script setup>
defineProps({
    listeProduits: {
        type: Array,
        required: true
    }
});
defineEmits(['select-product']);
</script>

<style scoped>
#produits { padding: 80px 50px; background-color: #ffffff; text-align: center; }
.section-title { color: #143489; font-size: 36px; margin-bottom: 50px; }
.produits-container { display: flex; justify-content: center; gap: 30px; flex-wrap: wrap; }
.produit-card { background: #f4f4f4; padding: 20px; border-radius: 10px; width: 280px; text-align: center; cursor: pointer; transition: transform 0.3s, box-shadow 0.3s; }
.produit-card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
.produit-img-container { height: 200px; display: flex; align-items: center; justify-content: center; overflow: hidden; margin-bottom: 15px; border-radius: 8px; background: white; }
.produit-img-container img { max-height: 100%; max-width: 100%; object-fit: contain; }
.produit-card h3 { color: #143489; font-size: 18px; margin-bottom: 10px; }
.prix { color: #E31E24; font-size: 22px; font-weight: bold; margin-bottom: 15px; }
.btn-sm { background: #143489; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; transition: 0.3s; }
.btn-sm:hover { background: #E31E24; }
</style>