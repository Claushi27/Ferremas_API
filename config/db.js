// config/db.js
const { Pool } = require('pg');
const dotenv = require('dotenv'); // dotenv se importa aquí
dotenv.config(); // Y se configura aquí

// Usar la URL completa de conexión para mayor compatibilidad
const connectionString = process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  },
  // Forzar IPv4
  family: 4,
  // Timeout de conexión
  connectionTimeoutMillis: 10000
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
