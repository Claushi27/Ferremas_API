// controllers/consultaClienteController.js
const ConsultaClienteModel = require('../models/consultaClienteModel');
const ClienteModel = require('../models/clienteModel'); // Para validar id_cliente si se provee
const UsuarioModel = require('../models/usuarioModel'); // Para validar id_vendedor_asignado o id_usuario que responde

// Crear una nueva consulta
exports.crearConsulta = async (req, res) => {
    const { id_cliente, asunto, mensaje } = req.body;

    if (!asunto || !mensaje) {
        return res.status(400).json({ error: 'El asunto y el mensaje de la consulta son requeridos.' });
    }

    // Validación opcional del id_cliente (si se proporciona)
    if (id_cliente) {
        if (isNaN(parseInt(id_cliente))) {
            return res.status(400).json({ error: 'id_cliente debe ser un número.' });
        }
        try {
            const clienteExiste = await new Promise((resolve, reject) => {
                ClienteModel.obtenerClientePorId(id_cliente, (err, cliente) => {
                    if (err) return reject(err);
                    resolve(cliente);
                });
            });
            if (!clienteExiste) {
                return res.status(400).json({ error: `El cliente con id_cliente ${id_cliente} no existe.` });
            }
        } catch (error) {
            console.error("Error verificando id_cliente para consulta:", error);
            return res.status(500).json({ error: 'Error interno al verificar el cliente asociado a la consulta.' });
        }
    }

    const datosConsulta = { id_cliente: id_cliente || null, asunto, mensaje, estado: 'Pendiente' };

    ConsultaClienteModel.crearConsulta(datosConsulta, (err, insertId) => {
        if (err) {
            console.error("Error al crear consulta de cliente:", err);
            if (err.code === 'ER_NO_REFERENCED_ROW_2' && err.sqlMessage.includes('id_cliente')) {
                 return res.status(400).json({ error: 'El id_cliente proporcionado no existe (error de FK).' });
            }
            return res.status(500).json({ error: 'Error interno al crear la consulta.' });
        }
        ConsultaClienteModel.obtenerConsultaPorId(insertId, (err, nuevaConsulta) => {
            if (err || !nuevaConsulta) {
                return res.status(201).json({ message: 'Consulta creada exitosamente pero no se pudo recuperar.', id_consulta: insertId });
            }
            res.status(201).json({ message: 'Consulta creada exitosamente.', consulta: nuevaConsulta });
        });
    });
};

// Obtener todas las consultas (para administradores/vendedores)
exports.obtenerTodas = (req, res) => {
    ConsultaClienteModel.obtenerTodasLasConsultas((err, consultas) => {
        if (err) {
            console.error("Error al obtener todas las consultas:", err);
            return res.status(500).json({ error: 'Error interno al obtener las consultas.' });
        }
        res.status(200).json(consultas);
    });
};

// Obtener una consulta por su ID (y sus respuestas)
exports.obtenerPorIdConRespuestas = (req, res) => {
    const id_consulta = parseInt(req.params.id_consulta);
    if (isNaN(id_consulta)) {
        return res.status(400).json({ error: 'ID de consulta inválido.' });
    }

    ConsultaClienteModel.obtenerConsultaPorId(id_consulta, (err, consulta) => {
        if (err) {
            console.error(`Error al obtener consulta ${id_consulta}:`, err);
            return res.status(500).json({ error: 'Error interno al obtener la consulta.' });
        }
        if (!consulta) {
            return res.status(404).json({ error: 'Consulta no encontrada.' });
        }

        // Ahora obtener las respuestas para esta consulta
        ConsultaClienteModel.obtenerRespuestasPorConsultaId(id_consulta, (errResp, respuestas) => {
            if (errResp) {
                console.error(`Error al obtener respuestas para consulta ${id_consulta}:`, errResp);
                // Devolver la consulta de todas formas, pero con un aviso sobre las respuestas
                consulta.respuestas_error = 'Error al cargar respuestas.';
                return res.status(200).json(consulta);
            }
            consulta.respuestas = respuestas || [];
            res.status(200).json(consulta);
        });
    });
};

