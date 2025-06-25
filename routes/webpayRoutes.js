// routes/webpayRoutes.js
const express = require('express');
const router = express.Router();
const webpayController = require('../controllers/webpayController');
// const authMiddleware = require('../middlewares/authMiddleware'); // Podrías proteger /crear

// Iniciar una transacción de Webpay
// router.post('/crear', authMiddleware, webpayController.crearTransaccion);
router.post('/crear', webpayController.crearTransaccion);

// URL de Retorno de Webpay (Transbank hace un POST aquí con token_ws o TBK_TOKEN)
// Esta URL no debe ser llamada directamente por el frontend, es para Transbank.
router.post('/retorno', webpayController.retornoWebpay);
router.get('/retorno', webpayController.retornoWebpay);
// Opcional: Si Transbank usa GET para algún caso de retorno (revisar documentación)
// router.get('/retorno', webpayController.retornoWebpay);

module.exports = router;