// config/db.js
const { Pool } = require('pg');
const dotenv = require('dotenv'); // dotenv se importa aquí
dotenv.config(); // Y se configura aquí

// Usar la URL completa de conexión para mayor compatibilidad
const connectionString = process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

// Configuración directa sin connectionString para evitar problemas de DNS
const pool = new Pool({
  host: 'db.hnprqhbocsdjyivxvdtv.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: process.env.DB_PASSWORD || 'Clau2703.',
  ssl: {
    rejectUnauthorized: false
  },
  // Timeout de conexión
  connectionTimeoutMillis: 15000,
  query_timeout: 15000,
  statement_timeout: 15000,
  idle_in_transaction_session_timeout: 30000
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
