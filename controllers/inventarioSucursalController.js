// controllers/inventarioSucursalController.js
const InventarioModel = require('../models/inventarioSucursalModel');

// Registrar nuevo stock para un producto en una sucursal (POST)
exports.registrarStock = (req, res) => {
    const datosInventario = req.body;
    // Validaciones
    if (datosInventario.id_producto === undefined || datosInventario.id_sucursal === undefined || datosInventario.stock === undefined) {
        return res.status(400).json({ error: 'id_producto, id_sucursal y stock son requeridos.' });
    }
    if (isNaN(parseInt(datosInventario.id_producto)) || isNaN(parseInt(datosInventario.id_sucursal)) || isNaN(parseInt(datosInventario.stock))) {
        return res.status(400).json({ error: 'id_producto, id_sucursal y stock deben ser números.' });
    }
    if (datosInventario.ultimo_reabastecimiento && isNaN(Date.parse(datosInventario.ultimo_reabastecimiento))) {
        return res.status(400).json({ error: 'Formato de fecha para ultimo_reabastecimiento inválido. Usar YYYY-MM-DD.' });
    }


    InventarioModel.registrarOActualizarStock(datosInventario, (err, result) => {
        if (err) {
            console.error("Error al registrar stock:", err);
            if (err.code === 'ER_DUP_ENTRY') { // Si tienes la constraint UNIQUE (id_producto, id_sucursal)
                return res.status(409).json({ error: 'Ya existe una entrada de inventario para este producto en esta sucursal. Use PUT para actualizar.' });
            }
            if (err.code === 'ER_NO_REFERENCED_ROW_2') {
                return res.status(400).json({ error: 'El id_producto o id_sucursal proporcionado no existe.' });
            }
            return res.status(500).json({ error: 'Error interno al registrar el stock.' });
        }
        // Devolver la entrada de inventario creada/actualizada
        // Si fue un INSERT, result.insertId tendrá el ID. Si fue ON DUPLICATE KEY UPDATE, no siempre.
        // Una mejor forma es hacer un SELECT después, o si la PK es (id_producto, id_sucursal), usarlos.
        // Por simplicidad, devolvemos un mensaje general o el resultado.
        // Si tienes id_inventario autoincremental, y fue un INSERT, result.insertId es el id_inventario.
        if (result.insertId) {
             InventarioModel.obtenerInventarioPorId(result.insertId, (err, inventario) => {
                if (err || !inventario) return res.status(201).json({ message: 'Stock registrado exitosamente.', details: result });
                return res.status(201).json({ message: 'Stock registrado exitosamente.', inventario: inventario });
            });
        } else { // Podría ser un UPDATE a través de ON DUPLICATE KEY
            InventarioModel.obtenerStockProductoEnSucursal(datosInventario.id_producto, datosInventario.id_sucursal, (err, inventario) => {
                if (err || !inventario) return res.status(200).json({ message: 'Stock actualizado (o ya existía con mismos valores).', details: result });
                return res.status(200).json({ message: 'Stock actualizado (o ya existía con mismos valores).', inventario: inventario });
            });
        }
    });
};

// Obtener todo el inventario
exports.obtenerTodos = (req, res) => {
    // Opcional: permitir filtros por query params, ej. /api/inventario?id_sucursal=1&id_producto=5
    const { id_sucursal, id_producto } = req.query;

    if (id_sucursal && id_producto) {
        if (isNaN(parseInt(id_producto)) || isNaN(parseInt(id_sucursal))) {
             return res.status(400).json({ error: 'id_producto y id_sucursal deben ser números.' });
        }
        InventarioModel.obtenerStockProductoEnSucursal(id_producto, id_sucursal, (err, inventario) => {
            if (err) return res.status(500).json({ error: 'Error obteniendo stock específico.' });
            if (!inventario) return res.status(404).json({ message: 'No se encontró stock para el producto y sucursal especificados.' });
            res.status(200).json(inventario);
        });
    } else { // Aquí podrías añadir filtros por solo sucursal o solo producto si lo deseas
        InventarioModel.obtenerTodoElInventario((err, inventarios) => {
            if (err) {
                console.error("Error al obtener inventario:", err);
                return res.status(500).json({ error: 'Error interno al obtener el inventario.' });
            }
            res.status(200).json(inventarios);
        });
    }
};

