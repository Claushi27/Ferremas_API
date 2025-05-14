// routes/tasaCambioRoutes.js
const express = require('express');
const router = express.Router();
const tasaCambioController = require('../controllers/tasaCambioController');

// Ruta para forzar la actualización de la tasa USD a CLP desde la API externa y guardarla en BD
// Esta ruta debería ser protegida (ej. solo administradores)
router.post('/actualizar-usd-clp', tasaCambioController.actualizarTasaUsdClpEnBD);

// Ruta para obtener una tasa de conversión almacenada en la BD
// ej. GET /api/tasas-cambio/convertir?monedaOrigenCodigo=USD&monedaDestinoCodigo=CLP
router.get('/convertir', tasaCambioController.obtenerTasaAlmacenada);

// Ruta para listar todas las tasas guardadas en la BD (para admin/debug)
// Esta ruta debería ser protegida
router.get('/almacenadas', tasaCambioController.listarTasasGuardadas);

module.exports = router;