// routes/supabaseRoutes.js
const express = require('express');
const router = express.Router();

const productoSupabaseController = require('../controllers/productoSupabaseController');
const authSupabaseController = require('../controllers/authSupabaseController');
const pedidoSupabaseController = require('../controllers/pedidoSupabaseController');

// Ruta de test
router.get('/test-supabase', async (req, res) => {
    try {
        const supabase = require('../config/supabase');
        const { data, error } = await supabase
            .from('producto')
            .select('id_producto, nombre')
            .limit(1);

        if (error) {
            return res.status(500).json({ error: error.message, details: error });
        }

        res.json({ message: 'Supabase conectado', data });
    } catch (err) {
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});

// Test usuarios
router.get('/test-usuarios', async (req, res) => {
    try {
        const supabase = require('../config/supabase');
        const { data, error } = await supabase
            .from('usuario')
            .select('id_usuario, nombre, email')
            .limit(3);

        res.json({ usuarios: data, error });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Crear usuario admin de prueba
router.post('/crear-admin', async (req, res) => {
    try {
        const bcrypt = require('bcrypt');
        const supabase = require('../config/supabase');

        const passwordHash = await bcrypt.hash('admin123', 10);

        const { data, error } = await supabase
            .from('usuario')
            .insert([
                {
                    nombre: 'Admin',
                    apellido: 'Ferremas',
                    email: 'admin@ferremas.cl',
                    password_hash: passwordHash,
                    telefono: '+56912345678',
                    id_rol: 1 // Admin
                }
            ])
            .select()
            .single();

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.json({ message: 'Admin creado exitosamente', usuario: data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Rutas de productos usando Supabase
router.get('/productos', productoSupabaseController.obtenerTodos);
router.get('/productos/buscar', productoSupabaseController.buscar);
router.get('/productos/:id', productoSupabaseController.obtenerPorId);

// Rutas de autenticación usando Supabase
router.post('/login', authSupabaseController.login);
router.post('/register', authSupabaseController.register);

// Rutas de pedidos usando Supabase
router.post('/pedidos', pedidoSupabaseController.crear);
router.get('/pedidos/cliente/:id_cliente', pedidoSupabaseController.obtenerPorCliente);

module.exports = router;