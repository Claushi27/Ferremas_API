// controllers/promocionController.js
const PromocionModel = require('../models/promocionModel');

// Crear una nueva promoción
exports.crear = (req, res) => {
    const datosPromocion = req.body;

    // Validaciones básicas
    if (!datosPromocion.nombre || !datosPromocion.fecha_inicio || !datosPromocion.fecha_fin) {
        return res.status(400).json({ error: 'Nombre, fecha de inicio y fecha de fin son requeridos para la promoción.' });
    }
    if (new Date(datosPromocion.fecha_inicio) >= new Date(datosPromocion.fecha_fin)) {
        return res.status(400).json({ error: 'La fecha de inicio debe ser anterior a la fecha de fin.' });
    }
    if ((datosPromocion.porcentaje_descuento === undefined || datosPromocion.porcentaje_descuento === null) && 
        (datosPromocion.descuento_fijo === undefined || datosPromocion.descuento_fijo === null)) {
        return res.status(400).json({ error: 'Se debe especificar un porcentaje_descuento o un descuento_fijo.' });
    }
    if (datosPromocion.porcentaje_descuento && (isNaN(parseFloat(datosPromocion.porcentaje_descuento)) || datosPromocion.porcentaje_descuento <= 0 || datosPromocion.porcentaje_descuento > 100)) {
        return res.status(400).json({ error: 'El porcentaje de descuento debe ser un número entre 0.01 y 100.' });
    }
     if (datosPromocion.descuento_fijo && (isNaN(parseFloat(datosPromocion.descuento_fijo)) || datosPromocion.descuento_fijo <= 0)) {
        return res.status(400).json({ error: 'El descuento fijo debe ser un número positivo.' });
    }


    PromocionModel.crearPromocion(datosPromocion, (err, insertId) => {
        if (err) {
            console.error("Error al crear promoción:", err);
            if (err.code === 'ER_DUP_ENTRY' && err.sqlMessage.includes('codigo_promocion')) {
                return res.status(409).json({ error: 'El código de promoción ya existe.' });
            }
            // Podrían existir errores de FK si los productos_ids o categorias_ids no existen
            if (err.code === 'ER_NO_REFERENCED_ROW_2') {
                return res.status(400).json({ error: 'Error de referencia: uno de los productos o categorías asociadas no existe.' });
            }
            return res.status(500).json({ error: 'Error interno al crear la promoción.', detalle: err.message });
        }
        PromocionModel.obtenerPromocionPorId(insertId, (err, nuevaPromocion) => {
            if (err || !nuevaPromocion) {
                return res.status(201).json({ message: 'Promoción creada exitosamente pero no se pudo recuperar completamente.', id_promocion: insertId });
            }
            res.status(201).json({ message: 'Promoción creada exitosamente.', promocion: nuevaPromocion });
        });
    });
};

// Obtener todas las promociones
exports.obtenerTodos = (req, res) => {
    PromocionModel.obtenerTodasLasPromociones((err, promociones) => {
        if (err) {
            console.error("Error al obtener promociones:", err);
            return res.status(500).json({ error: 'Error interno al obtener las promociones.' });
        }
        res.status(200).json(promociones);
    });
};

// Obtener una promoción por su ID
exports.obtenerPorId = (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'ID de promoción inválido.' });
    }
    PromocionModel.obtenerPromocionPorId(id, (err, promocion) => {
        if (err) {
            console.error(`Error al obtener promoción con ID ${id}:`, err);
            return res.status(500).json({ error: 'Error interno al obtener la promoción.' });
        }
        if (!promocion) {
            return res.status(404).json({ error: 'Promoción no encontrada.' });
        }
        res.status(200).json(promocion);
    });
};

// Actualizar una promoción
exports.actualizar = (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'ID de promoción inválido.' });
    }
    const datosPromocion = req.body;
    if (Object.keys(datosPromocion).length === 0) {
        return res.status(400).json({ error: 'No se proporcionaron datos para actualizar.' });
    }
    // Validaciones similares a las de crear podrían ir aquí si los campos se actualizan

    PromocionModel.actualizarPromocion(id, datosPromocion, (err, result) => {
        if (err) {
            console.error(`Error al actualizar promoción con ID ${id}:`, err);
            if (err.code === 'ER_DUP_ENTRY' && err.sqlMessage.includes('codigo_promocion')) {
                return res.status(409).json({ error: 'Conflicto: El código de promoción ya existe para otra promoción.' });
            }
            if (err.code === 'ER_NO_REFERENCED_ROW_2') {
                return res.status(400).json({ error: 'Error de referencia: uno de los productos o categorías asociadas no existe.' });
            }
            return res.status(500).json({ error: 'Error interno al actualizar la promoción.', detalle: err.message });
        }
        if (result.affectedRows === 0 && (!result.message || !result.message.includes("No hay campos válidos para actualizar"))) {
            // Esto podría suceder si la promoción con ese ID no existe, O si no se actualizaron campos en la tabla principal 'promocion'
            // pero sí se intentaron modificar asociaciones. La lógica del modelo y la respuesta aquí podrían refinarse.
             PromocionModel.obtenerPromocionPorId(id, (errGet, currentPromocion) => {
                if (!currentPromocion) return res.status(404).json({ error: 'Promoción no encontrada para actualizar.' });
                 // Si la promoción existe pero no se modificaron campos principales
                 if (result.message && result.message.includes("No hay campos válidos para actualizar")){
                     return res.status(200).json({ message: 'No se realizaron cambios en los datos principales de la promoción, pero las asociaciones podrían haberse actualizado.'});
                 }
                 // Si se afectaron las asociaciones, devolvemos la promoción actualizada.
                return PromocionModel.obtenerPromocionPorId(id, (errInner, promocionActualizada) => {
                    if(errInner || !promocionActualizada) return res.status(200).json({ message: 'Promoción actualizada (posiblemente solo asociaciones) pero no se pudo recuperar completamente.' });
                    res.status(200).json({ message: 'Promoción actualizada exitosamente (posiblemente solo asociaciones).', promocion: promocionActualizada });
                });
             });
        } else {
             PromocionModel.obtenerPromocionPorId(id, (err, promocionActualizada) => {
                if (err || !promocionActualizada) {
                    return res.status(200).json({ message: 'Promoción actualizada exitosamente pero no se pudo recuperar completamente.' });
                }
                res.status(200).json({ message: 'Promoción actualizada exitosamente.', promocion: promocionActualizada });
            });
        }
    });
};

// Eliminar una promoción
exports.eliminar = (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'ID de promoción inválido.' });
    }

    PromocionModel.obtenerPromocionPorId(id, (err, promocion) => {
        if (err) {
            return res.status(500).json({ error: 'Error verificando promoción antes de eliminar.' });
        }
        if (!promocion) {
            return res.status(404).json({ error: 'Promoción no encontrada para eliminar.' });
        }
        PromocionModel.eliminarPromocion(id, (err, result) => {
            if (err) {
                console.error(`Error al eliminar promoción con ID ${id}:`, err);
                return res.status(500).json({ error: 'Error interno al eliminar la promoción.' });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Promoción no encontrada durante el intento de eliminación (raro si la verificación previa pasó).' });
            }
            res.status(200).json({ message: 'Promoción eliminada exitosamente.' });
        });
    });
};