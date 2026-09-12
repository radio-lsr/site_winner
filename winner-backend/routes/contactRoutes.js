const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');

// Envoi public depuis le formulaire de contact du site
router.post('/', contactController.createMessage);

module.exports = router;
