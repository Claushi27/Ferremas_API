# API Login con Node.js, Express y MySQL

Este proyecto es una API REST básica que permite realizar un **login** de usuarios y gestionar su creación, edición y eliminación, conectándose a una base de datos MySQL. El código está organizado de manera modular para facilitar su mantenimiento y escalabilidad.

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
│   └── usuarioController.js # Controlador para CRUD de usuarios
│
├── models/
│   └── usuarioModel.js     # Consultas a BD para usuarios
│
├── routes/
│   └── authRoutes.js       # Rutas para /login
│   └── usuarioRoutes.js    # Rutas para crear, editar, eliminar usuarios
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

```sql
CREATE SCHEMA `tienda` DEFAULT CHARACTER SET utf8 COLLATE utf8_spanish_ci;

CREATE USER 'administrador'@'localhost' IDENTIFIED BY 'yR!9uL2@pX';
GRANT ALL PRIVILEGES ON tienda.* TO 'administrador'@'localhost';
FLUSH PRIVILEGES;

ALTER USER 'administrador'@'localhost' IDENTIFIED WITH mysql_native_password BY 'yR!9uL2@pX';
FLUSH PRIVILEGES;
```

### Crear tabla `Usuarios`

```sql
CREATE TABLE Usuarios (
  id_usuario INT AUTO_INCREMENT PRIMARY KEY,
  rut VARCHAR(12) NOT NULL,
  username VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL,
  nombres VARCHAR(45) NOT NULL,
  ap_paterno VARCHAR(45) NOT NULL,
  ap_materno VARCHAR(45),
  esta_suscrito VARCHAR(1) NOT NULL DEFAULT '0',
  id_rol INT NOT NULL,
  estado TINYINT NOT NULL DEFAULT 1
);
```

---

## 🔐 Variables de entorno

Archivo `.env`:

```env
DB_HOST=localhost
DB_USER=administrador
DB_PASSWORD=yR!9uL2@pX
DB_NAME=tienda
PORT=3000
```

---

## ⚙️ Rutas disponibles

### POST `/login`
Autentica al usuario.

### POST `/usuarios/crear`
Crea un nuevo usuario.

### PUT `/usuarios/editar/:id`
Edita un usuario por su ID.

### DELETE `/usuarios/eliminar/:id`
Elimina un usuario por su ID.

---

## 📁 Paso 4: Código de ejemplo

Ya incluido en los archivos `authController.js`, `usuarioController.js`, `usuarioModel.js`, `authRoutes.js`, y `usuarioRoutes.js`.

---

## 🧪 Probar con Postman

### Login

- Método: POST
- URL: `http://localhost:3000/login`
- Body JSON:

```json
{
  "username": "admin",
  "password": "1234"
}
```

### Crear usuario

```json
{
  "rut": "12345678-9",
  "username": "admin",
  "password": "1234",
  "nombres": "Juan",
  "ap_paterno": "Pérez",
  "ap_materno": "Gómez",
  "esta_suscrito": "1",
  "id_rol": 1
}
```

### Editar usuario

PUT a `/usuarios/editar/1`

### Eliminar usuario

DELETE a `/usuarios/eliminar/1`

---

## ✅ Próximos pasos y mejoras

- Usar bcrypt para contraseñas
- JWT para autenticación
- Validaciones con Joi
- Manejo de errores avanzado

---

## 📌 Licencia

Uso educativo y libre distribución.
