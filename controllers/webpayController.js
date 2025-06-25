// controllers/webpayController.js
const webpayService = require('../services/webpayService');
const PedidoModel = require('../models/pedidoModel');     
const PagoModel = require('../models/pagoModel');     
const db = require('../config/db'); 

const ID_METODO_PAGO_WEBPAY = 4; 
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'; 

/**
 * Crea (inicia) una transacción en Webpay.
 */
exports.crearTransaccion = async (req, res) => {
    const { id_pedido } = req.body;

    if (!id_pedido) {
        return res.status(400).json({ error: 'El id_pedido es requerido.' });
    }

    try {
        const pedido = await new Promise((resolve, reject) => {
            PedidoModel.obtenerPedidoConDetallesPorId(id_pedido, (err, data) => { 
                if (err) return reject(new Error('Error al obtener el pedido.'));
                if (!data) return reject(new Error(`Pedido con ID ${id_pedido} no encontrado.`));
                if (data.id_estado === 3) { 
                     return reject(new Error(`El pedido ${id_pedido} ya ha sido pagado.`));
                }
                resolve(data);
            });
        });

        const buyOrder = pedido.numero_compra;        
        const sessionId = `SESS-${pedido.id_pedido}-${Date.now()}`; 
        const amount = Math.round(pedido.total_con_impuesto); 
        const returnUrl = `${req.protocol}://${req.get('host')}/api/pagos/webpay/retorno`;

        const webpayResponse = await webpayService.iniciarTransaccionWebpay(buyOrder, sessionId, amount, returnUrl); 

        res.status(200).json({
            url_webpay: webpayResponse.url,
            token_ws: webpayResponse.token,
            buy_order: buyOrder,
            session_id: sessionId
        });

    } catch (error) {
        console.error("[WebpayController] Error al crear transacción:", error.message);
        res.status(500).json({ error: error.message || 'Error interno al procesar el inicio del pago.' });
    }
};

/**
 * Maneja el retorno de Webpay después de que el usuario interactúa con la plataforma de pago.
 */
