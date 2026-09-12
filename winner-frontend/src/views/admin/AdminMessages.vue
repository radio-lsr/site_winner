<template>
  <div class="page-section">
    <div class="page-header">
      <h2 class="page-title">
        ✉️ Messages & Devis
        <span v-if="messagesNonLus > 0" class="unread-total">{{ messagesNonLus }} non lu(s)</span>
      </h2>
      <button class="btn-refresh" @click="fetchMessages" :disabled="isLoading">🔄 Actualiser</button>
    </div>

    <!-- Modale de lecture d'un message -->
    <div v-if="messageSelectionne" class="modal-overlay" @click.self="fermerModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Message de {{ messageSelectionne.nom }}</h3>
          <button class="close-btn" @click="fermerModal">✖</button>
        </div>

        <div class="details-body">
          <div class="info-grid">
            <div class="info-item">
              <span class="label">📧 Email :</span>
              <strong>{{ messageSelectionne.email }}</strong>
            </div>
            <div class="info-item">
              <span class="label">📞 Téléphone :</span>
              <span>{{ messageSelectionne.telephone || 'Non renseigné' }}</span>
            </div>
            <div class="info-item full-width">
              <span class="label">🕐 Reçu le :</span>
              <span>{{ formatDate(messageSelectionne.date) }}</span>
            </div>
          </div>

          <div class="message-body">
            <span class="label">Message :</span>
            <p class="message-texte">{{ messageSelectionne.message }}</p>
          </div>

          <div class="modal-actions">
            <a class="btn-outline" :href="'mailto:' + messageSelectionne.email">✉️ Répondre par email</a>
            <button
              v-if="messageSelectionne.lu"
              class="btn-outline"
              @click="marquer(messageSelectionne, false)">
              Marquer comme non lu
            </button>
            <button
              v-else
              class="btn-yellow"
              @click="marquer(messageSelectionne, true)">
              ✅ Marquer comme traité
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Tableau des messages -->
    <table class="admin-table">
      <thead>
        <tr>
          <th>Statut</th>
          <th>Expéditeur</th>
          <th>Contact</th>
          <th>Message</th>
          <th>Date</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="messages.length === 0">
          <td colspan="6" style="text-align: center; color: #6b7280; padding: 30px;">
            Aucun message reçu pour le moment.
          </td>
        </tr>
        <tr
          v-else
          v-for="msg in messages"
          :key="msg.id"
          :class="{ 'ligne-non-lue': !msg.lu }"
          @click="ouvrirMessage(msg)">
          <td>
            <span :class="['badge', msg.lu ? 'read' : 'unread']">
              {{ msg.lu ? 'Traité' : 'Nouveau' }}
            </span>
          </td>
          <td><strong>{{ msg.nom }}</strong></td>
          <td>
            <div class="client-info">
              <span class="client-name">{{ msg.email }}</span>
              <small class="client-contact">{{ msg.telephone || '—' }}</small>
            </div>
          </td>
          <td class="address-cell">{{ apercu(msg.message) }}</td>
          <td>{{ formatDate(msg.date) }}</td>
          <td class="actions-cell" @click.stop>
            <button class="action-btn" title="Lire le message" @click="ouvrirMessage(msg)">👁️</button>
            <button
              class="action-btn"
              :title="msg.lu ? 'Marquer non lu' : 'Marquer traité'"
              @click="marquer(msg, !msg.lu)">
              {{ msg.lu ? '📭' : '✅' }}
            </button>
            <button class="action-btn delete-btn" title="Supprimer" @click="supprimerMessage(msg.id)">🗑️</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { API_URL } from '@/services/config'

const MESSAGES_URL = `${API_URL}/messages`

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
})

const messages = ref([])
const isLoading = ref(false)
const messageSelectionne = ref(null)

const messagesNonLus = computed(() => messages.value.filter(m => !m.lu).length)

