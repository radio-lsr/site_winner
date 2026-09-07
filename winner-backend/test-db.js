const db = require('./config/db'); // Assurez-vous que le chemin correspond à votre configuration

async function testConnection() {
    try {
        console.log("🔄 Tentative de connexion à la base de données...");
        
        // On tente de lire la table "users"
        const [rows] = await db.query('SELECT id, nom, email, role, created_at FROM users');
        
        console.log("✅ Connexion réussie ! La base de données répond correctement.");
        
        if (rows.length === 0) {
            console.log("ℹ️ La table 'users' est vide. N'oubliez pas d'exécuter votre script seed.js pour créer l'admin.");
        } else {
            console.log("👥 Voici les utilisateurs trouvés :");
            console.table(rows); // L'affichage en table est plus lisible dans la console
        }
        
        process.exit(0);
    } catch (error) {
        console.error("❌ Échec de la connexion à la base de données !");
        console.error("Détails de l'erreur :", error.message);
        process.exit(1);
    }
}

testConnection();
