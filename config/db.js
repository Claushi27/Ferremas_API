// config/db.js
const { Pool } = require('pg');
const dotenv = require('dotenv'); // dotenv se importa aquí
dotenv.config(); // Y se configura aquí

// Usar la URL completa de conexión para mayor compatibilidad
const connectionString = process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

// Configuración con manejo de errores mejorado
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
  connectionTimeoutMillis: 20000,
  query_timeout: 20000,
  statement_timeout: 20000,
  idle_in_transaction_session_timeout: 30000,
  // Configuración adicional para Render
  max: 20,
  idleTimeoutMillis: 30000,
  allowExitOnIdle: false
});

// Conexión no bloqueante - el servidor sigue funcionando aunque falle
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error conectando a la base de datos PostgreSQL:', err.message);
    console.log('🔄 El servidor API seguirá funcionando, reintentando conexión...');
    // Reintentar conexión cada 30 segundos
    setTimeout(() => {
      pool.connect((retryErr, retryClient, retryRelease) => {
        if (retryErr) {
          console.error('❌ Reintento de conexión falló:', retryErr.message);
        } else {
          console.log('✅ Conectado a la base de datos PostgreSQL (Supabase) - Reintento exitoso');
          retryRelease();
        }
      });
    }, 30000);
    return;
  }
  console.log('✅ Conectado a la base de datos PostgreSQL (Supabase)');
  release();
});

module.exports = pool;
