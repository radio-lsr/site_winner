<template>
  <footer id="contact">
      <div class="footer-container">
          <div class="footer-info">
              <h3>Contactez-nous</h3>
              <p>📍 1 Avenue Colonel mondjiba, Ngaliema, Kinshasa - RD CONGO</p>
              <p>📞 Téléphone : +243 89 922 78 78</p>
              <p>✉️ Email : mavinga1@gmail.com</p>
              <br>
              <p><strong>Horaires d'ouverture :</strong></p>
              <p>Lundi au Dimanche : 24H/24</p>
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
      </div>
  </footer>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { API_URL } from '../services/config';
import authService from '../services/authService';

const contactForm = ref({
    nom: '',
    email: '',
    telephone: '',
    message: ''
});

// Visiteur connecté : on pré-remplit son identité (modifiable)
const visiteurConnecte = authService.getCurrentUser();
if (visiteurConnecte) {
    contactForm.value.nom = visiteurConnecte.nom || '';
    contactForm.value.email = visiteurConnecte.email || '';
}

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
</style>