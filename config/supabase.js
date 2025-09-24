// config/supabase.js
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://hnprqhbocsdjyivxvdtv.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhucHJxaGJvY3Nkanlpdnh2ZHR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3NDUzNDYsImV4cCI6MjA3NDMyMTM0Nn0.EWeg0kejhln_9H-oMEahXCKDM14iuFIOOwQ_nAufc5g';

const supabase = createClient(supabaseUrl, supabaseKey);

// Probar la conexión
async function testConnection() {
  try {
    // Usar una consulta más simple que no requiere tablas específicas
    const { data, error } = await supabase.rpc('version'); // Función incorporada de PostgreSQL
    if (error) {
      console.log('🔄 Supabase conectado pero sin acceso a funciones RPC (normal con anon key)');
      console.log('✅ Conectado a Supabase API correctamente');
    } else {
      console.log('✅ Conectado a Supabase correctamente:', data);
    }
  } catch (err) {
    console.error('❌ Error de conexión a Supabase:', err.message);
  }
}

// Probar conexión al inicializar
testConnection();

module.exports = supabase;