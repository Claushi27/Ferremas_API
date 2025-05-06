// controllers/usuarioController.js
const UsuarioModel = require('../models/usuarioModel');
// const jwt = require('jsonwebtoken'); // Ya lo tienes si lo instalaste

// --- CREAR (Ya lo tienes y funciona) ---
exports.crear = (req, res) => {
  const { nombre_usuario, contrasena, correo, id_rol, primer_inicio } = req.body;
  if (!nombre_usuario || !contrasena || !correo || !id_rol) {
    return res.status(400).json({ error: 'Faltan campos requeridos: nombre_usuario, contrasena, correo, id_rol' });
  }
  const datosNuevoUsuario = { nombre_usuario, contrasena, correo, id_rol, primer_inicio };
  UsuarioModel.crearUsuario(datosNuevoUsuario, (err, insertId) => {
    if (err) {
      console.error("Error al crear usuario:", err);
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'El nombre de usuario o correo ya existe.' });
      }
      return res.status(500).json({ error: 'Error interno al crear el usuario' });
    }
    // Devolver el usuario creado (sin la contraseña) después de crearlo
    UsuarioModel.obtenerUsuarioPorId(insertId, (err, nuevoUsuario) => {
        if (err || !nuevoUsuario) {
            return res.status(201).json({ message: 'Usuario creado exitosamente pero no se pudo recuperar', id_usuario: insertId });
        }
        res.status(201).json({ message: 'Usuario creado exitosamente', usuario: nuevoUsuario });
    });
  });
};

// --- OBTENER TODOS (NUEVO) ---
exports.obtenerTodos = (req, res) => {
  UsuarioModel.obtenerTodosLosUsuarios((err, usuarios) => {
    if (err) {
      console.error("Error al obtener todos los usuarios:", err);
      return res.status(500).json({ error: 'Error interno al obtener los usuarios' });
    }
    res.status(200).json(usuarios);
  });
};

// --- OBTENER POR ID (NUEVO) ---
exports.obtenerPorId = (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID de usuario inválido.' });
  }
  UsuarioModel.obtenerUsuarioPorId(id, (err, usuario) => {
    if (err) {
      console.error(`Error al obtener usuario con ID ${id}:`, err);
      return res.status(500).json({ error: 'Error interno al obtener el usuario' });
    }
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.status(200).json(usuario);
  });
};

// --- ACTUALIZAR (NUEVO, usando PATCH/PUT) ---
exports.actualizar = (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID de usuario inválido.' });
  }
  const datosUsuario = req.body;
  // Aquí deberías validar los datosUsuario antes de pasarlos al modelo
  if (Object.keys(datosUsuario).length === 0) {
    return res.status(400).json({ error: 'No se proporcionaron datos para actualizar.' });
  }

  UsuarioModel.actualizarUsuario(id, datosUsuario, (err, result) => {
    if (err) {
      console.error(`Error al actualizar usuario con ID ${id}:`, err);
       if (err.code === 'ER_DUP_ENTRY') { // Por si intentas actualizar un correo a uno que ya existe
        return res.status(409).json({ error: 'Error de conflicto, el correo podría ya estar en uso.' });
      }
      return res.status(500).json({ error: 'Error interno al actualizar el usuario' });
    }
    if (result.affectedRows === 0 && (!result.message || !result.message.includes("No hay campos para actualizar"))) {
      return res.status(404).json({ error: 'Usuario no encontrado para actualizar' });
    }
     if (result.message && result.message.includes("No hay campos para actualizar")){
        return res.status(200).json({ message: 'No se realizaron cambios, no se proporcionaron campos válidos para actualizar o los valores eran los mismos.' });
    }
    // Devolver el usuario actualizado
    UsuarioModel.obtenerUsuarioPorId(id, (err, usuarioActualizado) => {
        if (err || !usuarioActualizado) {
             return res.status(200).json({ message: 'Usuario actualizado exitosamente, pero no se pudo recuperar la información actualizada.' });
        }
         res.status(200).json({ message: 'Usuario actualizado exitosamente', usuario: usuarioActualizado });
    });
  });
};

// --- ELIMINAR (NUEVO) ---
exports.eliminar = (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID de usuario inválido.' });
  }
  // Antes de eliminar, podrías querer verificar si el usuario existe
  UsuarioModel.obtenerUsuarioPorId(id, (err, usuario) => {
    if (err) {
        return res.status(500).json({ error: 'Error interno verificando el usuario antes de eliminar.' });
    }
    if (!usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado para eliminar' });
    }
    // Si existe, proceder a eliminar
    UsuarioModel.eliminarUsuario(id, (err, result) => {
        if (err) {
        console.error(`Error al eliminar usuario con ID ${id}:`, err);
        // Aquí podrías manejar errores de FK si el usuario está referenciado en otras tablas
        return res.status(500).json({ error: 'Error interno al eliminar el usuario' });
        }
        // affectedRows debería ser 1 si se eliminó
        res.status(200).json({ message: 'Usuario eliminado exitosamente' });
    });
  });
};