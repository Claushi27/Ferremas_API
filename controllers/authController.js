// controllers/authController.js
const db = require('../config/db');

exports.login = (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Falta username o password' });
  }

  const sql = 'SELECT * FROM usuario WHERE username = ? AND password = ?';
  db.query(sql, [username, password], (err, results) => {
    if (err) return res.status(500).json({ error: 'Error en la base de datos' });

    if (results.length > 0) {
      return res.status(200).json({ message: 'Inicio de sesión exitoso' });
    } else {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }
  });
};
