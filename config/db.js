// config/db.js
const { Pool } = require('pg');
const dotenv = require('dotenv'); // dotenv se importa aquí
dotenv.config(); // Y se configura aquí

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error conectando a la base de datos PostgreSQL:', err.stack);
    return;
  }
  console.log('✅ Conectado a la base de datos PostgreSQL (Supabase)');
  release();
});

module.exports = pool;
