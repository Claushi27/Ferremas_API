// index.js
require('dotenv').config(); // <--- ¡PON ESTO AQUÍ ARRIBA!

const express = require('express');
const app = express();
// const dotenv = require('dotenv'); // Ya no necesitas estas dos líneas aquí
// dotenv.config();

const authRoutes = require('./routes/authRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const testRoutes = require('./routes/testRoutes');
const productoRoutes = require('./routes/productoRoutes');
const categoriaProductoRoutes = require('./routes/categoriaProductoRoutes');
const sucursalRoutes = require('./routes/sucursalRoutes');
const inventarioSucursalRoutes = require('./routes/inventarioSucursalRoutes');
const pedidoRoutes = require('./routes/pedidoRoutes');
const clienteRoutes = require('./routes/clienteRoutes');

app.use(express.json());
app.use('/login', authRoutes);
app.use('/usuarios', usuarioRoutes);
app.use('/api/test', testRoutes);
app.use('/api/productos', productoRoutes); 
app.use('/api/categorias-producto', categoriaProductoRoutes);
app.use('/api/sucursales', sucursalRoutes);
app.use('/api/inventario', inventarioSucursalRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/clientes', clienteRoutes);

app.listen(process.env.PORT, () => {
  console.log(`Servidor corriendo en el puerto ${process.env.PORT}`);
});