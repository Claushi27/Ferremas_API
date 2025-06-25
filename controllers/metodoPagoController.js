// controllers/metodoPagoController.js
const db = require('../config/db'); // Asumiendo tu conexión a la DB

exports.obtenerTodos = (req, res) => {
  db.query('SELECT * FROM metodo_pago', (err, metodos) => {
    if (err) {
      console.error("Error al obtener métodos de pago:", err);
      return res.status(500).json({ error: 'Error interno al obtener los métodos de pago' });
    }
    res.status(200).json(metodos);
  });
};

// Puedes añadir crear, actualizar, eliminar si es necesario, pero para la verificación, solo GET es suficiente.
exports.crear = (req, res) => {
    const { descripcion, activo } = req.body;
    if (!descripcion) {
        return res.status(400).json({ error: 'La descripción del método de pago es requerida.' });
    }
    db.query('INSERT INTO metodo_pago (descripcion, activo) VALUES (?, ?)', [descripcion, activo !== undefined ? activo : true], (err, result) => {
        if (err) {
            console.error("Error al crear método de pago:", err);
            return res.status(500).json({ error: 'Error interno al crear el método de pago.' });
        }
        res.status(201).json({ message: 'Método de pago creado exitosamente', id_metodo: result.insertId });
    });
};