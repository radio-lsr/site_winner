<template>
  <!-- Bouton flottant vers la page Facebook (visible sur tout le site public) -->
  <a
      :href="FACEBOOK_URL"
      target="_blank"
      rel="noopener noreferrer"
      class="facebook-float"
      aria-label="Suivez WINNER Multiservice sur Facebook"
      title="Suivez-nous sur Facebook">
      <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" focusable="false">
          <path fill="currentColor" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
  </a>
</template>

<script setup>
import { FACEBOOK_URL } from '../services/config';
</script>

<style scoped>
.facebook-float {
    position: fixed;
    left: 22px;
    bottom: 22px;
    z-index: 1500;
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background-color: #1877F2;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 22px rgba(24, 119, 242, 0.45);
    transition: background-color 0.25s, transform 0.25s;
}
.facebook-float:hover {
    background-color: #0f5fc9;
    transform: scale(1.06);
}
@media (max-width: 768px) {
    .facebook-float { width: 46px; height: 46px; left: 14px; bottom: 14px; }
}
</style>
