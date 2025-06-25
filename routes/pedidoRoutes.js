// routes/pedidoRoutes.js
const express = require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedidoController');

router.post('/', pedidoController.crear);           // POST /api/pedidos
router.get('/', pedidoController.obtenerTodos);      // GET /api/pedidos
router.get('/:id', pedidoController.obtenerPorId);   // GET /api/pedidos/:id
router.put('/:id', pedidoController.actualizar);     // PUT /api/pedidos/:id (o PATCH)
router.delete('/:id', pedidoController.eliminar);    // DELETE /api/pedidos/:id
router.patch('/:id', pedidoController.actualizar);

module.exports = router;