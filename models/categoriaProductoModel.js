// models/categoriaProductoModel.js
const db = require('../config/db');

// Crear una nueva categoría de producto
exports.crearCategoria = (datosCategoria, callback) => {
    const query = 'INSERT INTO categoria_producto (nombre, descripcion, categoria_padre) VALUES (?, ?, ?)';
    db.query(query, [
        datosCategoria.nombre,
        datosCategoria.descripcion,
        datosCategoria.categoria_padre // Puede ser NULL si es una categoría principal
    ], (err, results) => {
        if (err) {
            return callback(err);
        }
        callback(null, results.insertId);
    });
};

// Obtener todas las categorías de producto
exports.obtenerTodasLasCategorias = (callback) => {
    // Esta consulta trae también el nombre de la categoría padre si existe
    const query = `
        SELECT cp.*, cp_padre.nombre AS nombre_categoria_padre
        FROM categoria_producto cp
        LEFT JOIN categoria_producto cp_padre ON cp.categoria_padre = cp_padre.id_categoria
    `;
    db.query(query, callback);
};

// Obtener una categoría de producto por su ID
exports.obtenerCategoriaPorId = (id, callback) => {
    const query = `
        SELECT cp.*, cp_padre.nombre AS nombre_categoria_padre
        FROM categoria_producto cp
        LEFT JOIN categoria_producto cp_padre ON cp.categoria_padre = cp_padre.id_categoria
        WHERE cp.id_categoria = ?
    `;
    db.query(query, [id], (err, results) => {
        if (err) {
            return callback(err);
        }
        callback(null, results[0]); // Devuelve la primera categoría o undefined
    });
};

// Actualizar una categoría de producto por su ID
exports.actualizarCategoria = (id, datosCategoria, callback) => {
    let fieldsToUpdate = [];
    let values = [];

    if (datosCategoria.nombre !== undefined) { fieldsToUpdate.push('nombre = ?'); values.push(datosCategoria.nombre); }
    if (datosCategoria.descripcion !== undefined) { fieldsToUpdate.push('descripcion = ?'); values.push(datosCategoria.descripcion); }
    // Permitir actualizar categoria_padre a NULL o a un ID existente.
    // Si se envía categoria_padre: null, se debe poder setear a NULL.
    // Si se envía un ID, ese ID debe existir.
    if (datosCategoria.hasOwnProperty('categoria_padre')) { // Usar hasOwnProperty para permitir setear a null
        fieldsToUpdate.push('categoria_padre = ?');
        values.push(datosCategoria.categoria_padre); // Esto puede ser null o un ID
    }


    if (fieldsToUpdate.length === 0) {
        return callback(null, { affectedRows: 0, message: "No hay campos válidos para actualizar" });
    }

    values.push(id); // Para la cláusula WHERE

    const query = `UPDATE categoria_producto SET ${fieldsToUpdate.join(', ')} WHERE id_categoria = ?`;
    db.query(query, values, (err, result) => {
        if (err) {
            return callback(err);
        }
        callback(null, result);
    });
};

// Eliminar una categoría de producto por su ID
exports.eliminarCategoria = (id, callback) => {
    // Antes de eliminar, considerar qué pasa con los productos que pertenecen a esta categoría
    // y qué pasa con las subcategorías que tienen esta categoría como padre.
    // Opción 1: No permitir eliminar si tiene productos o subcategorías.
    // Opción 2: Poner id_categoria en productos a NULL o a una categoría "Sin categoría".
    // Opción 3: Poner categoria_padre en subcategorías a NULL.
    // La base de datos (FOREIGN KEY) podría impedir la eliminación si hay referencias.
    // Por ahora, intento de borrado simple.
    const query = 'DELETE FROM categoria_producto WHERE id_categoria = ?';
    db.query(query, [id], callback);
};