<template>
  <div class="page-section">
    <div class="page-header">
      <h2 class="page-title">🖼️ Bannière d'accueil</h2>
      <label class="btn-upload">
        ➕ Publier une image
        <input type="file" accept="image/*" hidden @change="publierImage" :disabled="envoiEnCours">
      </label>
    </div>

    <p v-if="envoiEnCours" class="info">⏳ Publication en cours…</p>
    <p v-if="message" class="info succes">✅ {{ message }}</p>

    <p v-if="images.length === 0" class="info">
      Aucune image publiée pour le moment : le site affiche les visuels par défaut.
      Publiez une image pour la voir apparaître dans la bannière d'accueil.
    </p>

    <div v-else class="hero-grid">
      <div v-for="(image, index) in images" :key="image.id" class="hero-card">
        <img :src="urlImage(image.image)" :alt="'Image bannière ' + (index + 1)">
        <a class="lien-voir" :href="urlImage(image.image)" target="_blank" rel="noopener" title="Ouvrir l'image telle que servie au site public">
          🔗 Voir côté site
        </a>
        <div class="hero-card-actions">
          <span class="ordre">N° {{ index + 1 }}</span>
          <button class="btn-supprimer" title="Retirer de la bannière" @click="supprimerImage(image.id)">🗑️ Retirer</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { API_URL, formatImageUrl } from '@/services/config'

const HERO_URL = `${API_URL}/hero`

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
})

const images = ref([])
const envoiEnCours = ref(false)
const message = ref('')

const urlImage = (img) => formatImageUrl(img)

const fetchImages = async () => {
  try {
    const { data } = await axios.get(HERO_URL)
    images.value = data || []
  } catch (error) {
    console.error('Erreur lors de la récupération des images hero :', error)
  }
}

onMounted(fetchImages)

const publierImage = async (event) => {
  const fichier = event.target.files?.[0]
  event.target.value = '' // permet de re-sélectionner le même fichier
  if (!fichier) return

  envoiEnCours.value = true
  message.value = ''
  try {
    const formData = new FormData()
    formData.append('image', fichier)
    const { data } = await axios.post(HERO_URL, formData, {
      ...getAuthHeaders(),
      headers: { ...getAuthHeaders().headers, 'Content-Type': 'multipart/form-data' }
    })
    message.value = data.message || 'Image publiée.'
    await fetchImages()
    setTimeout(() => { message.value = '' }, 4000)
  } catch (error) {
    alert(error.response?.data?.error || 'Impossible de publier cette image.')
  } finally {
    envoiEnCours.value = false
  }
}

const supprimerImage = async (id) => {
  if (!confirm('Retirer cette image de la bannière d\'accueil ?')) return
  try {
    await axios.delete(`${HERO_URL}/${id}`, getAuthHeaders())
    images.value = images.value.filter(i => i.id !== id)
  } catch (error) {
    console.error('Erreur lors de la suppression :', error)
    alert('Impossible de supprimer cette image.')
  }
}
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
.page-title { margin: 0; color: #1f1443; font-size: 20px; }
.btn-upload { background: #1f1443; color: white; padding: 10px 18px; border-radius: 8px; font-weight: 700; cursor: pointer; }
.btn-upload:hover { background: #E31E24; }

.info { color: #6b7280; font-size: 14px; }
.info.succes { color: #15803d; font-weight: 600; }

.hero-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 20px; }
.hero-card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
.hero-card img { width: 100%; height: 150px; object-fit: cover; display: block; }
.lien-voir { display: block; padding: 6px 12px 0; font-size: 11px; color: #6b7280; text-decoration: none; }
.lien-voir:hover { color: #143489; text-decoration: underline; }
.hero-card-actions { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; }
.ordre { font-size: 12px; font-weight: 700; color: #6b7280; }
.btn-supprimer { background: none; border: 1px solid #dc2626; color: #dc2626; border-radius: 6px; padding: 6px 10px; font-size: 12px; font-weight: 700; cursor: pointer; }
.btn-supprimer:hover { background: #dc2626; color: white; }
</style>
