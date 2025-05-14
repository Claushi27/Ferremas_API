// models/usuarioModel.js
const db = require('../config/db');
const bcrypt = require('bcrypt');
const saltRounds = 10;

// --- CREAR USUARIO (Ya lo tienes y funciona) ---
exports.crearUsuario = (datosUsuario, callback) => {
  bcrypt.hash(datosUsuario.contrasena, saltRounds, (err, hash) => {
    if (err) {
      return callback(err);
    }
    const query = 'INSERT INTO usuario (nombre_usuario, contrasena, correo, id_rol, primer_inicio) VALUES (?, ?, ?, ?, ?)';
    // Asumimos que primer_inicio puede venir en datosUsuario o le ponemos un default si no
    const primerInicio = datosUsuario.primer_inicio === undefined ? true : datosUsuario.primer_inicio;
    db.query(query, [datosUsuario.nombre_usuario, hash, datosUsuario.correo, datosUsuario.id_rol, primerInicio], (err, results) => {
      if (err) {
        return callback(err);
      }
      callback(null, results.insertId);
    });
  });
};

// --- VERIFICAR CREDENCIALES (Ya lo tienes y funciona para login) ---
exports.verificarCredenciales = (nombre_usuario, contrasenaPlana, callback) => {
  const query = 'SELECT id_usuario, nombre_usuario, contrasena, correo, id_rol, primer_inicio, fecha_ultimo_acceso FROM usuario WHERE nombre_usuario = ?';
  db.query(query, [nombre_usuario], (err, results) => {
    if (err) {
      return callback(err);
    }
    if (results.length === 0) {
      return callback(null, null);
    }
    const usuarioEncontrado = results[0];
    bcrypt.compare(contrasenaPlana, usuarioEncontrado.contrasena, (err, sonIguales) => {
      if (err) {
        return callback(err);
      }
      if (sonIguales) {
        const { contrasena, ...datosUsuarioSinPass } = usuarioEncontrado;
        // Opcional: Actualizar fecha_ultimo_acceso y primer_inicio si es el primer login real
        if (datosUsuarioSinPass.primer_inicio) {
          const updateQuery = 'UPDATE usuario SET fecha_ultimo_acceso = CURRENT_TIMESTAMP, primer_inicio = FALSE WHERE id_usuario = ?';
          db.query(updateQuery, [datosUsuarioSinPass.id_usuario], (updateErr) => {
            if (updateErr) console.error("Error al actualizar fecha_ultimo_acceso:", updateErr);
            // Devolver el usuario original incluso si la actualización falla para no bloquear el login
            callback(null, datosUsuarioSinPass);
          });
        } else {
          const updateQuery = 'UPDATE usuario SET fecha_ultimo_acceso = CURRENT_TIMESTAMP WHERE id_usuario = ?';
           db.query(updateQuery, [datosUsuarioSinPass.id_usuario], (updateErr) => {
            if (updateErr) console.error("Error al actualizar fecha_ultimo_acceso:", updateErr);
             callback(null, datosUsuarioSinPass);
          });
        }
      } else {
        callback(null, null);
      }
    });
  });
};

// --- OBTENER TODOS LOS USUARIOS (NUEVO) ---
exports.obtenerTodosLosUsuarios = (callback) => {
  const query = 'SELECT id_usuario, nombre_usuario, correo, id_rol, fecha_creacion, primer_inicio, fecha_ultimo_acceso FROM usuario';
  db.query(query, callback);
};

// --- OBTENER USUARIO POR ID (NUEVO) ---
exports.obtenerUsuarioPorId = (id, callback) => {
  const query = 'SELECT id_usuario, nombre_usuario, correo, id_rol, fecha_creacion, primer_inicio, fecha_ultimo_acceso FROM usuario WHERE id_usuario = ?';
  db.query(query, [id], (err, results) => {
    if (err) {
      return callback(err);
    }
    // results es un array, incluso si solo hay un resultado o ninguno
    callback(null, results[0]); // Devuelve el primer (y único) usuario, o undefined si no se encontró
  });
};

// --- ACTUALIZAR USUARIO (NUEVO) ---
exports.actualizarUsuario = (id, datosUsuario, callback) => {
  let fieldsToUpdate = [];
  let values = [];

  if (datosUsuario.correo !== undefined) {
    fieldsToUpdate.push('correo = ?');
    values.push(datosUsuario.correo);
  }
  if (datosUsuario.id_rol !== undefined) {
    fieldsToUpdate.push('id_rol = ?');
    values.push(datosUsuario.id_rol);
  }
  if (datosUsuario.primer_inicio !== undefined) {
    fieldsToUpdate.push('primer_inicio = ?');
    values.push(datosUsuario.primer_inicio);
  }
  // No actualizamos nombre_usuario (es UNIQUE) ni contraseña aquí por simplicidad.

  if (fieldsToUpdate.length === 0) {
    return callback(null, { affectedRows: 0, message: "No hay campos para actualizar" });
  }

  values.push(id); 

  const query = `UPDATE usuario SET ${fieldsToUpdate.join(', ')} WHERE id_usuario = ?`;

  db.query(query, values, (err, result) => {
    if (err) return callback(err);
    callback(null, result);
  });
};

// --- ELIMINAR USUARIO (NUEVO) ---
exports.eliminarUsuario = (id, callback) => {
  const query = 'DELETE FROM usuario WHERE id_usuario = ?';
  db.query(query, [id], callback);
};