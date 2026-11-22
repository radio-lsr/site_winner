const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const verifyToken = require('../middleware/authMiddleware');
const { requireAdminOrModerator } = require('../middleware/roleMiddleware');

router.get('/stats', verifyToken, requireAdminOrModerator, dashboardController.getStats);

module.exports = router;