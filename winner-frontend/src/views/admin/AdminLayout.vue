<template>
  <div class="admin-layout">
    <!-- BARRE LATÉRALE (SIDEBAR) -->
    <aside :class="['sidebar', { 'collapsed': sidebarRetractee }]">
      <div class="sidebar-header">
        <div class="logo-container">
          <img src="/Logo-Winner.png" alt="Logo" class="logo-img" />
          <span v-if="!sidebarRetractee" class="logo-text">WINNER Admin</span>
        </div>
      </div>
      
      <div class="sidebar-scroll">
        <nav class="sidebar-nav">
          <router-link to="/admin" class="nav-item" exact-active-class="active" title="Tableau de bord">
            <span class="icon">🚀</span>
            <span v-if="!sidebarRetractee" class="nav-label">Tableau de bord</span>
          </router-link>
          
          <router-link to="/admin/produits" class="nav-item" active-class="active" title="Produits">
            <span class="icon">📦</span>
            <span v-if="!sidebarRetractee" class="nav-label">Produits</span>
          </router-link>
          
          <router-link to="/admin/commandes" class="nav-item" active-class="active" title="Commandes">
            <span class="icon">🛒</span>
            <span v-if="!sidebarRetractee" class="nav-label">Commandes</span>
          </router-link>
          
          <router-link to="/admin/articles" class="nav-item" active-class="active" title="Conseils & Tutos">
            <span class="icon">📝</span>
            <span v-if="!sidebarRetractee" class="nav-label">Conseils & Tutos</span>
          </router-link>
          
          <router-link to="/admin/galerie" class="nav-item" active-class="active" title="Galerie Médias">
            <span class="icon">🖼️</span>
            <span v-if="!sidebarRetractee" class="nav-label">Galerie Médias</span>
          </router-link>

          <router-link to="/admin/utilisateurs" class="nav-item" active-class="active" title="Utilisateurs">
            <span class="icon">👥</span>
            <span v-if="!sidebarRetractee" class="nav-label">Utilisateurs</span>
          </router-link>
        </nav>
      </div>

      <div class="sidebar-footer">
        <span v-if="!sidebarRetractee" class="version">v 1.0 • WINNER ERP</span>
        <button @click="deconnexion" class="btn-logout" :title="sidebarRetractee ? 'Déconnexion' : ''" :disabled="isLoading">
          🚪 <span v-if="!sidebarRetractee">Déconnexion</span>
        </button>
      </div>
    </aside>

    <!-- CONTENU PRINCIPAL -->
    <main :class="['main-content', { 'expanded': sidebarRetractee }]">
      <!-- Topbar Fixe -->
      <header class="topbar">
        <div class="topbar-left">
          <button @click="toggleSidebar" class="btn-toggle-sidebar" title="Rétracter/Afficher le menu">
            ☰
          </button>
          <div class="breadcrumb">
            <span class="breadcrumb-root">Administration</span>
            <span class="separator">›</span>
            <span class="breadcrumb-current">{{ titrePage }}</span>
          </div>
        </div>

        <div class="search-container">
          <span class="search-icon">🔍</span>
          <input type="text" placeholder="Rechercher produits, commandes, utilisateurs..." class="search-input" />
        </div>

        <div class="topbar-right">
          <button class="icon-btn" title="Notifications">
            🔔 <span class="badge-dot"></span>
          </button>
          <button class="icon-btn" title="Messages">
            ✉️
          </button>

          <!-- Profil Utilisateur Cliquable -->
          <div class="user-menu-container" @click.stop="toggleMenu">
            <div class="user-profile-badge">
              <img :src="adminInfo.photo || '/OIP1.webp'" alt="Avatar" class="avatar-img" />
              <div class="user-info-text">
                <span class="user-name">{{ adminInfo.nom || 'Administrateur' }}</span>
                <span class="user-role">{{ adminInfo.role || 'Super Admin' }}</span>
              </div>
            </div>

            <div v-if="menuProfilOuvert" class="dropdown-menu fade-in">
              <div class="dropdown-header">
                <strong>{{ adminInfo.nom || 'Administrateur' }}</strong>
                <small>{{ adminInfo.email || 'admin@winner.com' }}</small>
              </div>
              <div class="dropdown-divider"></div>
              
              <router-link to="/admin/profil" class="dropdown-item" @click="menuProfilOuvert = false">
                👤 Mon Profil
              </router-link>
              
              <button class="dropdown-item text-danger" @click="deconnexion" :disabled="isLoading">
                🚪 Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- Contenu Dynamique de la sous-page -->
      <div class="content-area">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { API_URL as API_ROOT, formatImageUrl } from '@/services/config';

