// models/inventarioSucursalModel.js
const db = require('../config/db');

// Registrar o actualizar stock de un producto en una sucursal
// Esta función es un poco más compleja: intenta insertar, y si falla por duplicado (producto-sucursal ya existe), actualiza.
// Esto se conoce como "UPSERT". MySQL tiene INSERT ... ON DUPLICATE KEY UPDATE.
exports.registrarOActualizarStock = (datosInventario, callback) => {
    const query = `
        INSERT INTO inventario_sucursal (id_producto, id_sucursal, stock, stock_minimo, ubicacion_bodega, ultimo_reabastecimiento)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        stock = VALUES(stock),
        stock_minimo = VALUES(stock_minimo),
        ubicacion_bodega = VALUES(ubicacion_bodega),
        ultimo_reabastecimiento = VALUES(ultimo_reabastecimiento)
    `;
    // Para que ON DUPLICATE KEY UPDATE funcione, necesitas una clave UNIQUE en (id_producto, id_sucursal).
    // Si no la tienes, tendrías que hacer un SELECT primero para ver si existe y luego INSERT o UPDATE.
    // Por simplicidad, asumiremos que la constraint UNIQUE (id_producto, id_sucursal) existe o que
    // manejaremos la lógica de "existe o no" en el controlador si es necesario, o preferimos un error en POST si ya existe.

    // Para un POST simple (fallará si ya existe la combinación producto/sucursal con la constraint UNIQUE):
    const insertQuery = 'INSERT INTO inventario_sucursal (id_producto, id_sucursal, stock, stock_minimo, ubicacion_bodega, ultimo_reabastecimiento) VALUES (?, ?, ?, ?, ?, ?)';

    db.query(insertQuery, [
        datosInventario.id_producto,
        datosInventario.id_sucursal,
        datosInventario.stock,
        datosInventario.stock_minimo || 5, // Default si no se provee
        datosInventario.ubicacion_bodega,
        datosInventario.ultimo_reabastecimiento // Debe ser formato YYYY-MM-DD o null
    ], (err, results) => {
        if (err) {
            return callback(err);
        }
        // Si usas ON DUPLICATE KEY UPDATE, results.insertId podría ser 0 si fue un UPDATE.
        // Si es un INSERT simple, results.insertId será el nuevo ID.
        // results.affectedRows será 1 para INSERT, 1 o 2 para ON DUPLICATE KEY UPDATE (1 si no cambió, 2 si actualizó)
        callback(null, results);
    });
};

// Obtener todo el inventario (puede ser una lista larga)
// Usualmente se filtra por sucursal o por producto.
exports.obtenerTodoElInventario = (callback) => {
    const query = `
        SELECT inv.*, p.nombre AS nombre_producto, s.nombre AS nombre_sucursal
        FROM inventario_sucursal inv
        JOIN producto p ON inv.id_producto = p.id_producto
        JOIN sucursal s ON inv.id_sucursal = s.id_sucursal
    `;
    db.query(query, callback);
};

// Obtener inventario por ID de la entrada de inventario (id_inventario)
exports.obtenerInventarioPorId = (id, callback) => {
    const query = `
        SELECT inv.*, p.nombre AS nombre_producto, s.nombre AS nombre_sucursal
        FROM inventario_sucursal inv
        JOIN producto p ON inv.id_producto = p.id_producto
        JOIN sucursal s ON inv.id_sucursal = s.id_sucursal
        WHERE inv.id_inventario = ?
    `;
    db.query(query, [id], (err, results) => {
        if (err) {
            return callback(err);
        }
        callback(null, results[0]);
    });
};

// Obtener el stock de UN producto en UNA sucursal específica
exports.obtenerStockProductoEnSucursal = (id_producto, id_sucursal, callback) => {
    const query = `
        SELECT inv.*, p.nombre AS nombre_producto, s.nombre AS nombre_sucursal
        FROM inventario_sucursal inv
        JOIN producto p ON inv.id_producto = p.id_producto
        JOIN sucursal s ON inv.id_sucursal = s.id_sucursal
        WHERE inv.id_producto = ? AND inv.id_sucursal = ?
    `;
    db.query(query, [id_producto, id_sucursal], (err, results) => {
        if (err) return callback(err);
        callback(null, results[0]); // Debería haber solo una entrada o ninguna
    });
};


// Actualizar una entrada de inventario específica por su id_inventario (PATCH)
exports.actualizarStockPorIdInventario = (id_inventario, datosInventario, callback) => {
    let fieldsToUpdate = [];
    let values = [];

    if (datosInventario.stock !== undefined) { fieldsToUpdate.push('stock = ?'); values.push(datosInventario.stock); }
    if (datosInventario.stock_minimo !== undefined) { fieldsToUpdate.push('stock_minimo = ?'); values.push(datosInventario.stock_minimo); }
    if (datosInventario.ubicacion_bodega !== undefined) { fieldsToUpdate.push('ubicacion_bodega = ?'); values.push(datosInventario.ubicacion_bodega); }
    if (datosInventario.ultimo_reabastecimiento !== undefined) { fieldsToUpdate.push('ultimo_reabastecimiento = ?'); values.push(datosInventario.ultimo_reabastecimiento); }
    // Generalmente no se actualiza id_producto o id_sucursal en una entrada existente, se crearía una nueva o se borraría la antigua.

    if (fieldsToUpdate.length === 0) {
        return callback(null, { affectedRows: 0, message: "No hay campos válidos para actualizar" });
    }

    values.push(id_inventario);

    const query = `UPDATE inventario_sucursal SET ${fieldsToUpdate.join(', ')} WHERE id_inventario = ?`;
    db.query(query, values, (err, result) => {
        if (err) {
            return callback(err);
        }
        callback(null, result);
    });
};


// Eliminar una entrada de inventario por su id_inventario
exports.eliminarInventarioPorId = (id, callback) => {
    const query = 'DELETE FROM inventario_sucursal WHERE id_inventario = ?';
    db.query(query, [id], callback);
};

// Eliminar el inventario de un producto en una sucursal específica (si no se usa id_inventario)
exports.eliminarStockProductoEnSucursal = (id_producto, id_sucursal, callback) => {
    const query = 'DELETE FROM inventario_sucursal WHERE id_producto = ? AND id_sucursal = ?';
    db.query(query, [id_producto, id_sucursal], callback);
};