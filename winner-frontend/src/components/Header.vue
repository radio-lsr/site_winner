<template>
  <header>
      <a href="#accueil" class="logo">
          <img src="/Logo-Winner.png" alt="Logo Winner Multiservice" onerror="this.style.display='none'">
          <h1>WINNER <span>Multiservice</span></h1>
      </a>
      <nav>
          <ul>
              <li><a href="#accueil">Accueil</a></li>
              <li><a href="#services">Nos Services</a></li>
              <li class="nav-dropdown" @mouseenter="menuBoutiqueOuvert = true" @mouseleave="menuBoutiqueOuvert = false">
                  <a href="#produits" @click="choisirCategorie('Toutes')">Boutique ▾</a>
                  <ul v-show="menuBoutiqueOuvert" class="dropdown-menu">
                      <li>
                          <a href="#produits" @click="choisirCategorie('Toutes')">Tous les produits</a>
                      </li>
                      <li v-for="cat in categories" :key="cat">
                          <a href="#produits" @click="choisirCategorie(cat)">{{ cat }}</a>
                      </li>
                  </ul>
              </li>
              <li><a href="#galerie">Galerie</a></li>
              <li><a href="#articles">Conseils</a></li>
              <li><a href="#apropos">À Propos</a></li>
              <li class="header-search-item">
                  <input
                      v-model="termeRecherche"
                      type="search"
                      placeholder="🔍 Rechercher un produit..."
                      class="header-search-input"
                      @focus="suggestionsOuvertes = true"
                      @input="onSearchInput"
                      @keydown.enter="allerAuxProduits"
                  />
                  <ul v-if="suggestionsOuvertes && suggestions.length > 0" class="search-suggestions">
                      <li
                          v-for="p in suggestions"
                          :key="p.id"
                          class="suggestion-item"
                          @mousedown.prevent="selectionnerProduit(p)"
                      >
                          <span class="suggestion-nom">{{ p.nom }}</span>
                          <span class="suggestion-code">PRD-{{ String(p.id).padStart(4, '0') }}</span>
                      </li>
                  </ul>
              </li>
              <li>
                  <a href="#" @click.prevent="$emit('open-cart')" class="btn-panier">
                      🛒 Panier <span v-if="cartItemCount > 0" class="badge">{{ cartItemCount }}</span>
                  </a>
              </li>
          </ul>
      </nav>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue';

// Site vitrine : aucun compte client — le header ne gère que le panier.
const props = defineProps({
    cartItemCount: {
        type: Number,
        default: 0
    },
    categories: {
        type: Array,
        default: () => []
    },
    produits: {
        type: Array,
        default: () => []
    }
});

const emit = defineEmits(['open-cart', 'select-category', 'search', 'select-product']);
const menuBoutiqueOuvert = ref(false);
const termeRecherche = ref('');
const suggestionsOuvertes = ref(false);

const suggestions = computed(() => {
    const q = termeRecherche.value.trim().toLowerCase();
    if (!q) return [];
    return (props.produits || []).filter(p => {
        const code = `prd-${String(p.id).padStart(4, '0')}`;
        return (p.nom || '').toLowerCase().includes(q) || code.includes(q);
    }).slice(0, 6);
});

const onSearchInput = () => {
    suggestionsOuvertes.value = true;
    emit('search', termeRecherche.value);
};

const selectionnerProduit = (produit) => {
    suggestionsOuvertes.value = false;
    termeRecherche.value = produit.nom;
    emit('search', '');
    const el = document.getElementById('produits');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    emit('select-product', produit);
};

const choisirCategorie = (cat) => {
    menuBoutiqueOuvert.value = false;
    emit('select-category', cat);
};
</script>

<style scoped>
header { background-color: #ffffff; box-shadow: 0 2px 10px rgba(0,0,0,0.1); position: fixed; width: 100%; top: 0; z-index: 1000; display: flex; justify-content: space-between; align-items: center; padding: 15px 50px; }
.logo { display: flex; align-items: center; text-decoration: none; }
.logo img { height: 60px; margin-right: 15px; }
.logo h1 { color: #143489; font-size: 24px; font-weight: 700; }
.logo h1 span { color: #E31E24; }
nav ul { list-style: none; display: flex; align-items: center; }
nav ul li { margin-left: 30px; }
nav ul li a { text-decoration: none; color: #143489; font-weight: 600; transition: color 0.3s ease; }
nav ul li a:hover { color: #E31E24; }
.btn-panier { background: #143489; color: white !important; padding: 8px 15px; border-radius: 20px; display: flex; align-items: center; gap: 8px; }
.btn-panier:hover { background: #80142D; }
.badge { background: #E31E24; color: white; border-radius: 50%; padding: 2px 8px; font-size: 12px; }
@media (max-width: 768px) {
    header { flex-direction: column; padding: 15px 20px; }
    nav ul { margin-top: 15px; flex-wrap: wrap; justify-content: center; }
    nav ul li { margin: 5px 10px; }
}
.nav-dropdown { position: relative; }
.dropdown-menu {
    position: absolute;
    top: 100%;
    left: 0;
    min-width: 210px;
    background: #ffffff;
    border-radius: 10px;
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.14);
    border: 1px solid #e2e8f0;
    padding: 8px 0;
    list-style: none;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: 2px;
}
.dropdown-menu li a {
    display: block;
    padding: 9px 16px;
    color: #1e293b;
    font-size: 14px;
    font-weight: 500;
    text-decoration: none;
    white-space: nowrap;
}
.dropdown-menu li a:hover {
    background: #f8fafc;
    color: #1e3a8a;
}
.header-search-input {
    padding: 7px 12px;
    border: 1px solid #cbd5e1;
    border-radius: 20px;
    font-size: 13px;
    width: 190px;
    outline: none;
    transition: border-color 0.2s, width 0.2s;
}
.header-search-input:focus {
    border-color: #1e3a8a;
    width: 220px;
}
.header-search-item { position: relative; }
.search-suggestions {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    width: 260px;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.14);
    list-style: none;
    padding: 6px 0;
    margin: 0;
    z-index: 1100;
    display: flex;
    flex-direction: column;
}
.suggestion-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 14px;
    cursor: pointer;
    font-size: 13px;
    color: #1e293b;
}
.suggestion-item:hover { background: #f1f5f9; color: #1e3a8a; }
.suggestion-code { font-size: 11px; color: #64748b; font-weight: 600; }
</style>