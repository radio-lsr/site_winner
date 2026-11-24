<template>
  <div v-if="nbPages > 1" class="pagination">
      <button
          type="button"
          class="page-btn nav"
          :disabled="modelValue === 1"
          @click="allerA(modelValue - 1)">
          ‹ Précédent
      </button>
      <button
          v-for="(p, index) in pagesAffichage"
          :key="index"
          type="button"
          :class="['page-btn', p.active && 'active', p.trait && 'trait']"
          :disabled="p.trait"
          @click="p.page && allerA(p.page)">
          {{ p.label }}
      </button>
      <button
          type="button"
          class="page-btn nav"
          :disabled="modelValue === nbPages"
          @click="allerA(modelValue + 1)">
          Suivant ›
      </button>
  </div>
</template>

<script setup>
import { computed } from 'vue';

// Pagination réutilisable (galerie, articles, boutique…).
// - modelValue : page affichée (1-based)
// - totalElements : nombre d'éléments à répartir
// - parPage : éléments par page (défaut 12)
const props = defineProps({
    modelValue: {
        type: Number,
        required: true
    },
    totalElements: {
        type: Number,
        default: 0
    },
    parPage: {
        type: Number,
        default: 12
    }
});

const emit = defineEmits(['update:modelValue']);

const nbPages = computed(() =>
    Math.max(1, Math.ceil((props.totalElements || 0) / (props.parPage || 12)))
);

const pagesAffichage = computed(() => {
    const total = nbPages.value;
    const courant = props.modelValue;
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
    const cible = Math.min(Math.max(1, page), nbPages.value);
    if (cible !== props.modelValue) emit('update:modelValue', cible);
};
</script>

<style scoped>
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
</style>
