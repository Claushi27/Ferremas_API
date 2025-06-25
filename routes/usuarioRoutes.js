// routes/usuarioRoutes.js
const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');

router.post('/', usuarioController.crear);           // POST /usuarios
router.get('/', usuarioController.obtenerTodos);      // GET /usuarios
router.get('/:id', usuarioController.obtenerPorId);   // GET /usuarios/:id
router.put('/:id', usuarioController.actualizar);     // PUT /usuarios/:id (o PATCH)
router.delete('/:id', usuarioController.eliminar);    // DELETE /usuarios/:id
router.patch('/:id', usuarioController.actualizar);

module.exports = router;