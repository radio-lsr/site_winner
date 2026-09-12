<template>
  <div class="espace-avis">
    <h3 class="avis-titre">
      {{ estProduit ? '⭐ Avis des clients' : '💬 Commentaires' }}
      <span v-if="liste.length > 0" class="avis-count">({{ liste.length }})</span>
    </h3>

    <!-- Note moyenne (produits uniquement) -->
    <div v-if="estProduit && liste.length > 0" class="note-moyenne">
      <span class="etoiles">
        <span v-for="i in 5" :key="i" :class="i <= Math.round(noteMoyenne) ? 'etoile pleine' : 'etoile'">★</span>
      </span>
      <strong>{{ noteMoyenne.toFixed(1) }}/5</strong>
      <span class="nb-avis">basé sur {{ liste.length }} avis</span>
    </div>

    <!-- Liste des avis / commentaires -->
    <div v-if="liste.length > 0" class="avis-liste">
      <div v-for="item in liste" :key="item.id" class="avis-item">
        <div class="avis-item-entete">
          <span class="avis-auteur">{{ item.nom }}</span>
          <span v-if="estProduit" class="etoiles petites">
            <span v-for="i in 5" :key="i" :class="i <= item.note ? 'etoile pleine' : 'etoile'">★</span>
          </span>
          <span class="avis-date">{{ formatDate(item.date) }}</span>
        </div>
        <p class="avis-texte">{{ item.commentaire }}</p>
      </div>
    </div>
    <p v-else class="avis-vide">
      {{ estProduit ? 'Aucun avis pour le moment. Soyez le premier à donner votre avis !' : 'Aucun commentaire pour le moment. Lancez la discussion !' }}
    </p>

    <!-- Formulaire de dépôt -->
    <form class="avis-form" @submit.prevent="envoyer">
      <h4>{{ estProduit ? 'Donner mon avis' : 'Laisser un commentaire' }}</h4>
      <input
        v-model="form.nom"
        type="text"
        placeholder="Votre nom"
        required
        maxlength="150"
        :disabled="envoiEnCours" />
      <div v-if="estProduit" class="choix-note">
        <span class="label-note">Votre note :</span>
        <button
          v-for="i in 5"
          :key="i"
          type="button"
          class="etoile-bouton"
          :class="{ pleine: i <= form.note }"
          :title="i + ' étoile(s)'"
          :disabled="envoiEnCours"
          @click="form.note = i">★</button>
      </div>
      <textarea
        v-model="form.commentaire"
        :placeholder="estProduit ? 'Votre avis sur ce produit…' : 'Votre commentaire…'"
        rows="3"
        required
        maxlength="2000"
        :disabled="envoiEnCours"></textarea>
      <button type="submit" class="btn-avis" :disabled="envoiEnCours || (estProduit && form.note === 0)">
        {{ envoiEnCours ? 'Envoi…' : 'Publier' }}
      </button>
      <p v-if="statut.type" :class="['avis-statut', statut.type]">{{ statut.texte }}</p>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import axios from 'axios';
import { API_URL } from '../services/config';
import authService from '../services/authService';

const props = defineProps({
  // 'produit' => avis avec note étoiles ; 'article' => commentaire simple
  typeAvis: { type: String, default: 'produit' },
  cibleId: { type: Number, default: null }
});

const estProduit = computed(() => props.typeAvis === 'produit');

const urlListe = () => estProduit.value
  ? `${API_URL}/avis/produit/${props.cibleId}`
  : `${API_URL}/commentaires/article/${props.cibleId}`;

const liste = ref([]);
const envoiEnCours = ref(false);
const statut = ref({ type: '', texte: '' });
// Visiteur connecté : son nom est pré-rempli (modifiable)
const form = ref({ nom: authService.getCurrentUser()?.nom || '', note: 0, commentaire: '' });

const noteMoyenne = computed(() => {
  if (liste.value.length === 0) return 0;
  return liste.value.reduce((somme, a) => somme + Number(a.note || 0), 0) / liste.value.length;
});

