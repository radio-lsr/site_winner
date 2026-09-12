<template>
  <div class="site-public">
    <!-- En-tête -->
    <Header
        :cartItemCount="panier.length"
        :utilisateur="utilisateur"
        @open-cart="afficherPanierModal = true"
        @open-auth="afficherAuthModal = true"
        @logout="deconnexion" />
    
    <!-- Section Héroïque -->
    <Hero />
    
    <!-- Services -->
    <Services :listeServices="listeServices" />
    
    <!-- Boutique / Produits -->
    <Boutique :listeProduits="listeProduits" @select-product="ouvrirDetailsProduit" />
    
    <!-- Galerie -->
    <Galerie :listeGalerie="listeGalerie" />
    
    <!-- Articles & Tutoriels -->
    <Articles :listeArticles="listeArticles" @select-article="ouvrirDetailsArticle" />
    
    <!-- À propos -->
    <About />
    
    <!-- Pied de page -->
    <Footer />

    <!-- Modale Détails Produit -->
    <ProductModal 
      v-if="produitSelectionne" 
      :produit="produitSelectionne" 
      @close="fermerDetailsProduit" 
      @add-to-cart="ajouterAuPanier" 
    />

    <!-- Modale Détails Article / Tutoriel Vidéo -->
    <ArticleModal 
      v-if="articleSelectionne" 
      :article="articleSelectionne" 
      @close="fermerDetailsArticle" 
    />

    <!-- Modale Connexion / Inscription visiteur -->
    <AuthModal
        v-if="afficherAuthModal"
        @close="afficherAuthModal = false"
        @connected="surConnecte" />

    <!-- Modale Panier -->
    <CartModal 
        v-if="afficherPanierModal" 
      :panier="panier" 
      :commandeReussie="commandeReussie"
      @close="afficherPanierModal = false" 
      @remove-item="supprimerDuPanier" 
      @submit-order="confirmerCommande" 
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { API_URL, formatImageUrl } from '../services/config';

import Header from '../components/Header.vue';
import Hero from '../components/Hero.vue';
import AuthModal from '../components/AuthModal.vue';
import authService from '../services/authService';
import Services from '../components/Services.vue';
import Boutique from '../components/Boutique.vue';
import Galerie from '../components/Galerie.vue';
import Articles from '../components/Articles.vue';
import About from '../components/About.vue';
import Footer from '../components/Footer.vue';
import ProductModal from '../components/ProductModal.vue';
import ArticleModal from '../components/ArticleModal.vue';
import CartModal from '../components/CartModal.vue';

const listeProduits = ref([
    { id: 1, nom: "Huile Moteur Quartz 9000", prix: 45, image: "/prod.webp", specs: "Huile de synthèse 5W-40. Assure une protection optimale du moteur contre l'usure et l'encrassement. Idéal pour véhicules légers." },
    { id: 2, nom: "Liquide de Refroidissement", prix: 15, image: "/prod1.webp", specs: "Protège le moteur contre la surchauffe l'été et le gel l'hiver. Formule anti-corrosion de haute qualité." },
    { id: 3, nom: "Nettoyant Injecteur", prix: 12, image: "/telecharger.webp", specs: "Additif pour carburant. Nettoie le système d'injection, réduit la consommation et les émissions polluantes." },
    { id: 4, nom: "Bidon d'Huile 4x4", prix: 55, image: "/OIP2.webp", specs: "Formule spéciale pour les moteurs soumis à de fortes charges. Viscosité adaptée aux climats chauds." }
]);

const listeGalerie = ref([
    { type: 'image', url: '/OIP1.webp', titre: 'Notre Station Service' },
    { type: 'image', url: '/prod.webp', titre: 'Rayon Lubrifiants' },
    { type: 'image', url: '/telecharger.webp', titre: 'Entretien Rapide' },
    { type: 'video', url: '/tuto.mp4', titre: 'Tutoriel : Vidange' }
]);

