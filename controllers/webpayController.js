// controllers/webpayController.js
const webpayService = require('../services/webpayService');
const PedidoModel = require('../models/pedidoModel'); // Asume que tienes este modelo
const PagoModel = require('../models/pagoModel');     // Asume que tienes este modelo

const ID_METODO_PAGO_WEBPAY = 4; // IMPORTANTE: Ajusta este ID al que tengas para "Webpay" en tu tabla metodo_pago

// URL base de tu frontend para redirecciones (ajusta según sea necesario)
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080'; // O el puerto de tu frontend

/**
 * Crea (inicia) una transacción en Webpay.
 * Recibe id_pedido para obtener monto y generar datos para Webpay.
 */
exports.crearTransaccion = async (req, res) => {
    const { id_pedido } = req.body;

    if (!id_pedido) {
        return res.status(400).json({ error: 'El id_pedido es requerido.' });
    }

    try {
        // 1. Obtener detalles del pedido desde tu base de datos
        const pedido = await new Promise((resolve, reject) => {
            PedidoModel.obtenerPedidoConDetallesPorId(id_pedido, (err, data) => { // Usa tu función de modelo
                if (err) return reject(new Error('Error al obtener el pedido.'));
                if (!data) return reject(new Error(`Pedido con ID ${id_pedido} no encontrado.`));
                // Validar si el pedido ya fue pagado o está en un estado que no permite pagar
                if (data.id_estado === 3) { // Asumiendo que 3 es 'Pagado'
                     return reject(new Error(`El pedido ${id_pedido} ya ha sido pagado.`));
                }
                resolve(data);
            });
        });

        const buyOrder = pedido.numero_compra;        const sessionId = `SESS-${pedido.id_pedido}-${Date.now()}`; // Sesión única para Transbank
        const amount = Math.round(pedido.total_con_impuesto); // Monto total del pedido, Transbank espera enteros para CLP.
        const returnUrl = `${req.protocol}://${req.get('host')}/api/pagos/webpay/retorno`; // URL de retorno a este backend

        // 2. Iniciar transacción con Webpay
        const webpayResponse = await webpayService.iniciarTransaccionWebpay(buyOrder, sessionId, amount, returnUrl);

        // Aquí podrías guardar temporalmente el buyOrder o el token de Webpay asociado a tu id_pedido
        // para verificarlo en el retorno, aunque el commit se hace con el token_ws.
        // Por ejemplo, podrías actualizar el pedido con un estado "Pendiente de pago Webpay" y el token.

        // 3. Devolver URL y Token al frontend para la redirección
        res.status(200).json({
            url_webpay: webpayResponse.url,
            token_ws: webpayResponse.token, // Este es el token que el frontend debe enviar a la URL de Webpay
            buy_order: buyOrder, // Opcional, para referencia del frontend
            session_id: sessionId // Opcional
        });

    } catch (error) {
        console.error("[WebpayController] Error al crear transacción:", error.message);
        res.status(500).json({ error: error.message || 'Error interno al procesar el inicio del pago.' });
    }
};

/**
 * Maneja el retorno de Webpay después de que el usuario interactúa con la plataforma de pago.
 * Confirma la transacción con Transbank y actualiza el estado del pedido y pago.
 */
