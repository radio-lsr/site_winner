<template>
  <!-- Le routeur injecte dynamiquement soit SitePublic.vue, soit AdminDashboard.vue -->
  <router-view />
</template>

<script setup>
// App.vue ne contient plus la logique métier ni les listes en dur. 
// Tout est désormais modulaire et géré dans les vues et composants dédiés.
</script>

<style>
/* Styles globaux partagés par l'ensemble de l'application WINNER Multiservice */
:root {
    --red: #E31E24;
    --blue: #143489;
    --bordeaux: #80142D;
    --light-grey: #f4f4f4;
    --white: #ffffff;
    --text-dark: #333333;
}

* { 
    margin: 0; 
    padding: 0; 
    box-sizing: border-box; 
    font-family: 'Montserrat', sans-serif; 
    scroll-behavior: smooth; 
}

body { 
    color: var(--text-dark); 
    background-color: var(--white); 
    overflow-x: hidden; 
}
</style>