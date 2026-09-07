<template>
  <div class="site-public">
    <!-- En-tête -->
    <Header :cartItemCount="panier.length" @open-cart="afficherPanierModal = true" />
    
    <!-- Section Héroïque -->
    <Hero />
    
    <!-- Services -->
    <Services />
    
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
import { ref } from 'vue';

import Header from '../components/Header.vue';
import Hero from '../components/Hero.vue';
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

const confirmerCommande = (formData) => {
    console.log("Commande validée :", { client: formData, articles: panier.value });
    commandeReussie.value = true;
    setTimeout(() => {
        panier.value = [];
        commandeReussie.value = false;
        afficherPanierModal.value = false;
    }, 3500);
};
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