const listeArticles = ref([
    { 
        id: 1, 
        titre: 'Quand et comment faire sa vidange ?', 
        image: '/OIP2.webp', 
        extrait: 'Découvrez les étapes clés pour réaliser la vidange de votre moteur en toute sécurité et prolonger la durée de vie de votre véhicule.',
        contenu: 'La vidange est l\'opération d\'entretien la plus importante pour votre véhicule.\n\n1. Préparez votre matériel : un bac de récupération, une clé de vidange, un nouveau filtre à huile et votre bidon d\'huile Total.\n2. Chauffez légèrement le moteur pour fluidifier l\'huile, puis éteignez-le.\n3. Dévissez le bouchon de carter sous la voiture et laissez couler toute l\'huile usagée.\n4. Changez le joint et revissez le bouchon.\n5. Remplacez l\'ancien filtre à huile par un neuf.\n6. Versez la nouvelle huile en vérifiant le niveau avec la jauge.',
        type: 'texte'
    },
    { 
        id: 2, 
        titre: 'Tutoriel Vidéo : Bien choisir son huile moteur', 
        image: '/prod1.webp', 
        extrait: '5W-30, 10W-40... Décryptez les étiquettes et choisissez le lubrifiant Total parfaitement adapté à votre moteur en vidéo.',
        type: 'video',
        urlVideo: '/tuto.mp4' 
    },
    { 
        id: 3, 
        titre: 'Le liquide de refroidissement', 
        image: '/telecharger.webp', 
        extrait: 'Pourquoi vérifier régulièrement son niveau ? Les risques de surchauffe et nos conseils d\'entretien pour l\'été.',
        contenu: 'Le liquide de refroidissement joue un rôle vital : il évite au moteur de surchauffer en été et de geler en hiver.\n\nIl est recommandé de vérifier le niveau tous les mois, moteur froid, en s\'assurant qu\'il se situe entre les repères MIN et MAX du vase d\'expansion. Si le niveau baisse anormalement, cela peut indiquer une fuite dans le circuit qu\'il convient de faire inspecter rapidement dans l\'une de nos stations-service.',
        type: 'texte'
    }
]);

const panier = ref([]);
const produitSelectionne = ref(null);

// Compte visiteur (facultatif) : connexion / inscription / déconnexion
const utilisateur = ref(authService.getCurrentUser());
const afficherAuthModal = ref(false);

const surConnecte = (user) => {
    utilisateur.value = user || null;
    afficherAuthModal.value = false;
};

const deconnexion = () => {
    authService.logout();
    utilisateur.value = null;
};
const articleSelectionne = ref(null);
const afficherPanierModal = ref(false);
const commandeReussie = ref(false);

const ouvrirDetailsProduit = (produit) => {
    produitSelectionne.value = produit;
};

const fermerDetailsProduit = () => {
    produitSelectionne.value = null;
};

const ouvrirDetailsArticle = (article) => {
    articleSelectionne.value = article;
};

const fermerDetailsArticle = () => {
    articleSelectionne.value = null;
};

const ajouterAuPanier = (articleAvecQuantite) => {
    const index = panier.value.findIndex(item => item.id === articleAvecQuantite.id);
    if (index !== -1) {
        panier.value[index].quantite += articleAvecQuantite.quantite;
    } else {
        panier.value.push({ ...articleAvecQuantite });
    }
    fermerDetailsProduit();
    afficherPanierModal.value = true;
};

const supprimerDuPanier = (index) => {
    if (index >= 0 && index < panier.value.length) {
        panier.value.splice(index, 1);
    }
};

const confirmerCommande = async (formData) => {
    // Envoi réel de la commande au backend (route publique POST /api/commandes)
    try {
        await axios.post(`${API_URL}/commandes`, {
            nom: formData.nom,
            telephone: formData.telephone,
            adresse: formData.adresse,
            dateLivraison: formData.date || null,
            articles: panier.value.map(item => ({
                id: item.id,
                nom: item.nom,
                prix: item.prix,
                quantite: item.quantite
            }))
        });
        commandeReussie.value = true;
    } catch (error) {
        console.error("Erreur lors de l'envoi de la commande :", error);
        alert("Impossible d'enregistrer la commande. Veuillez réessayer ou nous contacter par téléphone.");
        return;
    }
    setTimeout(() => {
        panier.value = [];
        commandeReussie.value = false;
        afficherPanierModal.value = false;
    }, 3500);
};

