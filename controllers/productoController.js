// controllers/productoController.js
const ProductoModel = require('../models/productoModel');

// Crear un nuevo producto
exports.crear = (req, res) => {
    const datosNuevoProducto = req.body;
    // Validaciones básicas (puedes expandirlas)
    if (!datosNuevoProducto.nombre || !datosNuevoProducto.precio || !datosNuevoProducto.codigo_producto || !datosNuevoProducto.id_categoria) {
        return res.status(400).json({ error: 'Nombre, precio, código de producto y ID de categoría son requeridos.' });
    }

    ProductoModel.crearProducto(datosNuevoProducto, (err, insertId) => {
        if (err) {
            console.error("Error al crear producto:", err);
            if (err.code === 'ER_DUP_ENTRY') { // Si codigo_producto es UNIQUE
                return res.status(409).json({ error: 'El código de producto ya existe.' });
            }
            if (err.code === 'ER_NO_REFERENCED_ROW_2' && err.sqlMessage.includes('id_categoria')) {
                return res.status(400).json({ error: 'El ID de categoría proporcionado no existe.' });
            }
            return res.status(500).json({ error: 'Error interno al crear el producto' });
        }
        // Devolver el producto creado
        ProductoModel.obtenerProductoPorId(insertId, (err, nuevoProducto) => {
            if(err || !nuevoProducto){
                return res.status(201).json({ message: 'Producto creado exitosamente pero no se pudo recuperar', id_producto: insertId });
            }
            res.status(201).json({ message: 'Producto creado exitosamente', producto: nuevoProducto });
        });
    });
};

// Obtener todos los productos
exports.obtenerTodos = (req, res) => {
    ProductoModel.obtenerTodosLosProductos((err, productos) => {
        if (err) {
            console.error("Error al obtener productos:", err);
            return res.status(500).json({ error: 'Error interno al obtener los productos' });
        }
        res.status(200).json(productos);
    });
};

// Obtener un producto por su ID
exports.obtenerPorId = (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'ID de producto inválido.' });
    }
    ProductoModel.obtenerProductoPorId(id, (err, producto) => {
        if (err) {
            console.error(`Error al obtener producto con ID ${id}:`, err);
            return res.status(500).json({ error: 'Error interno al obtener el producto' });
        }
        if (!producto) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.status(200).json(producto);
    });
};

// Actualizar un producto
exports.actualizar = (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'ID de producto inválido.' });
    }
    const datosProducto = req.body;
    if (Object.keys(datosProducto).length === 0) {
        return res.status(400).json({ error: 'No se proporcionaron datos para actualizar.' });
    }

    ProductoModel.actualizarProducto(id, datosProducto, (err, result) => {
        if (err) {
            console.error(`Error al actualizar producto con ID ${id}:`, err);
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: 'Conflicto: El código de producto ya existe para otro producto.' });
            }
            if (err.code === 'ER_NO_REFERENCED_ROW_2' && err.sqlMessage.includes('id_categoria')) {
                return res.status(400).json({ error: 'El ID de categoría proporcionado no existe.' });
            }
            return res.status(500).json({ error: 'Error interno al actualizar el producto' });
        }
        if (result.affectedRows === 0 && (!result.message || !result.message.includes("No hay campos válidos para actualizar"))) {
            return res.status(404).json({ error: 'Producto no encontrado para actualizar' });
        }
        if (result.message && result.message.includes("No hay campos válidos para actualizar")){
             return res.status(200).json({ message: 'No se realizaron cambios, no se proporcionaron campos válidos para actualizar o los valores eran los mismos.' });
        }
        // Devolver el producto actualizado
        ProductoModel.obtenerProductoPorId(id, (err, productoActualizado) => {
            if(err || !productoActualizado){
                return res.status(200).json({ message: 'Producto actualizado exitosamente pero no se pudo recuperar.' });
            }
            res.status(200).json({ message: 'Producto actualizado exitosamente', producto: productoActualizado });
        });
    });
};

// Eliminar un producto
exports.eliminar = (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'ID de producto inválido.' });
    }
    ProductoModel.obtenerProductoPorId(id, (err, producto) => {
        if (err) {
            return res.status(500).json({ error: 'Error verificando producto antes de eliminar' });
        }
        if (!producto) {
            return res.status(404).json({ error: 'Producto no encontrado para eliminar' });
        }
        ProductoModel.eliminarProducto(id, (err, result) => {
            if (err) {
                console.error(`Error al eliminar producto con ID ${id}:`, err);
                // Manejar errores de FK constraint si el producto está en uso (ej. en inventario, pedidos)
                if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                    return res.status(409).json({ error: 'Conflicto: El producto no se puede eliminar porque está referenciado en otras tablas (ej. inventario, pedidos).' });
                }
                return res.status(500).json({ error: 'Error interno al eliminar el producto' });
            }
            res.status(200).json({ message: 'Producto eliminado exitosamente' });
        });
    });
};