<template>
  <section id="services">
      <h2 class="section-title">Nos Domaines d'Expertise</h2>
      <div class="services-container">
          <div class="service-card">
              <h3>Vente de Produits Total</h3>
              <p>Distribution officielle de lubrifiants, carburants et produits d'entretien.</p>
          </div>
          <div class="service-card">
              <h3>Gérance de Stations-Service</h3>
              <p>Expertise dans l'exploitation et la gestion quotidienne de stations-service.</p>
          </div>
          <div class="service-card">
              <h3>Prestations Multiservices</h3>
              <p>Lavage automobile, boutiques de proximité, et entretien rapide.</p>
          </div>
      </div>
  </section>
</template>

<style scoped>
#services { padding: 80px 50px; background-color: #f4f4f4; text-align: center; }
.section-title { color: #143489; font-size: 36px; margin-bottom: 50px; }
.services-container { display: flex; justify-content: center; gap: 30px; flex-wrap: wrap; }
.service-card { background-color: #ffffff; padding: 40px 30px; border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.05); flex: 1; min-width: 300px; border-bottom: 5px solid #143489; text-align: left; }
.service-card h3 { color: #143489; margin-bottom: 15px; font-size: 20px; }
.service-card p { color: #555; line-height: 1.6; }
@media (max-width: 768px) {
    .services-container { flex-direction: column; align-items: center; }
}
</style>