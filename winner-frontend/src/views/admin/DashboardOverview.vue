<template>
  <div class="page-section">
    <!-- Bannière de Bienvenue -->
    <div class="welcome-banner">
      <div class="banner-text">
        <h2>Bonjour, Administrateur 👋</h2>
        <p>WINNER MULTISERVICE - Tableau de bord global</p>
      </div>
      <div class="banner-actions">
        <router-link to="/admin/produits" class="btn-yellow">Gérer les produits</router-link>
        <router-link to="/admin/commandes" class="btn-yellow">Voir les commandes</router-link>
        <router-link to="/admin/galerie" class="btn-yellow">Ajouter un média</router-link>
      </div>
    </div>

    <!-- Grille de Statistiques -->
    <div class="stats-grid">
      <div v-for="(stat, index) in stats" :key="index" class="stat-card">
        <div :class="['stat-icon', stat.bg]">{{ stat.icon }}</div>
        <div class="stat-info">
          <span class="stat-label">{{ stat.label }}</span>
          <span class="stat-value">{{ stat.value ?? '...' }}</span>
        </div>
      </div>
    </div>

    <!-- Section Graphiques -->
    <div class="charts-section">
      <div class="chart-card">
        <h3>Évolution des Ventes (2026)</h3>
        <div class="chart-placeholder">
          <div class="bar-chart">
            <div v-for="(val, idx) in monthlySales" :key="idx" class="bar-col">
              <div class="bar" :style="{ height: val.height }">
                <span class="tooltip">{{ val.amount }}</span>
              </div>
              <span class="month">{{ val.month }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="chart-card">
        <h3>Répartition des Visites & Trafic</h3>
        <div class="chart-placeholder donut-container">
          <div class="donut-chart" :style="trafficConicGradient">
            <div class="donut-hole">
              <span class="donut-total">{{ totalVisitors }}</span>
              <span class="donut-label">Visiteurs</span>
            </div>
          </div>
          <div class="donut-legend">
            <div v-for="(item, idx) in trafficSources" :key="idx" class="legend-item">
              <span :class="['dot', item.dotClass]"></span> {{ item.label }} ({{ item.percentage }}%)
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Section Tableaux (Commandes & Produits) -->
    <div class="tables-grid">
      <!-- Tableau : 5 Dernières Commandes -->
      <div class="dashboard-card">
        <div class="card-header">
          <h3>5 Dernières Commandes</h3>
          <router-link to="/admin/commandes" class="link-see-all">Tout voir</router-link>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Client</th>
                <th>Date</th>
                <th>Montant</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="recentOrders.length === 0">
                <td colspan="5" class="text-center">Aucune commande récente</td>
              </tr>
              <tr v-for="order in recentOrders" :key="order.id">
                <td class="fw-bold">#{{ order.id }}</td>
                <td>{{ order.customer_name }}</td>
                <td>{{ formatDate(order.created_at) }}</td>
                <td>{{ order.total }} $</td>
                <td>
                  <span :class="['badge', getStatusClass(order.status)]">
                    {{ order.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tableau : 5 Produits les Plus Vendus -->
      <div class="dashboard-card">
        <div class="card-header">
          <h3>Produits les Plus Vendus</h3>
          <router-link to="/admin/produits" class="link-see-all">Tout voir</router-link>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Catégorie</th>
                <th>Ventes</th>
                <th>Revenu</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="topProducts.length === 0">
                <td colspan="4" class="text-center">Aucun produit trouvé</td>
              </tr>
              <tr v-for="product in topProducts" :key="product.id">
                <td class="fw-bold product-name-cell">
                  <span class="prod-emoji">📦</span> {{ product.name }}
                </td>
                <td>{{ product.category }}</td>
                <td><span class="sales-pill">{{ product.total_sales }} vtes</span></td>
                <td class="text-green fw-bold">{{ product.revenue }} $</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'

// Définition des statistiques dynamiques
const stats = ref([
  { label: 'Produits actifs', value: 0, icon: '📦', bg: 'bg-blue' },
  { label: 'Commandes', value: 0, icon: '🛒', bg: 'bg-green' },
  { label: 'Articles & Tutos', value: 0, icon: '📝', bg: 'bg-yellow' },
  { label: 'Clients inscrits', value: 0, icon: '👥', bg: 'bg-purple' },
  { label: 'Photos Galerie', value: 0, icon: '🖼️', bg: 'bg-red' },
  { label: 'Vidéos publiées', value: 0, icon: '📺', bg: 'bg-teal' },
  { label: 'Ventes ce mois', value: '0 $', icon: '💰', bg: 'bg-orange' },
  { label: 'Visites du site', value: 0, icon: '📈', bg: 'bg-light-green' },
])

const monthlySales = ref([])
const recentOrders = ref([])
const topProducts = ref([])
const totalVisitors = ref(0)
const trafficSources = ref([
  { label: 'Direct', percentage: 45, dotClass: 'bg-blue' },
  { label: 'Réseaux Sociaux', percentage: 30, dotClass: 'bg-green' },
  { label: 'Moteurs de recherche', percentage: 25, dotClass: 'bg-yellow' }
])

// Calcul dynamique du dégradé pour le camembert (donut)
const trafficConicGradient = computed(() => {
  let direct = trafficSources.value[0]?.percentage || 45
  let social = trafficSources.value[1]?.percentage || 30
  let p2 = direct * 3.6
  let p3 = (direct + social) * 3.6
  return {
    background: `conic-gradient(#3b82f6 0deg ${p2}deg, #10b981 ${p2}deg ${p3}deg, #f6a617 ${p3}deg 360deg)`
  }
})

// Fonction principale pour récupérer les données de la BDD
const fetchDashboardData = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/dashboard/stats', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })

    const data = response.data

    // 1. Mise à jour des compteurs de statistiques (Adapté à la structure du backend)
    stats.value[0].value = data.products || 0      // Produits
    stats.value[1].value = data.orders || 0        // Commandes
    stats.value[2].value = data.articles || 0      // Articles
    stats.value[3].value = data.users || 0         // Utilisateurs (Clients)
    stats.value[4].value = data.photos || 0        // Photos (Backend à venir)
    stats.value[5].value = data.videos || 0        // Vidéos (Backend à venir)
    stats.value[6].value = `${data.monthlySalesAmount || 0} $` 
    stats.value[7].value = data.visits || 0

    // 2. Mise à jour des graphiques de ventes mensuelles avec vérification
    if (data.monthlySales && Array.isArray(data.monthlySales)) {
      monthlySales.value = data.monthlySales.map(item => ({
        month: item.month,
        amount: `${item.amount} $`,
        height: `${item.percentage}%` 
      }))
    } else {
      monthlySales.value = [] // Sécurité
    }

    // 3. Mise à jour des tableaux avec des valeurs par défaut
    recentOrders.value = data.recentOrders || []
    topProducts.value = data.topProducts || []
    totalVisitors.value = data.visits || 0

  } catch (error) {
    console.error("Erreur lors de la récupération des données du tableau de bord :", error)
  }
}

// Formatage de la date
const formatDate = (dateString) => {
  if (!dateString) return ''
  const options = { day: 'numeric', month: 'short', year: 'numeric' }
  return new Date(dateString).toLocaleDateString('fr-FR', options)
}

const getStatusClass = (status) => {
  switch (status) {
    case 'Livré': return 'badge-success'
    case 'En cours': return 'badge-warning'
    case 'Annulé': return 'badge-danger'
    default: return 'badge-secondary'
  }
}

// Appel de l'API au chargement du composant
onMounted(() => {
  fetchDashboardData()
})
</script>

<style scoped>
.page-section {
  padding: 20px;
  background-color: #f8fafc;
  min-height: 100vh;
}
.welcome-banner {
  background-color: #1f1443;
  border-radius: 16px;
  padding: 30px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
  margin-bottom: 30px;
  box-shadow: 0 4px 20px rgba(31, 20, 67, 0.15);
}
.banner-text h2 { margin: 0 0 5px 0; font-size: 24px; }
.banner-text p { margin: 0; color: #a7a2c4; font-size: 14px; }
.banner-actions { display: flex; gap: 15px; }
.btn-yellow {
  background-color: #f6a617;
  color: #1f1443;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 13px;
  text-decoration: none;
  display: inline-block;
  transition: opacity 0.2s;
}
.btn-yellow:hover { opacity: 0.9; }
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}
.stat-card {
  background-color: white;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
}
.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 22px;
}
.bg-blue { background-color: #e0f2fe; }
.bg-green { background-color: #dcfce7; }
.bg-yellow { background-color: #fef3c7; }
.bg-purple { background-color: #f3e8ff; }
.bg-red { background-color: #ffe4e6; }
.bg-teal { background-color: #ccfbf1; }
.bg-orange { background-color: #ffedd5; }
.bg-light-green { background-color: #ecfccb; }

.stat-info { display: flex; flex-direction: column; }
.stat-label { font-size: 13px; color: #6b7280; margin-bottom: 4px; }
.stat-value { font-size: 24px; font-weight: 700; color: #111827; }

.charts-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  margin-bottom: 30px;
}
@media(max-width: 992px) {
  .charts-section { grid-template-columns: 1fr; }
}
.chart-card {
  background: white;
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
}
.chart-card h3 {
  font-size: 16px;
  color: #1f1443;
  margin-top: 0;
  margin-bottom: 20px;
}
.chart-placeholder {
  height: 220px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.bar-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  width: 100%;
  height: 180px;
  padding-top: 20px;
}
.bar-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  justify-content: flex-end;
  flex: 1;
}
.bar {
  width: 28px;
  background: linear-gradient(180deg, #f6a617 0%, #e0940b 100%);
  border-radius: 6px 6px 0 0;
  position: relative;
  transition: height 0.3s ease;
}
.bar:hover .tooltip {
  opacity: 1;
  visibility: visible;
}
.tooltip {
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  background: #1f1443;
  color: white;
  padding: 3px 8px;
  font-size: 11px;
  border-radius: 4px;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: 0.2s;
}
.month {
  font-size: 12px;
  color: #6b7280;
  margin-top: 8px;
}
.donut-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 15px;
}
.donut-chart {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
}
.donut-hole {
  width: 85px;
  height: 85px;
  background: white;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.donut-total { font-size: 16px; font-weight: 700; color: #111827; }
.donut-label { font-size: 10px; color: #6b7280; }
.donut-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  font-size: 12px;
  color: #4b5563;
}
.legend-item { display: flex; align-items: center; gap: 6px; }
.dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }

.tables-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
@media(max-width: 1024px) {
  .tables-grid { grid-template-columns: 1fr; }
}
.dashboard-card {
  background: white;
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.card-header h3 {
  margin: 0;
  font-size: 16px;
  color: #1f1443;
}
.link-see-all {
  font-size: 13px;
  color: #f6a617;
  font-weight: 600;
  text-decoration: none;
}
.link-see-all:hover { text-decoration: underline; }
.table-responsive { overflow-x: auto; }
.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 13px;
}
.data-table th {
  color: #6b7280;
  font-weight: 600;
  padding: 10px 12px;
  border-bottom: 1px solid #f3f4f6;
}
.data-table td {
  padding: 12px;
  color: #374151;
  border-bottom: 1px solid #f9fafb;
  vertical-align: middle;
}
.text-center { text-align: center; color: #9ca3af; }
.fw-bold { font-weight: 600; color: #111827; }
.text-green { color: #059669; }
.product-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}
.sales-pill {
  background: #f3f4f6;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
}
.badge {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  display: inline-block;
}
.badge-success { background-color: #dcfce7; color: #166534; }
.badge-warning { background-color: #fef3c7; color: #92400e; }
.badge-danger { background-color: #ffe4e6; color: #991b1b; }
.badge-secondary { background-color: #f3f4f6; color: #374151; }
</style>