// Actualizar una consulta (ej. cambiar estado, asignar vendedor - para administradores/vendedores)
exports.actualizar = async (req, res) => {
    const id_consulta = parseInt(req.params.id_consulta);
    if (isNaN(id_consulta)) {
        return res.status(400).json({ error: 'ID de consulta inválido.' });
    }
    const datosActualizar = req.body;
    if (Object.keys(datosActualizar).length === 0) {
        return res.status(400).json({ error: 'No se proporcionaron datos para actualizar la consulta.' });
    }

    // Validar id_vendedor_asignado si se provee
    if (datosActualizar.hasOwnProperty('id_vendedor_asignado') && datosActualizar.id_vendedor_asignado !== null) {
        if (isNaN(parseInt(datosActualizar.id_vendedor_asignado))) {
            return res.status(400).json({ error: 'id_vendedor_asignado debe ser un número.' });
        }
        try {
            const vendedorExiste = await new Promise((resolve, reject) => {
                // Asumimos que un vendedor es un usuario con un rol específico, por ahora solo validamos que el id_usuario exista
                UsuarioModel.obtenerUsuarioPorId(datosActualizar.id_vendedor_asignado, (err, usuario) => {
                    if (err) return reject(err);
                    resolve(usuario); // Aquí podrías también verificar el rol del usuario si es necesario
                });
            });
            if (!vendedorExiste) {
                return res.status(400).json({ error: `El usuario (vendedor) con id_usuario ${datosActualizar.id_vendedor_asignado} no existe.` });
            }
        } catch (error) {
            console.error("Error verificando id_vendedor_asignado para consulta:", error);
            return res.status(500).json({ error: 'Error interno al verificar el vendedor asignado.' });
        }
    }


    ConsultaClienteModel.actualizarConsulta(id_consulta, datosActualizar, (err, result) => {
        if (err) {
            console.error(`Error al actualizar consulta ${id_consulta}:`, err);
            if (err.code === 'ER_NO_REFERENCED_ROW_2' && err.sqlMessage.includes('id_vendedor_asignado')) {
                 return res.status(400).json({ error: 'El id_vendedor_asignado proporcionado no existe (error de FK).' });
            }
            return res.status(500).json({ error: 'Error interno al actualizar la consulta.' });
        }
        if (result.affectedRows === 0 && (!result.message || !result.message.includes("No hay campos válidos para actualizar"))) {
            return res.status(404).json({ error: 'Consulta no encontrada para actualizar.' });
        }
         if (result.message && result.message.includes("No hay campos válidos para actualizar")) {
            return res.status(200).json({ message: 'No se realizaron cambios en la consulta.' });
        }
        ConsultaClienteModel.obtenerConsultaPorId(id_consulta, (err, consultaActualizada) => {
            if (err || !consultaActualizada) {
                return res.status(200).json({ message: 'Consulta actualizada exitosamente pero no se pudo recuperar.' });
            }
            res.status(200).json({ message: 'Consulta actualizada exitosamente.', consulta: consultaActualizada });
        });
    });
};

// Eliminar una consulta (para administradores)
exports.eliminar = (req, res) => {
    const id_consulta = parseInt(req.params.id_consulta);
    if (isNaN(id_consulta)) {
        return res.status(400).json({ error: 'ID de consulta inválido.' });
    }

    ConsultaClienteModel.obtenerConsultaPorId(id_consulta, (err, consulta) => {
        if (err) return res.status(500).json({ error: 'Error verificando consulta antes de eliminar.' });
        if (!consulta) return res.status(404).json({ error: 'Consulta no encontrada para eliminar.' });

        ConsultaClienteModel.eliminarConsulta(id_consulta, (err, result) => {
            if (err) {
                console.error(`Error al eliminar consulta ${id_consulta}:`, err);
                return res.status(500).json({ error: 'Error interno al eliminar la consulta.' });
            }
            res.status(200).json({ message: 'Consulta eliminada exitosamente .' });
        });
    });
};


