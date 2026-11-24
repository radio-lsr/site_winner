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
import AdminMessages from '@/views/admin/AdminMessages.vue';
import AdminAvis from '@/views/admin/AdminAvis.vue';
import AdminHero from '@/views/admin/AdminHero.vue';
import AdminLogs from '@/views/admin/AdminLogs.vue';
import ProfilUtilisateur from '../views/admin/ProfilUtilisateur.vue';
import RedirectionExterne from '../views/RedirectionExterne.vue';

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
  // Adresse courte et « propre » (sans identifiant numérique) vers Facebook.
  {
    path: '/facebook',
    name: 'FacebookRedirect',
    component: RedirectionExterne,
    meta: { title: 'Facebook' }
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
        path: 'messages', // (/admin/messages)
        name: 'AdminMessages',
        component: AdminMessages,
        meta: { title: 'Messages & Devis' }
      },
      {
        path: 'avis', // (/admin/avis)
        name: 'AdminAvis',
        component: AdminAvis,
        meta: { title: 'Avis & Commentaires' }
      },
      {
        path: 'hero', // (/admin/hero)
        name: 'AdminHero',
        component: AdminHero,
        meta: { title: 'Bannière d\'accueil' }
      },
      {
        path: 'logs', // (/admin/logs) — réservé à l'Admin
        name: 'AdminLogs',
        component: AdminLogs,
        meta: { title: 'Logs système', roles: ['Admin'] }
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
  // Le cookie de session HttpOnly n'est pas lisible ici; ce profil local sert
  // uniquement à l'expérience UI. L'API vérifie réellement chaque accès.
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('user'));
  } catch {
    user = null;
  }
  const role = user?.role || '';
  const isStaff = role === 'Admin' || role === 'Modérateur';
  const isAuthenticated = Boolean(user);

  // Vérifie si la route actuelle OU un de ses parents possède la propriété requiresAuth
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);

  if (requiresAuth && (!isAuthenticated || !isStaff)) {
    // Non connecté, ou connecté sans rôle d'accès au back-office → page de connexion
    return '/admin/login';
  }

  // Contrôle fin par page : chaque sous-page déclare les rôles autorisés (meta.roles)
  const rolesRequis = [...to.matched].reverse().find(record => record.meta.roles)?.meta.roles;
  if (requiresAuth && rolesRequis && !rolesRequis.includes(role)) {
    // Le modérateur est redirigé vers la première page de son périmètre (commandes)
    return role === 'Modérateur' ? '/admin/commandes' : '/admin/login';
  }

  // Bonus : Empêche un membre du personnel DÉJÀ connecté d'accéder à la page de login
  if (to.path === '/admin/login' && isStaff) {
    return '/admin';
  }

  // Si on ne retourne rien, Vue Router laisse passer la navigation naturellement
});

// Titre d'onglet dynamique : « Section · WINNER Multiservice »
router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · WINNER Multiservice` : 'WINNER Multiservice';
  const routePrivee = /^\/(admin(?:\/|$)|login(?:\/|$))/i.test(to.path);
  let robots = document.querySelector('meta[name="robots"]');
  if (routePrivee) {
    if (!robots) {
      robots = document.createElement('meta');
      robots.name = 'robots';
      document.head.appendChild(robots);
    }
    robots.content = 'noindex, nofollow, noarchive';
  } else if (robots) {
    robots.remove();
  }
});

export default router;