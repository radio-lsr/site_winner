<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content auth-modal">
      <button class="close-btn" @click="$emit('close')">✖</button>
      <h2>👤 Mon compte</h2>
      <p class="auth-sous-titre">
        Un compte vous permet de retrouver vos informations et de publier avis et commentaires en votre nom.
      </p>

      <!-- Onglets Connexion / Inscription -->
      <div class="auth-tabs">
        <button :class="['auth-tab', onglet === 'connexion' && 'active']" @click="changerOnglet('connexion')">
          Connexion
        </button>
        <button :class="['auth-tab', onglet === 'inscription' && 'active']" @click="changerOnglet('inscription')">
          Inscription
        </button>
      </div>

      <!-- Connexion -->
      <form v-if="onglet === 'connexion'" @submit.prevent="connexion">
        <label for="auth-email-c">Adresse email</label>
        <input id="auth-email-c" v-model="form.email" type="email" required autocomplete="email" placeholder="vous@exemple.com" :disabled="envoiEnCours">
        <label for="auth-pass-c">Mot de passe</label>
        <input id="auth-pass-c" v-model="form.password" type="password" required autocomplete="current-password" placeholder="••••••••" :disabled="envoiEnCours">
        <button type="submit" class="btn-auth" :disabled="envoiEnCours">
          {{ envoiEnCours ? 'Connexion…' : 'Se connecter' }}
        </button>
      </form>

      <!-- Inscription -->
      <form v-else @submit.prevent="inscription">
        <label for="auth-nom">Nom complet</label>
        <input id="auth-nom" v-model="form.nom" type="text" required maxlength="150" autocomplete="name" placeholder="Votre nom et prénom" :disabled="envoiEnCours">
        <label for="auth-email-i">Adresse email</label>
        <input id="auth-email-i" v-model="form.email" type="email" required autocomplete="email" placeholder="vous@exemple.com" :disabled="envoiEnCours">
        <label for="auth-pass-i">Mot de passe <small>(8 caractères minimum)</small></label>
        <input id="auth-pass-i" v-model="form.password" type="password" required minlength="8" autocomplete="new-password" placeholder="••••••••" :disabled="envoiEnCours">
        <button type="submit" class="btn-auth" :disabled="envoiEnCours">
          {{ envoiEnCours ? 'Création…' : 'Créer mon compte' }}
        </button>
      </form>

      <p v-if="erreur" class="auth-erreur">⚠️ {{ erreur }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import authService from '../services/authService';

const emit = defineEmits(['close', 'connected']);

const onglet = ref('inscription');
const envoiEnCours = ref(false);
const erreur = ref('');
const form = ref({ nom: '', email: '', password: '' });

const changerOnglet = (o) => {
  onglet.value = o;
  erreur.value = '';
};

const inscription = async () => {
  envoiEnCours.value = true;
  erreur.value = '';
  try {
    await authService.register({
      nom: form.value.nom,
      email: form.value.email,
      password: form.value.password
    });
    // Inscription réussie : on connecte directement le visiteur
    const data = await authService.login({ email: form.value.email, password: form.value.password });
    emit('connected', data.user);
  } catch (error) {
    erreur.value = error.response?.data?.error || 'Impossible de créer le compte. Réessayez.';
  } finally {
    envoiEnCours.value = false;
  }
};

const connexion = async () => {
  envoiEnCours.value = true;
  erreur.value = '';
  try {
    const data = await authService.login({ email: form.value.email, password: form.value.password });
    emit('connected', data.user);
  } catch (error) {
    erreur.value = error.response?.data?.error || 'Connexion impossible. Vérifiez vos identifiants.';
  } finally {
    envoiEnCours.value = false;
  }
};
</script>

<style scoped>
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 2000; }
.modal-content { background: white; padding: 30px; border-radius: 10px; max-width: 440px; width: 92%; position: relative; max-height: 90vh; overflow-y: auto; text-align: left; }
.close-btn { position: absolute; top: 12px; right: 15px; background: none; border: none; font-size: 22px; cursor: pointer; color: #999; }
.close-btn:hover { color: #E31E24; }
.auth-modal h2 { color: #143489; margin: 0 0 6px; font-size: 22px; }
.auth-sous-titre { color: #6b7280; font-size: 13px; line-height: 1.5; margin: 0 0 18px; }

.auth-tabs { display: flex; gap: 8px; margin-bottom: 18px; }
.auth-tab { flex: 1; padding: 10px 0; border: none; border-radius: 8px; background: #eef1f7; color: #4b5563; font-weight: 700; cursor: pointer; }
.auth-tab.active { background: #143489; color: white; }

form { display: flex; flex-direction: column; gap: 8px; }
form label { font-size: 13px; font-weight: 600; color: #374151; margin-top: 6px; }
form label small { color: #9ca3af; font-weight: 500; }
form input { border: 1px solid #d1d5db; border-radius: 6px; padding: 11px 12px; font-size: 14px; }
form input:focus { outline: 2px solid #143489; border-color: transparent; }

.btn-auth { margin-top: 14px; background: #E31E24; color: white; border: none; border-radius: 6px; padding: 12px; font-weight: 700; text-transform: uppercase; font-size: 14px; cursor: pointer; }
.btn-auth:hover:not(:disabled) { background: #80142D; }
.btn-auth:disabled { opacity: 0.6; cursor: not-allowed; }

.auth-erreur { margin: 12px 0 0; color: #dc2626; font-size: 13px; font-weight: 600; }
</style>
