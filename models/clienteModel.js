// models/clienteModel.js
const db = require('../config/db');

// Crear un nuevo cliente
exports.crearCliente = (datosCliente, callback) => {
    // El campo id_usuario es opcional y UNIQUE
    const query = `INSERT INTO cliente (nombre_completo, direccion, telefono, id_usuario, rut, fecha_nacimiento, acepta_promociones)
                   VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db.query(query, [
        datosCliente.nombre_completo,
        datosCliente.direccion,
        datosCliente.telefono,
        datosCliente.id_usuario, // Puede ser null si el cliente no tiene cuenta de usuario
        datosCliente.rut,        // Puede ser null, pero es UNIQUE si se provee
        datosCliente.fecha_nacimiento, // Puede ser null, formato YYYY-MM-DD
        datosCliente.acepta_promociones || false
    ], (err, results) => {
        if (err) {
            return callback(err);
        }
        callback(null, results.insertId);
    });
};

// Obtener todos los clientes
exports.obtenerTodosLosClientes = (callback) => {
    // Podrías hacer JOIN con la tabla usuario si quieres mostrar el nombre_usuario o correo
    const query = `
        SELECT cl.*, u.nombre_usuario, u.correo AS correo_usuario
        FROM cliente cl
        LEFT JOIN usuario u ON cl.id_usuario = u.id_usuario
    `;
    db.query(query, callback);
};

// Obtener un cliente por su ID
exports.obtenerClientePorId = (id, callback) => {
    const query = `
        SELECT cl.*, u.nombre_usuario, u.correo AS correo_usuario
        FROM cliente cl
        LEFT JOIN usuario u ON cl.id_usuario = u.id_usuario
        WHERE cl.id_cliente = ?
    `;
    db.query(query, [id], (err, results) => {
        if (err) {
            return callback(err);
        }
        callback(null, results[0]);
    });
};

// Actualizar un cliente por su ID
exports.actualizarCliente = (id, datosCliente, callback) => {
    let fieldsToUpdate = [];
    let values = [];

    if (datosCliente.nombre_completo !== undefined) { fieldsToUpdate.push('nombre_completo = ?'); values.push(datosCliente.nombre_completo); }
    if (datosCliente.direccion !== undefined) { fieldsToUpdate.push('direccion = ?'); values.push(datosCliente.direccion); }
    if (datosCliente.telefono !== undefined) { fieldsToUpdate.push('telefono = ?'); values.push(datosCliente.telefono); }
    // Actualizar id_usuario es delicado por la constraint UNIQUE. Solo si se asegura que el nuevo id_usuario no esté en uso.
    // Por ahora, lo omitimos o lo manejamos con cuidado si es necesario.
    // if (datosCliente.id_usuario !== undefined) { fieldsToUpdate.push('id_usuario = ?'); values.push(datosCliente.id_usuario); }
    if (datosCliente.rut !== undefined) { fieldsToUpdate.push('rut = ?'); values.push(datosCliente.rut); }
    if (datosCliente.fecha_nacimiento !== undefined) { fieldsToUpdate.push('fecha_nacimiento = ?'); values.push(datosCliente.fecha_nacimiento); }
    if (datosCliente.acepta_promociones !== undefined) { fieldsToUpdate.push('acepta_promociones = ?'); values.push(datosCliente.acepta_promociones); }


    if (fieldsToUpdate.length === 0) {
        return callback(null, { affectedRows: 0, message: "No hay campos válidos para actualizar" });
    }

    values.push(id);

    const query = `UPDATE cliente SET ${fieldsToUpdate.join(', ')} WHERE id_cliente = ?`;
    db.query(query, values, (err, result) => {
        if (err) {
            return callback(err);
        }
        callback(null, result);
    });
};

// Eliminar un cliente por su ID
exports.eliminarCliente = (id, callback) => {
    // Considerar dependencias (pedidos). La BD podría impedir el borrado.
    const query = 'DELETE FROM cliente WHERE id_cliente = ?';
    db.query(query, [id], callback);
};