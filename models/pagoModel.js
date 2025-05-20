// models/pagoModel.js
const db = require('../config/db'); // Asegúrate que tu archivo de conexión a BD esté en '../config/db'

// Crear un nuevo registro de pago
exports.crearPago = (datosPago, callback) => {
    const {
        id_pedido, id_metodo, estado, monto,
        referencia_transaccion, comprobante_url, id_moneda
    } = datosPago;

    const query = `INSERT INTO pago (id_pedido, id_metodo, estado, monto, referencia_transaccion, comprobante_url, id_moneda, fecha_pago)
                   VALUES (?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))`;
    db.query(query, [
        id_pedido,
        id_metodo,
        estado,
        monto,
        referencia_transaccion,
        comprobante_url,
        id_moneda || 1, // Default a CLP (ID 1) si no se especifica
        datosPago.fecha_pago
    ], (err, result) => {
        if (err) {
            return callback(err);
        }
        callback(null, result.insertId);
    });
};

// Obtener todos los pagos con información adicional
exports.obtenerTodosLosPagos = (callback) => {
    const query = `
        SELECT
            p.id_pago,
            p.id_pedido,
            ped.numero_compra AS numero_compra_pedido,
            p.id_metodo,
            mp.descripcion AS metodo_pago_descripcion,
            p.estado,
            p.fecha_pago,
            p.monto,
            p.referencia_transaccion,
            p.comprobante_url,
            p.id_moneda,
            mon.codigo AS moneda_codigo,
            mon.simbolo AS moneda_simbolo
        FROM pago p
        LEFT JOIN pedido ped ON p.id_pedido = ped.id_pedido
        LEFT JOIN metodo_pago mp ON p.id_metodo = mp.id_metodo
        LEFT JOIN moneda mon ON p.id_moneda = mon.id_moneda
        ORDER BY p.fecha_pago DESC;
    `;
    db.query(query, callback);
};

// Obtener un pago por su ID con información adicional
exports.obtenerPagoPorId = (id_pago, callback) => {
    const query = `
        SELECT
            p.id_pago,
            p.id_pedido,
            ped.numero_compra AS numero_compra_pedido,
            p.id_metodo,
            mp.descripcion AS metodo_pago_descripcion,
            p.estado,
            p.fecha_pago,
            p.monto,
            p.referencia_transaccion,
            p.comprobante_url,
            p.id_moneda,
            mon.codigo AS moneda_codigo,
            mon.simbolo AS moneda_simbolo
        FROM pago p
        LEFT JOIN pedido ped ON p.id_pedido = ped.id_pedido
        LEFT JOIN metodo_pago mp ON p.id_metodo = mp.id_metodo
        LEFT JOIN moneda mon ON p.id_moneda = mon.id_moneda
        WHERE p.id_pago = ?;
    `;
    db.query(query, [id_pago], (err, results) => {
        if (err) {
            return callback(err);
        }
        callback(null, results[0]);
    });
};

// Actualizar un registro de pago
exports.actualizarPago = (id_pago, datosPago, callback) => {
    let fieldsToUpdate = [];
    let values = [];

    if (datosPago.id_pedido !== undefined) { fieldsToUpdate.push('id_pedido = ?'); values.push(datosPago.id_pedido); }
    if (datosPago.id_metodo !== undefined) { fieldsToUpdate.push('id_metodo = ?'); values.push(datosPago.id_metodo); }
    if (datosPago.estado !== undefined) { fieldsToUpdate.push('estado = ?'); values.push(datosPago.estado); }
    if (datosPago.monto !== undefined) { fieldsToUpdate.push('monto = ?'); values.push(datosPago.monto); }
    if (datosPago.referencia_transaccion !== undefined) { fieldsToUpdate.push('referencia_transaccion = ?'); values.push(datosPago.referencia_transaccion); }
    if (datosPago.comprobante_url !== undefined) { fieldsToUpdate.push('comprobante_url = ?'); values.push(datosPago.comprobante_url); }
    if (datosPago.id_moneda !== undefined) { fieldsToUpdate.push('id_moneda = ?'); values.push(datosPago.id_moneda); }
    if (datosPago.fecha_pago !== undefined) { fieldsToUpdate.push('fecha_pago = ?'); values.push(datosPago.fecha_pago); }


    if (fieldsToUpdate.length === 0) {
        return callback(null, { affectedRows: 0, message: "No hay campos válidos para actualizar." });
    }

    values.push(id_pago);
    const query = `UPDATE pago SET ${fieldsToUpdate.join(', ')} WHERE id_pago = ?`;

    db.query(query, values, (err, result) => {
        if (err) {
            return callback(err);
        }
        callback(null, result);
    });
};

// Eliminar un registro de pago
exports.eliminarPago = (id_pago, callback) => {
    const query = 'DELETE FROM pago WHERE id_pago = ?';
    db.query(query, [id_pago], (err, result) => {
        if (err) {
            return callback(err);
        }
        callback(null, result);
    });
};

// Obtener pagos asociados a un pedido específico
exports.obtenerPagosPorPedidoId = (id_pedido, callback) => {
    const query = `
        SELECT
            p.id_pago,
            p.id_metodo,
            mp.descripcion AS metodo_pago_descripcion,
            p.estado,
            p.fecha_pago,
            p.monto,
            p.referencia_transaccion,
            p.comprobante_url,
            p.id_moneda,
            mon.codigo AS moneda_codigo,
            mon.simbolo AS moneda_simbolo
        FROM pago p
        LEFT JOIN metodo_pago mp ON p.id_metodo = mp.id_metodo
        LEFT JOIN moneda mon ON p.id_moneda = mon.id_moneda
        WHERE p.id_pedido = ?
        ORDER BY p.fecha_pago DESC;
    `;
    db.query(query, [id_pedido], callback);
};