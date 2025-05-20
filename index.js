// index.js
require('dotenv').config(); // Correcto, al principio

const express = require('express');
const app = express();
const db = require('./config/db'); // Importante si lo usas en controladores como en el ejemplo de Webpay

// Tus Rutas Existentes
const authRoutes = require('./routes/authRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const testRoutes = require('./routes/testRoutes'); // Asegúrate de que este archivo exista si lo requieres
const productoRoutes = require('./routes/productoRoutes');
const categoriaProductoRoutes = require('./routes/categoriaProductoRoutes');
const sucursalRoutes = require('./routes/sucursalRoutes');
const inventarioSucursalRoutes = require('./routes/inventarioSucursalRoutes');
const pedidoRoutes = require('./routes/pedidoRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const consultaClienteRoutes = require('./routes/consultaClienteRoutes');
const tasaCambioRoutes = require('./routes/tasaCambioRoutes');

// Nuevas Rutas que hemos añadido
const promocionRoutes = require('./routes/promocionRoutes');    // Para el CRUD de Promociones
const webpayRoutes = require('./routes/webpayRoutes');        // Para la integración con Webpay

app.use(express.json()); // Para parsear JSON
app.use(express.urlencoded({ extended: true })); // Para parsear cuerpos de formularios (importante para el retorno de Webpay)

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


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor FERREMAS API corriendo en el puerto ${PORT}`);
});