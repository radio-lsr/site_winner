<template>
  <div class="page-section">
    <div class="page-header">
      <h2>Médiathèque</h2>
      <button class="btn-yellow" @click="declencherUpload" :disabled="isLoading">
        {{ isLoading ? 'Upload en cours...' : '➕ Uploader un fichier' }}
      </button>
      
      <!-- Input de fichier caché pour gérer l'upload -->
      <input 
        type="file" 
        ref="fileInputRef" 
        style="display: none" 
        multiple 
        accept="image/*,video/*" 
        @change="ajouterFichiers" 
        :disabled="isLoading"
      />
    </div>

    <div class="media-grid">
      <div v-if="medias.length === 0" class="empty-state">
        Aucun fichier dans la médiathèque.
      </div>
      
      <div 
        v-for="media in medias" 
        :key="media.id" 
        class="media-card" 
        :style="{ backgroundImage: `url(${formatImageUrl(media.image)})` }"
      >
        <div class="media-overlay">
          <button class="btn-delete" @click="supprimerMedia(media.id)" :disabled="isLoading">Supprimer</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

// --- CONFIGURATION API ---
import { API_URL as API_ROOT, API_BASE_URL } from '@/services/config'

const BACKEND_URL = API_BASE_URL
const API_URL = `${API_ROOT}/galerie`

// CORRECTION : Fonction pour inclure le token JWT dans les requêtes sécurisées
const getAuthHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`
  }
})

// --- DONNÉES RÉACTIVES ---
const fileInputRef = ref(null)
const medias = ref([])
const isLoading = ref(false)

// --- APPELS API BACKEND ---

// 1. Récupérer les médias
const fetchMedias = async () => {
  try {
    const response = await axios.get(API_URL)
    medias.value = response.data
  } catch (error) {
    console.error("Erreur lors de la récupération des médias :", error)
  }
}

onMounted(() => {
  fetchMedias()
})

// --- ACTIONS ---
const declencherUpload = () => {
  fileInputRef.value.click()
}

// 2. Envoyer de nouveaux fichiers via FormData (POST)
const ajouterFichiers = async (event) => {
  const files = event.target.files
  if (!files || files.length === 0) return

  isLoading.value = true
  const formData = new FormData()

  // On ajoute chaque fichier sélectionné au FormData
  Array.from(files).forEach(file => {
    formData.append('fichiers', file)
  })

  try {
    // CORRECTION : Ajout de getAuthHeaders() pour éviter l'erreur 401
    await axios.post(API_URL, formData, getAuthHeaders())
    await fetchMedias() // On rafraîchit la liste pour récupérer les URLs du serveur
  } catch (error) {
    console.error("Erreur lors de l'upload des fichiers :", error)
    alert("Une erreur est survenue lors de l'upload.")
  } finally {
    isLoading.value = false
    event.target.value = '' // Réinitialiser l'input
  }
}

// 3. Supprimer un média (DELETE)
const supprimerMedia = async (id) => {
  if (confirm("Voulez-vous vraiment supprimer ce fichier de la médiathèque ?")) {
    try {
      // CORRECTION : Ajout de getAuthHeaders() ici aussi
      await axios.delete(`${API_URL}/${id}`, getAuthHeaders())
      medias.value = medias.value.filter(m => m.id !== id)
    } catch (error) {
      console.error("Erreur lors de la suppression :", error)
      alert("Impossible de supprimer ce fichier.")
    }
  }
}

// --- UTILITAIRE IMAGE ---
const formatImageUrl = (imagePath) => {
  if (!imagePath) return '/prod.webp'
  if (imagePath.startsWith('/uploads')) {
    return `${BACKEND_URL}${imagePath}`
  }
  return imagePath
}
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
.btn-yellow { background-color: #f6a617; color: #1f1443; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 700; cursor: pointer; transition: background-color 0.2s; }
.btn-yellow:hover { background-color: #e09612; }
.btn-yellow:disabled { opacity: 0.6; cursor: not-allowed; }

.media-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; }
.media-card { height: 200px; border-radius: 12px; background-size: cover; background-position: center; position: relative; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
.media-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; opacity: 0; transition: 0.3s; }
.media-card:hover .media-overlay { opacity: 1; }

.btn-delete { background: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; transition: background-color 0.2s; }
.btn-delete:hover { background: #dc2626; }
.btn-delete:disabled { opacity: 0.6; cursor: not-allowed; }

.empty-state { grid-column: 1 / -1; text-align: center; color: #6b7280; font-style: italic; padding: 40px; background: white; border-radius: 12px; }
</style>