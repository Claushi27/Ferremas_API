// controllers/clienteController.js
const ClienteModel = require('../models/clienteModel');
const UsuarioModel = require('../models/usuarioModel'); // Para verificar si un id_usuario existe

// Crear un nuevo cliente
exports.crear = async (req, res) => { // Convertido a async para verificar id_usuario
    const datosNuevoCliente = req.body;
    // Validaciones básicas
    if (!datosNuevoCliente.nombre_completo || !datosNuevoCliente.direccion || !datosNuevoCliente.telefono) {
        return res.status(400).json({ error: 'Nombre completo, dirección y teléfono del cliente son requeridos.' });
    }
    if (datosNuevoCliente.fecha_nacimiento && isNaN(Date.parse(datosNuevoCliente.fecha_nacimiento))) {
        return res.status(400).json({ error: 'Formato de fecha_nacimiento inválido. Usar YYYY-MM-DD.' });
    }

    // Opcional: Verificar si el id_usuario existe, si se proporciona
    if (datosNuevoCliente.id_usuario) {
        if (isNaN(parseInt(datosNuevoCliente.id_usuario))) {
             return res.status(400).json({ error: 'id_usuario debe ser un número.' });
        }
        try {
            const usuarioExiste = await new Promise((resolve, reject) => {
                UsuarioModel.obtenerUsuarioPorId(datosNuevoCliente.id_usuario, (err, usuario) => {
                    if (err) return reject(err);
                    resolve(usuario);
                });
            });
            if (!usuarioExiste) {
                return res.status(400).json({ error: `El usuario con id_usuario ${datosNuevoCliente.id_usuario} no existe.` });
            }
        } catch (error) {
            console.error("Error verificando id_usuario:", error);
            return res.status(500).json({ error: 'Error interno al verificar el usuario asociado.' });
        }
    }


    ClienteModel.crearCliente(datosNuevoCliente, (err, insertId) => {
        if (err) {
            console.error("Error al crear cliente:", err);
            if (err.code === 'ER_DUP_ENTRY') {
                if (err.sqlMessage.includes('id_usuario')) {
                    return res.status(409).json({ error: 'Este id_usuario ya está asociado a otro cliente.' });
                }
                if (err.sqlMessage.includes('rut')) {
                    return res.status(409).json({ error: 'El RUT proporcionado ya está registrado.' });
                }
            }
            if (err.code === 'ER_NO_REFERENCED_ROW_2' && err.sqlMessage.includes('id_usuario')) {
                 return res.status(400).json({ error: 'El id_usuario proporcionado no existe.' });
            }
            return res.status(500).json({ error: 'Error interno al crear el cliente.' });
        }
        ClienteModel.obtenerClientePorId(insertId, (err, nuevoCliente) => {
            if (err || !nuevoCliente) {
                return res.status(201).json({ message: 'Cliente creado exitosamente pero no se pudo recuperar', id_cliente: insertId });
            }
            res.status(201).json({ message: 'Cliente creado exitosamente', cliente: nuevoCliente });
        });
    });
};

// Obtener todos los clientes
exports.obtenerTodos = (req, res) => {
    ClienteModel.obtenerTodosLosClientes((err, clientes) => {
        if (err) {
            console.error("Error al obtener clientes:", err);
            return res.status(500).json({ error: 'Error interno al obtener los clientes.' });
        }
        res.status(200).json(clientes);
    });
};

// Obtener un cliente por su ID
exports.obtenerPorId = (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'ID de cliente inválido.' });
    }
    ClienteModel.obtenerClientePorId(id, (err, cliente) => {
        if (err) {
            console.error(`Error al obtener cliente con ID ${id}:`, err);
            return res.status(500).json({ error: 'Error interno al obtener el cliente.' });
        }
        if (!cliente) {
            return res.status(404).json({ error: 'Cliente no encontrado.' });
        }
        res.status(200).json(cliente);
    });
};

