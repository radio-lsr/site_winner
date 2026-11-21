// ============================================================
// Boîtes de dialogue et notifications de l'application.
// ------------------------------------------------------------
// Remplace les alert()/confirm() natifs par des éléments stylés,
// montés une seule fois dans App.vue via le composant DialogHost.
// ============================================================

import { reactive } from 'vue'

export const dialogState = reactive({
  toasts: [],
  confirmation: null
})

let prochainId = 0

/**
 * Affiche une notification en haut de l'écran.
 * @param {string} message Texte affiché
 * @param {'success'|'error'|'info'} type Style de la notification
 * @param {number} duree Durée en ms (0 = persistante)
 */
export function notify(message, type = 'error', duree = 5000) {
  const id = ++prochainId
  dialogState.toasts.push({ id, message: String(message), type })
  if (duree > 0) {
    setTimeout(() => dismissToast(id), duree)
  }
  return id
}

export function dismissToast(id) {
  const index = dialogState.toasts.findIndex(toast => toast.id === id)
  if (index !== -1) dialogState.toasts.splice(index, 1)
}

/**
 * Demande une confirmation à l'utilisateur.
 * @returns {Promise<boolean>} true si l'utilisateur confirme
 */
export function demanderConfirmation({
  titre = 'Confirmation',
  message = 'Êtes-vous sûr ?',
  labelConfirmer = 'Confirmer',
  labelAnnuler = 'Annuler',
  dangereux = false
} = {}) {
  // Une seule confirmation à la fois : on libère une éventuelle demande en attente.
  if (dialogState.confirmation) repondreConfirmation(false)

  return new Promise(resolve => {
    dialogState.confirmation = {
      titre,
      message,
      labelConfirmer,
      labelAnnuler,
      dangereux,
      resolve
    }
  })
}

export function repondreConfirmation(resultat) {
  const demande = dialogState.confirmation
  if (!demande) return
  dialogState.confirmation = null
  demande.resolve(Boolean(resultat))
}
