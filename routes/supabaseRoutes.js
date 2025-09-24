// routes/supabaseRoutes.js
const express = require('express');
const router = express.Router();

const productoSupabaseController = require('../controllers/productoSupabaseController');
const authSupabaseController = require('../controllers/authSupabaseController');

// Ruta de test
router.get('/test-supabase', async (req, res) => {
    try {
        const supabase = require('../config/supabase');
        const { data, error } = await supabase
            .from('producto')
            .select('count()')
            .limit(1);

        if (error) {
            return res.status(500).json({ error: error.message, details: error });
        }

        res.json({ message: 'Supabase conectado', data });
    } catch (err) {
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});

// Rutas de productos usando Supabase
router.get('/productos', productoSupabaseController.obtenerTodos);
router.get('/productos/buscar', productoSupabaseController.buscar);
router.get('/productos/:id', productoSupabaseController.obtenerPorId);

// Rutas de autenticación usando Supabase
router.post('/login', authSupabaseController.login);
router.post('/register', authSupabaseController.register);

module.exports = router;