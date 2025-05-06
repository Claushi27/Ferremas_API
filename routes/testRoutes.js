// routes/testRoutes.js
const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');

// Definimos una ruta GET en /test/roles
router.get('/roles', testController.listarRoles);

module.exports = router;