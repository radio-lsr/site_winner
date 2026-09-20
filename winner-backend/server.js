const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// 1. Importation de toutes les routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const productRoutes = require('./routes/productRoutes');
const galerieRoutes = require('./routes/galerieRoutes');
const articlesRoutes = require('./routes/articlesRoutes');
const commandesRoutes = require('./routes/commandesRoutes');
const contactRoutes = require('./routes/contactRoutes');
const messagesRoutes = require('./routes/messagesRoutes');
const avisRoutes = require('./routes/avisRoutes');
const commentairesRoutes = require('./routes/commentairesRoutes');
const heroRoutes = require('./routes/heroRoutes');

// Importation du gestionnaire d'erreurs
const errorHandler = require('./middleware/errorMiddleware');

const app = express();

// --- Vérification de sécurité du secret JWT au démarrage ---
const SECRETS_FAIBLES_CONNUS = ['mon_super_secret_jwt_tres_securise', 'secret', 'changeme'];
if (!process.env.JWT_SECRET || SECRETS_FAIBLES_CONNUS.includes(process.env.JWT_SECRET)) {
  console.warn('⚠️  ATTENTION : JWT_SECRET manquant ou trop faible !');
  console.warn('    Générez un secret fort (ex: `node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\')"`)');
  console.warn('    et définissez-le dans winner-backend/.env — sinon un secret aléatoire');
  console.warn('    sera utilisé et les tokens seront invalidés à chaque redémarrage.');
  process.env.JWT_SECRET = process.env.JWT_SECRET || require('crypto').randomBytes(48).toString('hex');
}

// 2. Middlewares de base
app.use(cors());
app.use(express.json());

// 3. Dossier public pour les uploads (accès aux images)
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));
// Compatibilité avec l'ancien dossier public/uploads s'il existe encore
const legacyUploadsDir = path.join(__dirname, 'public/uploads');
if (fs.existsSync(legacyUploadsDir)) {
  app.use('/public/uploads', express.static(legacyUploadsDir));
}

// 4. Déclaration des Routes API
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/produits', productRoutes);
app.use('/api/galerie', galerieRoutes);
app.use('/api/articles', articlesRoutes);
app.use('/api/commandes', commandesRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/avis', avisRoutes);
app.use('/api/commentaires', commentairesRoutes);
app.use('/api/hero', heroRoutes);

// --- ROUTES UTILISATEURS (Profil personnel ET Administration CRUD) ---
app.use('/api/user', userRoutes);

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
