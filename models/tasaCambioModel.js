// models/tasaCambioModel.js
const db = require('../config/db');

/**
 * Guarda o actualiza una tasa de cambio.
 * Utiliza INSERT ... ON DUPLICATE KEY UPDATE para simplificar.
 * Requiere una CONSTRAINT UNIQUE en (id_moneda_origen, id_moneda_destino) en tu tabla tasa_cambio.
 */
exports.guardarOActualizarTasa = (idMonedaOrigen, idMonedaDestino, tasa, callback) => {
    // Primero, asegúrate que la tabla tasa_cambio tenga una constraint UNIQUE en (id_moneda_origen, id_moneda_destino)
    // Ejemplo de cómo añadirla si no existe:
    // ALTER TABLE tasa_cambio ADD CONSTRAINT uk_moneda_origen_destino UNIQUE (id_moneda_origen, id_moneda_destino);

    const query = `
        INSERT INTO tasa_cambio (id_moneda_origen, id_moneda_destino, tasa, fecha_actualizacion)
        VALUES (?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
            tasa = VALUES(tasa),
            fecha_actualizacion = NOW();
    `;
    db.query(query, [idMonedaOrigen, idMonedaDestino, tasa], (err, result) => {
        if (err) {
            return callback(err);
        }
        // result.affectedRows será 1 si fue un INSERT, 2 si fue un UPDATE de una fila existente que cambió.
        // result.insertId será el ID si fue un INSERT, o el ID existente si fue un UPDATE (o 0 en algunos casos de update sin cambio).
        callback(null, result);
    });
};

/**
 * Obtener la tasa de cambio más reciente entre dos monedas.
 */
exports.obtenerTasaReciente = (idMonedaOrigen, idMonedaDestino, callback) => {
    const query = `
        SELECT tasa, fecha_actualizacion 
        FROM tasa_cambio
        WHERE id_moneda_origen = ? AND id_moneda_destino = ?
        ORDER BY fecha_actualizacion DESC 
        LIMIT 1;
    `;
    db.query(query, [idMonedaOrigen, idMonedaDestino], (err, results) => {
        if (err) {
            return callback(err);
        }
        callback(null, results[0]); // Devuelve la tasa o undefined
    });
};

/**
 * Obtener el ID de una moneda por su código (ej. 'USD', 'CLP').
 * Esto es útil para no hardcodear IDs en el código.
 */
exports.obtenerIdMonedaPorCodigo = (codigoMoneda, callback) => {
    const query = 'SELECT id_moneda FROM moneda WHERE codigo = ?';
    db.query(query, [codigoMoneda.toUpperCase()], (err, results) => {
        if (err) {
            return callback(err);
        }
        if (results.length > 0) {
            callback(null, results[0].id_moneda);
        } else {
            callback(new Error(`Moneda con código ${codigoMoneda} no encontrada.`));
        }
    });
};

// Podrías añadir más funciones CRUD si necesitas administrar completamente las tasas desde la API.
// Por ejemplo, listar todas las tasas guardadas.
exports.listarTodasLasTasasGuardadas = (callback) => {
    const query = `
        SELECT 
            tc.id_tasa,
            mo.codigo AS moneda_origen_codigo,
            mo.nombre AS moneda_origen_nombre,
            md.codigo AS moneda_destino_codigo,
            md.nombre AS moneda_destino_nombre,
            tc.tasa,
            tc.fecha_actualizacion
        FROM tasa_cambio tc
        JOIN moneda mo ON tc.id_moneda_origen = mo.id_moneda
        JOIN moneda md ON tc.id_moneda_destino = md.id_moneda
        ORDER BY tc.fecha_actualizacion DESC;
    `;
    db.query(query, callback);
};