// models/consultaClienteModel.js
const db = require('../config/db');

/**
 * Crear una nueva consulta de cliente.
 */
exports.crearConsulta = (datosConsulta, callback) => {
    const query = `INSERT INTO consulta_cliente (id_cliente, asunto, mensaje, estado, id_vendedor_asignado) 
                   VALUES (?, ?, ?, ?, ?)`;
    db.query(query, [
        datosConsulta.id_cliente, 
        datosConsulta.asunto,
        datosConsulta.mensaje,
        datosConsulta.estado || 'Pendiente', 
        null 
    ], (err, results) => {
        if (err) {
            return callback(err);
        }
        callback(null, results.insertId);
    });
};

/**
 * Obtener todas las consultas de clientes.
 * Incluye nombre del cliente, correo del usuario asociado al cliente (si existe), 
 * y nombre del vendedor asignado (si existe).
 */
exports.obtenerTodasLasConsultas = (callback) => {
    const query = `
        SELECT 
            cc.*,
            c.nombre_completo AS nombre_cliente,
            u_cli.correo AS correo_cliente,  -- CORREGIDO: Obtener correo desde la tabla usuario vinculada al cliente
            u_vend.nombre_usuario AS nombre_vendedor_asignado
        FROM consulta_cliente cc
        LEFT JOIN cliente c ON cc.id_cliente = c.id_cliente
        LEFT JOIN usuario u_cli ON c.id_usuario = u_cli.id_usuario -- CORREGIDO: JOIN para el correo del cliente
        LEFT JOIN usuario u_vend ON cc.id_vendedor_asignado = u_vend.id_usuario
        ORDER BY cc.fecha_creacion DESC;
    `;
    db.query(query, callback);
};

/**
 * Obtener una consulta de cliente por su ID.
 * Incluye nombre del cliente, correo del usuario asociado al cliente (si existe), 
 * y nombre del vendedor asignado (si existe).
 */
exports.obtenerConsultaPorId = (id_consulta, callback) => {
    const query = `
        SELECT 
            cc.*,
            c.nombre_completo AS nombre_cliente,
            u_cli.correo AS correo_cliente, -- CORREGIDO: Obtener correo desde la tabla usuario vinculada al cliente
            u_vend.nombre_usuario AS nombre_vendedor_asignado
        FROM consulta_cliente cc
        LEFT JOIN cliente c ON cc.id_cliente = c.id_cliente
        LEFT JOIN usuario u_cli ON c.id_usuario = u_cli.id_usuario -- CORREGIDO: JOIN para el correo del cliente
        LEFT JOIN usuario u_vend ON cc.id_vendedor_asignado = u_vend.id_usuario
        WHERE cc.id_consulta = ?;
    `;
    db.query(query, [id_consulta], (err, results) => {
        if (err) {
            return callback(err);
        }
        callback(null, results[0]);
    });
};

/**
 * Actualizar una consulta de cliente (ej. cambiar estado, asignar vendedor).
 */
exports.actualizarConsulta = (id_consulta, datosActualizar, callback) => {
    let fieldsToUpdate = [];
    let values = [];

    if (datosActualizar.estado !== undefined) {
        fieldsToUpdate.push('estado = ?');
        values.push(datosActualizar.estado);
    }
    if (datosActualizar.hasOwnProperty('id_vendedor_asignado')) { 
        fieldsToUpdate.push('id_vendedor_asignado = ?');
        values.push(datosActualizar.id_vendedor_asignado);
    }

    if (fieldsToUpdate.length === 0) {
        return callback(null, { affectedRows: 0, message: "No hay campos válidos para actualizar" });
    }

    values.push(id_consulta);

    const query = `UPDATE consulta_cliente SET ${fieldsToUpdate.join(', ')} WHERE id_consulta = ?`;
    db.query(query, values, (err, result) => {
        if (err) {
            return callback(err);
        }
        callback(null, result);
    });
};

/**
 * Eliminar una consulta de cliente.
 */
exports.eliminarConsulta = (id_consulta, callback) => {
    const query = 'DELETE FROM consulta_cliente WHERE id_consulta = ?';
    db.query(query, [id_consulta], callback);
};

// --- Funciones para Respuestas ---

/**
 * Crear una respuesta a una consulta.
 */
exports.crearRespuesta = (datosRespuesta, callback) => {
    const query = `INSERT INTO respuesta_consulta (id_consulta, id_usuario, mensaje) 
                   VALUES (?, ?, ?)`;
    db.query(query, [
        datosRespuesta.id_consulta,
        datosRespuesta.id_usuario, 
        datosRespuesta.mensaje
    ], (err, results) => {
        if (err) {
            return callback(err);
        }
        callback(null, results.insertId);
    });
};

/**
 * Obtener todas las respuestas para una consulta específica.
 */
exports.obtenerRespuestasPorConsultaId = (id_consulta, callback) => {
    const query = `
        SELECT 
            rc.*,
            u.nombre_usuario AS nombre_usuario_respuesta
        FROM respuesta_consulta rc
        JOIN usuario u ON rc.id_usuario = u.id_usuario
        WHERE rc.id_consulta = ?
        ORDER BY rc.fecha_respuesta ASC;
    `;
    db.query(query, [id_consulta], callback);
};