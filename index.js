// index.js
require('dotenv').config(); // <--- ¡PON ESTO AQUÍ ARRIBA!

const express = require('express');
const app = express();
// const dotenv = require('dotenv'); // Ya no necesitas estas dos líneas aquí
// dotenv.config();

const authRoutes = require('./routes/authRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const testRoutes = require('./routes/testRoutes');

app.use(express.json());
app.use('/login', authRoutes);
app.use('/usuarios', usuarioRoutes);
app.use('/api/test', testRoutes);

app.listen(process.env.PORT, () => {
  console.log(`Servidor corriendo en el puerto ${process.env.PORT}`);
});