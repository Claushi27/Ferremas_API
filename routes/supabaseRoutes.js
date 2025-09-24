// routes/supabaseRoutes.js
const express = require('express');
const router = express.Router();

const productoSupabaseController = require('../controllers/productoSupabaseController');
const authSupabaseController = require('../controllers/authSupabaseController');

// Rutas de productos usando Supabase
router.get('/productos', productoSupabaseController.obtenerTodos);
router.get('/productos/buscar', productoSupabaseController.buscar);
router.get('/productos/:id', productoSupabaseController.obtenerPorId);

// Rutas de autenticación usando Supabase
router.post('/login', authSupabaseController.login);
router.post('/register', authSupabaseController.register);

module.exports = router;