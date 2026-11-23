<template>
  <section id="produits">
      <h2 class="section-title">
          Nos Produits en Vente
          <span v-if="categorieActive && categorieActive !== 'Toutes'" class="categorie-badge">
              — {{ categorieActive }}
          </span>
      </h2>
      <div v-if="produitsPagines.length > 0" class="produits-container">
          <div v-for="produit in produitsPagines" :key="produit.id" class="produit-card" @click="$emit('select-product', produit)">
              <div v-if="enPromo(produit)" class="promo-bar">🔥 En promotion</div>
              <div class="produit-img-container">
                  <img :src="produit.image" :alt="produit.nom">
              </div>
              <h3>{{ produit.nom }}</h3>
              <span class="code-produit">Code : {{ produit.code || 'PRD-' + String(produit.id).padStart(4, '0') }}</span>
              <!-- Note moyenne des clients (si des avis existent) -->
              <p v-if="produit.nbAvis > 0" class="note-carte" :title="produit.noteMoyenne.toFixed(1) + '/5'">
                  <span v-for="i in 5" :key="i" :class="i <= Math.round(produit.noteMoyenne) ? 'etoile-c pleine' : 'etoile-c'">★</span>
                  <span class="nb-avis-carte">({{ produit.nbAvis }})</span>
              </p>
              <!-- Prix en promotion : ancien prix barré + nouveau prix -->
              <div v-if="enPromo(produit)" class="prix-promo">
                  <span class="prix-barre">{{ formatPrix(produit.prixOriginal) }}</span>
                  <span class="prix-actuel">{{ formatPrix(produit.prix) }}</span>
              </div>
              <p v-else class="prix">{{ formatPrix(produit.prix) }}</p>
              <button class="btn-sm">Voir les détails</button>
          </div>
      </div>
      <p v-else class="aucun-produit">Aucun produit trouvé.</p>

      <!-- Pagination de la boutique -->
      <div v-if="nbPages > 1" class="pagination">
          <button type="button" class="page-btn nav" :disabled="pageCourante === 1" @click="allerA(pageCourante - 1)">‹ Précédent</button>
          <button
              v-for="(p, index) in pagesAffichage"
              :key="index"
              type="button"
              :class="['page-btn', p.active && 'active', p.trait && 'trait']"
              :disabled="p.trait"
              @click="p.page && allerA(p.page)">
              {{ p.label }}
          </button>
          <button type="button" class="page-btn nav" :disabled="pageCourante === nbPages" @click="allerA(pageCourante + 1)">Suivant ›</button>
      </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { formatPrix } from '../services/currency';

const props = defineProps({
    listeProduits: {
        type: Array,
        required: true
    },
    categorieActive: {
        type: String,
        default: 'Toutes'
    },
    // Recherche saisie dans l'en-tête (filtre la grille de la boutique)
    recherche: {
        type: String,
        default: ''
    }
});

defineEmits(['select-product']);

// Nombre de produits affichés par page.
const PAR_PAGE = 12;
const pageCourante = ref(1);

// Filtre catégorie + recherche (nom ou code), comme dans l'en-tête.
const produitsFiltres = computed(() => {
    const liste = Array.isArray(props.listeProduits) ? props.listeProduits : [];
    const q = String(props.recherche || '').trim().toLowerCase();
    return liste.filter(p => {
        const okCategorie = !props.categorieActive || props.categorieActive === 'Toutes'
            || String(p.categorie || '').toLowerCase() === String(props.categorieActive).toLowerCase();
        if (!okCategorie) return false;
        if (!q) return true;
        const code = String(p.code || `PRD-${String(p.id).padStart(4, '0')}`).toLowerCase();
        return String(p.nom || '').toLowerCase().includes(q) || code.includes(q);
    });
});

const nbPages = computed(() => Math.max(1, Math.ceil(produitsFiltres.value.length / PAR_PAGE)));

const debut = computed(() => (pageCourante.value - 1) * PAR_PAGE);
const produitsPagines = computed(() => produitsFiltres.value.slice(debut.value, debut.value + PAR_PAGE));