// ============================================================
// CHARGEMENT DES DONNÉES DEPUIS L'API
// Les listes codées en dur ci-dessus servent de secours si
// l'API est injoignable (le site reste consultable).
// ============================================================
const chargerProduits = async () => {
    try {
        const { data } = await axios.get(`${API_URL}/produits`);
        if (Array.isArray(data) && data.length > 0) {
            listeProduits.value = data.map(p => {
                const discount = Number(p.discount) || 0;
                const prixOriginal = Number(p.prix) || 0;
                // Prix réellement facturé (panier) = prix après remise
                const prix = discount > 0
                    ? Math.round(prixOriginal * (1 - discount / 100) * 100) / 100
                    : prixOriginal;
                return {
                    id: p.id,
                    nom: p.nom,
                    prix,
                    // Conservé uniquement s'il y a une remise -> affichage barré
                    prixOriginal: discount > 0 ? prixOriginal : null,
                    enSolde: discount > 0 || Boolean(p.enSolde),
                    image: formatImageUrl(p.image),
                    specs: p.description || 'Produit disponible dans nos stations-service.',
                    noteMoyenne: Number(p.noteMoyenne) || 0,
                    nbAvis: Number(p.nbAvis) || 0
                };
            });
        }
    } catch (error) {
        console.warn("API produits indisponible — affichage des données par défaut.", error?.message);
    }
};

const chargerGalerie = async () => {
    try {
        const { data } = await axios.get(`${API_URL}/galerie`);
        if (Array.isArray(data) && data.length > 0) {
            listeGalerie.value = data.map(item => ({
                type: 'image',
                url: formatImageUrl(item.image),
                titre: item.titre || 'WINNER Multiservice'
            }));
        }
    } catch (error) {
        console.warn("API galerie indisponible — affichage des données par défaut.", error?.message);
    }
};

const chargerArticles = async () => {
    try {
        const { data } = await axios.get(`${API_URL}/articles`);
        if (Array.isArray(data) && data.length > 0) {
            listeArticles.value = data.map(a => ({
                id: a.id,
                titre: a.titre,
                image: a.image_couverture ? formatImageUrl(a.image_couverture) : '/OIP2.webp',
                extrait: (a.contenu || '').slice(0, 140) + ((a.contenu || '').length > 140 ? '…' : ''),
                contenu: a.contenu || '',
                type: a.type_article === 'video' ? 'video' : 'texte',
                urlVideo: a.fichier_video ? formatImageUrl(a.fichier_video) : null
            }));
        }
    } catch (error) {
        console.warn("API articles indisponible — affichage des données par défaut.", error?.message);
    }
};

const chargerServices = async () => {
    try {
        const { data } = await axios.get(`${API_URL}/services`);
        if (Array.isArray(data) && data.length > 0) {
            listeServices.value = data
                .filter(s => !s.statut || s.statut === 'actif')
                .map(s => ({ titre: s.titre, description: s.description || '' }));
        }
    } catch (error) {
        console.warn("API services indisponible — affichage des données par défaut.", error?.message);
    }
};

// Services chargés depuis l'API (avec repli codé en dur dans Services.vue)
const listeServices = ref([]);

onMounted(() => {
    chargerProduits();
    chargerGalerie();
    chargerArticles();
    chargerServices();
});
</script>

<style scoped>
/* Conteneur global de la page d'accueil */
.site-public {
    position: relative;
    width: 100%;
    min-height: 100vh;
    background-color: var(--white, #ffffff);
    color: var(--text-dark, #333333);
}

/* Espacement global harmonieux pour éviter que le contenu ne se colle aux bords sur mobile */
section {
    scroll-margin-top: 90px;
}
</style>