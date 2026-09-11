<template>
  <div class="admin-layout">
    <!-- BARRE LATÉRALE (SIDEBAR) -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo-container">
          <img src="/Logo-Winner.png" alt="Logo" class="logo-img" />
          <span class="logo-text">WINNER Admin</span>
        </div>
      </div>
      
      <div class="sidebar-scroll">
        <nav class="sidebar-nav">
          <button 
            :class="['nav-item', { active: ongletActif === 'dashboard' }]" 
            @click="ongletActif = 'dashboard'"
          >
            <span class="icon">🚀</span> Tableau de bord
          </button>
          
          <button 
            :class="['nav-item', { active: ongletActif === 'produits' }]" 
            @click="ongletActif = 'produits'"
          >
            <span class="icon">📦</span> Produits
          </button>
          
          <button 
            :class="['nav-item', { active: ongletActif === 'commandes' }]" 
            @click="ongletActif = 'commandes'"
          >
            <span class="icon">🛒</span> Commandes
            <span class="chevron">▼</span>
          </button>
          
          <button 
            :class="['nav-item', { active: ongletActif === 'articles' }]" 
            @click="ongletActif = 'articles'"
          >
            <span class="icon">📝</span> Conseils & Tutos
            <span class="chevron">▼</span>
          </button>
          
          <button 
            :class="['nav-item', { active: ongletActif === 'galerie' }]" 
            @click="ongletActif = 'galerie'"
          >
            <span class="icon">🖼️</span> Galerie Médias
            <span class="chevron">▼</span>
          </button>

          <button class="nav-item">
            <span class="icon">👥</span> Utilisateurs
          </button>
        </nav>
      </div>

      <div class="sidebar-footer">
        <span class="version">v 1.0 • WINNER ERP</span>
        <button @click="deconnexion" class="btn-logout">Déconnexion</button>
      </div>
    </aside>

    <!-- CONTENU PRINCIPAL -->
    <main class="main-content">
      <!-- Topbar -->
      <header class="topbar">
        <h1>{{ titrePage }}</h1>
        <div class="topbar-right">
          <span class="date-texte">{{ dateDuJour }}</span>
          <img src="/OIP1.webp" alt="Avatar" class="avatar-img" />
        </div>
      </header>

      <!-- Zone de contenu -->
      <div class="content-area">
        
        <!-- VUE D'ENSEMBLE (TABLEAU DE BORD) -->
        <div v-if="ongletActif === 'dashboard'" class="dashboard-view page-section">
          
          <!-- Bannière de Bienvenue -->
          <div class="welcome-banner">
            <div class="banner-text">
              <h2>Bonjour, Administrateur 👋</h2>
              <p>WINNER MULTISERVICE</p>
            </div>
            <div class="banner-actions">
              <button class="btn-yellow" @click="ongletActif = 'produits'">Gérer les produits</button>
              <button class="btn-yellow" @click="ongletActif = 'commandes'">Voir les commandes</button>
              <button class="btn-yellow" @click="ongletActif = 'galerie'">Ajouter un média</button>
            </div>
          </div>

          <!-- Grille de Statistiques -->
          <div class="stats-grid">
            <!-- Ligne 1 -->
            <div class="stat-card">
              <div class="stat-icon bg-blue">📦</div>
              <div class="stat-info">
                <span class="stat-label">Produits actifs</span>
                <span class="stat-value">24</span>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon bg-green">🛒</div>
              <div class="stat-info">
                <span class="stat-label">Commandes</span>
                <span class="stat-value">12</span>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon bg-yellow">📝</div>
              <div class="stat-info">
                <span class="stat-label">Articles & Tutos</span>
                <span class="stat-value">8</span>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon bg-purple">👥</div>
              <div class="stat-info">
                <span class="stat-label">Clients inscrits</span>
                <span class="stat-value">45</span>
              </div>
            </div>

            <!-- Ligne 2 -->
            <div class="stat-card">
              <div class="stat-icon bg-red">🖼️</div>
              <div class="stat-info">
                <span class="stat-label">Photos Galerie</span>
                <span class="stat-value">18</span>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon bg-teal">📺</div>
              <div class="stat-info">
                <span class="stat-label">Vidéos publiées</span>
                <span class="stat-value">4</span>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon bg-orange">💰</div>
              <div class="stat-info">
                <span class="stat-label">Ventes ce mois</span>
                <span class="stat-value">1 250 $</span>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon bg-light-green">📈</div>
              <div class="stat-info">
                <span class="stat-label">Visites du site</span>
                <span class="stat-value">342</span>
              </div>
            </div>
          </div>
        </div>

        <!-- === SECTION : GESTION DES PRODUITS === -->
        <div v-else-if="ongletActif === 'produits'" class="page-section">
          <div class="page-header">
            <input type="text" placeholder="🔍 Rechercher un produit..." class="search-input" />
            <button class="btn-yellow">➕ Nouveau Produit</button>
          </div>
          
          <table class="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Nom du produit</th>
                <th>Catégorie</th>
                <th>Prix</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><img src="/prod.webp" alt="Produit" class="table-img" /></td>
                <td>Huile Moteur Quartz 9000</td>
                <td>Lubrifiants</td>
                <td>45.00 $</td>
                <td><span class="stock in-stock">15 en stock</span></td>
                <td>
                  <button class="action-btn edit" title="Modifier">✏️</button>
                  <button class="action-btn delete" title="Supprimer">🗑️</button>
                </td>
              </tr>
              <tr>
                <td><img src="/prod1.webp" alt="Produit" class="table-img" /></td>
                <td>Filtre à Huile Total</td>
                <td>Accessoires</td>
                <td>12.50 $</td>
                <td><span class="stock low-stock">3 en stock</span></td>
                <td>
                  <button class="action-btn edit" title="Modifier">✏️</button>
                  <button class="action-btn delete" title="Supprimer">🗑️</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- === SECTION : SUIVI DES COMMANDES === -->
        <div v-else-if="ongletActif === 'commandes'" class="page-section">
          <div class="page-header">
            <input type="text" placeholder="🔍 Rechercher une commande (ID, Client)..." class="search-input" />
            <button class="btn-outline">Filtrer par date</button>
          </div>

          <table class="admin-table">
            <thead>
              <tr>
                <th>Réf. Commande</th>
                <th>Date</th>
                <th>Client</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>#CMD-0042</strong></td>
                <td>24 Juil. 2026</td>
                <td>Jean Dupont</td>
                <td>90.00 $</td>
                <td><span class="badge pending">En attente</span></td>
                <td>
                  <button class="action-btn view" title="Voir les détails">👁️</button>
                </td>
              </tr>
              <tr>
                <td><strong>#CMD-0041</strong></td>
                <td>23 Juil. 2026</td>
                <td>Garage Auto Plus</td>
                <td>450.00 $</td>
                <td><span class="badge success">Livrée</span></td>
                <td>
                  <button class="action-btn view" title="Voir les détails">👁️</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- === SECTION : CONSEILS & TUTOS === -->
        <div v-else-if="ongletActif === 'articles'" class="page-section">
          <div class="page-header">
            <input type="text" placeholder="🔍 Rechercher un article..." class="search-input" />
            <button class="btn-yellow">➕ Rédiger un article</button>
          </div>

          <table class="admin-table">
            <thead>
              <tr>
                <th>Titre de l'article</th>
                <th>Auteur</th>
                <th>Date de publication</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Comment bien choisir son huile moteur ?</td>
                <td>Admin</td>
                <td>20 Juil. 2026</td>
                <td><span class="badge success">Publié</span></td>
                <td>
                  <button class="action-btn edit" title="Modifier">✏️</button>
                  <button class="action-btn delete" title="Supprimer">🗑️</button>
                </td>
              </tr>
              <tr>
                <td>Les étapes pour changer un pneu crevé</td>
                <td>Admin</td>
                <td>-</td>
                <td><span class="badge draft">Brouillon</span></td>
                <td>
                  <button class="action-btn edit" title="Modifier">✏️</button>
                  <button class="action-btn delete" title="Supprimer">🗑️</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- === SECTION : GALERIE MÉDIAS === -->
        <div v-else-if="ongletActif === 'galerie'" class="page-section">
          <div class="page-header">
            <h2 class="section-title">Médiathèque</h2>
            <button class="btn-yellow">➕ Uploader un fichier</button>
          </div>

          <div class="media-grid">
            <div class="media-card" style="background-image: url('/OIP1.webp');">
              <div class="media-overlay">
                <button class="btn-delete-media">Supprimer</button>
              </div>
            </div>
            <div class="media-card" style="background-image: url('/OIP2.webp');">
              <div class="media-overlay">
                <button class="btn-delete-media">Supprimer</button>
              </div>
            </div>
            <div class="media-card" style="background-image: url('/prod.webp');">
              <div class="media-overlay">
                <button class="btn-delete-media">Supprimer</button>
              </div>
            </div>
             <div class="media-card" style="background-image: url('/prod1.webp');">
              <div class="media-overlay">
                <button class="btn-delete-media">Supprimer</button>
              </div>
            </div>
          </div>
        </div>

        <!-- ESPACE RÉSERVÉ (Par défaut si un onglet est vide) -->
        <div v-else class="other-section page-section">
          <div class="placeholder-box">
            <h2>Interface de gestion : {{ titrePage }}</h2>
            <p>Le contenu de cette section est en cours de construction.</p>
          </div>
        </div>

      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const ongletActif = ref('dashboard');

