// controllers/authController.js
const UsuarioModel = require('../models/usuarioModel');
const jwt = require('jsonwebtoken'); // Si decides usar JWT

exports.login = (req, res) => {
  // Cambiado de 'username' a 'nombre_usuario' para coincidir con la BD de sistema_compras
  const { nombre_usuario, contrasena } = req.body;

  if (!nombre_usuario || !contrasena) {
    return res.status(400).json({ error: 'Faltan nombre_usuario o contrasena' });
  }

  UsuarioModel.verificarCredenciales(nombre_usuario, contrasena, (err, usuario) => {
    if (err) {
      console.error("Error en login (verificarCredenciales):", err);
      return res.status(500).json({ error: 'Error interno del servidor durante el login' });
    }

    if (usuario) {
      // Usuario autenticado correctamente
      // Opcional: Generar un token JWT
      // const token = jwt.sign(
      //   { id_usuario: usuario.id_usuario, nombre_usuario: usuario.nombre_usuario, id_rol: usuario.id_rol },
      //   process.env.JWT_SECRET, // Asegúrate de tener JWT_SECRET en tu .env
      //   { expiresIn: '1h' } // El token expira en 1 hora
      // );
      // return res.status(200).json({ message: 'Inicio de sesión exitoso', usuario: usuario, token: token });
      
      // Sin JWT por ahora:
      return res.status(200).json({ message: 'Inicio de sesión exitoso', usuario: usuario });

    } else {
      // Credenciales incorrectas (usuario no encontrado o contraseña no coincide)
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }
  });
};