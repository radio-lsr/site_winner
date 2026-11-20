const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const verifyToken = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

// Lecture et gestion réservées aux administrateurs
router.get('/', verifyToken, requireAdmin, contactController.getAllMessages);
router.put('/:id', verifyToken, requireAdmin, contactController.toggleRead);
router.delete('/:id', verifyToken, requireAdmin, contactController.deleteMessage);

module.exports = router;
