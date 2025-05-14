// models/promocionModel.js
const db = require('../config/db');

// Crear una nueva promoción y sus asociaciones
exports.crearPromocion = (datosPromocion, callback) => {
    const {
        nombre, descripcion, fecha_inicio, fecha_fin, porcentaje_descuento,
        descuento_fijo, cantidad_minima_productos, monto_minimo_compra,
        codigo_promocion, limitado_productos, limitado_categorias, activa,
        productos_ids, // Array de IDs de productos
        categorias_ids // Array de IDs de categorías
    } = datosPromocion;

    db.beginTransaction(err => {
        if (err) { return callback(err); }

        const queryPromocion = `INSERT INTO promocion (nombre, descripcion, fecha_inicio, fecha_fin, porcentaje_descuento, descuento_fijo, cantidad_minima_productos, monto_minimo_compra, codigo_promocion, limitado_productos, limitado_categorias, activa)
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        db.query(queryPromocion, [
            nombre, descripcion, fecha_inicio, fecha_fin, porcentaje_descuento,
            descuento_fijo, cantidad_minima_productos, monto_minimo_compra,
            codigo_promocion, limitado_productos || false, limitado_categorias || false, activa === undefined ? true : activa
        ], (err, resultPromocion) => {
            if (err) {
                return db.rollback(() => { callback(err); });
            }

            const idPromocionCreada = resultPromocion.insertId;
            const promesasAsociaciones = [];

            // Asociar productos si se proporcionan IDs
            if (limitado_productos && productos_ids && productos_ids.length > 0) {
                const queryProductoPromocion = 'INSERT INTO producto_promocion (id_promocion, id_producto) VALUES ?';
                const valuesProductoPromocion = productos_ids.map(id_producto => [idPromocionCreada, id_producto]);
                promesasAsociaciones.push(new Promise((resolve, reject) => {
                    db.query(queryProductoPromocion, [valuesProductoPromocion], (errProd) => {
                        if (errProd) { return reject(errProd); }
                        resolve();
                    });
                }));
            }

            // Asociar categorías si se proporcionan IDs
            if (limitado_categorias && categorias_ids && categorias_ids.length > 0) {
                const queryCategoriaPromocion = 'INSERT INTO categoria_promocion (id_promocion, id_categoria) VALUES ?';
                const valuesCategoriaPromocion = categorias_ids.map(id_categoria => [idPromocionCreada, id_categoria]);
                promesasAsociaciones.push(new Promise((resolve, reject) => {
                    db.query(queryCategoriaPromocion, [valuesCategoriaPromocion], (errCat) => {
                        if (errCat) { return reject(errCat); }
                        resolve();
                    });
                }));
            }

            Promise.all(promesasAsociaciones)
                .then(() => {
                    db.commit(commitErr => {
                        if (commitErr) { return db.rollback(() => { callback(commitErr); }); }
                        callback(null, idPromocionCreada);
                    });
                })
                .catch(errorAsociacion => {
                    db.rollback(() => { callback(errorAsociacion); });
                });
        });
    });
};

// Obtener todas las promociones
exports.obtenerTodasLasPromociones = (callback) => {
    const query = 'SELECT * FROM promocion ORDER BY fecha_inicio DESC';
    db.query(query, callback);
};

// Obtener una promoción por su ID con sus productos y categorías asociadas
exports.obtenerPromocionPorId = (id_promocion, callback) => {
    let promocionData = {};
    const queryPromocion = 'SELECT * FROM promocion WHERE id_promocion = ?';

    db.query(queryPromocion, [id_promocion], (err, resultsPromocion) => {
        if (err) { return callback(err); }
        if (resultsPromocion.length === 0) { return callback(null, null); }

        promocionData = resultsPromocion[0];

        const promesasDetalles = [];

        // Obtener productos asociados
        promesasDetalles.push(new Promise((resolve, reject) => {
            const queryProductos = `
                SELECT p.id_producto, p.nombre, p.codigo_producto 
                FROM producto_promocion pp
                JOIN producto p ON pp.id_producto = p.id_producto
                WHERE pp.id_promocion = ?`;
            db.query(queryProductos, [id_promocion], (errProd, productos) => {
                if (errProd) { return reject(errProd); }
                promocionData.productos_asociados = productos;
                resolve();
            });
        }));

        // Obtener categorías asociadas
        promesasDetalles.push(new Promise((resolve, reject) => {
            const queryCategorias = `
                SELECT cp.id_categoria, cp.nombre 
                FROM categoria_promocion catp
                JOIN categoria_producto cp ON catp.id_categoria = cp.id_categoria
                WHERE catp.id_promocion = ?`;
            db.query(queryCategorias, [id_promocion], (errCat, categorias) => {
                if (errCat) { return reject(errCat); }
                promocionData.categorias_asociadas = categorias;
                resolve();
            });
        }));

        Promise.all(promesasDetalles)
            .then(() => callback(null, promocionData))
            .catch(errorDetalles => callback(errorDetalles));
    });
};

// Actualizar una promoción y sus asociaciones
exports.actualizarPromocion = (id_promocion, datosPromocion, callback) => {
    const {
        nombre, descripcion, fecha_inicio, fecha_fin, porcentaje_descuento,
        descuento_fijo, cantidad_minima_productos, monto_minimo_compra,
        codigo_promocion, limitado_productos, limitado_categorias, activa,
        productos_ids, // Array de IDs de productos
        categorias_ids // Array de IDs de categorías
    } = datosPromocion;

    db.beginTransaction(err => {
        if (err) { return callback(err); }

        // 1. Actualizar la tabla promocion
        let fieldsToUpdate = [];
        let valuesPromocion = [];

        if (nombre !== undefined) { fieldsToUpdate.push('nombre = ?'); valuesPromocion.push(nombre); }
        if (descripcion !== undefined) { fieldsToUpdate.push('descripcion = ?'); valuesPromocion.push(descripcion); }
        if (fecha_inicio !== undefined) { fieldsToUpdate.push('fecha_inicio = ?'); valuesPromocion.push(fecha_inicio); }
        if (fecha_fin !== undefined) { fieldsToUpdate.push('fecha_fin = ?'); valuesPromocion.push(fecha_fin); }
        if (porcentaje_descuento !== undefined) { fieldsToUpdate.push('porcentaje_descuento = ?'); valuesPromocion.push(porcentaje_descuento); }
        if (descuento_fijo !== undefined) { fieldsToUpdate.push('descuento_fijo = ?'); valuesPromocion.push(descuento_fijo); }
        if (cantidad_minima_productos !== undefined) { fieldsToUpdate.push('cantidad_minima_productos = ?'); valuesPromocion.push(cantidad_minima_productos); }
        if (monto_minimo_compra !== undefined) { fieldsToUpdate.push('monto_minimo_compra = ?'); valuesPromocion.push(monto_minimo_compra); }
        if (codigo_promocion !== undefined) { fieldsToUpdate.push('codigo_promocion = ?'); valuesPromocion.push(codigo_promocion); }
        if (limitado_productos !== undefined) { fieldsToUpdate.push('limitado_productos = ?'); valuesPromocion.push(limitado_productos); }
        if (limitado_categorias !== undefined) { fieldsToUpdate.push('limitado_categorias = ?'); valuesPromocion.push(limitado_categorias); }
        if (activa !== undefined) { fieldsToUpdate.push('activa = ?'); valuesPromocion.push(activa); }

        if (fieldsToUpdate.length === 0 && productos_ids === undefined && categorias_ids === undefined) {
            db.rollback(); // No es estrictamente necesario si no se hizo nada, pero buena práctica.
            return callback(null, { affectedRows: 0, message: "No hay campos válidos para actualizar o asociaciones para modificar." });
        }
        
        const queryUpdatePromocion = `UPDATE promocion SET ${fieldsToUpdate.join(', ')} WHERE id_promocion = ?`;
        valuesPromocion.push(id_promocion);

        db.query(queryUpdatePromocion, valuesPromocion, (errUpdate, resultUpdate) => {
            if (errUpdate) { return db.rollback(() => { callback(errUpdate); }); }

            const promesasAsociaciones = [];

            // 2. Actualizar asociaciones de productos (borrar antiguas, insertar nuevas)
            if (productos_ids !== undefined) { // Si se pasa productos_ids (incluso vacío para desasociar todo)
                promesasAsociaciones.push(new Promise((resolve, reject) => {
                    db.query('DELETE FROM producto_promocion WHERE id_promocion = ?', [id_promocion], (errDeleteProd) => {
                        if (errDeleteProd) { return reject(errDeleteProd); }
                        if (limitado_productos && productos_ids.length > 0) {
                            const queryInsertProd = 'INSERT INTO producto_promocion (id_promocion, id_producto) VALUES ?';
                            const valuesProd = productos_ids.map(id_prod => [id_promocion, id_prod]);
                            db.query(queryInsertProd, [valuesProd], (errInsertProd) => {
                                if (errInsertProd) { return reject(errInsertProd); }
                                resolve();
                            });
                        } else {
                            resolve();
                        }
                    });
                }));
            }
            
            // 3. Actualizar asociaciones de categorías (borrar antiguas, insertar nuevas)
            if (categorias_ids !== undefined) { // Si se pasa categorias_ids (incluso vacío)
                 promesasAsociaciones.push(new Promise((resolve, reject) => {
                    db.query('DELETE FROM categoria_promocion WHERE id_promocion = ?', [id_promocion], (errDeleteCat) => {
                        if (errDeleteCat) { return reject(errDeleteCat); }
                        if (limitado_categorias && categorias_ids.length > 0) {
                            const queryInsertCat = 'INSERT INTO categoria_promocion (id_promocion, id_categoria) VALUES ?';
                            const valuesCat = categorias_ids.map(id_cat => [id_promocion, id_cat]);
                            db.query(queryInsertCat, [valuesCat], (errInsertCat) => {
                                if (errInsertCat) { return reject(errInsertCat); }
                                resolve();
                            });
                        } else {
                            resolve();
                        }
                    });
                }));
            }

            Promise.all(promesasAsociaciones)
                .then(() => {
                    db.commit(commitErr => {
                        if (commitErr) { return db.rollback(() => { callback(commitErr); }); }
                        callback(null, resultUpdate); // Devuelve el resultado de la actualización de la tabla 'promocion'
                    });
                })
                .catch(errorAsociacion => {
                    db.rollback(() => { callback(errorAsociacion); });
                });
        });
    });
};

// Eliminar una promoción y sus asociaciones
exports.eliminarPromocion = (id_promocion, callback) => {
    db.beginTransaction(err => {
        if (err) { return callback(err); }

        // Las FK en producto_promocion y categoria_promocion tienen ON DELETE CASCADE,
        // por lo que al eliminar la promoción, se deberían borrar automáticamente las asociaciones.
        // Si no tuvieran ON DELETE CASCADE, necesitarías borrarlas explícitamente primero:
        // 1. Eliminar de producto_promocion
        // 2. Eliminar de categoria_promocion
        // 3. Eliminar de promocion

        const query = 'DELETE FROM promocion WHERE id_promocion = ?';
        db.query(query, [id_promocion], (err, result) => {
            if (err) {
                return db.rollback(() => { callback(err); });
            }
            db.commit(commitErr => {
                if (commitErr) { return db.rollback(() => { callback(commitErr); }); }
                callback(null, result);
            });
        });
    });
};