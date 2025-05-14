// controllers/productoController.js
const ProductoModel = require('../models/productoModel');

// --- Funciones CRUD existentes (se mantienen por si se usan internamente) ---

// Crear un nuevo producto
exports.crear = (req, res) => {
    const datosNuevoProducto = req.body;
    if (!datosNuevoProducto.nombre || !datosNuevoProducto.precio || !datosNuevoProducto.codigo_producto || !datosNuevoProducto.id_categoria) {
        return res.status(400).json({ error: 'Nombre, precio, código de producto y ID de categoría son requeridos.' });
    }

    ProductoModel.crearProducto(datosNuevoProducto, (err, insertId) => {
        if (err) {
            console.error("Error al crear producto:", err);
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: 'El código de producto ya existe.' });
            }
            if (err.code === 'ER_NO_REFERENCED_ROW_2' && err.sqlMessage.includes('id_categoria')) {
                return res.status(400).json({ error: 'El ID de categoría proporcionado no existe.' });
            }
            return res.status(500).json({ error: 'Error interno al crear el producto' });
        }
        ProductoModel.obtenerProductoPorId(insertId, (err, nuevoProducto) => {
            if(err || !nuevoProducto){
                return res.status(201).json({ message: 'Producto creado exitosamente pero no se pudo recuperar', id_producto: insertId });
            }
            res.status(201).json({ message: 'Producto creado exitosamente', producto: nuevoProducto });
        });
    });
};

// Obtener todos los productos (versión original)
exports.obtenerTodos = (req, res) => {
    ProductoModel.obtenerTodosLosProductos((err, productos) => {
        if (err) {
            console.error("Error al obtener productos:", err);
            return res.status(500).json({ error: 'Error interno al obtener los productos' });
        }
        res.status(200).json(productos);
    });
};

// Obtener un producto por su ID (versión original)
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
                if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                    return res.status(409).json({ error: 'Conflicto: El producto no se puede eliminar porque está referenciado en otras tablas (ej. inventario, pedidos).' });
                }
                return res.status(500).json({ error: 'Error interno al eliminar el producto' });
            }
            res.status(200).json({ message: 'Producto eliminado exitosamente' });
        });
    });
};


// --- FUNCIONES PARA API N°2 (Consulta de Productos según Anexo) ---

/**
 * Formatea un producto de la base de datos al formato especificado en el anexo.
 * @param {object} productoDeLaDB - El objeto producto obtenido del modelo.
 * @returns {object} El producto formateado.
 */
const formatearProductoParaAnexo = (productoDeLaDB) => {
    if (!productoDeLaDB) {
        return null;
    }

    // Formatear el precio como un array con un solo objeto (precio actual)
    const precioFormateado = [{
        Fecha: new Date().toISOString(), // O puedes usar productoDeLaDB.fecha_creacion o alguna fecha de actualización si es más relevante
        Valor: parseFloat(productoDeLaDB.precio) // Asegurarse que sea un número
    }];

    return {
        "id_interno_db": productoDeLaDB.id_producto, // Opcional: para referencia interna, no está en el anexo
        "Código del producto": productoDeLaDB.codigo_producto,
        "Marca": productoDeLaDB.marca,
        "Código": productoDeLaDB.codigo_producto, // Anexo muestra "Código" además de "Código del producto". Asumimos que es el mismo.
        "Nombre": productoDeLaDB.nombre,
        "Precio": precioFormateado,
        "Stock": parseInt(productoDeLaDB.stock_total, 10) || 0, // Asegurarse que sea un número
        // Campos adicionales que podrías querer incluir si son útiles (no están en el anexo explícitamente):
        // "Descripción": productoDeLaDB.descripcion,
        // "Categoría": productoDeLaDB.nombre_categoria,
        // "Es Promoción": productoDeLaDB.es_promocion,
        // "Es Nuevo": productoDeLaDB.es_nuevo,
        // "Imagen URL": productoDeLaDB.imagen_url
    };
};

/**
 * Obtener todos los productos formateados según el anexo (incluye stock).
 * Estos serían los endpoints que la API de consulta externa/interna de FERREMAS consumiría.
 */
exports.obtenerTodosParaAnexo = (req, res) => {
    ProductoModel.obtenerTodosLosProductosConStock((err, productos) => {
        if (err) {
            console.error("Error al obtener productos para anexo:", err);
            return res.status(500).json({ error: 'Error interno al obtener los productos para el anexo.' });
        }
        const productosFormateados = productos.map(formatearProductoParaAnexo);
        res.status(200).json(productosFormateados);
    });
};

/**
 * Obtener un producto por su ID formateado según el anexo (incluye stock).
 */
exports.obtenerPorIdParaAnexo = (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'ID de producto inválido.' });
    }
    ProductoModel.obtenerProductoPorIdConStock(id, (err, producto) => {
        if (err) {
            console.error(`Error al obtener producto con ID ${id} para anexo:`, err);
            return res.status(500).json({ error: 'Error interno al obtener el producto para el anexo.' });
        }
        if (!producto) {
            return res.status(404).json({ error: 'Producto no encontrado.' });
        }
        const productoFormateado = formatearProductoParaAnexo(producto);
        res.status(200).json(productoFormateado);
    });
};