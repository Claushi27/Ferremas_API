// routes/promocionRoutes.js
const express = require('express');
const router = express.Router();
const promocionController = require('../controllers/promocionController');
// Aquí podrías añadir middlewares de autenticación/autorización si es necesario
// const authMiddleware = require('../middlewares/authMiddleware');
// const authorizeMiddleware = require('../middlewares/authorizeMiddleware');

// Crear una nueva promoción
// router.post('/', authMiddleware, authorizeMiddleware(['Administrador', 'Vendedor']), promocionController.crear);
router.post('/', promocionController.crear);

// Obtener todas las promociones
router.get('/', promocionController.obtenerTodos);

// Obtener una promoción por su ID
router.get('/:id', promocionController.obtenerPorId);

// Actualizar una promoción
// router.put('/:id', authMiddleware, authorizeMiddleware(['Administrador', 'Vendedor']), promocionController.actualizar);
router.put('/:id', promocionController.actualizar);

// Eliminar una promoción
// router.delete('/:id', authMiddleware, authorizeMiddleware(['Administrador']), promocionController.eliminar);
router.delete('/:id', promocionController.eliminar);

module.exports = router;