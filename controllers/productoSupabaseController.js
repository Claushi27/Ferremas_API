// controllers/productoSupabaseController.js
const supabase = require('../config/supabase');

// Obtener todos los productos usando Supabase
exports.obtenerTodos = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('producto')
            .select(`
                *,
                categoria_producto (
                    id_categoria,
                    nombre_categoria
                )
            `)
            .order('id_producto', { ascending: true });

        if (error) {
            console.error('Error Supabase obtenerTodos productos:', error);
            return res.status(500).json({
                error: 'Error al obtener productos',
                details: error.message
            });
        }

        res.status(200).json(data || []);
    } catch (err) {
        console.error('Error servidor obtenerTodos productos:', err);
        res.status(500).json({
            error: 'Error interno del servidor',
            details: err.message
        });
    }
};

// Obtener producto por ID usando Supabase
exports.obtenerPorId = async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('producto')
            .select(`
                *,
                categoria_producto (
                    id_categoria,
                    nombre_categoria
                )
            `)
            .eq('id_producto', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Producto no encontrado' });
            }
            console.error('Error Supabase obtenerPorId producto:', error);
            return res.status(500).json({
                error: 'Error al obtener producto',
                details: error.message
            });
        }

        res.status(200).json(data);
    } catch (err) {
        console.error('Error servidor obtenerPorId producto:', err);
        res.status(500).json({
            error: 'Error interno del servidor',
            details: err.message
        });
    }
};

// Buscar productos usando Supabase
exports.buscar = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q) {
            return res.status(400).json({ error: 'Parámetro de búsqueda requerido' });
        }

        const { data, error } = await supabase
            .from('producto')
            .select(`
                *,
                categoria_producto (
                    id_categoria,
                    nombre_categoria
                )
            `)
            .or(`nombre.ilike.%${q}%,descripcion.ilike.%${q}%,marca.ilike.%${q}%`)
            .order('id_producto', { ascending: true });

        if (error) {
            console.error('Error Supabase buscar productos:', error);
            return res.status(500).json({
                error: 'Error en búsqueda',
                details: error.message
            });
        }

        res.status(200).json(data || []);
    } catch (err) {
        console.error('Error servidor buscar productos:', err);
        res.status(500).json({
            error: 'Error interno del servidor',
            details: err.message
        });
    }
};