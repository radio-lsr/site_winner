<template>
  <section id="apropos">
      <div class="apropos-image">
          <img src="/OIP2.webp" alt="Station Service">
      </div>
      <div class="apropos-text">
          <h2>À Propos de WINNER Multiservice</h2>
          <br>
          <p>Fondée sur les valeurs de rigueur et de dynamisme, <strong>WINNER Multiservice</strong> s'impose comme un acteur incontournable dans le secteur de l'énergie et des services de proximité.</p>
          <p>Notre logo incarne notre vision : le bleu pour la fiabilité de notre gestion, le rouge pour la passion de notre métier et le dynamisme de nos équipes.</p>
          <p>En tant que distributeur des produits Total, nous nous engageons à fournir l'excellence à chacun de nos clients, qu'ils soient particuliers ou professionnels.</p>
      </div>
  </section>
</template>

<style scoped>
#apropos {
    padding: 80px 50px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 50px;
    flex-wrap: wrap;
    background-color: #f4f4f4;
}
.apropos-text {
    flex: 1;
    min-width: 300px;
    text-align: left;
}
.apropos-text h2 {
    color: #143489;
    font-size: 32px;
    margin-bottom: 20px;
}
.apropos-text p {
    margin-bottom: 15px;
    font-size: 16px;
    line-height: 1.6;
    color: #333;
}
.apropos-image {
    flex: 1;
    min-width: 300px;
    text-align: center;
}
.apropos-image img {
    max-width: 100%;
    border-radius: 8px;
    box-shadow: 0 10px 20px rgba(0,0,0,0.1);
}
@media (max-width: 768px) {
    #apropos { flex-direction: column; }
}
</style>