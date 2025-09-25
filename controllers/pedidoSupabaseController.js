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
            total
        } = req.body;

        if (!id_cliente || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                error: 'Faltan datos requeridos: id_cliente, items'
            });
        }

        // Calcular total de los items
        const totalCalculado = items.reduce((sum, item) => {
            const precio = item.precio || item.price || 0;
            const cantidad = item.cantidad || item.quantity || 1;
            return sum + (precio * cantidad);
        }, 0);

        // Generar número de compra único
        const numeroCompra = `FER-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        // Crear el pedido principal
        const { data: pedido, error: errorPedido } = await supabase
            .from('pedido')
            .insert([
                {
                    id_cliente,
                    id_tipo: 1, // Retiro en tienda por defecto
                    id_sucursal: 1, // Sucursal por defecto
                    fecha: new Date().toISOString().split('T')[0], // Solo fecha
                    id_estado: 1, // Estado inicial (Pendiente)
                    numero_compra: numeroCompra,
                    id_moneda: 1, // CLP por defecto
                    total_sin_impuesto: totalCalculado,
                    impuesto: totalCalculado * 0.19, // IVA 19%
                    total_con_impuesto: totalCalculado * 1.19,
                    descuento: 0,
                    comentarios: 'Pedido creado desde API'
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
        const detalles = items.map(item => {
            const cantidad = item.cantidad || item.quantity || 1;
            const precio = item.precio || item.price || 0;
            return {
                id_pedido: pedido.id_pedido,
                id_producto: item.id_producto || item.id,
                cantidad,
                precio_unitario: precio,
                descuento_item: 0,
                subtotal: cantidad * precio
            };
        });

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