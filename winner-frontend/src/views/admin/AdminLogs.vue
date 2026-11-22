<template>
  <div class="page-section">
    <div class="page-header">
      <input
        v-model="recherche"
        type="text"
        placeholder="🔍 Rechercher par utilisateur, action, détail..."
        class="search-input"
      />
      <button class="btn-yellow" @click="chargerLogs" :disabled="isLoading">
        🔄 Actualiser
      </button>
    </div>

    <div class="table-container">
      <div v-if="isLoading" class="loading-box">Chargement des logs...</div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Utilisateur</th>
            <th>Rôle</th>
            <th>Action</th>
            <th>Détails</th>
            <th>IP</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="logsFiltres.length === 0">
            <td colspan="6" class="empty-cell">Aucun log enregistré pour le moment.</td>
          </tr>
          <tr v-for="log in logsFiltres" :key="log.id">
            <td class="date-cell">{{ formatDate(log.created_at) }}</td>
            <td class="fw-bold">{{ log.user_nom || 'Système' }}</td>
            <td>
              <span v-if="log.user_role" :class="['badge', log.user_role === 'Admin' ? 'badge-admin' : 'badge-mod']">
                {{ log.user_role }}
              </span>
              <span v-else class="text-muted">-</span>
            </td>
            <td><span class="action-tag">{{ log.action }}</span></td>
            <td>{{ log.details || '-' }}</td>
            <td class="ip-cell">{{ log.ip || '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { API_URL } from '@/services/config'
import { notify } from '@/services/dialog'

const logs = ref([])
const recherche = ref('')
const isLoading = ref(false)

const chargerLogs = async () => {
  isLoading.value = true
  try {
    const { data } = await axios.get(`${API_URL}/logs`, { withCredentials: true })
    logs.value = data || []
  } catch (err) {
    console.error('Erreur chargement logs:', err)
    notify(err.response?.data?.error || 'Impossible de charger les logs.', 'error')
  } finally {
    isLoading.value = false
  }
}

const logsFiltres = computed(() => {
  const q = recherche.value.trim().toLowerCase()
  if (!q) return logs.value
  return logs.value.filter(l =>
    (l.user_nom || '').toLowerCase().includes(q) ||
    (l.user_role || '').toLowerCase().includes(q) ||
    (l.action || '').toLowerCase().includes(q) ||
    (l.details || '').toLowerCase().includes(q)
  )
})

const formatDate = (d) => {
  if (!d) return '-'
  return new Date(d).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

onMounted(chargerLogs)
</script>

<style scoped>
.page-section { padding: 10px 0; }
.page-header { display: flex; justify-content: space-between; align-items: center; gap: 15px; margin-bottom: 20px; flex-wrap: wrap; }
.search-input { flex: 1; min-width: 240px; max-width: 420px; padding: 10px 15px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; }
.btn-yellow { background-color: #f6a617; color: #1f1443; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 700; cursor: pointer; }
.btn-yellow:disabled { opacity: 0.6; cursor: not-allowed; }
.table-container { background: #fff; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.data-table th { text-align: left; padding: 14px 16px; background: #f8fafc; color: #475569; font-weight: 600; border-bottom: 1px solid #e2e8f0; }
.data-table td { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; color: #334155; }
.date-cell, .ip-cell { white-space: nowrap; font-size: 13px; color: #64748b; }
.fw-bold { font-weight: 600; color: #1e293b; }
.badge { padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; }
.badge-admin { background: #ede9fe; color: #6d28d9; }
.badge-mod { background: #e0f2fe; color: #0369a1; }
.action-tag { background: #f1f5f9; color: #0f172a; padding: 3px 8px; border-radius: 6px; font-weight: 600; font-size: 12px; }
.empty-cell, .loading-box { text-align: center; padding: 30px; color: #64748b; }
</style>
