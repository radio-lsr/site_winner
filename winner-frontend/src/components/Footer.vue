<template>
  <footer id="contact">
      <div class="footer-container">
          <div class="footer-info">
              <h3>Contactez-nous</h3>
              <p>📍 1 Avenue Colonel mondjiba, Ngaliema, Kinshasa - RD CONGO</p>
              <p>📞 Téléphone : +243 89 922 78 78</p>
              <p>✉️ Pour nous écrire, utilisez le formulaire de contact.</p>
              <br>
              <p><strong>Horaires d'ouverture :</strong></p>
              <p>Lundi au Dimanche : 24H/24</p>
              <br>
              <a :href="FACEBOOK_URL" target="_blank" rel="noopener noreferrer" class="btn-facebook">
                  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
                      <path fill="currentColor" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span>Suivez-nous sur Facebook</span>
              </a>
          </div>
          <div class="footer-form">
              <h3>Demande de devis / Renseignement</h3>
              <form @submit.prevent="handleContactSubmit">
                  <input type="text" v-model="contactForm.nom" placeholder="Votre Nom et Prénom" required autocomplete="name" :disabled="envoiEnCours">
                  <input type="email" v-model="contactForm.email" placeholder="Votre Adresse Email" required autocomplete="email" :disabled="envoiEnCours">
                  <input type="tel" v-model="contactForm.telephone" placeholder="Votre Numéro de Téléphone" autocomplete="tel" :disabled="envoiEnCours">
                  <textarea v-model="contactForm.message" rows="4" placeholder="Votre Message" required :disabled="envoiEnCours"></textarea>
                  <button type="submit" :disabled="envoiEnCours">
                      {{ envoiEnCours ? 'Envoi en cours...' : 'Envoyer le message' }}
                  </button>
                  <p v-if="statut.type === 'succes'" class="form-status succes">✅ {{ statut.texte }}</p>
                  <p v-if="statut.type === 'erreur'" class="form-status erreur">⚠️ {{ statut.texte }}</p>
              </form>
          </div>
      </div>
          <div class="footer-bottom">
              <p>&copy; 2026 WINNER Multiservice. Tous droits réservés. Créé pour le succès de votre réseau.</p>
              <router-link to="/admin/login" class="lien-admin" title="Accès réservé à l'administration">Espace administrateur</router-link>
          </div>
  </footer>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { API_URL, FACEBOOK_URL } from '../services/config';

const contactForm = ref({
    nom: '',
    email: '',
    telephone: '',
    message: ''
});

const envoiEnCours = ref(false);
const statut = ref({ type: '', texte: '' });

const handleContactSubmit = async () => {
    envoiEnCours.value = true;
    statut.value = { type: '', texte: '' };

    try {
        // Envoi réel du message au backend (enregistré en BDD, visible côté admin)
        const { data } = await axios.post(`${API_URL}/contact`, {
            nom: contactForm.value.nom,
            email: contactForm.value.email,
            telephone: contactForm.value.telephone,
            message: contactForm.value.message
        });
        statut.value = { type: 'succes', texte: data.message || 'Message envoyé !' };
        contactForm.value = { nom: '', email: '', telephone: '', message: '' };
        setTimeout(() => { statut.value = { type: '', texte: '' }; }, 6000);
    } catch (error) {
        statut.value = {
            type: 'erreur',
            texte: error.response?.data?.error || 'Impossible d\'envoyer le message. Vérifiez votre connexion et réessayez.'
        };
    } finally {
        envoiEnCours.value = false;
    }
};
</script>

<style scoped>
footer {
    background-color: #143489;
    color: #ffffff;
    padding: 60px 50px 20px;
}
.footer-container {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 40px;
    margin-bottom: 40px;
}
.footer-info, .footer-form {
    flex: 1;
    min-width: 300px;
    text-align: left;
}
.footer-info h3, .footer-form h3 {
    color: #ffffff;
    margin-bottom: 20px;
    font-size: 22px;
}
.footer-info p {
    margin-bottom: 10px;
}
.btn-facebook {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    background-color: #1877F2;
    color: #ffffff;
    padding: 11px 18px;
    border-radius: 6px;
    text-decoration: none;
    font-weight: 600;
    font-size: 15px;
    transition: background-color 0.3s, transform 0.2s;
}
.btn-facebook:hover {
    background-color: #0f5fc9;
    transform: translateY(-1px);
}
.btn-facebook svg { display: block; }
.footer-form form {
    display: flex;
    flex-direction: column;
    gap: 15px;
}
.footer-form input, .footer-form textarea {
    padding: 12px;
    border: none;
    border-radius: 4px;
    font-family: 'Montserrat', sans-serif;
    width: 100%;
}
.footer-form button {
    background-color: #E31E24;
    color: #ffffff;
    border: none;
    padding: 12px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    text-transform: uppercase;
    transition: background 0.3s;
}
.footer-form button:hover {
    background-color: #80142D;
}
.footer-form button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}
.form-status {
    margin: 0;
    padding: 10px 12px;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 600;
}
.form-status.succes {
    background-color: #16a34a;
    color: #ffffff;
}
.form-status.erreur {
    background-color: #E31E24;
    color: #ffffff;
}
.footer-bottom {
    text-align: center;
    border-top: 1px solid rgba(255,255,255,0.2);
    padding-top: 20px;
    font-size: 14px;
}
/* Lien discret vers l'administration */
.lien-admin {
    display: inline-block;
    margin-top: 8px;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.35);
    text-decoration: none;
    letter-spacing: 0.4px;
}
.lien-admin:hover {
    color: rgba(255, 255, 255, 0.75);
    text-decoration: underline;
}
</style>