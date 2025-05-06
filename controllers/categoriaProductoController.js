// controllers/categoriaProductoController.js
const CategoriaProductoModel = require('../models/categoriaProductoModel');

// Crear una nueva categoría
exports.crear = (req, res) => {
    const datosNuevaCategoria = req.body;
    if (!datosNuevaCategoria.nombre) {
        return res.status(400).json({ error: 'El nombre de la categoría es requerido.' });
    }
    // Validar que categoria_padre (si se envía) sea un ID numérico o null
    if (datosNuevaCategoria.categoria_padre !== undefined && datosNuevaCategoria.categoria_padre !== null && isNaN(parseInt(datosNuevaCategoria.categoria_padre))) {
        return res.status(400).json({ error: 'categoria_padre debe ser un ID numérico o null.' });
    }


    CategoriaProductoModel.crearCategoria(datosNuevaCategoria, (err, insertId) => {
        if (err) {
            console.error("Error al crear categoría:", err);
             if (err.code === 'ER_NO_REFERENCED_ROW_2' && err.sqlMessage.includes('categoria_padre')) {
                return res.status(400).json({ error: 'La categoría padre especificada no existe.' });
            }
            return res.status(500).json({ error: 'Error interno al crear la categoría' });
        }
        CategoriaProductoModel.obtenerCategoriaPorId(insertId, (err, nuevaCategoria) => {
            if(err || !nuevaCategoria) {
                return res.status(201).json({ message: 'Categoría creada exitosamente pero no se pudo recuperar', id_categoria: insertId });
            }
            res.status(201).json({ message: 'Categoría creada exitosamente', categoria: nuevaCategoria });
        });
    });
};

// Obtener todas las categorías
exports.obtenerTodos = (req, res) => {
    CategoriaProductoModel.obtenerTodasLasCategorias((err, categorias) => {
        if (err) {
            console.error("Error al obtener categorías:", err);
            return res.status(500).json({ error: 'Error interno al obtener las categorías' });
        }
        res.status(200).json(categorias);
    });
};

// Obtener una categoría por su ID
exports.obtenerPorId = (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'ID de categoría inválido.' });
    }
    CategoriaProductoModel.obtenerCategoriaPorId(id, (err, categoria) => {
        if (err) {
            console.error(`Error al obtener categoría con ID ${id}:`, err);
            return res.status(500).json({ error: 'Error interno al obtener la categoría' });
        }
        if (!categoria) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }
        res.status(200).json(categoria);
    });
};

// Actualizar una categoría
exports.actualizar = (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'ID de categoría inválido.' });
    }
    const datosCategoria = req.body;
    if (Object.keys(datosCategoria).length === 0) {
        return res.status(400).json({ error: 'No se proporcionaron datos para actualizar.' });
    }
    if (datosCategoria.categoria_padre !== undefined && datosCategoria.categoria_padre !== null && isNaN(parseInt(datosCategoria.categoria_padre))) {
        return res.status(400).json({ error: 'categoria_padre debe ser un ID numérico o null.' });
    }
    // Evitar que una categoría se ponga a sí misma como padre
    if (datosCategoria.categoria_padre !== undefined && datosCategoria.categoria_padre !== null && parseInt(datosCategoria.categoria_padre) === id) {
        return res.status(400).json({ error: 'Una categoría no puede ser su propia categoría padre.' });
    }


    CategoriaProductoModel.actualizarCategoria(id, datosCategoria, (err, result) => {
        if (err) {
            console.error(`Error al actualizar categoría con ID ${id}:`, err);
            if (err.code === 'ER_NO_REFERENCED_ROW_2' && err.sqlMessage.includes('categoria_padre')) {
                return res.status(400).json({ error: 'La categoría padre especificada no existe.' });
            }
            // Podría haber un error si se intenta crear una dependencia circular, MySQL podría detectarlo (ER_CANNOT_ADD_FOREIGN)
            // o necesitaríamos lógica adicional para prevenir ciclos si la BD no lo hace automáticamente.
            return res.status(500).json({ error: 'Error interno al actualizar la categoría' });
        }
        if (result.affectedRows === 0 && (!result.message || !result.message.includes("No hay campos válidos para actualizar"))) {
            return res.status(404).json({ error: 'Categoría no encontrada para actualizar' });
        }
        if (result.message && result.message.includes("No hay campos válidos para actualizar")){
             return res.status(200).json({ message: 'No se realizaron cambios, no se proporcionaron campos válidos para actualizar o los valores eran los mismos.' });
        }
        CategoriaProductoModel.obtenerCategoriaPorId(id, (err, categoriaActualizada) => {
            if(err || !categoriaActualizada){
                 return res.status(200).json({ message: 'Categoría actualizada exitosamente pero no se pudo recuperar.' });
            }
            res.status(200).json({ message: 'Categoría actualizada exitosamente', categoria: categoriaActualizada });
        });
    });
};

// Eliminar una categoría
exports.eliminar = (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'ID de categoría inválido.' });
    }

    CategoriaProductoModel.obtenerCategoriaPorId(id, (err, categoria) => {
        if (err) {
            return res.status(500).json({ error: 'Error verificando categoría antes de eliminar' });
        }
        if (!categoria) {
            return res.status(404).json({ error: 'Categoría no encontrada para eliminar' });
        }
        CategoriaProductoModel.eliminarCategoria(id, (err, result) => {
            if (err) {
                console.error(`Error al eliminar categoría con ID ${id}:`, err);
                if (err.code === 'ER_ROW_IS_REFERENCED_2') { // Si la categoría está siendo usada por productos o como padre de otras
                    return res.status(409).json({ error: 'Conflicto: La categoría no se puede eliminar porque está referenciada por productos u otras categorías.' });
                }
                return res.status(500).json({ error: 'Error interno al eliminar la categoría' });
            }
            res.status(200).json({ message: 'Categoría eliminada exitosamente' });
        });
    });
};