const charger = async () => {
  if (!props.cibleId) return;
  try {
    const { data } = await axios.get(urlListe());
    liste.value = data || [];
  } catch (error) {
    liste.value = [];
  }
};

onMounted(charger);
watch(() => props.cibleId, charger);

const envoyer = async () => {
  envoiEnCours.value = true;
  statut.value = { type: '', texte: '' };
  try {
    const corps = estProduit.value
      ? { produitId: props.cibleId, nom: form.value.nom, note: form.value.note, commentaire: form.value.commentaire }
      : { articleId: props.cibleId, nom: form.value.nom, commentaire: form.value.commentaire };
    const { data } = await axios.post(estProduit.value ? `${API_URL}/avis` : `${API_URL}/commentaires`, corps);
    statut.value = { type: 'succes', texte: data.message || 'Merci !' };
    form.value = { nom: '', note: 0, commentaire: '' };
    await charger();
    setTimeout(() => { statut.value = { type: '', texte: '' }; }, 5000);
  } catch (error) {
    statut.value = {
      type: 'erreur',
      texte: error.response?.data?.error || 'Impossible d\'envoyer. Réessayez.'
    };
  } finally {
    envoiEnCours.value = false;
  }
};

const formatDate = (d) => {
  if (!d) return '';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};
</script>

<style scoped>
.espace-avis { margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; text-align: left; width: 100%; }
.avis-titre { color: #143489; font-size: 18px; margin-bottom: 12px; }
.avis-count { color: #9ca3af; font-size: 14px; font-weight: 500; }

.note-moyenne { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; }
.nb-avis { color: #6b7280; font-size: 13px; }
.etoile { color: #d1d5db; }
.etoile.pleine { color: #f6a617; }
.etoiles.petites { font-size: 13px; }

.avis-liste { display: flex; flex-direction: column; gap: 12px; max-height: 280px; overflow-y: auto; margin-bottom: 18px; }
.avis-item { background: #f9fafb; border-radius: 8px; padding: 12px 14px; }
.avis-item-entete { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; flex-wrap: wrap; }
.avis-auteur { font-weight: 700; color: #1f1443; font-size: 14px; }
.avis-date { color: #9ca3af; font-size: 12px; margin-left: auto; }
.avis-texte { margin: 0; color: #4b5563; font-size: 14px; line-height: 1.6; white-space: pre-line; }
.avis-vide { color: #6b7280; font-size: 14px; font-style: italic; margin-bottom: 18px; }

.avis-form { background: #f4f6fb; border-radius: 8px; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
.avis-form h4 { margin: 0; color: #143489; font-size: 15px; }
.avis-form input, .avis-form textarea {
  border: 1px solid #d1d5db; border-radius: 6px; padding: 10px 12px; font-size: 14px;
  font-family: inherit; resize: vertical; background: white;
}
.avis-form input:focus, .avis-form textarea:focus { outline: 2px solid #143489; border-color: transparent; }

.choix-note { display: flex; align-items: center; gap: 4px; }
.label-note { font-size: 14px; color: #4b5563; margin-right: 6px; }
.etoile-bouton { background: none; border: none; font-size: 22px; color: #d1d5db; cursor: pointer; padding: 0 2px; transition: transform 0.1s; }
.etoile-bouton.pleine { color: #f6a617; }
.etoile-bouton:hover { transform: scale(1.15); }
.etoile-bouton:disabled { cursor: not-allowed; }

.btn-avis { background: #E31E24; color: white; border: none; border-radius: 6px; padding: 10px 20px; font-weight: 700; cursor: pointer; text-transform: uppercase; font-size: 13px; align-self: flex-start; }
.btn-avis:hover:not(:disabled) { background: #80142D; }
.btn-avis:disabled { opacity: 0.6; cursor: not-allowed; }

.avis-statut { margin: 0; font-size: 13px; font-weight: 600; }
.avis-statut.succes { color: #15803d; }
.avis-statut.erreur { color: #dc2626; }
</style>
