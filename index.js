// index.js
require('dotenv').config(); // Correcto, al principio

const express = require('express');
const app = express();
const cors = require('cors'); // <--- ADD THIS LINE
const db = require('./config/db'); // Importante si lo usas en controladores como en el ejemplo de Webpay

// Tus Rutas Existentes
const authRoutes = require('./routes/authRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const testRoutes = require('./routes/testRoutes');
const productoRoutes = require('./routes/productoRoutes');
const categoriaProductoRoutes = require('./routes/categoriaProductoRoutes');
const sucursalRoutes = require('./routes/sucursalRoutes');
const inventarioSucursalRoutes = require('./routes/inventarioSucursalRoutes');
const pedidoRoutes = require('./routes/pedidoRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const consultaClienteRoutes = require('./routes/consultaClienteRoutes');
const tasaCambioRoutes = require('./routes/tasaCambioRoutes');
const pagoRoutes = require('./routes/pagoRoutes');
const metodoPagoRoutes = require('./routes/metodoPagoRoutes');

const promocionRoutes = require('./routes/promocionRoutes');    // Para el CRUD de Promociones
const webpayRoutes = require('./routes/webpayRoutes');        // Para la integración con Webpay

app.use(express.json()); // Para parsear JSON
app.use(express.urlencoded({ extended: true })); // Para parsear cuerpos de formularios (importante para el retorno de Webpay)

// Enable CORS for all origins during development.
// In a production environment, you should restrict this to your specific frontend domain.
app.use(cors()); // <--- ADD THIS LINE (after body-parser middleware, before your routes)

// API Endpoints
app.use('/api/login', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/test', testRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/categorias-producto', categoriaProductoRoutes);
app.use('/api/sucursales', sucursalRoutes);
app.use('/api/inventario', inventarioSucursalRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/consultas', consultaClienteRoutes);
app.use('/api/tasas-cambio', tasaCambioRoutes);
app.use('/api/promociones', promocionRoutes);        
app.use('/api/pagos/webpay', webpayRoutes);    
app.use('/api/pagos', pagoRoutes);
app.use('/api/metodos-pago', metodoPagoRoutes);

// Ruta raíz para evitar 404
app.get('/', (req, res) => {
  res.json({
    message: 'FERREMAS API está funcionando correctamente',
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Manejar rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    message: 'La ruta solicitada no existe en la API'
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor FERREMAS API corriendo en el puerto ${PORT}`);
});