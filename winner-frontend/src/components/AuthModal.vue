<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content auth-modal">
      <button class="close-btn" @click="$emit('close')">✖</button>
      <h2>👤 Mon compte</h2>
      <p class="auth-sous-titre">
        Connectez-vous à votre compte client.
      </p>

      <!-- Connexion uniquement : l'inscription publique est désactivée -->
      <form @submit.prevent="connexion">
        <label for="auth-email-c">Adresse email</label>
        <input id="auth-email-c" v-model="form.email" type="email" required autocomplete="email" placeholder="vous@exemple.com" :disabled="envoiEnCours">
        <label for="auth-pass-c">Mot de passe</label>
        <input id="auth-pass-c" v-model="form.password" type="password" required autocomplete="current-password" placeholder="••••••••" :disabled="envoiEnCours">
        <button type="submit" class="btn-auth" :disabled="envoiEnCours">
          {{ envoiEnCours ? 'Connexion…' : 'Se connecter' }}
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

const envoiEnCours = ref(false);
const erreur = ref('');
const form = ref({ email: '', password: '' });

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

form { display: flex; flex-direction: column; gap: 8px; }
form label { font-size: 13px; font-weight: 600; color: #374151; margin-top: 6px; }
form input { border: 1px solid #d1d5db; border-radius: 6px; padding: 11px 12px; font-size: 14px; }
form input:focus { outline: 2px solid #143489; border-color: transparent; }

.btn-auth { margin-top: 14px; background: #E31E24; color: white; border: none; border-radius: 6px; padding: 12px; font-weight: 700; text-transform: uppercase; font-size: 14px; cursor: pointer; }
.btn-auth:hover:not(:disabled) { background: #80142D; }
.btn-auth:disabled { opacity: 0.6; cursor: not-allowed; }

.auth-erreur { margin: 12px 0 0; color: #dc2626; font-size: 13px; font-weight: 600; }
</style>
