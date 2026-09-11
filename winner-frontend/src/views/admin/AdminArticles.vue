<template>
  <div class="page-section">
    <div class="page-header">
      <input 
        type="text" 
        placeholder="🔍 Rechercher un article ou un tuto..." 
        class="search-input" 
        v-model="recherche" 
      />
      <button class="btn-yellow" @click="ouvrirModalAjout">➕ Créer un contenu</button>
    </div>

    <!-- Fenêtre Modale (Ajout / Modification) -->
    <div v-if="afficherModal" class="modal-overlay" @click.self="fermerModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ idEnEdition ? "Modifier le contenu" : "Créer un nouveau contenu" }}</h3>
          <button class="close-btn" @click="fermerModal" :disabled="isLoading">✖</button>
        </div>
        
        <form @submit.prevent="soumettreArticle" class="modal-form">
          <div class="form-group">
            <label>Titre</label>
            <input v-model="formArticle.titre" type="text" required placeholder="Ex: Comment faire sa vidange ?" :disabled="isLoading" />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Type de contenu</label>
              <select v-model="formArticle.type_article" required :disabled="isLoading">
                <option value="texte">📝 Article Texte</option>
                <option value="video">🎥 Tutoriel Vidéo</option>
              </select>
            </div>

            <div class="form-group">
              <label>Statut</label>
              <select v-model="formArticle.statut" required :disabled="isLoading">
                <option value="Brouillon">Brouillon</option>
                <option value="Publié">Publié</option>
              </select>
            </div>
          </div>
          
          <div class="form-row">
            <!-- Champ Upload Image de couverture -->
            <div class="form-group">
              <label>Image de couverture</label>
              <div class="file-upload-box" :class="{ 'disabled-box': isLoading }">
                <input type="file" accept="image/*" @change="gererUploadImage" :disabled="isLoading" />
                <span v-if="formArticle.imageNom" class="file-name">🖼️ {{ formArticle.imageNom }}</span>
              </div>
              <div v-if="formArticle.image_couverture" class="cover-preview-container">
                <img :src="formatImageUrl(formArticle.image_couverture)" alt="Aperçu" class="cover-preview-img" />
              </div>
            </div>
          </div>

          <!-- Champ Upload Vidéo conditionnel -->
          <div v-if="formArticle.type_article === 'video'" class="form-group fade-in">
            <label>Importer le fichier vidéo (.mp4, .mov, .avi...)</label>
            <div class="file-upload-box" :class="{ 'disabled-box': isLoading }">
              <input type="file" accept="video/*" @change="gererUploadVideo" :required="!idEnEdition && !formArticle.fichier_video" :disabled="isLoading" />
              <span v-if="formArticle.videoNom" class="file-name">📹 Fichier : {{ formArticle.videoNom }}</span>
            </div>
          </div>

          <div class="form-group">
            <label>Description / Contenu</label>
            <textarea v-model="formArticle.contenu" rows="4" required placeholder="Écrivez le contenu ou la description ici..." :disabled="isLoading"></textarea>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn-cancel" @click="fermerModal" :disabled="isLoading">Annuler</button>
            <button type="submit" class="btn-yellow" :disabled="isLoading">
              {{ isLoading ? 'Enregistrement...' : (idEnEdition ? 'Mettre à jour' : 'Enregistrer') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Tableau des articles & tutos -->
    <table class="admin-table">
      <thead>
        <tr>
          <th>Couverture</th>
          <th>Titre</th>
          <th>Format</th>
          <th>Auteur</th>
          <th>Date</th>
          <th>Statut</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="articlesFiltres.length === 0">
          <td colspan="7" class="text-center">Aucun contenu trouvé.</td>
        </tr>
        <tr v-for="article in articlesFiltres" :key="article.id">
          <td>
            <div class="cover-wrapper">
              <img v-if="article.image_couverture" :src="formatImageUrl(article.image_couverture)" :alt="article.titre" class="table-img" />
              <div v-else class="no-img">Pas d'image</div>
            </div>
          </td>
          <td>
            <div class="title-cell">
              <strong>{{ article.titre }}</strong>
              <small v-if="article.fichier_video" class="video-file-info">🎬 {{ article.fichier_video }}</small>
            </div>
          </td>
          <td>
            <span class="format-badge" :class="article.type_article === 'video' ? 'format-video' : 'format-texte'">
              {{ article.type_article === 'video' ? '🎥 Vidéo' : '📝 Texte' }}
            </span>
          </td>
          <td>{{ article.auteur || article.username || 'Admin' }}</td>
          <td>{{ formatDate(article.created_at) }}</td>
          <td>
            <span :class="['badge', getBadgeClass(article.statut)]">
              {{ article.statut }}
            </span>
          </td>
          <td>
            <button class="action-btn" title="Modifier" @click="ouvrirModalEdition(article)">✏️</button>
            <button class="action-btn delete-btn" title="Supprimer" @click="supprimerArticle(article.id)">🗑️</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { API_URL as API_ROOT, API_BASE_URL } from '@/services/config'

// --- CONFIGURATION API ---
const BACKEND_URL = API_BASE_URL
const API_URL = `${API_ROOT}/articles`

// Injection du token JWT d'authentification
const getAuthHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`
  }
})

// --- DONNÉES ---
const articles = ref([])
const recherche = ref('')
const isLoading = ref(false)

const afficherModal = ref(false)
const idEnEdition = ref(null)

const formArticle = ref({
  type_article: 'texte',
  titre: '',
  statut: 'Brouillon',
  contenu: '',
  image_couverture: '',
  imageNom: '',
  fichier_video: '',
  imageFichier: null,
  videoFichier: null
})

// --- APPELS API BACKEND ---
const fetchArticles = async () => {
  try {
    // Avec le token admin, le backend renvoie AUSSI les brouillons
    const response = await axios.get(API_URL, getAuthHeaders())
    articles.value = response.data
  } catch (error) {
    console.error("Erreur lors de la récupération des articles :", error)
  }
}

onMounted(() => {
  fetchArticles()
})

// --- RECHERCHE ---
const articlesFiltres = computed(() => {
  if (!recherche.value) return articles.value
  const q = recherche.value.toLowerCase()
  return articles.value.filter(a => 
    a.titre.toLowerCase().includes(q) || 
    (a.contenu && a.contenu.toLowerCase().includes(q))
  )
})

// --- GESTION UPLOAD FICHIER IMAGE ---
const gererUploadImage = (event) => {
  const fichier = event.target.files[0]
  if (fichier) {
    formArticle.value.imageFichier = fichier
    formArticle.value.imageNom = fichier.name
    formArticle.value.image_couverture = URL.createObjectURL(fichier)
  }
}

// --- GESTION UPLOAD FICHIER VIDÉO ---
const gererUploadVideo = (event) => {
  const fichier = event.target.files[0]
  if (fichier) {
    formArticle.value.videoFichier = fichier
    formArticle.value.fichier_video = fichier.name
  }
}

// --- BADGES ET FORMATAGE ---
const getBadgeClass = (statut) => {
  return statut === 'Publié' ? 'success' : 'draft'
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const options = { day: 'numeric', month: 'short', year: 'numeric' }
  return new Date(dateString).toLocaleDateString('fr-FR', options)
}

// --- GESTION DE LA MODALE ---
const ouvrirModalAjout = () => {
  idEnEdition.value = null
  formArticle.value = { 
    type_article: 'texte', 
    titre: '', 
    statut: 'Brouillon', 
    contenu: '', 
    image_couverture: '', 
    imageNom: '', 
    fichier_video: '', 
    imageFichier: null, 
    videoFichier: null 
  }
  afficherModal.value = true
}

const ouvrirModalEdition = (article) => {
  idEnEdition.value = article.id
  formArticle.value = { 
    ...article,
    imageNom: article.image_couverture ? article.image_couverture.split('/').pop() : '',
    videoNom: article.fichier_video || '',
    imageFichier: null, 
    videoFichier: null
  }
  afficherModal.value = true
}

const fermerModal = () => {
  afficherModal.value = false
  idEnEdition.value = null
}

// --- ACTIONS CRUD ---
const soumettreArticle = async () => {
  isLoading.value = true

  if (formArticle.value.type_article === 'texte') {
    formArticle.value.fichier_video = ''
    formArticle.value.videoFichier = null
  }

  const formData = new FormData()
  formData.append('titre', formArticle.value.titre)
  formData.append('type_article', formArticle.value.type_article)
  formData.append('statut', formArticle.value.statut)
  formData.append('contenu', formArticle.value.contenu)
  
  if (formArticle.value.imageFichier) {
    formData.append('image_couverture', formArticle.value.imageFichier)
  }
  if (formArticle.value.type_article === 'video' && formArticle.value.videoFichier) {
    formData.append('fichier_video', formArticle.value.videoFichier)
  }

  try {
    if (idEnEdition.value !== null) {
      await axios.put(`${API_URL}/${idEnEdition.value}`, formData, getAuthHeaders())
    } else {
      await axios.post(API_URL, formData, getAuthHeaders())
    }
    
    await fetchArticles() 
    fermerModal()
  } catch (error) {
    console.error("Erreur lors de la sauvegarde :", error)
    alert("Une erreur est survenue lors de l'enregistrement.")
  } finally {
    isLoading.value = false
  }
}

const supprimerArticle = async (id) => {
  if (confirm("Voulez-vous vraiment supprimer ce contenu ?")) {
    try {
      await axios.delete(`${API_URL}/${id}`, getAuthHeaders())
      articles.value = articles.value.filter(a => a.id !== id)
    } catch (error) {
      console.error("Erreur lors de la suppression :", error)
      alert("Impossible de supprimer cet article.")
    }
  }
}

// --- UTILITAIRE IMAGE ---
const formatImageUrl = (imagePath) => {
  if (!imagePath) return ''
  if (imagePath.startsWith('blob:')) return imagePath
  if (imagePath.startsWith('/uploads')) {
    return `${BACKEND_URL}${imagePath}`
  }
  return imagePath
}
</script>

<style scoped>
/* --- HEADER ET TABLEAU --- */
.page-header { display: flex; justify-content: space-between; margin-bottom: 25px; }
.search-input { padding: 12px 20px; border: 1px solid #e5e7eb; border-radius: 8px; width: 350px; outline: none; }
.search-input:focus { border-color: #241a4a; }

.btn-yellow { background-color: #f6a617; color: #1f1443; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 700; cursor: pointer; transition: background-color 0.2s; }
.btn-yellow:hover { background-color: #e09612; }
.btn-yellow:disabled { opacity: 0.6; cursor: not-allowed; }

.admin-table { width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.02); }
.admin-table th, .admin-table td { padding: 15px 20px; text-align: left; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
.admin-table th { background-color: #f9fafb; color: #6b7280; font-size: 12px; text-transform: uppercase; }

.text-center { text-align: center !important; color: #6b7280; font-style: italic; padding: 30px; }

/* --- IMAGES & FORMATS --- */
.cover-wrapper { width: 60px; height: 45px; border-radius: 6px; overflow: hidden; background: #f3f4f6; display: flex; align-items: center; justify-content: center; }
.table-img { width: 100%; height: 100%; object-fit: cover; }
.no-img { font-size: 10px; color: #9ca3af; text-align: center; line-height: 1.1; }

.cover-preview-container { margin-top: 6px; width: 60px; height: 45px; border-radius: 6px; overflow: hidden; border: 1px solid #d1d5db; }
.cover-preview-img { width: 100%; height: 100%; object-fit: cover; }

.title-cell { display: flex; flex-direction: column; gap: 2px; }
.video-file-info { font-size: 11px; color: #6b7280; }

.format-badge { font-size: 12px; font-weight: 600; padding: 4px 8px; border-radius: 6px; display: inline-block; }
.format-video { background: #fee2e2; color: #dc2626; }
.format-texte { background: #e0e7ff; color: #4338ca; }

/* --- BADGES ET ACTIONS --- */
.badge { padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; display: inline-block; }
.badge.success { background-color: #dcfce7; color: #15803d; }
.badge.draft { background-color: #f3f4f6; color: #4b5563; }

.action-btn { background: none; border: none; font-size: 16px; cursor: pointer; margin-right: 10px; transition: transform 0.2s; }
.action-btn:hover { transform: scale(1.2); }
.delete-btn:hover { filter: drop-shadow(0 0 2px rgba(220, 38, 38, 0.5)); }

/* --- FENÊTRE MODALE --- */
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center;
  z-index: 1000; backdrop-filter: blur(2px);
}

.modal-content {
  background: white; padding: 30px; border-radius: 12px; width: 100%; max-width: 650px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2); animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.modal-header h3 { margin: 0; color: #1f1443; font-size: 20px; }
.close-btn { background: transparent; border: none; font-size: 20px; color: #9ca3af; cursor: pointer; }
.close-btn:hover { color: #ef4444; }
.close-btn:disabled { cursor: not-allowed; opacity: 0.5; }

/* --- FORMULAIRE --- */
.modal-form { display: flex; flex-direction: column; gap: 15px; }
.form-row { display: flex; gap: 15px; }
.form-row .form-group { flex: 1; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 13px; font-weight: 600; color: #374151; }

.form-group input:not([type="file"]), .form-group select, .form-group textarea {
  padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; outline: none; width: 100%; box-sizing: border-box; font-family: inherit;
}
.form-group input:focus, .form-group select:focus, .form-group textarea:focus { border-color: #f6a617; }
.form-group input:disabled, .form-group select:disabled, .form-group textarea:disabled { background: #f3f4f6; cursor: not-allowed; }

.file-upload-box { display: flex; flex-direction: column; gap: 6px; padding: 10px; border: 1px dashed #d1d5db; border-radius: 8px; background: #f9fafb; }
.file-upload-box.disabled-box { opacity: 0.6; cursor: not-allowed; pointer-events: none; }
.file-upload-box input[type="file"] { font-size: 13px; color: #4b5563; }
.file-name { font-size: 12px; color: #15803d; font-weight: 600; }

.fade-in { animation: fadeIn 0.3s ease-in-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 15px; padding-top: 15px; border-top: 1px solid #f3f4f6; }
.btn-cancel { background: #f3f4f6; color: #4b5563; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background-color 0.2s;}
.btn-cancel:hover { background: #e5e7eb; }
.btn-cancel:disabled { opacity: 0.6; cursor: not-allowed; }
</style>