// routes/clienteRoutes.js
const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');

router.post('/', clienteController.crear);           // POST /api/clientes
router.get('/', clienteController.obtenerTodos);      // GET /api/clientes
router.get('/:id', clienteController.obtenerPorId);   // GET /api/clientes/:id
router.put('/:id', clienteController.actualizar);     // PUT /api/clientes/:id
router.delete('/:id', clienteController.eliminar);    // DELETE /api/clientes/:id

module.exports = router;