// routes/inventarioSucursalRoutes.js
const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventarioSucursalController');

// Registrar stock para un producto en una sucursal
router.post('/', inventarioController.registrarStock);

// Obtener todo el inventario (o filtrado por producto y sucursal vía query params)
router.get('/', inventarioController.obtenerTodos);

// Obtener una entrada de inventario específica por su id_inventario
router.get('/:id', inventarioController.obtenerPorId);

// Actualizar una entrada de inventario específica por su id_inventario
router.put('/:id', inventarioController.actualizar); // o PATCH

// Eliminar una entrada de inventario específica por su id_inventario
router.delete('/:id', inventarioController.eliminar);

module.exports = router;