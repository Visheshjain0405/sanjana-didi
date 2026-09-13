const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/seed', authController.seed);
router.post('/push-token', authController.savePushToken);

module.exports = router;
