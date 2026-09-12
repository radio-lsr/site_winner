// État partagé des notifications du panneau d'administration :
//  - messagesNonLus      : badge de l'enveloppe (navbar + sidebar)
//  - commandesEnAttente  : badge de la cloche (navbar)
// Importé par AdminLayout (affichage + rafraîchissement périodique)
// et par AdminMessages / AdminCommandes (mise à jour immédiate après action).
import { reactive } from 'vue'
import axios from 'axios'
import { API_URL } from './config'

export const notificationState = reactive({
  messagesNonLus: 0,
  commandesEnAttente: 0
})

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
})

// Recompte les messages non lus à partir d'une liste fournie
// (utilisé par la page Messages pour une mise à jour instantanée)
export function syncMessagesNonLus(liste) {
  notificationState.messagesNonLus = (liste || []).filter(m => !m.lu).length
}

// Recompte les commandes "En attente" à partir d'une liste fournie
// (utilisé par la page Commandes pour une mise à jour instantanée)
export function syncCommandesEnAttente(liste) {
  notificationState.commandesEnAttente = (liste || []).filter(c => c.statut === 'En attente').length
}

export async function refreshMessagesNonLus() {
  try {
    const { data } = await axios.get(`${API_URL}/messages`, getAuthHeaders())
    syncMessagesNonLus(data)
  } catch {
    // Silencieux : les badges ne sont pas critiques
  }
}

export async function refreshCommandesEnAttente() {
  try {
    const { data } = await axios.get(`${API_URL}/commandes`, getAuthHeaders())
    syncCommandesEnAttente(data)
  } catch {
    // Silencieux : les badges ne sont pas critiques
  }
}

export function refreshNotifications() {
  refreshMessagesNonLus()
  refreshCommandesEnAttente()
}
