<template>
  <div class="login-container">
    <div class="login-card">
      <div class="logo-area">
        <img src="/Logo-Winner.png" alt="Logo Winner Multiservice" class="logo-img">
        <h2>Espace Administration</h2>
        <p>WINNER Multiservice</p>
      </div>

      <!-- Formulaire de Connexion -->
      <form v-if="!modeOubli" @submit.prevent="gererConnexion" class="login-form">
        <div v-if="erreur" class="alert-error">{{ erreur }}</div>

        <div class="form-group">
          <label for="email">Adresse Email</label>
          <input 
            type="email" 
            id="email" 
            v-model="email" 
            required 
            placeholder="admin@winnermultiservice.com"
          >
        </div>

        <div class="form-group">
          <label for="password">Mot de passe</label>
          <input 
            type="password" 
            id="password" 
            v-model="password" 
            required 
            placeholder="••••••••"
          >
        </div>

        <div class="form-actions">
          <a href="#" @click.prevent="modeOubli = true" class="forgot-link">Mot de passe oublié ?</a>
        </div>

        <button type="submit" class="btn-submit" :disabled="enAttente">
          {{ enAttente ? 'Connexion en cours...' : 'Se connecter' }}
        </button>
      </form>

      <!-- Formulaire de Récupération de Mot de Passe -->
      <form v-else @submit.prevent="gererRecuperation" class="login-form">
        <h3>Récupération du mot de passe</h3>
        <p class="reset-desc">Entrez votre adresse email pour recevoir les instructions de réinitialisation.</p>

        <div v-if="messageSucces" class="alert-success">{{ messageSucces }}</div>
        <div v-if="erreur" class="alert-error">{{ erreur }}</div>

        <div class="form-group">
          <label for="reset-email">Adresse Email</label>
          <input 
            type="email" 
            id="reset-email" 
            v-model="emailRecuperation" 
            required 
            placeholder="admin@winnermultiservice.com"
          >
        </div>

        <button type="submit" class="btn-submit">Envoyer les instructions</button>
        
        <button type="button" @click="modeOubli = false; erreur = ''; messageSucces = ''" class="btn-back">
          Retour à la connexion
        </button>
      </form>

      <div class="back-home">
        <router-link to="/">← Retourner sur le site public</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import authService from '@/services/authService'; // Assurez-vous que le chemin correspond à votre arborescence

const router = useRouter();

const email = ref('');
const password = ref('');
const emailRecuperation = ref('');
const modeOubli = ref(false);
const erreur = ref('');
const messageSucces = ref('');

// État pour désactiver le bouton pendant le chargement
const enAttente = ref(false);

// Connexion reliée au Backend Node.js
const gererConnexion = async () => {
  erreur.value = '';
  enAttente.value = true;
  
  try {
    // Appel à l'API via notre service (qui gère l'enregistrement du token)
    await authService.login({
      email: email.value,
      password: password.value
    });
    
    // Redirection vers le tableau de bord en cas de succès
    router.push('/admin');
  } catch (error) {
    // Récupération de l'erreur renvoyée par le backend (ex: "Mot de passe incorrect")
    erreur.value = error.response?.data?.error || "Erreur de connexion au serveur.";
  } finally {
    enAttente.value = false;
  }
};

// Simulation de la récupération de mot de passe
const gererRecuperation = () => {
  erreur.value = '';
  if (!emailRecuperation.value) {
    erreur.value = "Veuillez entrer une adresse email valide.";
    return;
  }
  
  // Simulation d'envoi d'e-mail de réinitialisation
  messageSucces.value = "Un e-mail contenant les instructions a été envoyé à " + emailRecuperation.value;
  setTimeout(() => {
    emailRecuperation.value = '';
    messageSucces.value = '';
  }, 4000);
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f4f6f9;
  padding: 20px;
}

.login-card {
  background: white;
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  width: 100%;
  max-width: 420px;
}

.logo-area {
  text-align: center;
  margin-bottom: 30px;
}

.logo-img {
  height: 60px;
  object-fit: contain;
  margin-bottom: 10px;
}

.logo-area h2 {
  font-size: 22px;
  color: #143489;
  margin-bottom: 5px;
}

.logo-area p {
  font-size: 14px;
  color: #666;
}

.login-form h3 {
  font-size: 18px;
  color: #143489;
  margin-bottom: 8px;
}

.reset-desc {
  font-size: 13px;
  color: #666;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.form-group input:focus {
  border-color: #143489;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
}

.forgot-link {
  font-size: 13px;
  color: #143489;
  text-decoration: none;
}

.forgot-link:hover {
  text-decoration: underline;
}

.btn-submit {
  width: 100%;
  background: #143489;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 6px;
  font-size: 15px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-submit:hover {
  background: #0d235c;
}

.btn-submit:disabled {
  background: #a0aabf;
  cursor: not-allowed;
  opacity: 0.8;
}

.btn-back {
  width: 100%;
  background: transparent;
  color: #666;
  border: 1px solid #ddd;
  padding: 10px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  margin-top: 10px;
}

.btn-back:hover {
  background: #f8f9fa;
}

.alert-error {
  background: #f8d7da;
  color: #721c24;
  padding: 10px;
  border-radius: 6px;
  font-size: 13px;
  margin-bottom: 20px;
  border: 1px solid #f5c6cb;
}

.alert-success {
  background: #d4edda;
  color: #155724;
  padding: 10px;
  border-radius: 6px;
  font-size: 13px;
  margin-bottom: 20px;
  border: 1px solid #c3e6cb;
}

.back-home {
  text-align: center;
  margin-top: 25px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.back-home a {
  font-size: 13px;
  color: #666;
  text-decoration: none;
}

.back-home a:hover {
  color: #143489;
  text-decoration: underline;
}
</style>