const fetchMessages = async () => {
  isLoading.value = true
  try {
    const response = await axios.get(MESSAGES_URL, getAuthHeaders())
    messages.value = response.data
  } catch (error) {
    console.error('Erreur lors de la récupération des messages :', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchMessages()
})

const ouvrirMessage = async (msg) => {
  messageSelectionne.value = msg
  // Ouvrir un message le marque automatiquement comme lu
  if (!msg.lu) {
    await marquer(msg, true)
  }
}

const marquer = async (msg, lu) => {
  try {
    await axios.put(`${MESSAGES_URL}/${msg.id}`, { lu }, getAuthHeaders())
    msg.lu = lu
  } catch (error) {
    console.error('Erreur lors de la mise à jour du message :', error)
  }
}

const supprimerMessage = async (id) => {
  if (!confirm('Supprimer définitivement ce message ?')) return
  try {
    await axios.delete(`${MESSAGES_URL}/${id}`, getAuthHeaders())
    messages.value = messages.value.filter(m => m.id !== id)
    if (messageSelectionne.value?.id === id) messageSelectionne.value = null
  } catch (error) {
    console.error('Erreur lors de la suppression :', error)
    alert('Impossible de supprimer le message.')
  }
}

const fermerModal = () => {
  messageSelectionne.value = null
}

const apercu = (texte) => {
  if (!texte) return ''
  return texte.length > 80 ? texte.slice(0, 80) + '…' : texte
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
.page-title { margin: 0; color: #1f1443; font-size: 20px; display: flex; align-items: center; gap: 12px; }
.unread-total { background: #E31E24; color: white; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 20px; }
.btn-refresh { background: #f3f6fb; border: 1px solid #d1d5db; padding: 10px 16px; border-radius: 8px; cursor: pointer; font-weight: 600; }
.btn-refresh:disabled { opacity: 0.6; cursor: not-allowed; }

.admin-table { width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.02); }
.admin-table th, .admin-table td { padding: 14px 18px; text-align: left; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
.admin-table th { background-color: #f9fafb; color: #6b7280; font-size: 12px; text-transform: uppercase; }
.admin-table tbody tr { cursor: pointer; transition: background 0.15s; }
.admin-table tbody tr:hover { background: #f9fafb; }
.ligne-non-lue { background: #fef9ec; font-weight: 600; }
.ligne-non-lue:hover { background: #fdf3d8; }

.client-info { display: flex; flex-direction: column; }
.client-name { font-weight: 500; color: #1f1443; }
.client-contact { color: #6b7280; font-size: 12px; }
.address-cell { max-width: 280px; font-size: 13px; color: #4b5563; }

.badge { padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; display: inline-block; }
.badge.unread { background-color: #fee2e2; color: #dc2626; }
.badge.read { background-color: #dcfce7; color: #15803d; }

.actions-cell { display: flex; gap: 8px; }
.action-btn { background: none; border: none; font-size: 16px; cursor: pointer; transition: transform 0.2s; }
.action-btn:hover { transform: scale(1.2); }
.delete-btn:hover { filter: drop-shadow(0 0 2px rgba(220, 38, 38, 0.5)); }

.modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; backdrop-filter: blur(2px); }
.modal-content { background: white; padding: 25px 30px; border-radius: 12px; width: 100%; max-width: 560px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); animation: slideDown 0.3s ease-out; }
@keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.modal-header h3 { margin: 0; color: #1f1443; font-size: 18px; }
.close-btn { background: transparent; border: none; font-size: 18px; color: #9ca3af; cursor: pointer; }

.details-body { display: flex; flex-direction: column; gap: 15px; }
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: #f9fafb; padding: 15px; border-radius: 8px; }
.info-item { display: flex; flex-direction: column; gap: 4px; font-size: 13px; }
.info-item.full-width { grid-column: span 2; }
.label { color: #6b7280; font-weight: 600; font-size: 11px; text-transform: uppercase; }

.message-body { background: #f9fafb; padding: 15px; border-radius: 8px; display: flex; flex-direction: column; gap: 8px; }
.message-texte { margin: 0; white-space: pre-wrap; line-height: 1.6; color: #1f2937; font-size: 14px; }

.modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 5px; }
.btn-yellow { background-color: #f6a617; color: #1f1443; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 700; cursor: pointer; text-decoration: none; }
.btn-outline { background: transparent; border: 1px solid #6b7280; padding: 10px 18px; border-radius: 8px; cursor: pointer; font-weight: 600; color: #1f1443; text-decoration: none; }
</style>
