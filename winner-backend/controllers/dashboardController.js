const db = require('../config/db');

const MOIS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

exports.getStats = async (req, res) => {
  try {
    const estAdmin = req.user && req.user.role === 'Admin';

    // 1. Produits actifs
    let totalProducts = 0;
    try {
      const [productRows] = await db.query("SELECT COUNT(*) as total FROM produits WHERE statut = 'Actif'");
      totalProducts = productRows[0].total;
    } catch (e) {}

    // 2. Articles & vidéos
    let totalArticles = 0;
    let totalVideos = 0;
    try {
      const [articleRows] = await db.query('SELECT COUNT(*) as total FROM articles');
      totalArticles = articleRows[0].total;
      const [videoRows] = await db.query("SELECT COUNT(*) as total FROM articles WHERE type_article = 'video'");
      totalVideos = videoRows[0].total;
    } catch (e) {}

    // 3. Commandes totales + 5 dernières commandes
    let totalOrders = 0;
    let recentOrders = [];
    try {
      const [orderRows] = await db.query('SELECT COUNT(*) as total FROM commandes');
      totalOrders = orderRows[0].total;

      const [recentRows] = await db.query(
        `SELECT id, client_nom AS customer_name, created_at, total, statut AS status
         FROM commandes
         ORDER BY created_at DESC
         LIMIT 5`
      );
      recentOrders = recentRows;
    } catch (e) {}

    // 4. Données réservées à l'administrateur (utilisateurs, galerie, ventes, visites)
    let totalUsers = 0;
    let totalPhotos = 0;
    let monthlySalesAmount = 0;
    let monthlySales = [];

    if (estAdmin) {
      try {
        const [userRows] = await db.query('SELECT COUNT(*) as total FROM users');
        totalUsers = userRows[0].total;
      } catch (e) {}

      try {
        const [photoRows] = await db.query('SELECT COUNT(*) as total FROM galerie');
        totalPhotos = photoRows[0].total;
      } catch (e) {}

      try {
        const [monthRows] = await db.query(
          `SELECT COALESCE(SUM(total), 0) AS total
           FROM commandes
           WHERE statut != 'Annulée'
             AND YEAR(created_at) = YEAR(CURDATE())
             AND MONTH(created_at) = MONTH(CURDATE())`
        );
        monthlySalesAmount = Number(monthRows[0]?.total || 0);

        // Ventes des 6 derniers mois
        const [salesRows] = await db.query(
          `SELECT YEAR(created_at) AS annee, MONTH(created_at) AS mois, COALESCE(SUM(total), 0) AS montant
           FROM commandes
           WHERE statut != 'Annulée'
             AND created_at >= DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 5 MONTH)
           GROUP BY YEAR(created_at), MONTH(created_at)
           ORDER BY annee ASC, mois ASC`
        );

        const parMois = new Map();
        for (const row of salesRows) {
          parMois.set(`${row.annee}-${row.mois}`, Number(row.montant || 0));
        }

        const now = new Date();
        const serie = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
          serie.push({
            month: MOIS_FR[d.getMonth()],
            amount: parMois.get(key) || 0
          });
        }
        const maxVal = Math.max(...serie.map(s => s.amount), 1);
        monthlySales = serie.map(s => ({
          month: s.month,
          amount: s.amount,
          percentage: s.amount > 0 ? Math.max(10, Math.round((s.amount / maxVal) * 100)) : 4
        }));
      } catch (e) {
        console.error('[DASHBOARD] Erreur ventes mensuelles:', e.message);
      }

      // Ventes par jour sur le mois en cours (courbe mensuelle)
      try {
        const [dailyRows] = await db.query(
          `SELECT DAY(created_at) AS jour, COALESCE(SUM(total), 0) AS montant
           FROM commandes
           WHERE statut != 'Annulée'
             AND YEAR(created_at) = YEAR(CURDATE())
             AND MONTH(created_at) = MONTH(CURDATE())
           GROUP BY DAY(created_at)
           ORDER BY jour ASC`
        );
        const parJour = new Map();
        for (const row of dailyRows) {
          parJour.set(Number(row.jour), Number(row.montant || 0));
        }
        const nowDaily = new Date();
        const nbJours = new Date(nowDaily.getFullYear(), nowDaily.getMonth() + 1, 0).getDate();
        const serieJours = [];
        for (let j = 1; j <= nbJours; j++) {
          serieJours.push({ label: String(j).padStart(2, '0'), amount: parJour.get(j) || 0 });
        }
        const maxJour = Math.max(...serieJours.map(s => s.amount), 1);
        req._dailySales = serieJours.map(s => ({
          month: s.label,
          amount: s.amount,
          percentage: s.amount > 0 ? Math.max(10, Math.round((s.amount / maxJour) * 100)) : 4
        }));
      } catch (e) {
        console.error('[DASHBOARD] Erreur ventes journalières:', e.message);
      }
    }

    res.json({
      users: totalUsers,
      products: totalProducts,
      articles: totalArticles,
      orders: totalOrders,
      photos: totalPhotos,
      videos: totalVideos,
      monthlySalesAmount,
      monthlySales,
      dailySales: req._dailySales || [],
      recentOrders,
      visits: 0,
      serverStatus: 'Online',
      uptime: process.uptime()
    });
  } catch (error) {
    console.error("Erreur Dashboard Controller:", error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques.' });
  }
};
