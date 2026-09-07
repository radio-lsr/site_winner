<template>
  <div class="profile-page">
    <div class="profile-container">
      <!-- Carte d'identité / Aperçu du profil -->
      <div class="profile-card">
        <div class="avatar-container">
          <img :src="user.avatar || '/OIP1.webp'" alt="Avatar" class="avatar-img" />
          <label class="avatar-upload-btn" title="Changer l'avatar">
            📷
            <input type="file" accept="image/*" @change="gererUploadAvatar" class="hidden-input" :disabled="isLoading" />
          </label>
        </div>
        
        <!-- Bouton direct pour changer la photo -->
        <label class="btn-change-photo" :class="{ 'disabled-btn': isLoading }">
          📁 Changer la photo
          <input type="file" accept="image/*" @change="gererUploadAvatar" class="hidden-input" :disabled="isLoading" />
        </label>

        <h3>{{ user.prenom }} {{ user.nom }}</h3>
        <span class="role-badge">{{ user.role }}</span>
        <p class="user-email">{{ user.email }}</p>
        
        <div class="profile-stats">
          <div class="stat-item">
            <span class="stat-value">12</span>
            <span class="stat-label">Articles</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">4</span>
            <span class="stat-label">Vidéos</span>
          </div>
        </div>
      </div>

      <!-- Formulaires de modification par onglets -->
      <div class="profile-forms">
        <div class="profile-tabs">
          <button 
            :class="['tab-btn', actifOnglet === 'infos' ? 'active' : '']" 
            @click="actifOnglet = 'infos'"
          >
            👤 Informations personnelles
          </button>
          <button 
            :class="['tab-btn', actifOnglet === 'securite' ? 'active' : '']" 
            @click="actifOnglet = 'securite'"
          >
            🔒 Sécurité & Mot de passe
          </button>
        </div>

        <!-- Section Informations personnelles -->
        <div v-if="actifOnglet === 'infos'" class="form-section fade-in">
          <form @submit.prevent="sauvegarderProfil" class="profile-form">
            <div class="form-row">
              <div class="form-group">
                <label>Prénom</label>
                <input v-model="user.prenom" type="text" required :disabled="isLoading" />
              </div>
              <div class="form-group">
                <label>Nom</label>
                <input v-model="user.nom" type="text" required :disabled="isLoading" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Email professionnel</label>
                <input v-model="user.email" type="email" required :disabled="isLoading" />
              </div>
              <div class="form-group">
                <label>Téléphone</label>
                <input v-model="user.telephone" type="tel" placeholder="+33 6 00 00 00 00" :disabled="isLoading" />
              </div>
            </div>

            <div class="form-group">
              <label>Biographie / À propos</label>
              <textarea v-model="user.bio" rows="4" placeholder="Quelques mots sur vous..." :disabled="isLoading"></textarea>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn-yellow" :disabled="isLoading">
                {{ isLoading ? 'Enregistrement...' : 'Enregistrer les modifications' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Section Sécurité & Mot de passe -->
        <div v-if="actifOnglet === 'securite'" class="form-section fade-in">
          <form @submit.prevent="modifierMotDePasse" class="profile-form">
            <div class="form-group">
              <label>Mot de passe actuel</label>
              <input v-model="passwordForm.actuel" type="password" required placeholder="••••••••" :disabled="isLoading" />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Nouveau mot de passe</label>
                <input v-model="passwordForm.nouveau" type="password" required placeholder="••••••••" :disabled="isLoading" />
              </div>
              <div class="form-group">
                <label>Confirmer le nouveau mot de passe</label>
                <input v-model="passwordForm.confirmation" type="password" required placeholder="••••••••" :disabled="isLoading" />
              </div>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn-yellow" :disabled="isLoading">
                {{ isLoading ? 'Mise à jour...' : 'Mettre à jour le mot de passe' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Notification toast de succès -->
    <div v-if="messageSucces" class="toast-notification fade-in">
      ✅ {{ messageSucces }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

// --- CONFIGURATION API ---
const API_URL = 'http://localhost:5000/api/profile'

// --- DONNÉES RÉACTIVES ---
const actifOnglet = ref('infos')
const messageSucces = ref('')
const isLoading = ref(false)

const user = ref({
  prenom: '',
  nom: '',
  email: '',
  telephone: '',
  role: '',
  bio: '',
  avatar: ''
})

const passwordForm = ref({
  actuel: '',
  nouveau: '',
  confirmation: ''
})

// --- APPELS API BACKEND ---

// 1. Récupérer les informations du profil utilisateur connecté
const fetchProfil = async () => {
  try {
    const response = await axios.get(API_URL)
    user.value = response.data
  } catch (error) {
    console.error("Erreur lors de la récupération du profil :", error)
  }
}

onMounted(() => {
  fetchProfil()
})

// 2. Upload de l'avatar avec FormData
const gererUploadAvatar = async (event) => {
  const fichier = event.target.files[0]
  if (!fichier) return

  isLoading.value = true
  const formData = new FormData()
  formData.append('avatar', fichier)

  try {
    const response = await axios.post(`${API_URL}/avatar`, formData)
    user.value.avatar = response.data.avatarUrl // Met à jour avec l'URL renvoyée par le serveur
    afficherNotification('Avatar mis à jour avec succès !')
  } catch (error) {
    console.error("Erreur lors de l'upload de l'avatar :", error)
    alert("Impossible de mettre à jour la photo de profil.")
  } finally {
    isLoading.value = false
    event.target.value = ''
  }
}

// 3. Sauvegarder les modifications du profil (PUT)
const sauvegarderProfil = async () => {
  isLoading.value = true
  try {
    await axios.put(API_URL, user.value)
    afficherNotification('Profil mis à jour avec succès !')
  } catch (error) {
    console.error("Erreur lors de la mise à jour du profil :", error)
    alert("Une erreur est survenue lors de l'enregistrement.")
  } finally {
    isLoading.value = false
  }
}

// 4. Modifier le mot de passe (PUT)
const modifierMotDePasse = async () => {
  if (passwordForm.value.nouveau !== passwordForm.value.confirmation) {
    alert('Les nouveaux mots de passe ne correspondent pas.')
    return
  }

  isLoading.value = true
  try {
    await axios.put(`${API_URL}/password`, {
      actuel: passwordForm.value.actuel,
      nouveau: passwordForm.value.nouveau
    })
    afficherNotification('Mot de passe modifié avec succès !')
    passwordForm.value = { actuel: '', nouveau: '', confirmation: '' }
  } catch (error) {
    console.error("Erreur lors du changement de mot de passe :", error)
    alert(error.response?.data?.message || 'Mot de passe actuel incorrect ou erreur serveur.')
  } finally {
    isLoading.value = false
  }
}

// --- NOTIFICATION ---
const afficherNotification = (msg) => {
  messageSucces.value = msg
  setTimeout(() => {
    messageSucces.value = ''
  }, 3500)
}
</script>

<style scoped>
.profile-page { display: flex; flex-direction: column; gap: 20px; }

.profile-container { display: flex; gap: 30px; align-items: flex-start; }

/* Carte Profil Gauche */
.profile-card { background: white; border-radius: 12px; padding: 30px; width: 300px; display: flex; flex-direction: column; align-items: center; box-shadow: 0 2px 10px rgba(0,0,0,0.02); text-align: center; flex-shrink: 0; }
.avatar-container { position: relative; width: 90px; height: 90px; border-radius: 50%; overflow: hidden; margin-bottom: 10px; border: 3px solid #241a4a; }
.avatar-img { width: 100%; height: 100%; object-fit: cover; }
.avatar-upload-btn { position: absolute; bottom: 0; right: 0; background: #241a4a; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 12px; transition: transform 0.2s; }
.avatar-upload-btn:hover { transform: scale(1.1); }
.hidden-input { display: none; }

.btn-change-photo { display: inline-block; font-size: 12px; font-weight: 600; color: #241a4a; background: #f3f6fb; padding: 6px 12px; border-radius: 6px; cursor: pointer; margin-bottom: 15px; transition: background 0.2s; }
.btn-change-photo:hover { background: #e5ebf5; }
.disabled-btn { opacity: 0.6; pointer-events: none; }

.profile-card h3 { margin: 10px 0 5px; color: #1f1443; font-size: 18px; }
.role-badge { background: #fef3c7; color: #d97706; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; }
.user-email { color: #6b7280; font-size: 13px; margin: 10px 0 20px; }

.profile-stats { display: flex; width: 100%; justify-content: space-around; border-top: 1px solid #f3f4f6; padding-top: 20px; }
.stat-item { display: flex; flex-direction: column; }
.stat-value { font-size: 18px; font-weight: 700; color: #1f1443; }
.stat-label { font-size: 11px; color: #6b7280; }

/* Formulaires Droite */
.profile-forms { flex: 1; background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.02); }

.profile-tabs { display: flex; gap: 15px; border-bottom: 1px solid #f3f4f6; margin-bottom: 25px; padding-bottom: 15px; }
.tab-btn { background: transparent; border: none; font-size: 14px; font-weight: 600; color: #6b7280; cursor: pointer; padding: 8px 12px; border-radius: 8px; transition: all 0.2s; }
.tab-btn.active { background: #f3f6fb; color: #241a4a; border-bottom: 2px solid #241a4a; }

.profile-form { display: flex; flex-direction: column; gap: 20px; }
.form-row { display: flex; gap: 20px; }
.form-row .form-group { flex: 1; }
.form-group { display: flex; flex-direction: column; gap: 8px; }
.form-group label { font-size: 13px; font-weight: 600; color: #374151; }
.form-group input, .form-group textarea { padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; outline: none; font-family: inherit; }
.form-group input:focus, .form-group textarea:focus { border-color: #241a4a; }
.form-group input:disabled, .form-group textarea:disabled { background: #f3f6fb; cursor: not-allowed; }

.form-actions { display: flex; justify-content: flex-end; margin-top: 10px; }
.btn-yellow { background-color: #f6a617; color: #1f1443; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 700; cursor: pointer; transition: background-color 0.2s; }
.btn-yellow:hover { background-color: #e09612; }
.btn-yellow:disabled { opacity: 0.6; cursor: not-allowed; }

/* Animations & Toast */
.fade-in { animation: fadeIn 0.3s ease-in-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }

.toast-notification { position: fixed; bottom: 30px; right: 30px; background: #15803d; color: white; padding: 12px 20px; border-radius: 8px; font-weight: 600; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 2000; }
</style>