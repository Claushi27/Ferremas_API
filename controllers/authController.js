// controllers/authController.js
const UsuarioModel = require('../models/usuarioModel');
const jwt = require('jsonwebtoken'); // Si decides usar JWT

exports.login = (req, res) => {
  // Aceptar tanto 'username' como 'nombre_usuario' para compatibilidad con frontend
  const { username, nombre_usuario, password, contrasena } = req.body;
  const user = username || nombre_usuario;
  const pass = password || contrasena;

  if (!user || !pass) {
    return res.status(400).json({
      success: false,
      message: 'Faltan credenciales'
    });
  }

  UsuarioModel.verificarCredenciales(user, pass, (err, usuario) => {
    if (err) {
      console.error("Error en login (verificarCredenciales):", err);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor durante el login'
      });
    }

    if (usuario) {
      // Mapear rol para frontend
      let roleMap = {
        1: 'admin',
        2: 'vendedor',
        3: 'bodeguero',
        4: 'contador',
        5: 'cliente'
      };

      // Generar token simple (puedes usar JWT después)
      const token = 'token_' + Date.now() + '_' + usuario.id_usuario;

      const userData = {
        id: usuario.id_usuario,
        username: usuario.nombre_usuario,
        email: usuario.correo,
        role: roleMap[usuario.id_rol] || 'usuario',
        roleId: usuario.id_rol
      };

      return res.status(200).json({
        success: true,
        message: 'Inicio de sesión exitoso',
        data: {
          user: userData,
          token: token
        }
      });

    } else {
      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas'
      });
    }
  });
};