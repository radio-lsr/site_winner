const db = require('../config/db');

exports.getStats = async (req, res) => {
  try {
    // 1. Compter le nombre d'utilisateurs
    const [userRows] = await db.query('SELECT COUNT(*) as total FROM users');
    const totalUsers = userRows[0].total;
    
    // 2. Compter le nombre de produits (C'est ce qui corrige l'erreur Vue.js)
    let totalProducts = 0;
    try {
      const [productRows] = await db.query('SELECT COUNT(*) as total FROM produits');
      totalProducts = productRows[0].total;
    } catch (e) {
      // Table pas encore créée ou vide, on ignore
    }

    // 3. Compter le nombre d'articles/vidéos
    let totalArticles = 0;
    try {
      const [articleRows] = await db.query('SELECT COUNT(*) as total FROM articles');
      totalArticles = articleRows[0].total;
    } catch (e) {
      // Table pas encore créée ou vide
    }

    // 4. Compter les commandes (Optionnel mais utile pour un Dashboard)
    let totalOrders = 0;
    try {
      const [orderRows] = await db.query('SELECT COUNT(*) as total FROM commandes');
      totalOrders = orderRows[0].total;
    } catch (e) {}

    // 5. Compter les services (Conservation de votre logique initiale)
    let totalServices = 0;
    try {
      const [serviceRows] = await db.query('SELECT COUNT(*) as total FROM services');
      totalServices = serviceRows[0].total;
    } catch (e) {}

    // 6. Photos (galerie) et vidéos (articles de type vidéo) pour DashboardOverview
    let totalPhotos = 0;
    let totalVideos = 0;
    try {
      const [photoRows] = await db.query('SELECT COUNT(*) as total FROM galerie');
      totalPhotos = photoRows[0].total;
    } catch (e) {}
    try {
      const [videoRows] = await db.query("SELECT COUNT(*) as total FROM articles WHERE type_article = 'video'");
      totalVideos = videoRows[0].total;
    } catch (e) {}

    // RÉPONSE AU FRONTEND : 
    // On s'assure d'envoyer la clé "products" attendue par votre composant
    res.json({
      users: totalUsers,
      products: totalProducts, // Résout le : Cannot read properties of undefined (reading 'products')
      articles: totalArticles,
      orders: totalOrders,
      totalServices: totalServices,
      photos: totalPhotos,
      videos: totalVideos,
      serverStatus: 'Online',
      uptime: process.uptime()
    });
    
  } catch (error) {
    console.error("Erreur Dashboard Controller:", error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques.' });
  }
};