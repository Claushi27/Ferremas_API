// models/testModel.js
const db = require('../config/db'); // Tu conexión a la BD

exports.obtenerRoles = (callback) => {
  db.query('SELECT * FROM rol', callback); // Selecciona todos los datos de la tabla 'rol'
};