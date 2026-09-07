const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// 1. Importation de toutes vos routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const productRoutes = require('./routes/productRoutes');
const galerieRoutes = require('./routes/galerieRoutes');
const articlesRoutes = require('./routes/articlesRoutes');

// Importation du gestionnaire d'erreurs
const errorHandler = require('./middleware/errorMiddleware');

const app = express();

// 2. Middlewares de base
app.use(cors());
app.use(express.json());

// 3. Dossier public pour les uploads (accès aux images)
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// 4. Déclaration des Routes API
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/produits', productRoutes);
app.use('/api/galerie', galerieRoutes);
app.use('/api/articles', articlesRoutes);

// --- ROUTES UTILISATEURS (Profil personnel ET Administration CRUD) ---
app.use('/api/user', userRoutes); 

// 💡 ASTUCE : Si dans votre fichier Vue (AdminUtilisateurs.vue), 
// vous avez gardé const API_URL = 'http://localhost:5000/api/utilisateurs',
// décommentez simplement la ligne ci-dessous pour éviter l'erreur 404 sans toucher à Vue.js :
// app.use('/api/utilisateurs', userRoutes);


// 5. Route de test à la racine
app.get('/', (req, res) => {
  res.json({ message: 'API WINNER en cours d\'exécution...' });
});

// 6. Middleware global de gestion des erreurs (toujours en dernier)
app.use(errorHandler);

// 7. Lancement du serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré avec succès sur le port ${PORT}`);
});