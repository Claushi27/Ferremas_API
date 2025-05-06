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
        datosProducto.id_categoria, // Asegúrate que este ID de categoría exista en la tabla categoria_producto
        datosProducto.codigo_producto,
        datosProducto.marca,
        datosProducto.es_promocion || false, // Valor por defecto si no se envía
        datosProducto.es_nuevo || false,   // Valor por defecto si no se envía
        datosProducto.imagen_url
    ], (err, results) => {
        if (err) {
            return callback(err);
        }
        callback(null, results.insertId);
    });
};

// Obtener todos los productos
exports.obtenerTodosLosProductos = (callback) => {
    // Podrías añadir JOIN con categoria_producto para obtener el nombre de la categoría
    const query = `
        SELECT p.*, c.nombre AS nombre_categoria 
        FROM producto p
        LEFT JOIN categoria_producto c ON p.id_categoria = c.id_categoria
    `;
    db.query(query, callback);
};

// Obtener un producto por su ID
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
        callback(null, results[0]); // Devuelve el primer producto o undefined
    });
};

// Actualizar un producto por su ID (usando PATCH)
exports.actualizarProducto = (id, datosProducto, callback) => {
    let fieldsToUpdate = [];
    let values = [];

    // Construir dinámicamente los campos a actualizar
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

    values.push(id); // Para la cláusula WHERE

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
    // Considerar si hay dependencias (ej. si está en inventario_sucursal o detalle_pedido)
    // Podrías necesitar borrar esas referencias primero o configurar ON DELETE CASCADE/SET NULL en la BD.
    // Por ahora, un borrado simple.
    const query = 'DELETE FROM producto WHERE id_producto = ?';
    db.query(query, [id], callback);
};