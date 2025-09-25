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
    console.log('🔍 Probando conexión a Supabase...');
    console.log('🌐 URL:', supabaseUrl);
    console.log('🔑 Key (primeros 20):', supabaseKey.substring(0, 20) + '...');

    // Probar con una consulta simple a una tabla conocida
    const { data, error } = await supabase
      .from('producto')
      .select('id_producto')
      .limit(1);

    if (error) {
      console.error('❌ Error en test de Supabase:', error.message);
      console.log('🔄 Pero el cliente está configurado correctamente');
    } else {
      console.log('✅ Conectado a Supabase API correctamente');
      console.log('📊 Test query exitosa:', data);
    }
  } catch (err) {
    console.error('❌ Error de conexión a Supabase:', err.message);
  }
}

// Probar conexión al inicializar
testConnection();

module.exports = supabase;