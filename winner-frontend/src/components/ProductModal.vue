<template>
  <div class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-content">
          <button class="close-btn" @click="$emit('close')">✖</button>
          <div class="modal-body" v-if="produit">
              <div class="modal-img-wrapper">
                  <div v-if="enPromo" class="promo-bar">🔥 En promotion</div>
                  <img :src="produit.image" :alt="produit.nom" class="modal-img">
              </div>
              <div class="modal-info">
                  <h2>{{ produit.nom }}</h2>
                  <!-- Prix en promotion : ancien prix barré + nouveau prix -->
                  <p v-if="enPromo" class="prix-modal">
                      <span class="prix-barre">{{ formatPrix(produit.prixOriginal) }} $</span>
                      <span class="prix-actuel">{{ formatPrix(produit.prix) }} $</span>
                  </p>
                  <p v-else class="prix-modal">{{ produit.prix }} $</p>
                  <p class="specs">{{ produit.specs }}</p>
                  
                  <div class="commande-action">
                      <label for="quantite">Quantité :</label>
                      <input type="number" id="quantite" v-model.number="quantiteChoisie" min="1" max="99" class="input-quantite">
                      <button class="btn" @click="ajouter">Ajouter au panier</button>
                  </div>
              </div>
          </div>
      </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
    produit: {
        type: Object,
        default: null
    }
});

const emit = defineEmits(['close', 'add-to-cart']);
const quantiteChoisie = ref(1);

const enPromo = computed(() => Boolean(props.produit && props.produit.prixOriginal && props.produit.prixOriginal > props.produit.prix));
const formatPrix = (v) => Number(v).toFixed(2);

const ajouter = () => {
    const q = parseInt(quantiteChoisie.value, 10);
    if (q > 0 && q <= 99) {
        emit('add-to-cart', { ...props.produit, quantite: q });
    }
};
</script>

<style scoped>
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 2000; }
.modal-content { background: white; padding: 30px; border-radius: 10px; max-width: 800px; width: 90%; position: relative; max-height: 90vh; overflow-y: auto; }
.close-btn { position: absolute; top: 15px; right: 15px; background: none; border: none; font-size: 24px; cursor: pointer; color: #999; }
.close-btn:hover { color: #E31E24; }
.modal-body { display: flex; gap: 30px; flex-wrap: wrap; align-items: center; }
.modal-img-wrapper { position: relative; flex: 0 1 300px; }
.modal-img { max-width: 300px; width: 100%; object-fit: contain; border-radius: 8px; background: #f4f4f4; padding: 10px; }
.promo-bar { position: absolute; top: 0; left: 0; right: 0; background: #E31E24; color: #ffffff; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 6px 0; text-align: center; border-radius: 8px 8px 0 0; z-index: 2; }
.modal-info { flex: 1; min-width: 250px; text-align: left; }
.modal-info h2 { color: #143489; margin-bottom: 10px; }
.prix-modal { color: #E31E24; font-size: 28px; font-weight: bold; margin-bottom: 15px; }
.prix-modal .prix-barre { text-decoration: line-through; color: #9ca3af; font-size: 18px; font-weight: 500; margin-right: 12px; }
.prix-modal .prix-actuel { color: #E31E24; }
.specs { color: #555; margin-bottom: 25px; line-height: 1.6; }
.commande-action { display: flex; align-items: center; gap: 15px; background: #f4f4f4; padding: 15px; border-radius: 8px; }
.input-quantite { width: 60px; padding: 10px; border: 1px solid #ccc; border-radius: 5px; font-size: 16px; text-align: center; }
.btn { display: inline-block; padding: 12px 25px; background-color: #E31E24; color: #ffffff; text-decoration: none; font-weight: bold; border-radius: 5px; cursor: pointer; border: none; text-transform: uppercase; transition: 0.3s; }
.btn:hover { background-color: #80142D; }
</style>