// --- CONFIGURATION API ---
const ME_URL = `${API_ROOT}/auth/me`; // Profil de l'admin connecté

const route = useRoute();
const router = useRouter();

const menuProfilOuvert = ref(false);
const sidebarRetractee = ref(false);
const isLoading = ref(false);

// Données dynamiques de l'administrateur connecté
const adminInfo = ref({
  nom: '',
  email: '',
  role: '',
  photo: ''
});

// Récupération des informations de l'admin connecté via Axios
const fetchAdminProfile = async () => {
  // Clé unique 'token' — celle écrite par authService lors du login
  const token = localStorage.getItem('token');
  if (!token) return;

  isLoading.value = true;
  try {
    const response = await axios.get(ME_URL, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = response.data;
    adminInfo.value = {
      nom: data.nom || '',
      email: data.email || '',
      role: data.role || '',
      photo: formatImageUrl(data.avatar)
    };
  } catch (error) {
    console.error("Erreur lors de la récupération du profil admin :", error);
    // Si le token est invalide ou expiré, on déconnecte par sécurité
    if (error.response?.status === 401) {
      deconnexion();
    }
  } finally {
    isLoading.value = false;
  }
};

const toggleSidebar = () => {
  sidebarRetractee.value = !sidebarRetractee.value;
};

const toggleMenu = () => {
  menuProfilOuvert.value = !menuProfilOuvert.value;
};

const fermerMenuExterieur = () => {
  menuProfilOuvert.value = false;
};

onMounted(() => {
  window.addEventListener('click', fermerMenuExterieur);
  fetchAdminProfile();
});

onUnmounted(() => {
  window.removeEventListener('click', fermerMenuExterieur);
});

const titrePage = computed(() => route.meta.title || 'Tableau de bord');

const deconnexion = async () => {
  isLoading.value = true;
  try {
    // Le JWT est sans état : on notifie le backend puis on purge le stockage local
    await axios.post(`${API_ROOT}/auth/logout`, {}, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
  } catch (error) {
    console.error("Erreur déconnexion API", error);
  } finally {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    isLoading.value = false;
    router.push('/admin/login');
  }
};
</script>

<style scoped>
.admin-layout {
  display: flex;
  height: 100vh;
  background-color: #f3f6fb;
  font-family: 'Montserrat', sans-serif;
  overflow: hidden;
}

/* Sidebar & Animation de rétraction */
.sidebar {
  width: 260px;
  background-color: #241a4a;
  color: white;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  transition: width 0.3s ease;
  z-index: 100;
}

.sidebar.collapsed {
  width: 75px;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  height: 70px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 12px;
  overflow: hidden;
}

.logo-img {
  height: 35px;
  background: white;
  border-radius: 6px;
  padding: 2px;
  flex-shrink: 0;
}

.logo-text {
  font-weight: 700;
  font-size: 18px;
  white-space: nowrap;
}

.sidebar-scroll {
  flex-grow: 1;
  overflow-y: auto;
  padding-top: 15px;
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
  color: #a7a2c4;
  text-decoration: none;
  padding: 12px 15px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.nav-item .icon {
  font-size: 18px;
  flex-shrink: 0;
}

.sidebar:not(.collapsed) .nav-item .icon {
  margin-right: 12px;
}

.sidebar.collapsed .nav-item {
  justify-content: center;
  padding: 12px 0;
}

.nav-item:hover {
  background-color: rgba(255, 255, 255, 0.05);
  color: white;
}

.nav-item.active {
  background-color: #4a4175;
  color: white;
  border-left: 4px solid white;
}

.sidebar-footer {
  padding: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.version {
  font-size: 11px;
  color: #6b6488;
  white-space: nowrap;
}

.btn-logout {
  background: transparent;
  color: #ff4d4f;
  border: 1px solid #ff4d4f;
  padding: 6px 15px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.btn-logout:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sidebar.collapsed .btn-logout span {
  display: none;
}

.btn-logout:hover:not(:disabled) {
  background: #ff4d4f;
  color: white;
}

/* Main Content & Fixed Header */
.main-content {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.topbar {
  position: fixed;
  top: 0;
  right: 0;
  left: 260px;
  height: 75px;
  background-color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 30px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
  z-index: 99;
  transition: left 0.3s ease;
}

.main-content.expanded .topbar {
  left: 75px;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.btn-toggle-sidebar {
  background: #f3f6fb;
  border: none;
  font-size: 18px;
  cursor: pointer;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #241a4a;
  transition: background 0.2s;
}

.btn-toggle-sidebar:hover {
  background: #e5ebf5;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.breadcrumb-root {
  color: #6b7280;
}

.separator {
  color: #9ca3af;
}

.breadcrumb-current {
  color: #1f1443;
  font-weight: 700;
}

/* Barre de recherche centrale */
.search-container {
  position: relative;
  width: 350px;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
}

.search-input {
  width: 100%;
  padding: 10px 14px 10px 38px;
  background-color: #f3f6fb;
  border: 1px solid transparent;
  border-radius: 20px;
  font-size: 13px;
  outline: none;
  transition: all 0.2s;
}

.search-input:focus {
  background-color: white;
  border-color: #241a4a;
  box-shadow: 0 0 0 3px rgba(36, 26, 74, 0.05);
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 15px;
  position: relative;
}

.icon-btn {
  background: #f3f6fb;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  font-size: 16px;
  transition: background 0.2s;
}

.icon-btn:hover {
  background: #e5ebf5;
}

.badge-dot {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 8px;
  height: 8px;
  background-color: #ef4444;
  border-radius: 50%;
}

/* User Profile Badge dans le header */
.user-menu-container {
  position: relative;
  cursor: pointer;
}

.user-profile-badge {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 12px 5px 5px;
  background: #f3f6fb;
  border-radius: 30px;
  border: 1px solid #e5e7eb;
  transition: background 0.2s;
}

.user-profile-badge:hover {
  background: #e5ebf5;
}

.avatar-img {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}

.user-info-text {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.user-name {
  font-size: 13px;
  font-weight: 700;
  color: #1f1443;
  line-height: 1.2;
}

.user-role {
  font-size: 11px;
  color: #6b7280;
  line-height: 1.2;
}

/* Dropdown Menu */
.dropdown-menu {
  position: absolute;
  top: 55px;
  right: 0;
  background: white;
  color: #1f1443;
  border-radius: 8px;
  width: 220px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.15);
  padding: 10px 0;
  z-index: 1000;
  border: 1px solid #e5e7eb;
}

.dropdown-header {
  padding: 8px 15px;
  display: flex;
  flex-direction: column;
}

.dropdown-header strong {
  font-size: 14px;
}

.dropdown-header small {
  font-size: 11px;
  color: #6b7280;
}

.dropdown-divider {
  height: 1px;
  background: #f3f4f6;
  margin: 6px 0;
}

.dropdown-item {
  width: 100%;
  padding: 10px 15px;
  background: transparent;
  border: none;
  text-align: left;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  text-decoration: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.2s;
  box-sizing: border-box;
}

.dropdown-item:hover {
  background: #f3f6fb;
}

.text-danger {
  color: #dc2626;
}

.fade-in {
  animation: fadeIn 0.2s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Espace dynamique pour le contenu sous le header fixe */
.content-area {
  margin-top: 75px;
  flex-grow: 1;
  padding: 30px 40px;
  overflow-y: auto;
}
</style>