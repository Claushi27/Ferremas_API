// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/', authController.login); // Asumiendo que la ruta es POST /login

module.exports = router;