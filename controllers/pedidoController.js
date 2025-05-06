// controllers/pedidoController.js
const PedidoModel = require('../models/pedidoModel');

// Crear un nuevo pedido
exports.crear = (req, res) => {
    const { cabecera, detalles } = req.body;

    // Validaciones básicas de la cabecera
    if (!cabecera || !cabecera.id_cliente || !cabecera.id_tipo || !cabecera.fecha || !cabecera.numero_compra ||
        cabecera.total_sin_impuesto === undefined || cabecera.impuesto === undefined || cabecera.total_con_impuesto === undefined) {
        return res.status(400).json({ error: 'Campos requeridos de la cabecera del pedido faltantes o inválidos.' });
    }
    // Validaciones de los detalles (si existen)
    if (detalles) {
        if (!Array.isArray(detalles)) {
            return res.status(400).json({ error: 'Los detalles del pedido deben ser un array.' });
        }
        for (const item of detalles) {
            if (item.id_producto === undefined || item.cantidad === undefined || item.precio_unitario === undefined || item.subtotal === undefined) {
                return res.status(400).json({ error: 'Cada item de detalle debe tener id_producto, cantidad, precio_unitario y subtotal.' });
            }
        }
    }

    PedidoModel.crearPedidoConDetalles(cabecera, detalles, (err, insertId) => {
        if (err) {
            console.error("Error al crear pedido:", err);
            if (err.code === 'ER_DUP_ENTRY' && err.sqlMessage.includes('numero_compra')) {
                return res.status(409).json({ error: 'El número de compra ya existe.' });
            }
            if (err.code === 'ER_NO_REFERENCED_ROW_2') {
                return res.status(400).json({ error: 'Error de referencia: id_cliente, id_tipo, id_sucursal, id_estado, id_moneda o id_producto en detalles no existen.' });
            }
            return res.status(500).json({ error: 'Error interno al crear el pedido.' });
        }
        PedidoModel.obtenerPedidoConDetallesPorId(insertId, (err, nuevoPedido) => {
            if (err || !nuevoPedido) {
                 return res.status(201).json({ message: 'Pedido creado exitosamente pero no se pudo recuperar', id_pedido: insertId });
            }
            res.status(201).json({ message: 'Pedido creado exitosamente', pedido: nuevoPedido });
        });
    });
};

// Obtener todos los pedidos (solo cabeceras)
exports.obtenerTodos = (req, res) => {
    PedidoModel.obtenerTodosLosPedidos((err, pedidos) => {
        if (err) {
            console.error("Error al obtener pedidos:", err);
            return res.status(500).json({ error: 'Error interno al obtener los pedidos.' });
        }
        res.status(200).json(pedidos);
    });
};

// Obtener un pedido por ID con sus detalles
exports.obtenerPorId = (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'ID de pedido inválido.' });
    }
    PedidoModel.obtenerPedidoConDetallesPorId(id, (err, pedido) => {
        if (err) {
            console.error(`Error al obtener pedido con ID ${id}:`, err);
            return res.status(500).json({ error: 'Error interno al obtener el pedido.' });
        }
        if (!pedido) {
            return res.status(404).json({ error: 'Pedido no encontrado.' });
        }
        res.status(200).json(pedido);
    });
};

// Actualizar un pedido (ej. estado)
exports.actualizar = (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'ID de pedido inválido.' });
    }
    const datosPedido = req.body; // Espera ej. { "id_estado": 3, "comentarios": "El cliente llamó..." }
    if (Object.keys(datosPedido).length === 0) {
        return res.status(400).json({ error: 'No se proporcionaron datos para actualizar.' });
    }

    PedidoModel.actualizarPedido(id, datosPedido, (err, result) => {
        if (err) {
            console.error(`Error al actualizar pedido con ID ${id}:`, err);
            if (err.code === 'ER_NO_REFERENCED_ROW_2' && err.sqlMessage.includes('id_estado')) {
                return res.status(400).json({ error: 'El ID de estado proporcionado no existe.' });
            }
            return res.status(500).json({ error: 'Error interno al actualizar el pedido.' });
        }
        if (result.affectedRows === 0 && (!result.message || !result.message.includes("No hay campos válidos para actualizar"))) {
            return res.status(404).json({ error: 'Pedido no encontrado para actualizar.' });
        }
        if (result.message && result.message.includes("No hay campos válidos para actualizar")) {
            return res.status(200).json({ message: 'No se realizaron cambios, no se proporcionaron campos válidos para actualizar o los valores eran los mismos.' });
        }
        PedidoModel.obtenerPedidoConDetallesPorId(id, (err, pedidoActualizado) => {
            if(err || !pedidoActualizado){
                return res.status(200).json({ message: 'Pedido actualizado exitosamente pero no se pudo recuperar.' });
            }
            res.status(200).json({ message: 'Pedido actualizado exitosamente.', pedido: pedidoActualizado });
        });
    });
};

// Eliminar un pedido
exports.eliminar = (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'ID de pedido inválido.' });
    }
    PedidoModel.obtenerPedidoConDetallesPorId(id, (err, pedido) => { // Verifica si existe primero
        if (err) return res.status(500).json({ error: 'Error verificando pedido antes de eliminar.' });
        if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado para eliminar.' });

        PedidoModel.eliminarPedidoConDetalles(id, (err, result) => {
            if (err) {
                console.error(`Error al eliminar pedido con ID ${id}:`, err);
                return res.status(500).json({ error: 'Error interno al eliminar el pedido.' });
            }
            // result.affectedRows se refiere a la tabla 'pedido', los detalles se borraron en la transacción
            if (result.affectedRows === 0) {
                 return res.status(404).json({ error: 'Pedido no encontrado durante la eliminación (raro si la verificación previa pasó).' });
            }
            res.status(200).json({ message: 'Pedido y sus detalles eliminados exitosamente.' });
        });
    });
};