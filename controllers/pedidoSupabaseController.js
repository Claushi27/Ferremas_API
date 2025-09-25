// controllers/pedidoSupabaseController.js
const supabase = require('../config/supabase');

// Crear un pedido usando Supabase
exports.crear = async (req, res) => {
    try {
        console.log('🔍 Creando pedido con Supabase...');
        console.log('📝 Datos recibidos:', req.body);

        const {
            id_cliente,
            items,
            total,
            direccion_entrega,
            tipo_entrega = 1,
            metodo_pago = 1
        } = req.body;

        if (!id_cliente || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                error: 'Faltan datos requeridos: id_cliente, items'
            });
        }

        // Crear el pedido principal
        const { data: pedido, error: errorPedido } = await supabase
            .from('pedido')
            .insert([
                {
                    id_cliente,
                    fecha_pedido: new Date().toISOString(),
                    total: total || 0,
                    direccion_entrega: direccion_entrega || 'Dirección por definir',
                    id_estado_pedido: 1, // Estado inicial
                    id_tipo_entrega: tipo_entrega,
                    id_metodo_pago: metodo_pago
                }
            ])
            .select()
            .single();

        if (errorPedido) {
            console.error('❌ Error creando pedido:', errorPedido);
            return res.status(500).json({
                error: 'Error al crear pedido',
                details: errorPedido.message
            });
        }

        console.log('✅ Pedido creado:', pedido.id_pedido);

        // Crear los detalles del pedido
        const detalles = items.map(item => ({
            id_pedido: pedido.id_pedido,
            id_producto: item.id_producto || item.id,
            cantidad: item.cantidad || item.quantity || 1,
            precio_unitario: item.precio || item.price || 0,
            subtotal: (item.cantidad || 1) * (item.precio || item.price || 0)
        }));

        const { data: detallesPedido, error: errorDetalles } = await supabase
            .from('detalle_pedido')
            .insert(detalles)
            .select();

        if (errorDetalles) {
            console.error('❌ Error creando detalles:', errorDetalles);
            // El pedido ya se creó, pero falló el detalle
        } else {
            console.log('✅ Detalles creados:', detallesPedido.length);
        }

        res.status(201).json({
            success: true,
            message: 'Pedido creado exitosamente',
            data: {
                pedido,
                detalles: detallesPedido || []
            }
        });

    } catch (err) {
        console.error('❌ Error servidor crear pedido:', err);
        res.status(500).json({
            error: 'Error interno del servidor',
            details: err.message
        });
    }
};

// Obtener pedidos de un cliente
exports.obtenerPorCliente = async (req, res) => {
    try {
        const { id_cliente } = req.params;

        const { data, error } = await supabase
            .from('pedido')
            .select(`
                *,
                detalle_pedido (
                    *,
                    producto (
                        id_producto,
                        nombre,
                        precio
                    )
                ),
                estado_pedido (
                    nombre_estado
                )
            `)
            .eq('id_cliente', id_cliente)
            .order('fecha_pedido', { ascending: false });

        if (error) {
            console.error('❌ Error obteniendo pedidos:', error);
            return res.status(500).json({
                error: 'Error al obtener pedidos',
                details: error.message
            });
        }

        res.status(200).json(data || []);
    } catch (err) {
        console.error('❌ Error servidor obtener pedidos:', err);
        res.status(500).json({
            error: 'Error interno del servidor',
            details: err.message
        });
    }
};