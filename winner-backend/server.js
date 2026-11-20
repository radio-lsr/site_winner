const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

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
const limits = require('./middleware/rateLimiters');
const errorHandler = require('./middleware/errorMiddleware');
const db = require('./config/db');

const app = express();
const crypto = require('crypto');
const weakSecretHashes = new Set(['85f7857e497a361d388ea1a8b828aee342ebd2c546cc80222e0c75e4bad661cd']);
const jwtFingerprint = process.env.JWT_SECRET ? crypto.createHash('sha256').update(process.env.JWT_SECRET).digest('hex') : '';
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 64 || /^(secret|changeme|password|mon_super_secret)/i.test(process.env.JWT_SECRET) || weakSecretHashes.has(jwtFingerprint)) {
  throw new Error('Configuration refusée : JWT_SECRET doit être un secret aléatoire d’au moins 64 caractères (aucune valeur par défaut).');
}

app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: false, // CSP du frontend est gérée par le serveur web public.
  crossOriginEmbedderPolicy: false
}));
const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map(value => value.trim()).filter(Boolean);
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-CSRF-Protection']
}));
app.use(express.json({ limit: '1mb' }));
app.use((req, res, next) => {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) || !req.headers.origin) return next();
  const ownOrigin = `${req.protocol}://${req.get('host')}`;
  if (req.headers.origin === ownOrigin || allowedOrigins.includes(req.headers.origin)) return next();
  return res.status(403).json({ error: 'Origine de requête non autorisée.' });
});

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir, {
  setHeaders(res, filePath) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (/\.(?:html?|svg|xml|js|mjs)$/i.test(filePath)) {
      res.setHeader('Content-Disposition', 'attachment');
      res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
    }
  }
}));
const legacyUploadsDir = path.join(__dirname, 'public/uploads');
if (fs.existsSync(legacyUploadsDir)) app.use('/public/uploads', express.static(legacyUploadsDir));

app.use('/api/auth/login', limits.login);
app.use('/api/auth/forgot-password', limits.reset);
app.use('/api/auth/reset-password', limits.reset);
app.use('/api/contact', limits.contact);
app.use('/api/commandes', limits.order);
app.use('/api/avis', (req, res, next) => req.method === 'POST' ? limits.publicPost(req, res, next) : next());
app.use('/api/commentaires', (req, res, next) => req.method === 'POST' ? limits.publicPost(req, res, next) : next());

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
app.use('/api/user', userRoutes);
app.get('/', (_req, res) => res.json({ message: "API WINNER en cours d'exécution..." }));
app.use(errorHandler);

async function start() {
  // Migration idempotente pour les bases déjà créées avant la révocation de sessions.
  let authVersionColumnAdded = false;
  try {
    await db.query('ALTER TABLE users ADD COLUMN token_version INTEGER NOT NULL DEFAULT 0');
    authVersionColumnAdded = true;
  } catch (error) {
    if (!/duplicate|already exists|1060/i.test(`${error.code || ''} ${error.message || ''}`)) throw error;
  }
  // Les anciens liens stockaient le token brut; les invalider lors de la migration.
  if (authVersionColumnAdded) await db.query('DELETE FROM password_resets');
  const port = Number(process.env.PORT || 5000);
  app.listen(port, '0.0.0.0', () => console.log(`🚀 API WINNER démarrée sur le port ${port}`));
}
start().catch(error => {
  console.error('[STARTUP] Démarrage impossible:', error.message);
  process.exit(1);
});
