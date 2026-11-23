<template>
  <Teleport to="body">
    <Transition name="promo">
      <div
        v-if="visible && produitCourant"
        class="promo-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="Produit en promotion"
        @click.self="fermer"
      >
        <div
          class="promo-card"
          @mouseenter="arreterMinuteur"
          @mouseleave="demarrerMinuteur"
        >
          <button type="button" class="promo-close" aria-label="Fermer" @click="fermer">✕</button>

          <div class="promo-media">
            <span class="promo-badge">🔥 En promotion</span>
            <img :src="produitCourant.image" :alt="produitCourant.nom">
          </div>

          <div class="promo-body">
            <p class="promo-eyebrow">WINNER Multiservice</p>
            <h3 class="promo-nom">{{ produitCourant.nom }}</h3>
            <p class="promo-desc">
              {{ produitCourant.specs || 'Produit disponible dans nos stations-service.' }}
            </p>

            <p class="promo-prix">
              <span class="promo-barre">{{ formatPrix(produitCourant.prixOriginal) }}</span>
              <span class="promo-actuel">{{ formatPrix(produitCourant.prix) }}</span>
            </p>

            <div class="promo-actions">
              <button type="button" class="promo-btn" @click="voirProduit">Voir le produit</button>
            </div>

            <div v-if="promos.length > 1" class="promo-nav">
              <button
                type="button"
                class="promo-arrow"
                aria-label="Produit précédent"
                @click="precedent"
              >‹</button>
              <div class="promo-dots">
                <button
                  v-for="(p, i) in promos"
                  :key="p.id"
                  type="button"
                  :class="['promo-dot', { actif: i === index }]"
                  :aria-label="`Produit ${i + 1}`"
                  @click="allerA(i)"
                ></button>
              </div>
              <button
                type="button"
                class="promo-arrow"
                aria-label="Produit suivant"
                @click="suivant"
              >›</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { formatPrix } from '../services/currency';

const props = defineProps({
  produits: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['select-product']);

// Clé session : la popup ne s'ouvre qu'une fois par session de navigation.
const CLE_SESSION = 'winner_promo_presentee';
const DUREE_DEFILLEMENT = 4500;

const visible = ref(false);
const index = ref(0);
const DELAI_OUVERTURE = 1200;
let minuteur = null;
let delaiOuverture = null;
let presentee = false;

// Un produit est « en promotion » s'il a un prix d'origine barré plus haut.
const promos = computed(() =>
  (props.produits || []).filter(p => p && p.prixOriginal && p.prixOriginal > p.prix)
);

const produitCourant = computed(() => promos.value[index.value] || null);

const passeSuivant = () => {
  if (promos.value.length <= 1) return;
  index.value = (index.value + 1) % promos.value.length;
};

const demarrerMinuteur = () => {
  arreterMinuteur();
  if (promos.value.length > 1) {
    minuteur = setInterval(passeSuivant, DUREE_DEFILLEMENT);
  }
};

const arreterMinuteur = () => {
  if (minuteur) {
    clearInterval(minuteur);
    minuteur = null;
  }
};

const allerA = (i) => {
  index.value = i;
  demarrerMinuteur();
};

const precedent = () => {
  const n = promos.value.length;
  index.value = (index.value - 1 + n) % n;
  demarrerMinuteur();
};

const suivant = () => {
  passeSuivant();
  demarrerMinuteur();
};

const voirProduit = () => {
  const produit = produitCourant.value;
  fermer();
  if (produit) emit('select-product', produit);
};

const fermer = () => {
  visible.value = false;
  arreterMinuteur();
};

const ouvrirSiPromo = () => {
  if (presentee || !promos.value.length || delaiOuverture) return;
  // Petit délai : laisse le temps à l'API de renvoyer la vraie liste de
  // produits (la liste de secours ne doit pas être mise en avant).
  delaiOuverture = setTimeout(() => {
    delaiOuverture = null;
    if (presentee || !promos.value.length) return;
    // La popup ne s'ouvre qu'une fois par session de navigation.
    let dejaVue = false;
    try {
      dejaVue = Boolean(sessionStorage.getItem(CLE_SESSION));
    } catch {
      /* sessionStorage indisponible (navigation privée) : on ignore */
    }
    presentee = true;
    if (dejaVue) return;
    try {
      sessionStorage.setItem(CLE_SESSION, '1');
    } catch {
      /* idem : le stockage local peut être désactivé */
    }
    index.value = 0;
    visible.value = true;
    demarrerMinuteur();
  }, DELAI_OUVERTURE);
};

const gererEchap = (event) => {
  if (event.key === 'Escape' && visible.value) fermer();
};

onMounted(() => {
  ouvrirSiPromo();
  window.addEventListener('keydown', gererEchap);
});

onUnmounted(() => {
  arreterMinuteur();
  if (delaiOuverture) {
    clearTimeout(delaiOuverture);
    delaiOuverture = null;
  }
  window.removeEventListener('keydown', gererEchap);
});

// La liste de produits peut arriver après le montage (appel API) : on
// réessaie l'ouverture dès que des promotions sont disponibles.
watch(promos, () => ouvrirSiPromo(), { immediate: true });
</script>

<style scoped>
.promo-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.66);
  backdrop-filter: blur(3px);
}