exports.retornoWebpay = async (req, res) => {
    const tokenWs = req.body.token_ws; // Webpay POSTea el token_ws a esta URL
    const tbkToken = req.body.TBK_TOKEN; // Token si el pago fue anulado o abandonado
    // Otros tokens posibles: TBK_ID_SESION, TBK_ORDEN_COMPRA

    console.log("[WebpayController] Retorno Webpay recibido:");
    console.log("token_ws:", tokenWs);
    console.log("TBK_TOKEN (anulación/abandono):", tbkToken);

    let redirectUrl = `${FRONTEND_URL}/pago/resultado?estado=error&mensaje=Error%20desconocido`; // URL por defecto

    if (tbkToken) { // El usuario anuló el pago o hubo un error antes de confirmar con tarjeta
        console.log(`[WebpayController] Pago anulado o abandonado por el usuario. TBK_TOKEN: ${tbkToken}`);
        // Aquí podrías querer buscar el pedido asociado al TBK_ORDEN_COMPRA o TBK_ID_SESION si los guardaste
        // y actualizar su estado a "Pago Anulado por Usuario" o similar.
        redirectUrl = `${FRONTEND_URL}/pago/resultado?estado=anulado&mensaje=Pago%20anulado%20por%20el%20usuario`;
        return res.redirect(redirectUrl);
    }

    if (!tokenWs) {
        console.error("[WebpayController] No se recibió token_ws en el retorno de Webpay.");
        // Esto podría pasar si el usuario cierra la ventana de Webpay sin completar o anular.
        redirectUrl = `${FRONTEND_URL}/pago/resultado?estado=error&mensaje=No%20se%20completo%20el%20proceso%20de%20pago`;
        return res.redirect(redirectUrl);
    }

    try {
        const commitResponse = await webpayService.confirmarTransaccionWebpay(tokenWs);
        console.log("[WebpayController] Respuesta del commit:", commitResponse);

        // Recuperar el id_pedido original. El buyOrder que generaste contenía el numero_compra.
        // Necesitas una forma de mapear commitResponse.buyOrder de vuelta a tu id_pedido.
        // Si tu buyOrder fue `FERREMAS-${pedido.numero_compra}-${timestamp}`,
        // podrías extraer el numero_compra y buscar el pedido.
        // EJEMPLO (necesitas ajustar esto a tu lógica de buyOrder):
        const numeroCompraOriginal = commitResponse.buyOrder.split('-')[1]; // ¡Esto es un ejemplo, ajústalo!
        const pedido = await new Promise((resolve, reject) => {
            // Debes tener una función en PedidoModel para buscar por numero_compra
            // PedidoModel.obtenerPedidoPorNumeroCompra(numeroCompraOriginal, (err, data) => { ... });
            // Por ahora, asumimos que tienes una forma de obtener el id_pedido.
            // TEMPORALMENTE, buscaremos el último pedido no pagado para el ejemplo. NO USAR EN PRODUCCIÓN.
            // En una implementación real, el buyOrder debe estar ligado de forma segura a tu id_pedido.
             console.warn("[WebpayController] ADVERTENCIA: Lógica de recuperación de pedido es de ejemplo. Implementar correctamente.");
             db.query("SELECT id_pedido FROM pedido WHERE numero_compra = ? ORDER BY id_pedido DESC LIMIT 1", [numeroCompraOriginal], (err, results) => {
                 if (err || results.length === 0) return reject(new Error('No se pudo encontrar el pedido original desde buyOrder.'));
                 resolve({ id_pedido: results[0].id_pedido, id_moneda_pedido: commitResponse.amount === Math.round(commitResponse.amount) ? 1 : 2 /* Lógica de moneda */ }); // Asume moneda 1 (CLP)
             });
        });
        const idPedidoOriginal = pedido.id_pedido;
        const idMonedaOriginal = pedido.id_moneda_pedido || 1; // Asume CLP por defecto o la moneda del pedido

        if (commitResponse.status === 'AUTHORIZED' && commitResponse.responseCode === 0) {
            // PAGO APROBADO
            console.log(`[WebpayController] Pago APROBADO para buyOrder: ${commitResponse.buyOrder}, monto: ${commitResponse.amount}`);

            // 1. Actualizar estado del pedido
            await new Promise((resolve, reject) => {
                PedidoModel.actualizarPedido(idPedidoOriginal, { id_estado: 3 }, (err, result) => { // Asume 3 = 'Pagado'
                    if (err) return reject(err);
                    resolve(result);
                });
            });

            // 2. Crear registro de pago
            const datosPago = {
                id_pedido: idPedidoOriginal,
                id_metodo: ID_METODO_PAGO_WEBPAY,
                estado: 'Completado',
                fecha_pago: commitResponse.transactionDate, // Formato: YYYY-MM-DDTHH:mm:ss.sssZ
                monto: commitResponse.amount,
                referencia_transaccion: commitResponse.authorizationCode, // Código de autorización
                comprobante_url: null, // Opcional
                id_moneda: idMonedaOriginal // Usar la moneda del pedido
            };
            await new Promise((resolve, reject) => {
                PagoModel.crearPago(datosPago, (err, result) => {
                    if (err) return reject(err);
                    resolve(result);
                });
            });
            redirectUrl = `${FRONTEND_URL}/pago/resultado?estado=exito&orden=${commitResponse.buyOrder}&monto=${commitResponse.amount}`;
        } else {
            // PAGO RECHAZADO o con error
            console.log(`[WebpayController] Pago RECHAZADO/ERROR para buyOrder: ${commitResponse.buyOrder}, status: ${commitResponse.status}, responseCode: ${commitResponse.responseCode}`);
            await new Promise((resolve, reject) => { // Actualizar pedido a 'Pago Fallido' (ej. id_estado = 8)
                PedidoModel.actualizarPedido(idPedidoOriginal, { id_estado: 8 }, (err, result) => {
                     if (err) console.error("Error actualizando pedido a fallido:", err); // No rechazar para poder redirigir
                    resolve(result);
                });
            });
            const mensajeError = encodeURIComponent(`Pago rechazado. Código: ${commitResponse.responseCode}. Intente nuevamente.`);
            redirectUrl = `${FRONTEND_URL}/pago/resultado?estado=fallido&orden=${commitResponse.buyOrder}&mensaje=${mensajeError}`;
        }
        res.redirect(redirectUrl);

    } catch (error) {
        console.error("[WebpayController] Error crítico en el retorno/commit de Webpay:", error);
        redirectUrl = `${FRONTEND_URL}/pago/resultado?estado=error&mensaje=Error%20procesando%20el%20pago`;
        res.redirect(redirectUrl); // Redirigir a una página de error en el frontend
    }
};