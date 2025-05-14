// routes/consultaClienteRoutes.js
const express = require('express');
const router = express.Router();
const consultaClienteController = require('../controllers/consultaClienteController');

// --- Rutas para Consultas de Clientes ---

// POST /api/consultas - Crear una nueva consulta de cliente
// Esta ruta podría estar abierta o requerir autenticación de cliente si el cliente está logueado
router.post('/', consultaClienteController.crearConsulta);

// GET /api/consultas - Obtener todas las consultas (para Vendedores/Administradores)
// Esta ruta DEBERÍA estar protegida por autenticación y roles en una implementación completa
router.get('/', consultaClienteController.obtenerTodas);

// GET /api/consultas/:id_consulta - Obtener una consulta específica con sus respuestas
// Esta ruta podría estar abierta si el cliente conoce el ID o protegida para Vendedores/Administradores/Cliente propietario
router.get('/:id_consulta', consultaClienteController.obtenerPorIdConRespuestas);

// PUT /api/consultas/:id_consulta - Actualizar una consulta (ej. estado, asignar vendedor)
// Esta ruta DEBERÍA estar protegida por autenticación y roles (Vendedor/Administrador)
router.put('/:id_consulta', consultaClienteController.actualizar);

// DELETE /api/consultas/:id_consulta - Eliminar una consulta
// Esta ruta DEBERÍA estar protegida por autenticación y roles (Administrador)
router.delete('/:id_consulta', consultaClienteController.eliminar);


// --- Rutas para Respuestas a Consultas ---

// POST /api/consultas/:id_consulta/respuestas - Crear una respuesta para una consulta
// Esta ruta DEBERÍA estar protegida por autenticación y roles (Vendedor/Administrador)
router.post('/:id_consulta/respuestas', consultaClienteController.crearRespuestaParaConsulta);

// GET /api/consultas/:id_consulta/respuestas - Obtener todas las respuestas de una consulta específica
// (Nota: obtenerPorIdConRespuestas ya incluye las respuestas, pero esta ruta puede ser útil si solo se quieren las respuestas)
// Esta ruta podría estar abierta si el cliente conoce el ID de consulta o protegida.
router.get('/:id_consulta/respuestas', consultaClienteController.obtenerRespuestasDeConsulta);


module.exports = router;