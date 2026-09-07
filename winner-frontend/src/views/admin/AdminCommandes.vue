<template>
  <div class="page-section">
    <div class="page-header">
      <input type="text" placeholder="🔍 Rechercher une commande..." class="search-input" v-model="recherche" />
      <button class="btn-outline">Filtrer par date</button>
    </div>

    <!-- Modale de Détails & Attributs (Livreur / Statut) -->
    <div v-if="afficherModal" class="modal-overlay" @click.self="fermerModal">
      <div class="modal-content" v-if="commandeSelectionnee">
        <div class="modal-header">
          <h3>Détails de la commande {{ commandeSelectionnee.ref }}</h3>
          <button class="close-btn" @click="fermerModal">✖</button>
        </div>

        <div class="details-body">
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Client :</span>
              <strong>{{ commandeSelectionnee.client }}</strong>
            </div>
            <div class="info-item">
              <span class="label">Contact :</span>
              <span>📞 {{ commandeSelectionnee.contact }}</span>
            </div>
            <div class="info-item full-width">
              <span class="label">Adresse de livraison :</span>
              <span>📍 {{ commandeSelectionnee.adresse }}</span>
            </div>
            <div class="info-item">
              <span class="label">Montant total :</span>
              <!-- Vérification de sécurité avec ?. au cas où le montant ne serait pas encore chargé en nombre -->
              <strong class="price">{{ Number(commandeSelectionnee.montant).toFixed(2) }} $</strong>
            </div>
            <div class="info-item">
              <span class="label">Date :</span>
              <span>{{ commandeSelectionnee.date }}</span>
            </div>
          </div>

          <hr class="divider" />

          <!-- Formulaire de gestion administrative -->
          <form @submit.prevent="sauvegarderCommande" class="admin-form">
            <div class="form-group">
              <label>Nom du livreur assigné</label>
              <input 
                v-model="formCommande.livreur" 
                type="text" 
                placeholder="Ex: Alain Mukendi"
                :disabled="commandeSelectionnee.statut === 'Annulée' || isLoading"
              />
            </div>

            <div class="form-group">
              <label>Statut de la commande</label>
              <select v-model="formCommande.statut" :disabled="isLoading">
                <option value="En attente">En attente</option>
                <option value="En cours">En cours de livraison</option>
                <option value="Livrée">Livrée</option>
                <option value="Annulée">Annulée</option>
              </select>
            </div>

            <div class="modal-actions">
              <button 
                type="button" 
                class="btn-danger" 
                v-if="commandeSelectionnee.statut !== 'Annulée'"
                @click="annulerDepuisModale"
                :disabled="isLoading"
              >
                🚫 Annuler la commande
              </button>
              <button type="submit" class="btn-yellow" :disabled="isLoading">
                {{ isLoading ? 'Enregistrement...' : 'Enregistrer les modifications' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Tableau des commandes -->
    <table class="admin-table">
      <thead>
        <tr>
          <th>Réf. Commande</th>
          <th>Date</th>
          <th>Client & Contact</th>
          <th>Adresse</th>
          <th>Montant</th>
          <th>Livreur</th>
          <th>Statut</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="commandesFiltrees.length === 0">
          <td colspan="8" style="text-align: center; color: #6b7280; padding: 30px;">
            Aucune commande trouvée.
          </td>
        </tr>
        <tr v-else v-for="cmd in commandesFiltrees" :key="cmd.id">
          <td><strong>{{ cmd.ref }}</strong></td>
          <td>{{ cmd.date }}</td>
          <td>
            <div class="client-info">
              <span class="client-name">{{ cmd.client }}</span>
              <small class="client-contact">{{ cmd.contact }}</small>
            </div>
          </td>
          <td class="address-cell">{{ cmd.adresse }}</td>
          <td><strong>{{ Number(cmd.montant).toFixed(2) }} $</strong></td>
          <td>
            <span v-if="cmd.livreur" class="driver-badge">🛵 {{ cmd.livreur }}</span>
            <span v-else class="text-muted">Non assigné</span>
          </td>
          <td>
            <span :class="['badge', getBadgeClass(cmd.statut)]">
              {{ cmd.statut }}
            </span>
          </td>
          <td class="actions-cell">
            <button class="action-btn" title="Voir détails / Editer" @click="ouvrirDetails(cmd)">👁️</button>
            <button 
              class="action-btn cancel-btn" 
              title="Annuler la commande" 
              v-if="cmd.statut !== 'Annulée'"
              @click="annulerCommande(cmd.id)"
            >
              🚫
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios' // Ajout d'Axios pour les requêtes HTTP

// --- ÉTATS GLOBAUX ---
const commandes = ref([])
const recherche = ref('')
const isLoading = ref(false)

// --- ÉTATS MODALE ---
const afficherModal = ref(false)
const commandeSelectionnee = ref(null)
const formCommande = ref({
  livreur: '',
  statut: ''
})

// Configuration de l'URL de base (à adapter si votre route backend est différente)
const API_URL = 'http://localhost:5000/api/commandes'

// --- APPELS API (BACKEND) ---

// 1. Récupérer toutes les commandes au chargement
const fetchCommandes = async () => {
  try {
    const response = await axios.get(API_URL)
    commandes.value = response.data
  } catch (error) {
    console.error("Erreur lors de la récupération des commandes:", error)
  }
}

// 2. Mettre à jour une commande (Livreur / Statut)
const sauvegarderCommande = async () => {
  if (!commandeSelectionnee.value) return

  isLoading.value = true
  try {
    const payload = {
      livreur: formCommande.value.livreur,
      statut: formCommande.value.statut
    }

    // Appel PUT vers le backend
    await axios.put(`${API_URL}/${commandeSelectionnee.value.id}`, payload)
    
    // Mise à jour de l'affichage local si succès
    commandeSelectionnee.value.livreur = formCommande.value.livreur
    commandeSelectionnee.value.statut = formCommande.value.statut
    
    fermerModal()
  } catch (error) {
    console.error("Erreur lors de la mise à jour :", error)
    alert("Une erreur est survenue lors de la sauvegarde.")
  } finally {
    isLoading.value = false
  }
}

// 3. Annuler une commande directement depuis le tableau
const annulerCommande = async (id) => {
  if (confirm("Êtes-vous sûr de vouloir annuler cette commande ?")) {
    try {
      // Appel PUT pour changer uniquement le statut
      await axios.put(`${API_URL}/${id}`, { statut: 'Annulée' })
      
      // Mise à jour de l'état local
      const cmd = commandes.value.find(c => c.id === id)
      if (cmd) {
        cmd.statut = 'Annulée'
      }
    } catch (error) {
      console.error("Erreur lors de l'annulation :", error)
      alert("Impossible d'annuler la commande.")
    }
  }
}

// --- LOGIQUE INTERNE ---

onMounted(() => {
  // Déclenchement de la requête API au montage du composant
  fetchCommandes()
})

const commandesFiltrees = computed(() => {
  if (!recherche.value) return commandes.value
  const q = recherche.value.toLowerCase()
  return commandes.value.filter(c => 
    (c.ref && c.ref.toLowerCase().includes(q)) ||
    (c.client && c.client.toLowerCase().includes(q)) ||
    (c.contact && c.contact.toLowerCase().includes(q))
  )
})

const getBadgeClass = (statut) => {
  switch (statut) {
    case 'En attente': return 'pending'
    case 'En cours': return 'in-progress'
    case 'Livrée': return 'success'
    case 'Annulée': return 'cancelled'
    default: return ''
  }
}

const ouvrirDetails = (commande) => {
  commandeSelectionnee.value = commande
  formCommande.value = {
    livreur: commande.livreur || '',
    statut: commande.statut
  }
  afficherModal.value = true
}

const fermerModal = () => {
  afficherModal.value = false
  commandeSelectionnee.value = null
}

const annulerDepuisModale = async () => {
  if (confirm("Êtes-vous sûr de vouloir annuler cette commande ?")) {
    formCommande.value.statut = 'Annulée'
    await sauvegarderCommande() // Réutilise la fonction d'API existante
  }
}
</script>

<style scoped>
/* AUCUNE MODIFICATION DANS LE STYLE - Tout est conservé à l'identique */
.page-header { display: flex; justify-content: space-between; margin-bottom: 25px; }
.search-input { padding: 12px 20px; border: 1px solid #e5e7eb; border-radius: 8px; width: 350px; outline: none; }
.btn-outline { background: transparent; border: 1px solid #6b7280; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 600; }

.admin-table { width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.02); }
.admin-table th, .admin-table td { padding: 16px 20px; text-align: left; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
.admin-table th { background-color: #f9fafb; color: #6b7280; font-size: 12px; text-transform: uppercase; }

.client-info { display: flex; flex-direction: column; }
.client-name { font-weight: 600; color: #1f1443; }
.client-contact { color: #6b7280; font-size: 12px; }
.address-cell { max-width: 220px; font-size: 13px; color: #4b5563; }
.driver-badge { font-size: 13px; color: #1f1443; font-weight: 500; }
.text-muted { color: #9ca3af; font-size: 13px; font-style: italic; }

.badge { padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; display: inline-block; }
.badge.pending { background-color: #fef3c7; color: #d97706; }
.badge.in-progress { background-color: #dbeafe; color: #1d4ed8; }
.badge.success { background-color: #dcfce7; color: #15803d; }
.badge.cancelled { background-color: #fee2e2; color: #dc2626; }

.actions-cell { display: flex; gap: 8px; }
.action-btn { background: none; border: none; font-size: 16px; cursor: pointer; transition: transform 0.2s; }
.action-btn:hover { transform: scale(1.2); }
.cancel-btn:hover { filter: drop-shadow(0 0 2px rgba(220, 38, 38, 0.5)); }

.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center;
  z-index: 1000; backdrop-filter: blur(2px);
}

.modal-content {
  background: white; padding: 25px 30px; border-radius: 12px; width: 100%; max-width: 550px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2); animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.modal-header h3 { margin: 0; color: #1f1443; font-size: 18px; }
.close-btn { background: transparent; border: none; font-size: 18px; color: #9ca3af; cursor: pointer; }

.details-body { display: flex; flex-direction: column; gap: 15px; }
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: #f9fafb; padding: 15px; border-radius: 8px; }
.info-item { display: flex; flex-direction: column; gap: 4px; font-size: 13px; }
.info-item.full-width { grid-column: span 2; }
.info-item .label { color: #6b7280; font-weight: 600; font-size: 11px; text-transform: uppercase; }
.price { color: #1f1443; font-size: 15px; }

.divider { border: none; border-top: 1px solid #f3f4f6; margin: 10px 0; }

.admin-form { display: flex; flex-direction: column; gap: 15px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 13px; font-weight: 600; color: #374151; }
.form-group input, .form-group select { padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; outline: none; }

.modal-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 15px; }
.btn-yellow { background-color: #f6a617; color: #1f1443; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 700; cursor: pointer; }
.btn-danger { background-color: #fee2e2; color: #dc2626; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 600; cursor: pointer; }
.btn-danger:hover { background-color: #fca5a5; }

/* Désactivation visuelle des boutons en cours de chargement */
button:disabled { opacity: 0.6; cursor: not-allowed; }
input:disabled, select:disabled { background-color: #f3f4f6; cursor: not-allowed; }
</style>