// Liste des pages à afficher, avec « … » quand il y en a beaucoup.
const pagesAffichage = computed(() => {
    const total = nbPages.value;
    const courant = pageCourante.value;
    const pages = [];
    const ajouter = (n) => pages.push({ label: String(n), page: n, active: n === courant, trait: false });
    if (total <= 7) {
        for (let i = 1; i <= total; i++) ajouter(i);
        return pages;
    }
    ajouter(1);
    if (courant > 3) pages.push({ label: '…', page: null, active: false, trait: true });
    const debutFenetre = Math.max(2, courant - 1);
    const finFenetre = Math.min(total - 1, courant + 1);
    for (let i = debutFenetre; i <= finFenetre; i++) ajouter(i);
    if (courant < total - 2) pages.push({ label: '…', page: null, active: false, trait: true });
    ajouter(total);
    return pages;
});

const allerA = (page) => {
    const cible = Math.min(Math.max(1, Number(page) || 1), nbPages.value);
    if (cible === pageCourante.value) return;
    pageCourante.value = cible;
    // Replace le visiteur sur la grille lors du changement de page.
    document.getElementById('produits')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

// Tout changement de filtre repart de la première page.
watch(
    [() => props.categorieActive, () => props.recherche, () => props.listeProduits],
    () => { pageCourante.value = 1; }
);

// Un produit est en promotion s'il a un prix d'origine barré
const enPromo = (produit) => Boolean(produit && produit.prixOriginal && produit.prixOriginal > produit.prix);
</script>

<style scoped>
#produits { padding: 80px 50px; background-color: #ffffff; text-align: center; }
.section-title { color: #143489; font-size: 36px; margin-bottom: 50px; }
.produits-container { display: flex; justify-content: center; gap: 30px; flex-wrap: wrap; }
.produit-card { background: #f4f4f4; padding: 20px; border-radius: 10px; width: 280px; text-align: center; cursor: pointer; transition: transform 0.3s, box-shadow 0.3s; position: relative; }
.produit-card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
.produit-img-container { height: 200px; display: flex; align-items: center; justify-content: center; overflow: hidden; margin-bottom: 15px; border-radius: 8px; background: white; }
.produit-img-container img { max-height: 100%; max-width: 100%; object-fit: contain; }
.produit-card h3 { color: #143489; font-size: 18px; margin-bottom: 10px; }
.note-carte { display: flex; justify-content: center; align-items: center; gap: 2px; margin: -4px 0 10px; font-size: 15px; }
.etoile-c { color: #d1d5db; }
.etoile-c.pleine { color: #f6a617; }
.nb-avis-carte { color: #6b7280; font-size: 12px; margin-left: 4px; }
.prix { color: #E31E24; font-size: 22px; font-weight: bold; margin-bottom: 15px; }
/* --- Affichage promotion : barre + prix barré + nouveau prix --- */
.promo-bar { position: absolute; top: 0; left: 0; right: 0; background: #E31E24; color: #ffffff; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 6px 0; text-align: center; border-radius: 10px 10px 0 0; z-index: 2; }
.prix-promo { display: flex; flex-direction: column; align-items: center; gap: 2px; margin-bottom: 15px; }
.prix-barre { text-decoration: line-through; color: #9ca3af; font-size: 14px; font-weight: 500; }
.prix-actuel { color: #E31E24; font-size: 22px; font-weight: bold; }
.btn-sm { background: #143489; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; transition: 0.3s; }
.btn-sm:hover { background: #E31E24; }
.code-produit { display: inline-block; font-size: 12px; color: #64748b; font-weight: 600; margin-bottom: 6px; }

/* --- Pagination --- */
.aucun-produit { color: #6b7280; font-size: 18px; padding: 40px 0; }
.pagination { display: flex; justify-content: center; align-items: center; flex-wrap: wrap; gap: 8px; margin-top: 45px; }
.page-btn {
    min-width: 42px;
    height: 42px;
    padding: 0 14px;
    border: 1px solid #cbd5e1;
    background: #ffffff;
    color: #143489;
    font-size: 15px;
    font-weight: 600;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.25s, color 0.25s, border-color 0.25s;
}
.page-btn:hover:not(:disabled):not(.active) { background: #eef2ff; border-color: #143489; }
.page-btn.active { background: #143489; border-color: #143489; color: #ffffff; }
.page-btn.nav { padding: 0 18px; }
.page-btn.trait { border: none; background: transparent; cursor: default; color: #94a3b8; }
.page-btn:disabled { opacity: 0.45; cursor: not-allowed; }
@media (max-width: 768px) {
    #produits { padding: 60px 20px; }
    .section-title { font-size: 28px; margin-bottom: 30px; }
    .page-btn { min-width: 38px; height: 38px; padding: 0 10px; }
}
</style>
