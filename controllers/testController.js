// controllers/testController.js
const TestModel = require('../models/TestModel.js');

exports.listarRoles = (req, res) => {
  TestModel.obtenerRoles((err, roles) => {
    if (err) {
      console.error('Error al obtener roles:', err);
      return res.status(500).json({ error: 'Error al obtener roles de la base de datos' });
    }
    if (roles.length === 0) {
      return res.status(404).json({ message: 'No se encontraron roles.' });
    }
    res.status(200).json(roles); // Devuelve los roles encontrados como JSON
  });
};