<template>
  <div class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-content panier-modal">
          <button class="close-btn" @click="$emit('close')">✖</button>
          <h2>Votre Panier</h2>
          
          <div v-if="panier.length === 0" class="panier-vide">
              <p>Votre panier est actuellement vide.</p>
          </div>
          
          <div v-else class="panier-layout">
              <div class="panier-articles">
                  <div v-for="(item, index) in panier" :key="index" class="panier-item">
                      <img :src="item.image" :alt="item.nom">
                      <div class="item-info">
                          <h4>{{ item.nom }}</h4>
                          <p>Quantité : {{ item.quantite }}</p>
                      </div>
                      <p class="item-prix">{{ item.prix * item.quantite }} $</p>
                      <button class="btn-supprimer" @click="$emit('remove-item', index)" title="Supprimer">🗑️</button>
                  </div>
                  <div class="panier-total">
                      <h3>Total : {{ calculTotal }} $</h3>
                  </div>
              </div>

              <div class="panier-formulaire">
                  <h3>Informations de livraison</h3>
                  <form @submit.prevent="validerCommande">
                      <input type="text" v-model="formulaire.nom" placeholder="Nom et Prénom" required autocomplete="name">
                      <input type="tel" v-model="formulaire.telephone" placeholder="Numéro de Téléphone" required autocomplete="tel">
                      <textarea v-model="formulaire.adresse" placeholder="Adresse complète de livraison" rows="3" required></textarea>
                      <label>Date de livraison souhaitée :</label>
                      <input type="date" v-model="formulaire.date" :min="minDate" required>
                      
                      <button type="submit" class="btn btn-block">Confirmer la commande</button>
                  </form>
              </div>
          </div>
          
          <div v-if="commandeReussie" class="message-succes">
              ✅ Votre commande a été envoyée avec succès ! Nous vous contacterons bientôt.
          </div>
      </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
    panier: {
        type: Array,
        required: true
    },
    commandeReussie: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['close', 'remove-item', 'submit-order']);

const formulaire = ref({
    nom: '',
    telephone: '',
    adresse: '',
    date: ''
});

// Sécurité : Empêche la sélection d'une date de livraison passée
const minDate = computed(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
});

const calculTotal = computed(() => {
    return props.panier.reduce((total, item) => total + (item.prix * item.quantite), 0);
});

const validerCommande = () => {
    emit('submit-order', { ...formulaire.value });
};
</script>

<style scoped>
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 2000; }
.modal-content { background: white; padding: 30px; border-radius: 10px; max-width: 900px; width: 90%; position: relative; max-height: 90vh; overflow-y: auto; }
.close-btn { position: absolute; top: 15px; right: 15px; background: none; border: none; font-size: 24px; cursor: pointer; color: #999; }
.close-btn:hover { color: #E31E24; }
.panier-modal h2 { text-align: center; color: #143489; margin-bottom: 25px; border-bottom: 2px solid #E31E24; padding-bottom: 10px; }
.panier-layout { display: flex; gap: 40px; flex-wrap: wrap; }
.panier-articles { flex: 1; min-width: 300px; text-align: left; }
.panier-item { display: flex; align-items: center; justify-content: space-between; padding: 15px 0; border-bottom: 1px solid #eee; }
.panier-item img { width: 50px; height: 50px; object-fit: contain; }
.item-info { flex: 1; margin: 0 15px; }
.item-info h4 { color: #143489; font-size: 16px; }
.item-prix { font-weight: bold; color: #143489; width: 60px; }
.btn-supprimer { background: none; border: none; cursor: pointer; font-size: 18px; color: #E31E24; }
.panier-total { text-align: right; margin-top: 20px; font-size: 20px; color: #E31E24; font-weight: bold; }
.panier-vide { text-align: center; padding: 40px; color: #777; font-size: 18px; }
.panier-formulaire { flex: 1; min-width: 300px; background: #f4f4f4; padding: 25px; border-radius: 8px; text-align: left; }
.panier-formulaire h3 { margin-bottom: 20px; color: #143489; }
.panier-formulaire input, .panier-formulaire textarea, .panier-formulaire label { width: 100%; display: block; margin-bottom: 15px; }
.panier-formulaire input, .panier-formulaire textarea { padding: 12px; border: 1px solid #ccc; border-radius: 5px; font-family: 'Montserrat', sans-serif; }
.panier-formulaire label { font-size: 14px; color: #555; margin-bottom: 5px; }
.btn { display: inline-block; padding: 12px 25px; background-color: #E31E24; color: #ffffff; text-decoration: none; font-weight: bold; border-radius: 5px; cursor: pointer; border: none; text-transform: uppercase; transition: 0.3s; }
.btn:hover { background-color: #80142D; }
.btn-block { width: 100%; margin-top: 15px; }
.message-succes { background: #d4edda; color: #155724; padding: 15px; border-radius: 5px; text-align: center; margin-top: 20px; font-weight: bold; }
</style>