.promo-card {
  position: relative;
  display: flex;
  width: min(880px, 100%);
  min-height: 340px;
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 30px 80px rgba(15, 23, 42, 0.4);
  border-top: 5px solid var(--red, #E31E24);
}

.promo-close {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 3;
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 50%;
  background: rgba(20, 52, 137, 0.08);
  color: #143489;
  font-size: 15px;
  cursor: pointer;
  transition: background .15s, color .15s;
}
.promo-close:hover { background: var(--red, #E31E24); color: #fff; }

.promo-media {
  position: relative;
  flex: 0 0 340px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 26px;
  background: linear-gradient(160deg, #f4f7ff 0%, #e8eefc 100%);
}
.promo-media img {
  max-width: 100%;
  max-height: 280px;
  object-fit: contain;
  filter: drop-shadow(0 12px 22px rgba(20, 52, 137, 0.22));
}
.promo-badge {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  background: var(--red, #E31E24);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  padding: 7px 0;
  text-align: center;
}

.promo-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 34px 34px 28px;
  text-align: left;
}
.promo-eyebrow {
  color: var(--blue, #143489);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-bottom: 10px;
}
.promo-nom {
  color: var(--blue, #143489);
  font-size: 26px;
  line-height: 1.2;
  margin-bottom: 12px;
}
.promo-desc {
  color: #4b5563;
  font-size: 14px;
  line-height: 1.65;
  margin-bottom: 18px;
}
.promo-prix {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 22px;
}
.promo-barre {
  color: #9ca3af;
  font-size: 18px;
  font-weight: 600;
  text-decoration: line-through;
}
.promo-actuel {
  color: var(--red, #E31E24);
  font-size: 30px;
  font-weight: 800;
}

.promo-actions { margin-bottom: 20px; }
.promo-btn {
  display: inline-block;
  padding: 12px 26px;
  background: var(--red, #E31E24);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: .5px;
  cursor: pointer;
  transition: background .15s, transform .15s;
}
.promo-btn:hover { background: var(--bordeaux, #80142D); transform: translateY(-1px); }

.promo-nav {
  display: flex;
  align-items: center;
  gap: 14px;
}
.promo-arrow {
  width: 30px;
  height: 30px;
  border: 1px solid #cbd5e1;
  border-radius: 50%;
  background: #fff;
  color: #143489;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  transition: background .15s, color .15s;
}
.promo-arrow:hover { background: var(--blue, #143489); color: #fff; }
.promo-dots { display: flex; gap: 8px; }
.promo-dot {
  width: 9px;
  height: 9px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: #cbd5e1;
  cursor: pointer;
  transition: background .15s, transform .15s;
}
.promo-dot.actif { background: var(--red, #E31E24); transform: scale(1.25); }

/* --- Animation d'ouverture --- */
.promo-enter-active, .promo-leave-active { transition: opacity .25s ease; }
.promo-enter-from, .promo-leave-to { opacity: 0; }
.promo-enter-active .promo-card,
.promo-leave-active .promo-card { transition: transform .25s ease; }
.promo-enter-from .promo-card,
.promo-leave-to .promo-card { transform: translateY(18px) scale(.97); }

@media (max-width: 720px) {
  .promo-card { flex-direction: column; min-height: 0; }
  .promo-media { flex: 0 0 auto; padding: 30px 20px 18px; }
  .promo-media img { max-height: 180px; }
  .promo-body { padding: 22px 22px 26px; }
  .promo-nom { font-size: 21px; }
  .promo-actuel { font-size: 25px; }
}
</style>
