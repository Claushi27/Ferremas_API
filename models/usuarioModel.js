const db = require('../config/db');

const verificarCredenciales = (username, password, callback) => {
  const sql = 'SELECT * FROM usuario WHERE username = ? AND password = ?';
  db.query(sql, [username, password], (err, results) => {
    if (err) return callback(err);
    callback(null, results);
  });
};

module.exports = {
  verificarCredenciales
};
