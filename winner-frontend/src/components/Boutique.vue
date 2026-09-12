<template>
  <section id="produits">
      <h2 class="section-title">Nos Produits en Vente</h2>
      <div class="produits-container">
          <div v-for="produit in listeProduits" :key="produit.id" class="produit-card" @click="$emit('select-product', produit)">
              <div v-if="enPromo(produit)" class="promo-bar">🔥 En promotion</div>
              <div class="produit-img-container">
                  <img :src="produit.image" :alt="produit.nom">
              </div>
              <h3>{{ produit.nom }}</h3>
              <!-- Note moyenne des clients (si des avis existent) -->
              <p v-if="produit.nbAvis > 0" class="note-carte" :title="produit.noteMoyenne.toFixed(1) + '/5'">
                  <span v-for="i in 5" :key="i" :class="i <= Math.round(produit.noteMoyenne) ? 'etoile-c pleine' : 'etoile-c'">★</span>
                  <span class="nb-avis-carte">({{ produit.nbAvis }})</span>
              </p>
              <!-- Prix en promotion : ancien prix barré + nouveau prix -->
              <div v-if="enPromo(produit)" class="prix-promo">
                  <span class="prix-barre">{{ formatPrix(produit.prixOriginal) }} $</span>
                  <span class="prix-actuel">{{ formatPrix(produit.prix) }} $</span>
              </div>
              <p v-else class="prix">{{ produit.prix }} $</p>
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

// Un produit est en promotion s'il a un prix d'origine barré
const enPromo = (produit) => Boolean(produit && produit.prixOriginal && produit.prixOriginal > produit.prix);

const formatPrix = (v) => Number(v).toFixed(2);
</script>

<style scoped>
#produits { padding: 80px 50px; background-color: #ffffff; text-align: center; }
.section-title { color: #143489; font-size: 36px; margin-bottom: 50px; }
.produits-container { display: flex; justify-content: center; gap: 30px; flex-wrap: wrap; }
.produit-card { background: #f4f4f4; padding: 20px; border-radius: 10px; width: 280px; text-align: center; cursor: pointer; transition: transform 0.3s, box-shadow 0.3s; position: relative; }
.produit-card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
.produit-img-container { height: 200px; display: flex; align-items: center; justify-content: center; overflow: hidden; margin-bottom: 15px; border-radius: 8px; background: white; }
.produit-img-container img { max-height: 100%; max-width: 100%; object-fit: contain; }
.produit-card h3 { color: #143489; font-size: 18px; margin-bottom: 10px; }
.note-carte { display: flex; justify-content: center; align-items: center; gap: 2px; margin: -4px 0 10px; font-size: 15px; }
.etoile-c { color: #d1d5db; }
.etoile-c.pleine { color: #f6a617; }
.nb-avis-carte { color: #6b7280; font-size: 12px; margin-left: 4px; }
.prix { color: #E31E24; font-size: 22px; font-weight: bold; margin-bottom: 15px; }
/* --- Affichage promotion : barre + prix barré + nouveau prix --- */
.promo-bar { position: absolute; top: 0; left: 0; right: 0; background: #E31E24; color: #ffffff; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 6px 0; text-align: center; border-radius: 10px 10px 0 0; z-index: 2; }
.prix-promo { display: flex; flex-direction: column; align-items: center; gap: 2px; margin-bottom: 15px; }
.prix-barre { text-decoration: line-through; color: #9ca3af; font-size: 14px; font-weight: 500; }
.prix-actuel { color: #E31E24; font-size: 22px; font-weight: bold; }
.btn-sm { background: #143489; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; transition: 0.3s; }
.btn-sm:hover { background: #E31E24; }
</style>