// --- Manejo de Respuestas a Consultas ---

// Crear una respuesta a una consulta (para vendedor/administrador)
exports.crearRespuestaParaConsulta = async (req, res) => {
    const id_consulta = parseInt(req.params.id_consulta);
    const { id_usuario, mensaje } = req.body; // id_usuario es el del vendedor/admin que responde

    if (isNaN(id_consulta)) {
        return res.status(400).json({ error: 'ID de consulta inválido.' });
    }
    if (!id_usuario || !mensaje) {
        return res.status(400).json({ error: 'id_usuario (quien responde) y mensaje son requeridos para la respuesta.' });
    }
    if (isNaN(parseInt(id_usuario))) {
        return res.status(400).json({ error: 'id_usuario debe ser un número.' });
    }

    // Verificar que la consulta exista
    try {
        const consultaExiste = await new Promise((resolve, reject) => {
            ConsultaClienteModel.obtenerConsultaPorId(id_consulta, (err, consulta) => {
                if (err) return reject(err);
                resolve(consulta);
            });
        });
        if (!consultaExiste) {
            return res.status(404).json({ error: `La consulta con id_consulta ${id_consulta} no existe.` });
        }

        // Verificar que el id_usuario (quien responde) exista
        const usuarioRespondeExiste = await new Promise((resolve, reject) => {
            UsuarioModel.obtenerUsuarioPorId(id_usuario, (err, usuario) => {
                if (err) return reject(err);
                resolve(usuario); // Aquí podrías verificar el rol del usuario que responde
            });
        });
        if (!usuarioRespondeExiste) {
            return res.status(400).json({ error: `El usuario con id_usuario ${id_usuario} (quien responde) no existe.` });
        }

    } catch (error) {
        console.error("Error verificando consulta o usuario para respuesta:", error);
        return res.status(500).json({ error: 'Error interno al verificar datos para la respuesta.' });
    }

    const datosRespuesta = { id_consulta, id_usuario, mensaje };

    ConsultaClienteModel.crearRespuesta(datosRespuesta, (err, insertId) => {
        if (err) {
            console.error(`Error al crear respuesta para consulta ${id_consulta}:`, err);
             if (err.code === 'ER_NO_REFERENCED_ROW_2') { // Por si id_consulta o id_usuario son inválidos a pesar de la verificación previa
                 return res.status(400).json({ error: 'La consulta o el usuario especificado para la respuesta no existen (error de FK).' });
            }
            return res.status(500).json({ error: 'Error interno al crear la respuesta.' });
        }
        // Podrías querer devolver la respuesta creada, o la consulta actualizada con todas sus respuestas
        // Por simplicidad, un mensaje de éxito.
        res.status(201).json({ message: 'Respuesta creada exitosamente.', id_respuesta: insertId });
    });
};

// Obtener todas las respuestas para una consulta (ya se incluye en obtenerPorIdConRespuestas)
// Si necesitas un endpoint solo para respuestas:
exports.obtenerRespuestasDeConsulta = (req, res) => {
    const id_consulta = parseInt(req.params.id_consulta);
    if (isNaN(id_consulta)) {
        return res.status(400).json({ error: 'ID de consulta inválido.' });
    }
    ConsultaClienteModel.obtenerRespuestasPorConsultaId(id_consulta, (err, respuestas) => {
        if (err) {
            console.error(`Error al obtener respuestas para consulta ${id_consulta}:`, err);
            return res.status(500).json({ error: 'Error interno al obtener las respuestas.' });
        }
        res.status(200).json(respuestas);
    });
};