// Actualizar un cliente
exports.actualizar = async (req, res) => { // Convertido a async para verificar id_usuario
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'ID de cliente inválido.' });
    }
    const datosCliente = req.body;
    if (Object.keys(datosCliente).length === 0) {
        return res.status(400).json({ error: 'No se proporcionaron datos para actualizar.' });
    }
     if (datosCliente.fecha_nacimiento && isNaN(Date.parse(datosCliente.fecha_nacimiento))) {
        return res.status(400).json({ error: 'Formato de fecha_nacimiento inválido. Usar YYYY-MM-DD.' });
    }

    // Opcional: Verificar si el id_usuario existe, si se proporciona para actualizar
    if (datosCliente.id_usuario) {
         if (isNaN(parseInt(datosCliente.id_usuario))) {
             return res.status(400).json({ error: 'id_usuario debe ser un número.' });
        }
        try {
            const usuarioExiste = await new Promise((resolve, reject) => {
                UsuarioModel.obtenerUsuarioPorId(datosCliente.id_usuario, (err, usuario) => {
                    if (err) return reject(err);
                    resolve(usuario);
                });
            });
            if (!usuarioExiste) {
                return res.status(400).json({ error: `El usuario con id_usuario ${datosCliente.id_usuario} no existe.` });
            }
        } catch (error) {
            console.error("Error verificando id_usuario al actualizar:", error);
            return res.status(500).json({ error: 'Error interno al verificar el usuario asociado para la actualización.' });
        }
    }


    ClienteModel.actualizarCliente(id, datosCliente, (err, result) => {
        if (err) {
            console.error(`Error al actualizar cliente con ID ${id}:`, err);
             if (err.code === 'ER_DUP_ENTRY') {
                if (err.sqlMessage.includes('id_usuario')) {
                    return res.status(409).json({ error: 'Este id_usuario ya está asociado a otro cliente.' });
                }
                if (err.sqlMessage.includes('rut')) {
                    return res.status(409).json({ error: 'El RUT proporcionado ya está registrado para otro cliente.' });
                }
            }
            if (err.code === 'ER_NO_REFERENCED_ROW_2' && err.sqlMessage.includes('id_usuario')) {
                 return res.status(400).json({ error: 'El id_usuario proporcionado para la actualización no existe.' });
            }
            return res.status(500).json({ error: 'Error interno al actualizar el cliente.' });
        }
        if (result.affectedRows === 0 && (!result.message || !result.message.includes("No hay campos válidos para actualizar"))) {
            return res.status(404).json({ error: 'Cliente no encontrado para actualizar.' });
        }
        if (result.message && result.message.includes("No hay campos válidos para actualizar")) {
            return res.status(200).json({ message: 'No se realizaron cambios, no se proporcionaron campos válidos para actualizar o los valores eran los mismos.' });
        }
        ClienteModel.obtenerClientePorId(id, (err, clienteActualizado) => {
            if(err || !clienteActualizado){
                return res.status(200).json({ message: 'Cliente actualizado exitosamente pero no se pudo recuperar.' });
            }
            res.status(200).json({ message: 'Cliente actualizado exitosamente', cliente: clienteActualizado });
        });
    });
};

// Eliminar un cliente
exports.eliminar = (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'ID de cliente inválido.' });
    }
    ClienteModel.obtenerClientePorId(id, (err, cliente) => {
        if (err) return res.status(500).json({ error: 'Error verificando cliente antes de eliminar.' });
        if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado para eliminar.' });

        ClienteModel.eliminarCliente(id, (err, result) => {
            if (err) {
                console.error(`Error al eliminar cliente con ID ${id}:`, err);
                if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                    return res.status(409).json({ error: 'Conflicto: El cliente no se puede eliminar porque tiene pedidos asociados u otras referencias.' });
                }
                return res.status(500).json({ error: 'Error interno al eliminar el cliente.' });
            }
            res.status(200).json({ message: 'Cliente eliminado exitosamente.' });
        });
    });
};