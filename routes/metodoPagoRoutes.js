// routes/metodoPagoRoutes.js
const express = require('express');
const router = express.Router();
const metodoPagoController = require('../controllers/metodoPagoController');

router.get('/', metodoPagoController.obtenerTodos);
router.post('/', metodoPagoController.crear); // Para crear si no existe

module.exports = router;