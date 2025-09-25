// routes/supabaseRoutes.js
const express = require('express');
const router = express.Router();

const productoSupabaseController = require('../controllers/productoSupabaseController');
const authSupabaseController = require('../controllers/authSupabaseController');
const pedidoSupabaseController = require('../controllers/pedidoSupabaseController');
const webpaySupabaseController = require('../controllers/webpaySupabaseController');

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
            .select('id_usuario, nombre_usuario, correo')
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
                    nombre_usuario: 'Admin Ferremas',
                    correo: 'admin@ferremas.cl',
                    contrasena: passwordHash,
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

// Endpoint temporal para actualizar contraseña de admin
router.post('/actualizar-admin-password', async (req, res) => {
    try {
        const bcrypt = require('bcrypt');
        const supabase = require('../config/supabase');

        const passwordHash = await bcrypt.hash('admin123', 10);

        const { data, error } = await supabase
            .from('usuario')
            .update({ contrasena: passwordHash })
            .eq('correo', 'admin@ferremas.cl')
            .select();

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.json({ message: 'Contraseña de admin actualizada a admin123', usuario: data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ENDPOINT DEBUG - Capturar datos exactos del frontend
router.post('/debug-login', async (req, res) => {
    console.log('🔍 DEBUG LOGIN - Headers recibidos:', req.headers);
    console.log('🔍 DEBUG LOGIN - Body recibido:', req.body);
    console.log('🔍 DEBUG LOGIN - Raw body type:', typeof req.body);
    console.log('🔍 DEBUG LOGIN - Content-Type:', req.get('Content-Type'));

    res.json({
        message: 'Debug data captured',
        headers: req.headers,
        body: req.body,
        bodyType: typeof req.body,
        contentType: req.get('Content-Type'),
        timestamp: new Date().toISOString()
    });
});

router.post('/debug-pedidos', async (req, res) => {
    console.log('🔍 DEBUG PEDIDOS - Headers recibidos:', req.headers);
    console.log('🔍 DEBUG PEDIDOS - Body recibido:', req.body);
    console.log('🔍 DEBUG PEDIDOS - Raw body type:', typeof req.body);
    console.log('🔍 DEBUG PEDIDOS - Content-Type:', req.get('Content-Type'));

    res.json({
        message: 'Debug pedidos data captured',
        headers: req.headers,
        body: req.body,
        bodyType: typeof req.body,
        contentType: req.get('Content-Type'),
        timestamp: new Date().toISOString()
    });
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

// Rutas de Webpay usando Supabase
router.post('/pagos/webpay/crear', webpaySupabaseController.crearTransaccion);
router.post('/pagos/webpay/retorno', webpaySupabaseController.retornoWebpay);
router.get('/pagos/webpay/retorno', webpaySupabaseController.retornoWebpay); // También GET para compatibilidad

// Endpoint simple para redirigir al último pedido a Webpay
router.get('/pagar-ultimo-pedido', async (req, res) => {
    try {
        const supabase = require('../config/supabase');

        // Obtener el último pedido
        const { data: ultimoPedido, error } = await supabase
            .from('pedido')
            .select('id_pedido')
            .order('fecha_actualizacion', { ascending: false })
            .limit(1)
            .single();

        if (error || !ultimoPedido) {
            return res.status(404).json({ error: 'No se encontró ningún pedido' });
        }

        // Crear transacción Webpay
        const webpayResponse = await fetch(`${req.protocol}://${req.get('host')}/api/pagos/webpay/crear`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_pedido: ultimoPedido.id_pedido })
        });

        const webpayData = await webpayResponse.json();

        if (!webpayData.url_webpay || !webpayData.token_ws) {
            return res.status(500).json({ error: 'Error creando transacción Webpay' });
        }

        // Redirigir directamente a Webpay
        const webpayUrl = `${webpayData.url_webpay}?token_ws=${webpayData.token_ws}`;
        res.redirect(webpayUrl);

    } catch (err) {
        console.error('Error en pagar-ultimo-pedido:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;