exports.retornoWebpay = async (req, res) => {
    // --- CONSOLE.LOGS INICIALES PARA DEPURACIÓN ---
    console.log("\n--- INICIO RETORNO WEBPAY ---");
    console.log("Método de solicitud:", req.method); 
    console.log("req.body recibido (raw):", req.body); 
    console.log("req.query recibido (raw):", req.query); 
    console.log("--- FIN CONSOLE.LOGS DEPURACIÓN INICIAL ---\n");

    // Extracción SÚPER DEFENSIVA de tokens
    const tokenWs = (req.method === 'POST' ? req.body?.token_ws : req.query?.token_ws) || null;
    const tbkToken = (req.method === 'POST' ? req.body?.TBK_TOKEN : req.query?.TBK_TOKEN) || null;
    const tbkOrdenCompra = (req.method === 'POST' ? req.body?.TBK_ORDEN_COMPura : req.query?.TBK_ORDEN_COMPRA) || null; // Corregido: TBK_ORDEN_COMPRA


    console.log("[WebpayController] Tokens extraídos (defensivo):");
    console.log("token_ws:", tokenWs);
    console.log("TBK_TOKEN:", tbkToken);
    console.log("TBK_ORDEN_COMPRA:", tbkOrdenCompra);
    
    let redirectUrl = `${FRONTEND_URL}/pago/resultado?estado=error&mensaje=Error%20desconocido`;

    // --- Lógica principal: Primero chequear TBK_TOKEN (anulación/abandono), luego token_ws (confirmación) ---
    if (tbkToken) { 
        console.log(`[WebpayController] Flujo de Anulación/Abandono. TBK_TOKEN: ${tbkToken}`);
        
        if (tbkOrdenCompra) { 
            try {
                console.log(`[WebpayController] En flujo de Anulación, buscando pedido por numero_compra: "${tbkOrdenCompra}"`);

                const pedidoParaActualizar = await new Promise((resolve, reject) => {
                    db.query("SELECT id_pedido FROM pedido WHERE numero_compra = ? ORDER BY id_pedido DESC LIMIT 1", [tbkOrdenCompra], (err, results) => {
                        if (err) {
                            console.error("[WebpayController] ERROR en consulta DB al buscar pedido para ANULACIÓN:", err);
                            resolve(null); 
                        }
                        if (results.length === 0) {
                            console.warn(`[WebpayController] Pedido para anulación con numero_compra "${tbkOrdenCompra}" NO ENCONTRADO en la BD.`);
                            resolve(null); 
                        } else {
                           console.log(`[WebpayController] Pedido para anulación con numero_compra "${tbkOrdenCompra}" ENCONTRADO. ID: ${results[0].id_pedido}`);
                           resolve(results[0].id_pedido);
                        }
                    });
                });

                if (pedidoParaActualizar) {
                    await new Promise((resolve, reject) => {
                        PedidoModel.actualizarPedido(pedidoParaActualizar, { id_estado: 8, comentarios: `Pago anulado/abandonado por usuario. TBK_TOKEN: ${tbkToken}` }, (errUpdate, resultUpdate) => { 
                            if (errUpdate) console.error("Error actualizando pedido a cancelado:", errUpdate);
                            resolve(resultUpdate);
                        });
                    });
                }
            } catch (updateErr) {
                console.error("[WebpayController] Falló la actualización de pedido tras anulación:", updateErr.message);
            }
        } else {
            console.warn("[WebpayController] TBK_ORDEN_COMPRA no disponible para actualizar pedido tras anulación.");
        }

        redirectUrl = `${FRONTEND_URL}/pago/resultado?estado=anulado&mensaje=Pago%20anulado%20por%20el%20usuario`;
        return res.redirect(redirectUrl);

    } else if (tokenWs) { 
        console.log(`[WebpayController] Flujo de Confirmación de Transacción. token_ws: ${tokenWs}`);
        let commitResponse;
        let isTransactionSuccessful = false; 
        let transactionDetails = {}; 

        try {
            commitResponse = await webpayService.confirmarTransaccionWebpay(tokenWs); 
            console.log("[WebpayController] Respuesta del commit:", commitResponse);

            // Extraer y validar los detalles clave de la respuesta de commit defensivamente
            const commitStatus = commitResponse?.status || 'UNKNOWN';
            // CORREGIDO: Usar response_code con guion bajo
            const commitResponseCode = commitResponse?.response_code; // <--- CAMBIO CLAVE AQUÍ
            const commitBuyOrder = commitResponse?.buy_order || 'N/A';
            const commitAmount = commitResponse?.amount || 0;
            const commitAuthorizationCode = commitResponse?.authorization_code || null; // Corregido: authorization_code
            const commitTransactionDate = commitResponse?.transaction_date || new Date().toISOString(); // Corregido: transaction_date


            // NUEVO CONSOLE.LOG para depurar tipos de datos
            console.log(`[WebpayController] Tipo de commitResponse.status: ${typeof commitStatus}, valor: ${commitStatus}`);
            console.log(`[WebpayController] Tipo de commitResponse.response_code: ${typeof commitResponseCode}, valor: ${commitResponseCode}`); // Corregido el log


            // Definir el éxito de la transacción
            // CORREGIDO: Usar commitResponseCode para la condición
            isTransactionSuccessful = (commitStatus === 'AUTHORIZED' && commitResponseCode === 0);

            // Capturar detalles para usar después
            transactionDetails = {
                status: commitStatus,
                responseCode: commitResponseCode, // Usar el nombre corregido aquí también
                buyOrder: commitBuyOrder,
                amount: commitAmount,
                authorizationCode: commitAuthorizationCode,
                transactionDate: commitTransactionDate
            };


            // Buscar el pedido en la BD (esto siempre se hace si hay tokenWs)
            const numeroCompraOriginal = transactionDetails.buyOrder; 
            if (!numeroCompraOriginal || numeroCompraOriginal === 'N/A') {
                console.error("[WebpayController] ERROR CRÍTICO: El buy_order de la respuesta de Transbank es inválido.");
                throw new Error("No se pudo obtener el número de compra de la respuesta de Transbank.");
            }
            
            console.log(`[WebpayController] En flujo de Confirmación, buscando pedido por numero_compra: "${numeroCompraOriginal}"`);
            
            let pedido = null;
            let idPedidoOriginal = null;
            let idMonedaOriginal = 1;

            try {
                pedido = await new Promise((resolve, reject) => {
                    db.query("SELECT id_pedido, id_moneda FROM pedido WHERE numero_compra = ? ORDER BY id_pedido DESC LIMIT 1", [numeroCompraOriginal], (err, results) => {
                        if (err) {
                            console.error("[WebpayController] ERROR en consulta DB al buscar pedido para CONFIRMACIÓN:", err);
                            return reject(new Error(`Error en la consulta DB: ${err.message}`));
                        }
                        if (results.length === 0) {
                            console.warn(`[WebpayController] Pedido para confirmación con numero_compra "${numeroCompraOriginal}" NO ENCONTRADO en la BD.`);
                            return reject(new Error('No se pudo encontrar el pedido original desde buyOrder.'));
                        }
                        console.log(`[WebpayController] Pedido para confirmación con numero_compra "${numeroCompraOriginal}" ENCONTRADO. ID: ${results[0].id_pedido}`);
                        resolve({ id_pedido: results[0].id_pedido, id_moneda_pedido: results[0].id_moneda });
                    });
                });
                idPedidoOriginal = pedido.id_pedido;
                idMonedaOriginal = pedido.id_moneda_pedido;
            } catch (pedidoError) {
                console.error("[WebpayController] ADVERTENCIA: Error al recuperar id_pedido desde buyOrder. ", pedidoError.message);
                throw new Error(`Error al mapear buyOrder ("${numeroCompraOriginal}") a un pedido existente: ${pedidoError.message}`);
            }

            // --- Lógica de Actualización de Pedido y Creación de Pago (basada en isTransactionSuccessful) ---
            if (isTransactionSuccessful) {
                console.log(`[WebpayController] Pago APROBADO para buyOrder: ${transactionDetails.buyOrder}, monto: ${transactionDetails.amount}`);

                await new Promise((resolve, reject) => {
                    PedidoModel.actualizarPedido(idPedidoOriginal, { id_estado: 3 }, (err, result) => { 
                        if (err) return reject(err);
                        resolve(result);
                    });
                });

                const datosPago = {
                    id_pedido: idPedidoOriginal,
                    id_metodo: ID_METODO_PAGO_WEBPAY,
                    estado: 'Completado',
                    fecha_pago: transactionDetails.transactionDate,
                    monto: transactionDetails.amount,
                    referencia_transaccion: transactionDetails.authorizationCode,
                    comprobante_url: null,
                    id_moneda: idMonedaOriginal
                };
                await new Promise((resolve, reject) => {
                    PagoModel.crearPago(datosPago, (err, result) => { 
                        if (err) return reject(err);
                        resolve(result);
                    });
                });
                redirectUrl = `${FRONTEND_URL}/pago/resultado?estado=exito&orden=${transactionDetails.buyOrder}&monto=${transactionDetails.amount}`;
            } else {
                console.log(`[WebpayController] Pago RECHAZADO/ERROR para buyOrder: ${transactionDetails.buyOrder}, status: ${transactionDetails.status}, responseCode: ${transactionDetails.responseCode}`);
                await new Promise((resolve, reject) => {
                    // Actualizar pedido a 'Pago Fallido' (id_estado = 8)
                    PedidoModel.actualizarPedido(idPedidoOriginal, { id_estado: 8, comentarios: `Pago rechazado. Código: ${transactionDetails.responseCode}. Transbank Status: ${transactionDetails.status}` }, (err, result) => { 
                         if (err) console.error("Error actualizando pedido a fallido:", err);
                        resolve(result);
                    });
                });
                const mensajeError = encodeURIComponent(`Pago rechazado. Código: ${transactionDetails.responseCode}. Intente nuevamente.`);
                redirectUrl = `${FRONTEND_URL}/pago/resultado?estado=fallido&orden=${transactionDetails.buyOrder}&mensaje=${mensajeError}`;
            }
            res.redirect(redirectUrl);

        } catch (error) {
            console.error("[WebpayController] Error crítico en el flujo de confirmación de Webpay:", error);
            const errorBuyOrder = commitResponse?.buy_order || 'N/A';
            const errorMessage = encodeURIComponent(`Error procesando el pago. Detalles: ${error.message}`);
            redirectUrl = `${FRONTEND_URL}/pago/resultado?estado=error&orden=${errorBuyOrder}&mensaje=${errorMessage}`;
            res.redirect(redirectUrl);
        }
    } else { 
        console.error("[WebpayController] Ni TBK_TOKEN ni token_ws recibidos. Flujo de retorno no reconocido o URL malformada.");
        redirectUrl = `${FRONTEND_URL}/pago/resultado?estado=error&mensaje=Error%20en%20el%20retorno%20de%20Transbank.%20No%20se%20recibieron%20tokens.`;
        return res.redirect(redirectUrl);
    }
};