<template>
  <div class="page-section">
    <div class="page-header">
      <input 
        type="text" 
        placeholder="🔍 Rechercher un utilisateur..." 
        class="search-input" 
        v-model="recherche" 
        :disabled="isLoading"
      />
      <button class="btn-yellow" @click="ouvrirModalAjout" :disabled="isLoading">➕ Ajouter un utilisateur</button>
    </div>

    <!-- Notification / Message de succès -->
    <div v-if="messageNotification" class="notification-banner">
      {{ messageNotification }}
    </div>

    <!-- Fenêtre Modale (Ajout / Modification) -->
    <div v-if="afficherModal" class="modal-overlay" @click.self="fermerModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ idEnEdition ? "Modifier l'utilisateur" : "Ajouter un nouvel utilisateur" }}</h3>
          <button class="close-btn" @click="fermerModal" :disabled="isLoading">✖</button>
        </div>
        
        <form @submit.prevent="soumettreUtilisateur" class="modal-form">
          <div class="form-group">
            <label>Nom complet</label>
            <input v-model="formUtilisateur.nom" type="text" required placeholder="Ex: Marie Curie" :disabled="isLoading" />
          </div>

          <div class="form-group">
            <label>Adresse Email</label>
            <input v-model="formUtilisateur.email" type="email" required placeholder="Ex: marie.curie@winner.com" :disabled="isLoading" />
          </div>

          <!-- Champ Upload de Fichier Photo -->
          <div class="form-group">
            <label>Photo de profil</label>
            <div class="file-upload-wrapper">
              <input type="file" @change="gererChangementFichier" accept="image/*" id="file-input-user" class="file-input-hidden" :disabled="isLoading" />
              <label for="file-input-user" class="file-upload-btn">📁 Choisir un fichier</label>
              <span class="file-name">{{ nomFichierSelectionne || 'Aucun fichier choisi' }}</span>
            </div>
            <small class="form-hint">Formats acceptés : JPG, PNG, WEBP. (Laisser vide pour conserver l'avatar par défaut).</small>
            
            <!-- Aperçu de la photo -->
            <div v-if="formUtilisateur.photo" class="preview-container">
              <!-- On utilise une URL locale si on vient de choisir un fichier, sinon l'URL du serveur -->
              <img :src="formUtilisateur.photo.startsWith('blob:') ? formUtilisateur.photo : getImageUrl(formUtilisateur.photo)" alt="Aperçu" class="avatar-preview" />
              <span class="preview-label">Aperçu</span>
            </div>
          </div>

          <!-- Champ Mot de passe -->
          <div class="form-group">
            <label>
              {{ idEnEdition ? 'Nouveau mot de passe (laisser vide pour ne pas modifier)' : 'Mot de passe temporaire' }}
            </label>
            <div class="password-group">
              <input 
                v-model="formUtilisateur.password" 
                :type="afficherMotDePasse ? 'text' : 'password'" 
                :placeholder="idEnEdition ? 'Laisser vide si inchangé' : 'Ex: Temp#2026 (généré si vide)'" 
                :disabled="isLoading"
              />
              <button type="button" class="toggle-pwd-btn" @click="afficherMotDePasse = !afficherMotDePasse" :disabled="isLoading">
                {{ afficherMotDePasse ? '🙈' : '👁️' }}
              </button>
            </div>
            <small v-if="!idEnEdition" class="form-hint">Si vide, un mot de passe sécurisé sera généré automatiquement et envoyé par e-mail.</small>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Rôle</label>
              <select v-model="formUtilisateur.role" :disabled="isLoading">
                <option value="Utilisateur">Utilisateur</option>
                <option value="Modérateur">Modérateur</option>
              </select>
            </div>

            <div class="form-group">
              <label>Statut</label>
              <select v-model="formUtilisateur.statut" required :disabled="isLoading">
                <option value="Actif">Actif</option>
                <option value="Suspendu">Suspendu</option>
              </select>
            </div>
          </div>

          <!-- Option de sécurité : Forcer le changement -->
          <div class="form-group checkbox-group" v-if="!idEnEdition || formUtilisateur.doitChangerMotDePasse">
            <label class="checkbox-label">
              <input type="checkbox" v-model="formUtilisateur.doitChangerMotDePasse" :disabled="isLoading" />
              <span>Forcer le changement de mot de passe à la première connexion</span>
            </label>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn-cancel" @click="fermerModal" :disabled="isLoading">Annuler</button>
            <button type="submit" class="btn-yellow" :disabled="isLoading">
              {{ isLoading ? 'Traitement en cours...' : (idEnEdition ? 'Mettre à jour' : 'Enregistrer et envoyer l\'email') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Tableau des utilisateurs -->
    <table class="admin-table">
      <thead>
        <tr>
          <th>Utilisateur</th>
          <th>Rôle</th>
          <th>Date d'inscription</th>
          <th>Sécurité / Mot de passe</th>
          <th>Statut</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="utilisateursFiltres.length === 0">
          <td colspan="6" class="text-center">Aucun utilisateur trouvé.</td>
        </tr>
        <tr v-for="utilisateur in utilisateursFiltres" :key="utilisateur.id">
          <td>
            <div class="user-cell">
              <!-- Utilisation de getImageUrl pour afficher la photo venant du serveur -->
              <img :src="getImageUrl(utilisateur.photo)" alt="Avatar" class="user-avatar" />
              <div class="user-info">
                <span class="user-name">{{ utilisateur.nom }}</span>
                <small class="user-email">{{ utilisateur.email }}</small>
              </div>
            </div>
          </td>
          <td>
            <span class="badge-role role-user">
              {{ utilisateur.role }}
            </span>
          </td>
          <td>{{ utilisateur.dateInscription }}</td>
          <td>
            <span v-if="utilisateur.doitChangerMotDePasse" class="badge-pwd pwd-pending">
              🔑 À changer (1ère connexion)
            </span>
            <span v-else class="badge-pwd pwd-updated">
              🔒 Mot de passe défini
            </span>
          </td>
          <td>
            <span :class="['badge-status', getStatutClass(utilisateur.statut)]">
              {{ utilisateur.statut }}
            </span>
          </td>
          <td>
            <button class="action-btn" title="Modifier" @click="ouvrirModalEdition(utilisateur)" :disabled="isLoading">✏️</button>
            <button class="action-btn delete-btn" title="Supprimer" @click="supprimerUtilisateur(utilisateur.id)" :disabled="isLoading">🗑️</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

// --- CONFIGURATION API ---
const API_URL = 'http://localhost:5000/api/user' 
const BACKEND_URL = 'http://localhost:5000' 

const getConfig = () => {
  const token = localStorage.getItem('token')
  return {
    headers: {
      Authorization: `Bearer ${token}` 
    }
  }
}

const getImageUrl = (path) => {
  if (!path) return '/OIP1.webp' // Image par défaut si vide
  if (path.startsWith('http')) return path 
  
  // S'assure qu'il y a toujours un slash entre l'URL du backend et le chemin
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${BACKEND_URL}${cleanPath}` 
}

const utilisateurs = ref([])
const recherche = ref('')
const afficherModal = ref(false)
const idEnEdition = ref(null)
const afficherMotDePasse = ref(false)
const messageNotification = ref('')
const nomFichierSelectionne = ref('')
const fichierSelectionne = ref(null)
const isLoading = ref(false)

const formUtilisateur = ref({
  nom: '',
  email: '',
  role: 'Utilisateur',
  statut: 'Actif',
  password: '',
  doitChangerMotDePasse: true,
  photo: ''
})

const fetchUtilisateurs = async () => {
  isLoading.value = true
  try {
    const response = await axios.get(API_URL, getConfig())
    utilisateurs.value = response.data
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs :", error)
    if (error.response?.status === 401) {
      alert("Votre session a expiré. Veuillez vous reconnecter.")
    }
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchUtilisateurs()
})

const gererChangementFichier = (event) => {
  const fichier = event.target.files[0]
  if (fichier) {
    fichierSelectionne.value = fichier
    nomFichierSelectionne.value = fichier.name
    formUtilisateur.value.photo = URL.createObjectURL(fichier)
  }
}

const utilisateursFiltres = computed(() => {
  if (!recherche.value) return utilisateurs.value
  const q = recherche.value.toLowerCase()
  return utilisateurs.value.filter(u => 
    u.nom.toLowerCase().includes(q) || 
    u.email.toLowerCase().includes(q)
  )
})

const getStatutClass = (statut) => {
  return statut === 'Actif' ? 'status-active' : 'status-suspended'
}

const ouvrirModalAjout = () => {
  idEnEdition.value = null
  nomFichierSelectionne.value = ''
  fichierSelectionne.value = null
  formUtilisateur.value = { 
    nom: '', 
    email: '', 
    role: 'Utilisateur', 
    statut: 'Actif', 
    password: '', 
    doitChangerMotDePasse: true,
    photo: '' 
  }
  afficherMotDePasse.value = false
  afficherModal.value = true
}

const ouvrirModalEdition = (utilisateur) => {
  idEnEdition.value = utilisateur.id
  nomFichierSelectionne.value = ''
  fichierSelectionne.value = null
  formUtilisateur.value = { ...utilisateur, password: '' }
  afficherMotDePasse.value = false
  afficherModal.value = true
}

const fermerModal = () => {
  afficherModal.value = false
  idEnEdition.value = null
  nomFichierSelectionne.value = ''
  fichierSelectionne.value = null
}

const soumettreUtilisateur = async () => {
  isLoading.value = true
  const formData = new FormData()
  formData.append('nom', formUtilisateur.value.nom)
  formData.append('email', formUtilisateur.value.email)
  formData.append('role', formUtilisateur.value.role)
  formData.append('statut', formUtilisateur.value.statut)
  formData.append('doitChangerMotDePasse', formUtilisateur.value.doitChangerMotDePasse)
  
  if (formUtilisateur.value.password) {
    formData.append('password', formUtilisateur.value.password)
  }
  
  if (fichierSelectionne.value) {
    formData.append('photo', fichierSelectionne.value)
  }

  try {
    if (idEnEdition.value !== null) {
      await axios.put(`${API_URL}/${idEnEdition.value}`, formData, getConfig())
      afficherNotification(`Utilisateur ${formUtilisateur.value.nom} mis à jour avec succès.`)
    } else {
      await axios.post(API_URL, formData, getConfig())
      afficherNotification(`✉️ E-mail envoyé à ${formUtilisateur.value.email} avec le mot de passe temporaire.`)
    }
    
    await fetchUtilisateurs()
    fermerModal()
  } catch (error) {
    console.error("Erreur lors de la soumission :", error)
    alert(error.response?.data?.message || "Une erreur est survenue lors de l'enregistrement.")
  } finally {
    isLoading.value = false
  }
}

const supprimerUtilisateur = async (id) => {
  if (confirm("Voulez-vous vraiment supprimer cet utilisateur ?")) {
    isLoading.value = true
    try {
      await axios.delete(`${API_URL}/${id}`, getConfig())
      utilisateurs.value = utilisateurs.value.filter(u => u.id !== id)
      afficherNotification("Utilisateur supprimé avec succès.")
    } catch (error) {
      console.error("Erreur lors de la suppression :", error)
      alert("Impossible de supprimer cet utilisateur.")
    } finally {
      isLoading.value = false
    }
  }
}

const afficherNotification = (texte) => {
  messageNotification.value = texte
  setTimeout(() => {
    messageNotification.value = ''
  }, 5000)
}
</script>

<style scoped>
/* --- NOTIFICATION BANNER --- */
.notification-banner {
  background-color: #dcfce7;
  color: #15803d;
  padding: 12px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-weight: 600;
  border: 1px solid #bbf7d0;
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}

/* --- HEADER ET TABLEAU --- */
.page-header { display: flex; justify-content: space-between; margin-bottom: 25px; }
.search-input { padding: 12px 20px; border: 1px solid #e5e7eb; border-radius: 8px; width: 350px; outline: none; }
.search-input:focus { border-color: #f6a617; }
.search-input:disabled { background-color: #f3f4f6; cursor: not-allowed; }

.btn-yellow { background-color: #f6a617; color: #1f1443; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 700; cursor: pointer; transition: background-color 0.2s; }
.btn-yellow:hover { background-color: #e09612; }
.btn-yellow:disabled { opacity: 0.6; cursor: not-allowed; }

.admin-table { width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.02); }
.admin-table th, .admin-table td { padding: 16px 20px; text-align: left; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
.admin-table th { background-color: #f9fafb; color: #6b7280; font-size: 12px; text-transform: uppercase; }

.text-center { text-align: center !important; color: #6b7280; font-style: italic; }

/* --- CELLULES UTILISATEUR & AVATAR --- */
.user-cell { display: flex; align-items: center; gap: 12px; }
.user-avatar { width: 42px; height: 42px; border-radius: 50%; object-fit: cover; border: 2px solid #e5e7eb; flex-shrink: 0; }
.user-info { display: flex; flex-direction: column; gap: 2px; }
.user-name { font-weight: 600; color: #1f1443; }
.user-email { font-size: 12px; color: #6b7280; }

.badge-role { padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; display: inline-block; }
.role-user { background-color: #e0f2fe; color: #0369a1; }

.badge-pwd { padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; display: inline-block; }
.pwd-pending { background-color: #fef3c7; color: #b45309; }
.pwd-updated { background-color: #f3f4f6; color: #374151; }

.badge-status { padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; display: inline-block; }
.status-active { background-color: #dcfce7; color: #15803d; }
.status-suspended { background-color: #fee2e2; color: #dc2626; }

.action-btn { background: none; border: none; font-size: 16px; cursor: pointer; margin-right: 10px; transition: transform 0.2s; }
.action-btn:hover { transform: scale(1.2); }
.action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.delete-btn:hover { filter: drop-shadow(0 0 2px rgba(220, 38, 38, 0.5)); }

/* --- FENÊTRE MODALE --- */
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center;
  z-index: 1000; backdrop-filter: blur(2px);
}

.modal-content {
  background: white; 
  padding: 30px; 
  border-radius: 12px; 
  width: 100%; 
  max-width: 500px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2); 
  animation: slideDown 0.3s ease-out;
  
  /* --- AJOUT POUR LE SCROLL --- */
  max-height: 90vh; /* Empêche la modale de dépasser la hauteur de l'écran */
  overflow-y: auto; /* Ajoute une barre de défilement verticale si le contenu déborde */
}

/* Optionnel : Personnalisation de la barre de défilement (Chrome, Edge, Safari) */
.modal-content::-webkit-scrollbar {
  width: 8px;
}
.modal-content::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 12px;
}
.modal-content::-webkit-scrollbar-thumb {
  background-color: #d1d5db;
  border-radius: 12px;
  border: 2px solid #f3f4f6;
}
.modal-content::-webkit-scrollbar-thumb:hover {
  background-color: #9ca3af;
}
/* ---------------------------- */

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.modal-header h3 { margin: 0; color: #1f1443; font-size: 20px; }
.close-btn { background: transparent; border: none; font-size: 20px; color: #9ca3af; cursor: pointer; }
.close-btn:hover { color: #ef4444; }
.close-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* --- FORMULAIRE & UPLOAD DE FICHIER --- */
.modal-form { display: flex; flex-direction: column; gap: 15px; }
.form-row { display: flex; gap: 15px; }
.form-row .form-group { flex: 1; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 13px; font-weight: 600; color: #374151; }

.file-upload-wrapper { display: flex; align-items: center; gap: 12px; }
.file-input-hidden { display: none; }
.file-upload-btn {
  background-color: #f3f4f6; color: #374151; border: 1px solid #d1d5db; padding: 8px 14px;
  border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: background-color 0.2s;
}
.file-upload-btn:hover { background-color: #e5e7eb; }
.file-name { font-size: 13px; color: #6b7280; font-style: italic; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 250px; }

.preview-container { display: flex; align-items: center; gap: 10px; margin-top: 5px; }
.avatar-preview { width: 45px; height: 45px; border-radius: 50%; object-fit: cover; border: 2px solid #f6a617; }
.preview-label { font-size: 12px; color: #6b7280; font-style: italic; }

.password-group { position: relative; display: flex; align-items: center; }
.password-group input { width: 100%; padding-right: 40px; }
.toggle-pwd-btn { position: absolute; right: 10px; background: none; border: none; cursor: pointer; font-size: 16px; }

.form-hint { font-size: 11px; color: #6b7280; font-style: italic; }

.checkbox-group { margin-top: 5px; }
.checkbox-label { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px; font-weight: 500; color: #374151; }
.checkbox-label input[type="checkbox"] { width: 16px; height: 16px; cursor: pointer; accent-color: #f6a617; }

.form-group input:not([type="file"]), .form-group select {
  padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; outline: none; width: 100%; box-sizing: border-box; font-family: inherit;
}
.form-group input:focus, .form-group select:focus { border-color: #f6a617; }
.form-group input:disabled, .form-group select:disabled { background-color: #f3f4f6; color: #6b7280; cursor: not-allowed; }

.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 15px; padding-top: 15px; border-top: 1px solid #f3f4f6; }
.btn-cancel { background: #f3f4f6; color: #4b5563; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background-color 0.2s;}
.btn-cancel:hover { background: #e5e7eb; }
.btn-cancel:disabled { opacity: 0.5; cursor: not-allowed; }
</style>