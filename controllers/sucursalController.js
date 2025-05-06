// controllers/sucursalController.js
const SucursalModel = require('../models/sucursalModel');

// Crear una nueva sucursal
exports.crear = (req, res) => {
    const datosNuevaSucursal = req.body;
    // Validaciones básicas
    if (!datosNuevaSucursal.nombre || !datosNuevaSucursal.direccion || !datosNuevaSucursal.telefono) {
        return res.status(400).json({ error: 'Nombre, dirección y teléfono de la sucursal son requeridos.' });
    }

    SucursalModel.crearSucursal(datosNuevaSucursal, (err, insertId) => {
        if (err) {
            console.error("Error al crear sucursal:", err);
            // Podría haber una constraint UNIQUE en 'nombre' o 'email' si se desea
            return res.status(500).json({ error: 'Error interno al crear la sucursal' });
        }
        SucursalModel.obtenerSucursalPorId(insertId, (err, nuevaSucursal) => {
            if (err || !nuevaSucursal) {
                return res.status(201).json({ message: 'Sucursal creada exitosamente pero no se pudo recuperar', id_sucursal: insertId });
            }
            res.status(201).json({ message: 'Sucursal creada exitosamente', sucursal: nuevaSucursal });
        });
    });
};

// Obtener todas las sucursales
exports.obtenerTodos = (req, res) => {
    SucursalModel.obtenerTodasLasSucursales((err, sucursales) => {
        if (err) {
            console.error("Error al obtener sucursales:", err);
            return res.status(500).json({ error: 'Error interno al obtener las sucursales' });
        }
        res.status(200).json(sucursales);
    });
};

// Obtener una sucursal por su ID
exports.obtenerPorId = (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'ID de sucursal inválido.' });
    }
    SucursalModel.obtenerSucursalPorId(id, (err, sucursal) => {
        if (err) {
            console.error(`Error al obtener sucursal con ID ${id}:`, err);
            return res.status(500).json({ error: 'Error interno al obtener la sucursal' });
        }
        if (!sucursal) {
            return res.status(404).json({ error: 'Sucursal no encontrada' });
        }
        res.status(200).json(sucursal);
    });
};

// Actualizar una sucursal
exports.actualizar = (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'ID de sucursal inválido.' });
    }
    const datosSucursal = req.body;
    if (Object.keys(datosSucursal).length === 0) {
        return res.status(400).json({ error: 'No se proporcionaron datos para actualizar.' });
    }

    SucursalModel.actualizarSucursal(id, datosSucursal, (err, result) => {
        if (err) {
            console.error(`Error al actualizar sucursal con ID ${id}:`, err);
            return res.status(500).json({ error: 'Error interno al actualizar la sucursal' });
        }
        if (result.affectedRows === 0 && (!result.message || !result.message.includes("No hay campos válidos para actualizar"))) {
            return res.status(404).json({ error: 'Sucursal no encontrada para actualizar' });
        }
        if (result.message && result.message.includes("No hay campos válidos para actualizar")) {
            return res.status(200).json({ message: 'No se realizaron cambios, no se proporcionaron campos válidos para actualizar o los valores eran los mismos.' });
        }
        SucursalModel.obtenerSucursalPorId(id, (err, sucursalActualizada) => {
            if (err || !sucursalActualizada) {
                return res.status(200).json({ message: 'Sucursal actualizada exitosamente pero no se pudo recuperar.' });
            }
            res.status(200).json({ message: 'Sucursal actualizada exitosamente', sucursal: sucursalActualizada });
        });
    });
};

// Eliminar una sucursal
exports.eliminar = (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'ID de sucursal inválido.' });
    }
    SucursalModel.obtenerSucursalPorId(id, (err, sucursal) => {
        if (err) {
            return res.status(500).json({ error: 'Error verificando sucursal antes de eliminar' });
        }
        if (!sucursal) {
            return res.status(404).json({ error: 'Sucursal no encontrada para eliminar' });
        }
        SucursalModel.eliminarSucursal(id, (err, result) => {
            if (err) {
                console.error(`Error al eliminar sucursal con ID ${id}:`, err);
                if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                    return res.status(409).json({ error: 'Conflicto: La sucursal no se puede eliminar porque está referenciada en otras tablas (ej. inventario, pedidos).' });
                }
                return res.status(500).json({ error: 'Error interno al eliminar la sucursal' });
            }
            res.status(200).json({ message: 'Sucursal eliminada exitosamente' });
        });
    });
};