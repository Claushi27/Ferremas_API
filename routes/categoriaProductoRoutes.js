// routes/categoriaProductoRoutes.js
const express = require('express');
const router = express.Router();
const categoriaProductoController = require('../controllers/categoriaProductoController');

router.post('/', categoriaProductoController.crear);             // POST /api/categorias-producto
router.get('/', categoriaProductoController.obtenerTodos);        // GET /api/categorias-producto
router.get('/:id', categoriaProductoController.obtenerPorId);     // GET /api/categorias-producto/:id
router.put('/:id', categoriaProductoController.actualizar);       // PUT /api/categorias-producto/:id
router.delete('/:id', categoriaProductoController.eliminar);      // DELETE /api/categorias-producto/:id

module.exports = router;