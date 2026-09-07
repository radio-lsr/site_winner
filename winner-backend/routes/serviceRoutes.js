const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const verifyToken = require('../middleware/authMiddleware');

router.get('/', verifyToken, serviceController.getAllServices);
router.post('/', verifyToken, serviceController.createService);
router.delete('/:id', verifyToken, serviceController.deleteService);

module.exports = router;