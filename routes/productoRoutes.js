// routes/productoRoutes.js
const express = require('express');
const router = express.Router();
const productoController = require('../controllers/productoController');

// --- Rutas para la API N°2 (Consulta de Productos según Anexo) ---
// Estas rutas ahora usarán los controladores que formatean la respuesta según el anexo.
router.get('/', productoController.obtenerTodosParaAnexo);     // GET /api/productos (Formato Anexo)
router.get('/:id', productoController.obtenerPorIdParaAnexo);  // GET /api/productos/:id (Formato Anexo)



router.post('/', productoController.crear);          // POST /api/productos
router.put('/:id', productoController.actualizar);    // PUT /api/productos/:id (o usa PATCH)
router.delete('/:id', productoController.eliminar);   // DELETE /api/productos/:id

module.exports = router;