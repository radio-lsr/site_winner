<template>
  <div class="page-section">
    <div class="page-header">
      <h2 class="page-title">💬 Avis & Commentaires</h2>
      <button class="btn-refresh" @click="toutCharger" :disabled="isLoading">🔄 Actualiser</button>
    </div>

    <!-- Onglets -->
    <div class="tabs">
      <button :class="['tab', onglet === 'avis' && 'active']" @click="onglet = 'avis'">
        ⭐ Avis produits ({{ avis.length }})
      </button>
      <button :class="['tab', onglet === 'commentaires' && 'active']" @click="onglet = 'commentaires'">
        💬 Commentaires articles ({{ commentaires.length }})
      </button>
    </div>

    <!-- Onglet Avis produits -->
    <table v-if="onglet === 'avis'" class="admin-table">
      <thead>
        <tr>
          <th>Note</th>
          <th>Auteur</th>
          <th>Produit</th>
          <th>Avis</th>
          <th>Date</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="avis.length === 0">
          <td colspan="6" class="cell-vide">Aucun avis produit pour le moment.</td>
        </tr>
        <tr v-for="a in avis" :key="a.id">
          <td>
            <span class="etoiles">
              <span v-for="i in 5" :key="i" :class="i <= a.note ? 'etoile pleine' : 'etoile'">★</span>
            </span>
          </td>
          <td><strong>{{ a.nom }}</strong></td>
          <td>{{ a.produitNom }}</td>
          <td class="cell-texte">{{ a.commentaire }}</td>
          <td>{{ formatDate(a.date) }}</td>
          <td>
            <button class="action-btn delete-btn" title="Supprimer" @click="supprimerAvis(a.id)">🗑️</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Onglet Commentaires articles -->
    <table v-else class="admin-table">
      <thead>
        <tr>
          <th>Auteur</th>
          <th>Article / Tuto</th>
          <th>Commentaire</th>
          <th>Date</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="commentaires.length === 0">
          <td colspan="5" class="cell-vide">Aucun commentaire pour le moment.</td>
        </tr>
        <tr v-for="c in commentaires" :key="c.id">
          <td><strong>{{ c.nom }}</strong></td>
          <td>{{ c.articleTitre }}</td>
          <td class="cell-texte">{{ c.commentaire }}</td>
          <td>{{ formatDate(c.date) }}</td>
          <td>
            <button class="action-btn delete-btn" title="Supprimer" @click="supprimerCommentaire(c.id)">🗑️</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { API_URL } from '@/services/config'

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
})

const onglet = ref('avis')
const avis = ref([])
const commentaires = ref([])
const isLoading = ref(false)

const chargerAvis = async () => {
  try {
    const { data } = await axios.get(`${API_URL}/avis`, getAuthHeaders())
    avis.value = data || []
  } catch (error) {
    console.error('Erreur lors de la récupération des avis :', error)
  }
}

const chargerCommentaires = async () => {
  try {
    const { data } = await axios.get(`${API_URL}/commentaires`, getAuthHeaders())
    commentaires.value = data || []
  } catch (error) {
    console.error('Erreur lors de la récupération des commentaires :', error)
  }
}

const toutCharger = async () => {
  isLoading.value = true
  await Promise.all([chargerAvis(), chargerCommentaires()])
  isLoading.value = false
}

onMounted(toutCharger)

const supprimerAvis = async (id) => {
  if (!confirm('Supprimer cet avis ?')) return
  try {
    await axios.delete(`${API_URL}/avis/${id}`, getAuthHeaders())
    avis.value = avis.value.filter(a => a.id !== id)
  } catch (error) {
    console.error('Erreur lors de la suppression :', error)
    alert('Impossible de supprimer cet avis.')
  }
}

const supprimerCommentaire = async (id) => {
  if (!confirm('Supprimer ce commentaire ?')) return
  try {
    await axios.delete(`${API_URL}/commentaires/${id}`, getAuthHeaders())
    commentaires.value = commentaires.value.filter(c => c.id !== id)
  } catch (error) {
    console.error('Erreur lors de la suppression :', error)
    alert('Impossible de supprimer ce commentaire.')
  }
}

const formatDate = (d) => {
  if (!d) return ''
  const date = new Date(d)
  if (isNaN(date.getTime())) return ''
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
.page-title { margin: 0; color: #1f1443; font-size: 20px; }
.btn-refresh { background: #f3f6fb; border: 1px solid #d1d5db; padding: 10px 16px; border-radius: 8px; cursor: pointer; font-weight: 600; }
.btn-refresh:disabled { opacity: 0.6; cursor: not-allowed; }

.tabs { display: flex; gap: 8px; margin-bottom: 20px; }
.tab { background: #e5e7eb; border: none; padding: 10px 18px; border-radius: 8px 8px 0 0; cursor: pointer; font-weight: 600; color: #4b5563; }
.tab.active { background: #1f1443; color: white; }

.admin-table { width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.02); }
.admin-table th, .admin-table td { padding: 14px 18px; text-align: left; border-bottom: 1px solid #f3f4f6; vertical-align: top; }
.admin-table th { background-color: #f9fafb; color: #6b7280; font-size: 12px; text-transform: uppercase; }
.cell-vide { text-align: center; color: #6b7280; padding: 30px !important; }
.cell-texte { max-width: 320px; font-size: 13px; color: #4b5563; white-space: pre-line; }

.etoile { color: #d1d5db; }
.etoile.pleine { color: #f6a617; }

.action-btn { background: none; border: none; font-size: 16px; cursor: pointer; transition: transform 0.2s; }
.action-btn:hover { transform: scale(1.2); }
.delete-btn:hover { filter: drop-shadow(0 0 2px rgba(220, 38, 38, 0.5)); }
</style>
