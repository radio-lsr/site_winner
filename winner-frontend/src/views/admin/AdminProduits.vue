<template>
  <div class="page-section">
    <div class="page-header">
      <input type="text" placeholder="🔍 Rechercher un produit..." class="search-input" v-model="recherche" />
      <button class="btn-yellow" @click="ouvrirModalAjout">➕ Nouveau Produit</button>
    </div>
    
    <!-- Fenêtre Modale (Ajout / Modification) -->
    <div v-if="afficherModal" class="modal-overlay" @click.self="fermerModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ idEnEdition ? 'Modifier le produit' : 'Ajouter un nouveau produit' }}</h3>
          <button class="close-btn" @click="fermerModal" :disabled="isLoading">✖</button>
        </div>
        
        <form @submit.prevent="soumettreProduit" class="modal-form">
          <div class="form-group">
            <label>Nom du produit</label>
            <input v-model="formProduit.nom" type="text" required placeholder="Ex: Huile Moteur 5W30" :disabled="isLoading" />
          </div>
          
          <div class="form-group">
            <label>Catégorie</label>
            <select v-model="formProduit.categorie" required :disabled="isLoading">
              <option value="" disabled>Sélectionner une catégorie</option>
              <option value="Lubrifiants">Lubrifiants</option>
              <option value="Accessoires">Accessoires</option>
              <option value="Pièces de rechange">Pièces de rechange</option>
            </select>
          </div>

          <!-- Champ Description -->
          <div class="form-group">
            <label>Description du produit</label>
            <textarea v-model="formProduit.description" rows="3" placeholder="Brève description du produit..." :disabled="isLoading"></textarea>
          </div>

          <!-- Champ Image -->
          <div class="form-group">
            <label>Image du produit</label>
            <input type="file" accept="image/*" @change="handleFileUpload" :disabled="isLoading" class="file-input" />
            <small class="text-muted" v-if="idEnEdition">Laissez vide pour conserver l'image actuelle.</small>
          </div>

          <!-- Checkbox Promo -->
          <div class="form-group checkbox-group">
            <label>
              <input type="checkbox" v-model="formProduit.enSolde" :disabled="isLoading" />
              Ce produit est en promotion
            </label>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Prix ($)</label>
              <input v-model="formProduit.prix" type="number" step="0.01" min="0" required placeholder="0.00" :disabled="isLoading" />
            </div>
            
            <div v-if="formProduit.enSolde" class="form-group fade-in">
              <label>Remise (%)</label>
              <input v-model="formProduit.discount" type="number" min="1" max="100" required placeholder="Ex: 10" :disabled="isLoading" />
            </div>
            
            <div class="form-group">
              <label>Quantité en stock</label>
              <input v-model="formProduit.stock" type="number" min="0" required placeholder="Ex: 10" :disabled="isLoading" />
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn-cancel" @click="fermerModal" :disabled="isLoading">Annuler</button>
            <button type="submit" class="btn-yellow" :disabled="isLoading">
              {{ isLoading ? 'Enregistrement...' : (idEnEdition ? 'Mettre à jour' : 'Enregistrer le produit') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Tableau des produits -->
    <table class="admin-table">
      <thead>
        <tr>
          <th>Image</th>
          <th>Nom du produit</th>
          <th>Catégorie</th>
          <th>Prix</th>
          <th>Remise</th>
          <th>Stock</th>
          <th>Disponibilité (ON/OFF)</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="produitsFiltres.length === 0">
          <td colspan="8" style="text-align: center; color: #6b7280; padding: 30px;">
            Aucun produit trouvé.
          </td>
        </tr>
        <tr v-else v-for="produit in produitsFiltres" :key="produit.id">
          <!-- CORRECTION : Utilisation de formatImageUrl pour afficher la bonne URL -->
          <td><img :src="formatImageUrl(produit.image)" :alt="produit.nom" class="table-img" /></td>
          <td>
            <strong>{{ produit.nom }}</strong>
            <div class="text-muted" style="font-size: 11px; margin-top: 4px; max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              {{ produit.description }}
            </div>
          </td>
          <td>{{ produit.categorie }}</td>
          
          <td>
            <div class="price-container">
              <span v-if="produit.discount > 0" class="old-price">{{ Number(produit.prix).toFixed(2) }} $</span>
              <span class="current-price">{{ calculerPrixRemise(produit.prix, produit.discount).toFixed(2) }} $</span>
            </div>
          </td>
          
          <td>
            <span v-if="produit.discount > 0" class="badge-discount">-{{ produit.discount }}%</span>
            <span v-else class="text-muted">-</span>
          </td>
          
          <td>
            <span :class="['stock', (produit.disponible && produit.stock > 0) ? (produit.stock > 5 ? 'in-stock' : 'low-stock') : 'out-of-stock']">
              {{ produit.disponible && produit.stock > 0 ? `${produit.stock} en stock` : 'Rupture' }}
            </span>
          </td>

          <!-- BOUTON ON/OFF -->
          <td>
            <div class="toggle-container">
              <label class="switch">
                <input type="checkbox" :checked="produit.disponible" @change="toggleDisponibilite(produit)" />
                <span class="slider round"></span>
              </label>
              <span class="toggle-label" :class="{ 'text-active': produit.disponible }">
                {{ produit.disponible ? 'En Stock' : 'Rupture' }}
              </span>
            </div>
          </td>

          <td>
            <button class="action-btn" title="Modifier" @click="ouvrirModalEdition(produit)">✏️</button>
            <button class="action-btn" title="Supprimer" @click="supprimerProduit(produit.id)">🗑️</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

// --- CONFIGURATION API ---
const BACKEND_URL = 'http://localhost:5000' // Adresse du backend
const API_URL = `${BACKEND_URL}/api/produits`

const getAuthHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`
  }
})

// --- DONNÉES ---
const produits = ref([])
const recherche = ref('')
const isLoading = ref(false)

// --- GESTION DE LA MODALE ---
const afficherModal = ref(false)
const idEnEdition = ref(null)

const formProduit = ref({
  nom: '',
  categorie: '',
  description: '',
  prix: '',
  discount: '',
  stock: '',
  enSolde: false,
  image: null 
})

// --- APPELS API BACKEND ---
const fetchProduits = async () => {
  try {
    const response = await axios.get(API_URL, getAuthHeaders())
    produits.value = response.data
  } catch (error) {
    console.error("Erreur lors de la récupération des produits :", error)
  }
}

onMounted(() => {
  fetchProduits()
})

const produitsFiltres = computed(() => {
  if (!recherche.value) return produits.value
  const q = recherche.value.toLowerCase()
  return produits.value.filter(p => 
    p.nom.toLowerCase().includes(q) ||
    p.categorie.toLowerCase().includes(q)
  )
})

// Capture du fichier image
const handleFileUpload = (event) => {
  formProduit.value.image = event.target.files[0]
}

// --- ACTIONS MODALE ---
const ouvrirModalAjout = () => {
  idEnEdition.value = null
  formProduit.value = { nom: '', categorie: '', description: '', prix: '', discount: '', stock: '', enSolde: false, image: null }
  afficherModal.value = true
}

const ouvrirModalEdition = (produit) => {
  idEnEdition.value = produit.id
  formProduit.value = {
    nom: produit.nom,
    categorie: produit.categorie,
    description: produit.description || '',
    prix: produit.prix,
    discount: produit.discount || '',
    stock: produit.stock,
    enSolde: produit.discount > 0,
    image: null
  }
  afficherModal.value = true
}

const fermerModal = () => {
  afficherModal.value = false
  idEnEdition.value = null
  formProduit.value = { nom: '', categorie: '', description: '', prix: '', discount: '', stock: '', enSolde: false, image: null }
}

// --- SOUMISSION API ---
const soumettreProduit = async () => {
  isLoading.value = true
  const remiseFinale = formProduit.value.enSolde ? (parseInt(formProduit.value.discount) || 0) : 0

  const formData = new FormData()
  formData.append('nom', formProduit.value.nom)
  formData.append('categorie', formProduit.value.categorie)
  formData.append('description', formProduit.value.description)
  formData.append('prix', formProduit.value.prix)
  formData.append('discount', remiseFinale)
  formData.append('stock', formProduit.value.stock)
  
  if (formProduit.value.image) {
    formData.append('image', formProduit.value.image)
  }

  try {
    if (idEnEdition.value !== null) {
      await axios.put(`${API_URL}/${idEnEdition.value}`, formData, getAuthHeaders())
    } else {
      formData.append('disponible', 'true')
      await axios.post(API_URL, formData, getAuthHeaders())
    }
    
    await fetchProduits()
    fermerModal()
  } catch (error) {
    console.error("Erreur lors de la sauvegarde :", error)
    alert("Une erreur est survenue lors de l'enregistrement.")
  } finally {
    isLoading.value = false
  }
}

// --- SUPPRESSION API ---
const supprimerProduit = async (id) => {
  if (confirm("Voulez-vous vraiment supprimer ce produit ?")) {
    try {
      await axios.delete(`${API_URL}/${id}`, getAuthHeaders())
      produits.value = produits.value.filter(p => p.id !== id)
    } catch (error) {
      console.error("Erreur lors de la suppression :", error)
      alert("Impossible de supprimer le produit.")
    }
  }
}

// --- BASCULEMENT ON/OFF API ---
const toggleDisponibilite = async (produit) => {
  const ancienneValeur = produit.disponible
  produit.disponible = !produit.disponible 
  
  try {
    await axios.put(`${API_URL}/${produit.id}`, { disponible: produit.disponible }, getAuthHeaders())
  } catch (error) {
    console.error("Erreur lors de la mise à jour de disponibilité :", error)
    produit.disponible = ancienneValeur
    alert("Impossible de modifier la disponibilité.")
  }
}

// --- UTILITAIRES ---
const calculerPrixRemise = (prix, discount) => {
  const p = Number(prix)
  if (!discount || discount <= 0) return p
  return p - (p * (discount / 100))
}

// CORRECTION : Fonction pour formater l'URL de l'image correctement
const formatImageUrl = (imagePath) => {
  if (!imagePath) return '/prod.webp'
  
  // Si le chemin enregistré dans la DB commence par "/uploads", on y ajoute l'URL du Backend
  if (imagePath.startsWith('/uploads')) {
    return `${BACKEND_URL}${imagePath}`
  }
  
  return imagePath
}
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; margin-bottom: 25px; }
.search-input { padding: 12px 20px; border: 1px solid #e5e7eb; border-radius: 8px; width: 350px; outline: none; }
.search-input:focus { border-color: #241a4a; }

.btn-yellow { background-color: #f6a617; color: #1f1443; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 700; cursor: pointer; transition: 0.2s; }
.btn-yellow:hover { background-color: #e09612; }
.btn-yellow:disabled { opacity: 0.6; cursor: not-allowed; }

.admin-table { width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.02); }
.admin-table th, .admin-table td { padding: 18px 20px; text-align: left; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
.admin-table th { background-color: #f9fafb; color: #6b7280; font-size: 12px; text-transform: uppercase; }

.table-img { width: 45px; height: 45px; border-radius: 6px; object-fit: cover; }
.stock.in-stock { color: #15803d; font-weight: 600; }
.stock.low-stock { color: #d97706; font-weight: 600; }
.stock.out-of-stock { color: #dc2626; font-weight: 600; }

.action-btn { background: none; border: none; font-size: 16px; cursor: pointer; margin-right: 10px; transition: transform 0.2s; }
.action-btn:hover { transform: scale(1.2); }

.price-container { display: flex; flex-direction: column; }
.old-price { text-decoration: line-through; color: #9ca3af; font-size: 12px; }
.current-price { font-weight: 600; color: #1f1443; }
.badge-discount { background-color: #fee2e2; color: #ef4444; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 700; display: inline-block;}
.text-muted { color: #9ca3af; font-size: 13px; }

.toggle-container { display: flex; align-items: center; gap: 10px; }
.toggle-label { font-size: 12px; font-weight: 600; color: #9ca3af; }
.toggle-label.text-active { color: #16a34a; }

.switch { position: relative; display: inline-block; width: 44px; height: 24px; }
.switch input { opacity: 0; width: 0; height: 0; }
.slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #cbd5e1; transition: .3s; }
.slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .3s; }
input:checked + .slider { background-color: #16a34a; }
input:checked + .slider:before { transform: translateX(20px); }
.slider.round { border-radius: 24px; }
.slider.round:before { border-radius: 50%; }

.modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; backdrop-filter: blur(2px); }
.modal-content { background: white; padding: 30px; border-radius: 12px; width: 100%; max-width: 550px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2); animation: slideDown 0.3s ease-out; }

@keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }

.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.modal-header h3 { margin: 0; color: #1f1443; font-size: 20px; }
.close-btn { background: transparent; border: none; font-size: 20px; color: #9ca3af; cursor: pointer; }
.close-btn:hover { color: #ef4444; }

.modal-form { display: flex; flex-direction: column; gap: 15px; }
.form-row { display: flex; gap: 15px; align-items: flex-start; }
.form-row .form-group { flex: 1; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 13px; font-weight: 600; color: #374151; }

.form-group input:not([type="checkbox"]), .form-group select, .form-group textarea { padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; outline: none; width: 100%; box-sizing: border-box; font-family: inherit; }
.form-group input:disabled, .form-group select:disabled, .form-group textarea:disabled { background: #f3f4f6; cursor: not-allowed; }
.file-input { padding: 6px !important; font-size: 13px; }

.checkbox-group label { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 14px; color: #1f1443; font-weight: 500; }
.checkbox-group input[type="checkbox"] { width: 16px; height: 16px; accent-color: #f6a617; cursor: pointer; }

.fade-in { animation: fadeIn 0.3s ease-in-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }

.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 15px; padding-top: 15px; border-top: 1px solid #f3f4f6; }
.btn-cancel { background: #f3f4f6; color: #4b5563; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; }
.btn-cancel:hover { background: #e5e7eb; }
.btn-cancel:disabled { opacity: 0.6; cursor: not-allowed; }
</style>