// Obtener una entrada de inventario por su ID (id_inventario)
exports.obtenerPorId = (req, res) => {
    const id = parseInt(req.params.id); // Este es id_inventario
    if (isNaN(id)) {
        return res.status(400).json({ error: 'ID de inventario inválido.' });
    }
    InventarioModel.obtenerInventarioPorId(id, (err, inventario) => {
        if (err) {
            console.error(`Error al obtener inventario con ID ${id}:`, err);
            return res.status(500).json({ error: 'Error interno al obtener la entrada de inventario.' });
        }
        if (!inventario) {
            return res.status(404).json({ error: 'Entrada de inventario no encontrada.' });
        }
        res.status(200).json(inventario);
    });
};

// Actualizar stock por ID de la entrada de inventario (id_inventario)
exports.actualizar = (req, res) => {
    const id_inventario = parseInt(req.params.id); // Este es id_inventario
     if (isNaN(id_inventario)) {
        return res.status(400).json({ error: 'ID de inventario inválido.' });
    }
    const datosInventario = req.body;
    if (Object.keys(datosInventario).length === 0) {
        return res.status(400).json({ error: 'No se proporcionaron datos para actualizar.' });
    }
     if (datosInventario.ultimo_reabastecimiento && isNaN(Date.parse(datosInventario.ultimo_reabastecimiento))) {
        return res.status(400).json({ error: 'Formato de fecha para ultimo_reabastecimiento inválido. Usar YYYY-MM-DD.' });
    }

    InventarioModel.actualizarStockPorIdInventario(id_inventario, datosInventario, (err, result) => {
        if (err) {
            console.error(`Error al actualizar inventario con ID ${id_inventario}:`, err);
            return res.status(500).json({ error: 'Error interno al actualizar la entrada de inventario.' });
        }
        if (result.affectedRows === 0 && (!result.message || !result.message.includes("No hay campos válidos para actualizar"))) {
            return res.status(404).json({ error: 'Entrada de inventario no encontrada para actualizar.' });
        }
         if (result.message && result.message.includes("No hay campos válidos para actualizar")) {
            return res.status(200).json({ message: 'No se realizaron cambios, no se proporcionaron campos válidos para actualizar o los valores eran los mismos.' });
        }
        InventarioModel.obtenerInventarioPorId(id_inventario, (err, inventarioActualizado) => {
            if(err || !inventarioActualizado){
                return res.status(200).json({ message: 'Stock actualizado exitosamente pero no se pudo recuperar.' });
            }
            res.status(200).json({ message: 'Stock actualizado exitosamente.', inventario: inventarioActualizado });
        });
    });
};

// Eliminar una entrada de inventario por su ID (id_inventario)
exports.eliminar = (req, res) => {
    const id_inventario = parseInt(req.params.id); // Este es id_inventario
    if (isNaN(id_inventario)) {
        return res.status(400).json({ error: 'ID de inventario inválido.' });
    }
    InventarioModel.obtenerInventarioPorId(id_inventario, (err, inventario) => {
         if (err) return res.status(500).json({ error: 'Error verificando entrada de inventario antes de eliminar.' });
         if (!inventario) return res.status(404).json({ error: 'Entrada de inventario no encontrada para eliminar.' });

        InventarioModel.eliminarInventarioPorId(id_inventario, (err, result) => {
            if (err) {
                console.error(`Error al eliminar inventario con ID ${id_inventario}:`, err);
                return res.status(500).json({ error: 'Error interno al eliminar la entrada de inventario.' });
            }
            res.status(200).json({ message: 'Entrada de inventario eliminada exitosamente.' });
        });
    });
};