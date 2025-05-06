// routes/sucursalRoutes.js
const express = require('express');
const router = express.Router();
const sucursalController = require('../controllers/sucursalController');

router.post('/', sucursalController.crear);             // POST /api/sucursales
router.get('/', sucursalController.obtenerTodos);        // GET /api/sucursales
router.get('/:id', sucursalController.obtenerPorId);     // GET /api/sucursales/:id
router.put('/:id', sucursalController.actualizar);       // PUT /api/sucursales/:id
router.delete('/:id', sucursalController.eliminar);      // DELETE /api/sucursales/:id

module.exports = router;