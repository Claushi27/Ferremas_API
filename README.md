# API Login con Node.js, Express y MySQL

Este proyecto es una API REST básica que permite realizar un **login** de usuarios a través de un endpoint conectado a una base de datos MySQL. El código está organizado de manera modular para facilitar su mantenimiento y escalabilidad.

---

## 🚀 Requisitos Previos

Antes de comenzar asegúrate de tener instalado:

- Node.js y npm: https://nodejs.org/
- MySQL Server en tu máquina local
- Un editor de código como Visual Studio Code
- Postman u otra herramienta para probar endpoints

---

## 🧱 Estructura del Proyecto

```
api-login-node/
│
├── config/
│   └── db.js          # Conexión a la base de datos
│
├── controllers/
│   └── authController.js   # Lógica del login
│
├── routes/
│   └── authRoutes.js       # Rutas para /login
│
├── .env               # Variables de entorno
├── index.js           # Arranque de la aplicación
├── package.json
└── README.md
```

---

## 🛠️ Paso 1: Crear el proyecto

```bash
mkdir api-login-node
cd api-login-node
npm init -y
```

Instala las dependencias necesarias:

```bash
npm install express mysql dotenv
```

---

## 🗄️ Paso 2: Crear la base de datos y el usuario en MySQL

Abre tu cliente MySQL y ejecuta lo siguiente:

```sql
-- Crear el esquema
CREATE SCHEMA `tienda` DEFAULT CHARACTER SET utf8 COLLATE utf8_spanish_ci;

-- Crear el usuario
CREATE USER 'administrador'@'localhost' IDENTIFIED BY 'yR!9uL2@pX';

-- Otorgar privilegios
GRANT ALL PRIVILEGES ON tienda.* TO 'administrador'@'localhost';
FLUSH PRIVILEGES;

-- Asegurar compatibilidad del método de autenticación
ALTER USER 'administrador'@'localhost' IDENTIFIED WITH mysql_native_password BY 'yR!9uL2@pX';
FLUSH PRIVILEGES;

-- Crear la tabla y un usuario de prueba
USE tienda;

CREATE TABLE usuario (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL
);

INSERT INTO usuario (username, password) VALUES ('estudiante', '12345');
```

---

## 🔐 Paso 3: Configuración de variables de entorno

Crea un archivo `.env` en la raíz del proyecto con la siguiente configuración:

```env
DB_HOST=localhost
DB_USER=administrador
DB_PASSWORD=yR!9uL2@pX
DB_NAME=tienda
PORT=3306
```

---

## 📁 Paso 4: Estructurar el proyecto

### `index.js`

```js
const express = require('express');
const app = express();
const dotenv = require('dotenv');
dotenv.config();

const authRoutes = require('./routes/authRoutes');

app.use(express.json());
app.use('/login', authRoutes);

app.listen(process.env.PORT, () => {
  console.log(`Servidor corriendo en el puerto ${process.env.PORT}`);
});
```

### `config/db.js`

```js
const mysql = require('mysql');
const dotenv = require('dotenv');
dotenv.config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

connection.connect((err) => {
  if (err) throw err;
  console.log('✅ Conectado a la base de datos MySQL');
});

module.exports = connection;
```

### `controllers/authController.js`

```js
const db = require('../config/db');

exports.login = (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Falta username o password' });
  }

  const sql = 'SELECT * FROM usuario WHERE username = ? AND password = ?';
  db.query(sql, [username, password], (err, results) => {
    if (err) return res.status(500).json({ error: 'Error en la base de datos' });

    if (results.length > 0) {
      return res.status(200).json({ message: 'Inicio de sesión exitoso' });
    } else {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }
  });
};
```

### `routes/authRoutes.js`

```js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/', authController.login);

module.exports = router;
```

---

## 🧪 Paso 5: Probar con Postman

1. Inicia el servidor:

```bash
node index.js
```

2. En Postman, crea una petición:

- **Método:** `POST`
- **URL:** `http://localhost:3306/login`
- **Body (JSON):**
```json
{
  "username": "estudiante",
  "password": "12345"
}
```

3. Si todo está correcto, deberías recibir:

```json
{
  "message": "Inicio de sesión exitoso"
}
```

---

## ✅ Próximos pasos y mejoras

- Usar bcrypt para almacenar contraseñas de forma segura
- Implementar validaciones con Joi
- Agregar tokens JWT para autenticación
- Crear rutas protegidas
- Modularizar aún más el código en servicios

---

## 📌 Licencia

Este proyecto es de uso educativo y libre distribución.
