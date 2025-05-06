// models/pedidoModel.js
const db = require('../config/db');

// Crear un nuevo pedido y sus detalles (transacción)
exports.crearPedidoConDetalles = (datosCabeceraPedido, detallesPedido, callback) => {
    db.beginTransaction(err => {
        if (err) { return callback(err); }

        const queryPedido = `INSERT INTO pedido (id_cliente, id_tipo, id_sucursal, fecha, id_estado, numero_compra, id_moneda, total_sin_impuesto, impuesto, total_con_impuesto, descuento, comentarios)
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        db.query(queryPedido, [
            datosCabeceraPedido.id_cliente,
            datosCabeceraPedido.id_tipo,
            datosCabeceraPedido.id_sucursal, // Puede ser null
            datosCabeceraPedido.fecha, // YYYY-MM-DD
            datosCabeceraPedido.id_estado || 1, // Default 'Pendiente'
            datosCabeceraPedido.numero_compra,
            datosCabeceraPedido.id_moneda || 1, // Default CLP
            datosCabeceraPedido.total_sin_impuesto,
            datosCabeceraPedido.impuesto,
            datosCabeceraPedido.total_con_impuesto,
            datosCabeceraPedido.descuento || 0,
            datosCabeceraPedido.comentarios
        ], (err, resultPedido) => {
            if (err) {
                return db.rollback(() => { callback(err); });
            }

            const idPedidoCreado = resultPedido.insertId;
            if (!detallesPedido || detallesPedido.length === 0) {
                // Si no hay detalles, solo se crea la cabecera
                db.commit(err => {
                    if (err) { return db.rollback(() => { callback(err); }); }
                    callback(null, idPedidoCreado);
                });
                return;
            }

            const queryDetalle = 'INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio_unitario, descuento_item, subtotal) VALUES ?';
            const detallesValues = detallesPedido.map(item => [
                idPedidoCreado,
                item.id_producto,
                item.cantidad,
                item.precio_unitario,
                item.descuento_item || 0,
                item.subtotal
            ]);

            db.query(queryDetalle, [detallesValues], (err, resultDetalles) => {
                if (err) {
                    return db.rollback(() => { callback(err); });
                }
                db.commit(err => {
                    if (err) { return db.rollback(() => { callback(err); }); }
                    callback(null, idPedidoCreado);
                });
            });
        });
    });
};

// Obtener todos los pedidos (solo cabeceras)
exports.obtenerTodosLosPedidos = (callback) => {
    // Se pueden añadir JOINs para más info (cliente, estado, etc.)
    const query = `
        SELECT 
            p.*, 
            c.nombre_completo AS nombre_cliente, 
            ep.nombre AS nombre_estado_pedido,
            te.descripcion AS tipo_entrega_descripcion
        FROM pedido p
        LEFT JOIN cliente c ON p.id_cliente = c.id_cliente
        LEFT JOIN estado_pedido ep ON p.id_estado = ep.id_estado
        LEFT JOIN tipo_entrega te ON p.id_tipo = te.id_tipo
        ORDER BY p.fecha_actualizacion DESC
    `;
    db.query(query, callback);
};

// Obtener un pedido por su ID con sus detalles
exports.obtenerPedidoConDetallesPorId = (id, callback) => {
    let pedidoData = {};
    const queryPedido = `
        SELECT 
            p.*, 
            c.nombre_completo AS nombre_cliente, 
            ep.nombre AS nombre_estado_pedido,
            te.descripcion AS tipo_entrega_descripcion,
            s.nombre AS nombre_sucursal_retiro
        FROM pedido p
        LEFT JOIN cliente c ON p.id_cliente = c.id_cliente
        LEFT JOIN estado_pedido ep ON p.id_estado = ep.id_estado
        LEFT JOIN tipo_entrega te ON p.id_tipo = te.id_tipo
        LEFT JOIN sucursal s ON p.id_sucursal = s.id_sucursal
        WHERE p.id_pedido = ?
    `;
    db.query(queryPedido, [id], (err, resultsPedido) => {
        if (err) { return callback(err); }
        if (resultsPedido.length === 0) { return callback(null, null); } // Pedido no encontrado

        pedidoData = resultsPedido[0];

        const queryDetalles = `
            SELECT dp.*, pr.nombre AS nombre_producto, pr.codigo_producto
            FROM detalle_pedido dp
            JOIN producto pr ON dp.id_producto = pr.id_producto
            WHERE dp.id_pedido = ?
        `;
        db.query(queryDetalles, [id], (err, resultsDetalles) => {
            if (err) { return callback(err); }
            pedidoData.detalles = resultsDetalles;
            callback(null, pedidoData);
        });
    });
};

// Actualizar un pedido (ej. cambiar estado, comentarios. Actualizar detalles es más complejo)
exports.actualizarPedido = (id, datosPedido, callback) => {
    let fieldsToUpdate = [];
    let values = [];

    // Campos comunes a actualizar en la cabecera del pedido
    if (datosPedido.id_estado !== undefined) { fieldsToUpdate.push('id_estado = ?'); values.push(datosPedido.id_estado); }
    if (datosPedido.comentarios !== undefined) { fieldsToUpdate.push('comentarios = ?'); values.push(datosPedido.comentarios); }
    // Podrías añadir más campos si es necesario (ej. datos de envío si no van en una tabla 'despacho' separada)

    if (fieldsToUpdate.length === 0) {
        return callback(null, { affectedRows: 0, message: "No hay campos válidos para actualizar" });
    }

    values.push(id); // Para la cláusula WHERE

    // fecha_actualizacion se actualiza automáticamente por la BD
    const query = `UPDATE pedido SET ${fieldsToUpdate.join(', ')} WHERE id_pedido = ?`;
    db.query(query, values, (err, result) => {
        if (err) {
            return callback(err);
        }
        callback(null, result);
    });
};

// Eliminar un pedido y sus detalles (transacción)
exports.eliminarPedidoConDetalles = (id, callback) => {
    db.beginTransaction(err => {
        if (err) { return callback(err); }

        // Primero eliminar los detalles
        const queryDeleteDetalles = 'DELETE FROM detalle_pedido WHERE id_pedido = ?';
        db.query(queryDeleteDetalles, [id], (err, resultDetalles) => {
            if (err) {
                return db.rollback(() => { callback(err); });
            }

            // Luego eliminar la cabecera del pedido
            const queryDeletePedido = 'DELETE FROM pedido WHERE id_pedido = ?';
            db.query(queryDeletePedido, [id], (err, resultPedido) => {
                if (err) {
                    return db.rollback(() => { callback(err); });
                }
                db.commit(err => {
                    if (err) { return db.rollback(() => { callback(err); }); }
                    callback(null, resultPedido); // Devuelve el resultado de la eliminación del pedido
                });
            });
        });
    });
};