// routes/pagoRoutes.js
const express = require('express');
const router = express.Router();
const pagoController = require('../controllers/pagoController');

// Ruta para obtener todos los pagos
router.get('/', pagoController.obtenerTodos);

// Ruta para obtener un pago por su ID
router.get('/:id', pagoController.obtenerPorId);

// NUEVO: Ruta para obtener pagos por ID de Pedido
router.get('/pedido/:id_pedido', pagoController.obtenerPagosPorPedido);

module.exports = router;