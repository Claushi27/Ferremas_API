// routes/productoRoutes.js
const express = require('express');
const router = express.Router();
const productoController = require('../controllers/productoController');

router.post('/', productoController.crear);          // POST /api/productos
router.get('/', productoController.obtenerTodos);     // GET /api/productos
router.get('/:id', productoController.obtenerPorId);  // GET /api/productos/:id
router.put('/:id', productoController.actualizar);    // PUT /api/productos/:id (o usa PATCH para actualizaciones parciales)
router.delete('/:id', productoController.eliminar);   // DELETE /api/productos/:id

module.exports = router;