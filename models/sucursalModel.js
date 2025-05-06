// models/sucursalModel.js
const db = require('../config/db');

// Crear una nueva sucursal
exports.crearSucursal = (datosSucursal, callback) => {
    const query = 'INSERT INTO sucursal (nombre, direccion, telefono, email, horario_atencion) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [
        datosSucursal.nombre,
        datosSucursal.direccion,
        datosSucursal.telefono,
        datosSucursal.email,
        datosSucursal.horario_atencion
    ], (err, results) => {
        if (err) {
            return callback(err);
        }
        callback(null, results.insertId);
    });
};

// Obtener todas las sucursales
exports.obtenerTodasLasSucursales = (callback) => {
    const query = 'SELECT * FROM sucursal';
    db.query(query, callback);
};

// Obtener una sucursal por su ID
exports.obtenerSucursalPorId = (id, callback) => {
    const query = 'SELECT * FROM sucursal WHERE id_sucursal = ?';
    db.query(query, [id], (err, results) => {
        if (err) {
            return callback(err);
        }
        callback(null, results[0]); // Devuelve la primera sucursal o undefined
    });
};

// Actualizar una sucursal por su ID
exports.actualizarSucursal = (id, datosSucursal, callback) => {
    let fieldsToUpdate = [];
    let values = [];

    if (datosSucursal.nombre !== undefined) { fieldsToUpdate.push('nombre = ?'); values.push(datosSucursal.nombre); }
    if (datosSucursal.direccion !== undefined) { fieldsToUpdate.push('direccion = ?'); values.push(datosSucursal.direccion); }
    if (datosSucursal.telefono !== undefined) { fieldsToUpdate.push('telefono = ?'); values.push(datosSucursal.telefono); }
    if (datosSucursal.email !== undefined) { fieldsToUpdate.push('email = ?'); values.push(datosSucursal.email); }
    if (datosSucursal.horario_atencion !== undefined) { fieldsToUpdate.push('horario_atencion = ?'); values.push(datosSucursal.horario_atencion); }

    if (fieldsToUpdate.length === 0) {
        return callback(null, { affectedRows: 0, message: "No hay campos válidos para actualizar" });
    }

    values.push(id); // Para la cláusula WHERE

    const query = `UPDATE sucursal SET ${fieldsToUpdate.join(', ')} WHERE id_sucursal = ?`;
    db.query(query, values, (err, result) => {
        if (err) {
            return callback(err);
        }
        callback(null, result);
    });
};

// Eliminar una sucursal por su ID
exports.eliminarSucursal = (id, callback) => {
    // Considerar dependencias: inventario_sucursal, pedido, etc.
    // La BD podría impedir el borrado si hay FKs.
    const query = 'DELETE FROM sucursal WHERE id_sucursal = ?';
    db.query(query, [id], callback);
};