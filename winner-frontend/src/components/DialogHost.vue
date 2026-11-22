<template>
  <Teleport to="body">
    <!-- Boîte de confirmation -->
    <Transition name="confirmation">
      <div
        v-if="dialogState.confirmation"
        class="confirmation-overlay"
        @click.self="repondreConfirmation(false)"
      >
        <div
          class="confirmation-card"
          role="alertdialog"
          aria-modal="true"
          :aria-label="dialogState.confirmation.titre"
        >
          <div class="confirmation-icon" :class="{ 'danger': dialogState.confirmation.dangereux }">
            {{ dialogState.confirmation.dangereux ? '⚠️' : '❓' }}
          </div>
          <h3 class="confirmation-title">{{ dialogState.confirmation.titre }}</h3>
          <p class="confirmation-message">{{ dialogState.confirmation.message }}</p>
          <div class="confirmation-actions">
            <button type="button" class="btn-secondary" @click="repondreConfirmation(false)">
              {{ dialogState.confirmation.labelAnnuler }}
            </button>
            <button
              type="button"
              class="btn-primary"
              :class="{ 'btn-danger': dialogState.confirmation.dangereux }"
              @click="repondreConfirmation(true)"
            >
              {{ dialogState.confirmation.labelConfirmer }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Notifications (succès / erreur / info) -->
    <div class="toast-stack" role="status" aria-live="polite">
      <TransitionGroup name="toast">
        <div v-for="toast in dialogState.toasts" :key="toast.id" class="toast" :class="`toast-${toast.type}`">
          <span class="toast-icon">{{ icone(toast.type) }}</span>
          <span class="toast-message">{{ toast.message }}</span>
          <button type="button" class="toast-close" aria-label="Fermer la notification" @click="dismissToast(toast.id)">✕</button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { dialogState, dismissToast, repondreConfirmation } from '../services/dialog'

const icone = (type) => {
  if (type === 'success') return '✅'
  if (type === 'info') return 'ℹ️'
  return '⚠️'
}

const gererEchap = (event) => {
  if (event.key === 'Escape' && dialogState.confirmation) repondreConfirmation(false)
}

onMounted(() => window.addEventListener('keydown', gererEchap))
onUnmounted(() => window.removeEventListener('keydown', gererEchap))
</script>

<style scoped>
/* --- Confirmation --- */
.confirmation-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.62);
  backdrop-filter: blur(3px);
}

.confirmation-card {
  width: min(100%, 430px);
  background: #fff;
  border-radius: 16px;
  padding: 30px;
  text-align: center;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.28);
  border-top: 5px solid var(--blue, #143489);
}

.confirmation-icon {
  width: 54px;
  height: 54px;
  margin: 0 auto 14px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  background: #e0f2fe;
}

.confirmation-icon.danger { background: #fee2e2; }

.confirmation-title {
  margin: 0 0 10px;
  font-size: 20px;
  color: var(--blue, #143489);
}

.confirmation-message {
  margin: 0 0 24px;
  font-size: 14px;
  line-height: 1.6;
  color: #4b5563;
}

.confirmation-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.confirmation-actions button {
  min-width: 130px;
  padding: 11px 18px;
  border-radius: 8px;
  border: none;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  transition: transform .15s, box-shadow .15s, background .15s;
}

.confirmation-actions button:hover { transform: translateY(-1px); }
.btn-secondary { background: #eef2f7; color: #1f2940; }
.btn-secondary:hover { background: #dde4ee; }
.btn-primary { background: var(--blue, #143489); color: #fff; box-shadow: 0 4px 12px rgba(20, 52, 137, .25); }
.btn-primary:hover { background: #0f2870; }
.btn-danger { background: var(--red, #E31E24); box-shadow: 0 4px 12px rgba(227, 30, 36, .25); }
.btn-danger:hover { background: var(--bordeaux, #80142D); }

/* --- Notifications --- */
.toast-stack {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10001;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: min(380px, calc(100vw - 40px));
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 15px 16px;
  border-radius: 12px;
  background: #fff;
  border-left: 5px solid var(--red, #E31E24);
  box-shadow: 0 12px 32px rgba(15, 23, 42, .18);
  pointer-events: auto;
}

.toast-success { border-left-color: #16a34a; }
.toast-info { border-left-color: var(--blue, #143489); }
.toast-error { border-left-color: var(--red, #E31E24); }

.toast-icon { font-size: 18px; line-height: 1.3; }
.toast-message { flex: 1; font-size: 13px; line-height: 1.55; color: #1f2937; }
.toast-close {
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 13px;
  cursor: pointer;
  padding: 2px;
}
.toast-close:hover { color: #111827; }

/* --- Animations --- */
.confirmation-enter-active, .confirmation-leave-active { transition: opacity .2s ease; }
.confirmation-enter-from, .confirmation-leave-to { opacity: 0; }
.confirmation-enter-active .confirmation-card,
.confirmation-leave-active .confirmation-card { transition: transform .2s ease; }
.confirmation-enter-from .confirmation-card,
.confirmation-leave-to .confirmation-card { transform: translateY(12px) scale(.97); }

.toast-enter-active, .toast-leave-active { transition: opacity .25s ease, transform .25s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(24px); }
.toast-move { transition: transform .25s ease; }

@media (max-width: 480px) {
  .confirmation-card { padding: 24px 18px; }
  .confirmation-actions button { flex: 1; min-width: 0; }
}
</style>
