// ============================================================
// Configuration centralisée de l'API
// ------------------------------------------------------------
// En développement, l'API tourne sur http://localhost:5000.
// En production, définissez VITE_API_URL (ex: https://api.winner.cd)
// ou laissez vide pour utiliser le proxy /api du même domaine.
// ============================================================

// Valeur par défaut si la variable d'environnement n'est pas fournie
const DEFAULT_API_BASE = 'http://localhost:5000';

const envValue = import.meta.env.VITE_API_URL;

// Base de l'API (sans /api).
// - Non définie      -> http://localhost:5000 (développement local)
// - Chaîne vide ""   -> URLs relatives /api (proxy même domaine)
// - Autre valeur     -> utilisée telle quelle
export const API_BASE_URL = (envValue !== undefined && envValue !== null)
  ? envValue
  : DEFAULT_API_BASE;

// Racine complète des endpoints : http://localhost:5000/api
export const API_URL = `${API_BASE_URL}/api`;

// Page Facebook de WINNER Multiservice (cible de la redirection).
export const FACEBOOK_URL = 'https://www.facebook.com/profile.php?id=61597049302114';

// Adresse courte affichée sur le site : elle ne contient aucun identifiant
// numérique et redirige vers la cible ci-dessus.
export const FACEBOOK_LINK = '/facebook';

// WhatsApp de WINNER Multiservice (bouton flottant) : numéro du pied de page,
// avec un message pré-rempli.
export const WHATSAPP_URL =
  'https://wa.me/243980624652?text=' +
  encodeURIComponent('Bonjour Winner Multiservice, je vous contacte depuis votre site.');

/**
 * Construit l'URL absolue d'un fichier uploadé renvoyé par le backend.
 * Le backend renvoie des chemins relatifs comme "/uploads/xxx.png".
 */
export const formatImageUrl = (imagePath) => {
  if (!imagePath) return '';
  // URLs déjà absolues, blobs (aperçu avant upload) ou data URIs
  if (/^(https?:|blob:|data:)/i.test(imagePath)) return imagePath;
  // Ancien format stocké en base : "public/uploads/xxx.png"
  const clean = imagePath.replace(/^public\//, '');
  const normalized = clean.startsWith('/') ? clean : `/${clean}`;
  return `${API_BASE_URL}${normalized}`;
};
