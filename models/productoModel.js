// models/productoModel.js
const db = require('../config/db');

// Crear un nuevo producto
exports.crearProducto = (datosProducto, callback) => {
    const query = `INSERT INTO producto (nombre, descripcion, precio, id_categoria, codigo_producto, marca, es_promocion, es_nuevo, imagen_url) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    db.query(query, [
        datosProducto.nombre,
        datosProducto.descripcion,
        datosProducto.precio,
        datosProducto.id_categoria,
        datosProducto.codigo_producto,
        datosProducto.marca,
        datosProducto.es_promocion || false,
        datosProducto.es_nuevo || false,
        datosProducto.imagen_url
    ], (err, results) => {
        if (err) {
            return callback(err);
        }
        callback(null, results.insertId);
    });
};

// Obtener todos los productos (versión original)
exports.obtenerTodosLosProductos = (callback) => {
    const query = `
        SELECT p.*, c.nombre AS nombre_categoria 
        FROM producto p
        LEFT JOIN categoria_producto c ON p.id_categoria = c.id_categoria
    `;
    db.query(query, callback);
};

// Obtener un producto por su ID (versión original)
exports.obtenerProductoPorId = (id, callback) => {
    const query = `
        SELECT p.*, c.nombre AS nombre_categoria 
        FROM producto p
        LEFT JOIN categoria_producto c ON p.id_categoria = c.id_categoria
        WHERE p.id_producto = ?
    `;
    db.query(query, [id], (err, results) => {
        if (err) {
            return callback(err);
        }
        callback(null, results[0]);
    });
};

// Actualizar un producto por su ID
exports.actualizarProducto = (id, datosProducto, callback) => {
    let fieldsToUpdate = [];
    let values = [];

    if (datosProducto.nombre !== undefined) { fieldsToUpdate.push('nombre = ?'); values.push(datosProducto.nombre); }
    if (datosProducto.descripcion !== undefined) { fieldsToUpdate.push('descripcion = ?'); values.push(datosProducto.descripcion); }
    if (datosProducto.precio !== undefined) { fieldsToUpdate.push('precio = ?'); values.push(datosProducto.precio); }
    if (datosProducto.id_categoria !== undefined) { fieldsToUpdate.push('id_categoria = ?'); values.push(datosProducto.id_categoria); }
    if (datosProducto.codigo_producto !== undefined) { fieldsToUpdate.push('codigo_producto = ?'); values.push(datosProducto.codigo_producto); }
    if (datosProducto.marca !== undefined) { fieldsToUpdate.push('marca = ?'); values.push(datosProducto.marca); }
    if (datosProducto.es_promocion !== undefined) { fieldsToUpdate.push('es_promocion = ?'); values.push(datosProducto.es_promocion); }
    if (datosProducto.es_nuevo !== undefined) { fieldsToUpdate.push('es_nuevo = ?'); values.push(datosProducto.es_nuevo); }
    if (datosProducto.imagen_url !== undefined) { fieldsToUpdate.push('imagen_url = ?'); values.push(datosProducto.imagen_url); }

    if (fieldsToUpdate.length === 0) {
        return callback(null, { affectedRows: 0, message: "No hay campos válidos para actualizar" });
    }

    values.push(id);

    const query = `UPDATE producto SET ${fieldsToUpdate.join(', ')} WHERE id_producto = ?`;
    db.query(query, values, (err, result) => {
        if (err) {
            return callback(err);
        }
        callback(null, result);
    });
};

// Eliminar un producto por su ID
exports.eliminarProducto = (id, callback) => {
    const query = 'DELETE FROM producto WHERE id_producto = ?';
    db.query(query, [id], callback);
};

// --- FUNCIONES PARA API N°2 (Consulta de Productos según Anexo) ---

/**
 * Obtener un producto por su ID incluyendo el stock total.
 * El stock total se calcula sumando el stock de todas las sucursales.
 */
exports.obtenerProductoPorIdConStock = (id, callback) => {
    const query = `
        SELECT 
            p.id_producto,
            p.nombre,
            p.descripcion,
            p.precio,
            p.id_categoria,
            cat.nombre AS nombre_categoria,
            p.codigo_producto,
            p.marca,
            p.es_promocion,
            p.es_nuevo,
            p.imagen_url,
            p.fecha_creacion,
            COALESCE(SUM(inv.stock), 0) AS stock_total 
        FROM producto p
        LEFT JOIN categoria_producto cat ON p.id_categoria = cat.id_categoria
        LEFT JOIN inventario_sucursal inv ON p.id_producto = inv.id_producto
        WHERE p.id_producto = ?
        GROUP BY p.id_producto, p.nombre, p.descripcion, p.precio, p.id_categoria, cat.nombre, 
                 p.codigo_producto, p.marca, p.es_promocion, p.es_nuevo, p.imagen_url, p.fecha_creacion;
    `;
    // Se agrupa por todos los campos no agregados para asegurar la correcta suma del stock.
    db.query(query, [id], (err, results) => {
        if (err) {
            return callback(err);
        }
        callback(null, results[0]); // Devuelve el producto o undefined
    });
};

/**
 * Obtener todos los productos incluyendo el stock total para cada uno.
 * El stock total se calcula sumando el stock de todas las sucursales para cada producto.
 */
exports.obtenerTodosLosProductosConStock = (callback) => {
    const query = `
        SELECT 
            p.id_producto,
            p.nombre,
            p.descripcion,
            p.precio,
            p.id_categoria,
            cat.nombre AS nombre_categoria,
            p.codigo_producto,
            p.marca,
            p.es_promocion,
            p.es_nuevo,
            p.imagen_url,
            p.fecha_creacion,
            COALESCE(SUM(inv.stock), 0) AS stock_total
        FROM producto p
        LEFT JOIN categoria_producto cat ON p.id_categoria = cat.id_categoria
        LEFT JOIN inventario_sucursal inv ON p.id_producto = inv.id_producto
        GROUP BY p.id_producto, p.nombre, p.descripcion, p.precio, p.id_categoria, cat.nombre, 
                 p.codigo_producto, p.marca, p.es_promocion, p.es_nuevo, p.imagen_url, p.fecha_creacion
        ORDER BY p.nombre ASC; 
    `;
    // Se agrupa por todos los campos no agregados.
    db.query(query, callback);
};