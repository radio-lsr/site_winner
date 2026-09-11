import { createRouter, createWebHistory } from 'vue-router';

// 1. Import des pages principales
import SitePublic from '../views/SitePublic.vue';
import AdminLogin from '../views/AdminLogin.vue';

// 2. Import du Layout Admin et des sous-pages (nouvelle structure)
import AdminLayout from '../views/admin/AdminLayout.vue';
import DashboardOverview from '../views/admin/DashboardOverview.vue';
import AdminProduits from '../views/admin/AdminProduits.vue';
import AdminCommandes from '../views/admin/AdminCommandes.vue';
import AdminArticles from '../views/admin/AdminArticles.vue';
import AdminGalerie from '../views/admin/AdminGalerie.vue';
import AdminUtilisateurs from '@/views/admin/AdminUtilisateurs.vue';
import ProfilUtilisateur from '../views/admin/ProfilUtilisateur.vue';

const routes = [
  {
    path: '/',
    name: 'SitePublic',
    component: SitePublic
  },
  // Correction R0004 : Redirection pour attraper les appels vers /login (ex: Axios interceptor)
  {
    path: '/login',
    redirect: '/admin/login'
  },
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: AdminLogin
  },
  {
    path: '/admin',
    component: AdminLayout,
    // La propriété meta ici s'applique au parent ET à tous ses enfants
    meta: { requiresAuth: true }, 
    children: [
      {
        path: '', // Route par défaut (/admin)
        name: 'AdminDashboard',
        component: DashboardOverview,
        meta: { title: 'Tableau de bord' }
      },
      {
        path: 'produits', // (/admin/produits)
        name: 'AdminProduits',
        component: AdminProduits,
        meta: { title: 'Gestion des Produits' }
      },
      {
        path: 'commandes', // (/admin/commandes)
        name: 'AdminCommandes',
        component: AdminCommandes,
        meta: { title: 'Suivi des Commandes' }
      },
      {
        path: 'articles', // (/admin/articles)
        name: 'AdminArticles',
        component: AdminArticles,
        meta: { title: 'Conseils & Pédagogie' }
      },
      {
        path: 'galerie', // (/admin/galerie)
        name: 'AdminGalerie',
        component: AdminGalerie,
        meta: { title: 'Médiathèque' }
      },
      {
        path: 'utilisateurs', // (/admin/utilisateurs)
        name: 'AdminUtilisateurs',
        component: AdminUtilisateurs,
        meta: { title: 'Utilisateurs' }
      },
      {
        path: 'profil', // (/admin/profil) 
        name: 'ProfilUtilisateur',
        component: ProfilUtilisateur,
        meta: { title: 'Mon Profil' }
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Correction R0025 : Protection des routes administratives SANS utiliser next()
router.beforeEach((to) => {
  // Clé unique 'token' — celle écrite par authService lors du login
  const token = localStorage.getItem('token');

  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('user'));
  } catch {
    user = null;
  }
  const isAdmin = Boolean(user && user.role === 'Admin');
  const isAuthenticated = Boolean(token);

  // Vérifie si la route actuelle OU un de ses parents possède la propriété requiresAuth
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);

  if (requiresAuth && (!isAuthenticated || !isAdmin)) {
    // Non connecté, ou connecté sans le rôle Admin → page de connexion
    return '/admin/login';
  }

  // Bonus : Empêche un admin DÉJÀ connecté d'accéder à la page de login
  if (to.path === '/admin/login' && isAuthenticated && isAdmin) {
    return '/admin';
  }

  // Si on ne retourne rien, Vue Router laisse passer la navigation naturellement
});

export default router;