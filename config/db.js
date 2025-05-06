// config/db.js
const mysql = require('mysql');
const dotenv = require('dotenv'); // dotenv se importa aquí
dotenv.config(); // Y se configura aquí

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,       // Necesita que dotenv ya haya cargado esto
  password: process.env.DB_PASSWORD, // Necesita que dotenv ya haya cargado esto
  database: process.env.DB_NAME,   // Necesita que dotenv ya haya cargado esto
  port: process.env.DB_PORT        // Necesita que dotenv ya haya cargado esto
});

connection.connect((err) => {
  if (err) throw err;
  console.log('✅ Conectado a la base de datos MySQL');
});

module.exports = connection;
