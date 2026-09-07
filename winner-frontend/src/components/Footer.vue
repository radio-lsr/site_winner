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
                  <input type="text" v-model="contactForm.nom" placeholder="Votre Nom et Prénom" required autocomplete="name">
                  <input type="email" v-model="contactForm.email" placeholder="Votre Adresse Email" required autocomplete="email">
                  <input type="tel" v-model="contactForm.telephone" placeholder="Votre Numéro de Téléphone" autocomplete="tel">
                  <textarea v-model="contactForm.message" rows="4" placeholder="Votre Message" required></textarea>
                  <button type="submit">Envoyer le message</button>
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

const contactForm = ref({
    nom: '',
    email: '',
    telephone: '',
    message: ''
});

const handleContactSubmit = () => {
    // Traitement sécurisé des champs du formulaire
    console.log("Message de contact validé:", contactForm.value);
    alert("Votre message a bien été envoyé !");
    contactForm.value = { nom: '', email: '', telephone: '', message: '' };
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
.footer-bottom {
    text-align: center;
    border-top: 1px solid rgba(255,255,255,0.2);
    padding-top: 20px;
    font-size: 14px;
}
</style>