// Formatage de la date à la manière du screenshot
const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
const dateDuJour = new Date().toLocaleDateString('fr-FR', dateOptions);

const titrePage = computed(() => {
  const titres = {
    'dashboard': 'Tableau de bord',
    'produits': 'Gestion des Produits',
    'commandes': 'Suivi des Commandes',
    'articles': 'Conseils & Pédagogie',
    'galerie': 'Médiathèque'
  };
  return titres[ongletActif.value] || 'Administration';
});

const deconnexion = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  router.push('/admin/login');
};
</script>

<style scoped>
/* COULEURS INSPIRÉES DU SCREENSHOT */
:root {
  --bg-sidebar: #241a4a;
  --bg-sidebar-active: #4a4175;
  --bg-main: #f3f6fb;
  --bg-banner: #1f1443;
  --yellow-btn: #f6a617;
  --yellow-btn-hover: #e09612;
  --text-grey: #6b7280;
  --text-dark: #111827;
}

.admin-layout {
  display: flex;
  height: 100vh;
  background-color: var(--bg-main, #f3f6fb);
  font-family: 'Montserrat', sans-serif;
  overflow: hidden;
}

/* --- SIDEBAR --- */
.sidebar {
  width: 260px;
  background-color: var(--bg-sidebar, #241a4a);
  color: white;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-img {
  height: 35px;
  background: white;
  border-radius: 6px;
  padding: 2px;
}

.logo-text {
  font-weight: 700;
  font-size: 18px;
  letter-spacing: 0.5px;
}

.sidebar-scroll {
  flex-grow: 1;
  overflow-y: auto;
  padding-top: 15px;
}

/* Personnalisation de la barre de défilement de la sidebar */
.sidebar-scroll::-webkit-scrollbar {
  width: 6px;
}
.sidebar-scroll::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  padding: 0 10px;
  gap: 5px;
}

.nav-item {
  display: flex;
  align-items: center;
  background: transparent;
  color: #a7a2c4;
  border: none;
  padding: 12px 15px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.nav-item .icon {
  margin-right: 12px;
  font-size: 16px;
}

.nav-item .chevron {
  margin-left: auto;
  font-size: 10px;
  opacity: 0.5;
}

.nav-item:hover {
  background-color: rgba(255, 255, 255, 0.05);
  color: white;
}

.nav-item.active {
  background-color: var(--bg-sidebar-active, #4a4175);
  color: white;
  border-left: 4px solid white;
  border-radius: 0 8px 8px 0;
}

.sidebar-footer {
  padding: 15px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.version {
  font-size: 11px;
  color: #6b6488;
}

.btn-logout {
  background: transparent;
  color: #ff4d4f;
  border: 1px solid #ff4d4f;
  padding: 6px 15px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: 0.2s;
}

.btn-logout:hover {
  background: #ff4d4f;
  color: white;
}

/* --- MAIN CONTENT --- */
.main-content {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Topbar */
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 40px;
  background-color: transparent;
}

.topbar h1 {
  font-size: 22px;
  color: var(--bg-banner, #1f1443);
  font-weight: 700;
  margin: 0;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.date-texte {
  font-size: 14px;
  color: var(--text-grey, #6b7280);
}

.avatar-img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid white;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

/* Content Area */
.content-area {
  flex-grow: 1;
  padding: 0 40px 40px 40px;
  overflow-y: auto;
}

/* --- WELCOME BANNER --- */
.welcome-banner {
  background-color: var(--bg-banner, #1f1443);
  border-radius: 16px;
  padding: 30px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
  margin-bottom: 30px;
  box-shadow: 0 4px 20px rgba(31, 20, 67, 0.1);
}

.banner-text h2 {
  margin: 0 0 5px 0;
  font-size: 24px;
  font-weight: 600;
}

.banner-text p {
  margin: 0;
  color: #a7a2c4;
  font-size: 14px;
  letter-spacing: 1px;
}

.banner-actions {
  display: flex;
  gap: 15px;
}

.btn-yellow {
  background-color: var(--yellow-btn, #f6a617);
  color: var(--bg-banner, #1f1443);
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-yellow:hover {
  background-color: var(--yellow-btn-hover, #e09612);
}

/* --- STATS GRID --- */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
}

.stat-card {
  background-color: white;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
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

/* Couleurs pastels pour les icônes */
.bg-blue { background-color: #e0f2fe; }
.bg-green { background-color: #dcfce7; }
.bg-yellow { background-color: #fef3c7; }
.bg-purple { background-color: #f3e8ff; }
.bg-red { background-color: #ffe4e6; }
.bg-teal { background-color: #ccfbf1; }
.bg-orange { background-color: #ffedd5; }
.bg-light-green { background-color: #ecfccb; }

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 13px;
  color: var(--text-grey, #6b7280);
  margin-bottom: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-dark, #111827);
}

/* --- STYLES DES PAGES INTERNES --- */
.page-section {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.section-title {
  font-size: 20px;
  color: var(--bg-banner);
  margin: 0;
}

.search-input {
  padding: 12px 20px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  width: 350px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
  font-family: inherit;
}

.search-input:focus {
  border-color: var(--bg-sidebar);
}

.btn-outline {
  background: transparent;
  border: 1px solid var(--text-grey);
  color: var(--text-dark);
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
}

.btn-outline:hover {
  border-color: var(--bg-banner);
  color: var(--bg-banner);
}

/* --- TABLES --- */
.admin-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
}

.admin-table th, .admin-table td {
  padding: 18px 20px;
  text-align: left;
  border-bottom: 1px solid #f3f4f6;
}

.admin-table th {
  background-color: #f9fafb;
  color: var(--text-grey);
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.admin-table td {
  color: var(--text-dark);
  font-size: 14px;
  vertical-align: middle;
}

.table-img {
  width: 45px;
  height: 45px;
  border-radius: 6px;
  object-fit: cover;
  border: 1px solid #f3f4f6;
}

/* --- BADGES ET STATUS --- */
.badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
}
.badge.pending { background-color: #fef3c7; color: #d97706; }
.badge.success { background-color: #dcfce7; color: #15803d; }
.badge.draft { background-color: #f3f4f6; color: #6b7280; }

.stock {
  font-size: 13px;
  font-weight: 600;
}
.stock.in-stock { color: #15803d; }
.stock.low-stock { color: #dc2626; }

/* --- BOUTONS D'ACTION (Tableau) --- */
.action-btn {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  margin-right: 12px;
  opacity: 0.7;
  transition: opacity 0.2s, transform 0.2s;
}
.action-btn:hover {
  opacity: 1;
  transform: scale(1.1);
}

/* --- GRILLE MÉDIAS --- */
.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.media-card {
  height: 200px;
  border-radius: 12px;
  background-size: cover;
  background-position: center;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.media-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.media-card:hover .media-overlay {
  opacity: 1;
}

.btn-delete-media {
  background: #ef4444;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}
.btn-delete-media:hover {
  background: #dc2626;
}

/* --- OTHER SECTIONS PLACEHOLDER --- */
.placeholder-box {
  background: white;
  border-radius: 16px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0,0,0,0.02);
}

.placeholder-box h2 {
  color: var(--bg-banner);
  margin-bottom: 10px;
}

.placeholder-box p {
  color: var(--text-grey);
}
</style>