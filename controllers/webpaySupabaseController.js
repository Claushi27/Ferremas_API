// controllers/webpaySupabaseController.js
const webpayService = require('../services/webpayService');
const supabase = require('../config/supabase');

const ID_METODO_PAGO_WEBPAY = 4; // IMPORTANTE: Ajusta este ID al que tengas para "Webpay" en tu tabla metodo_pago

// URL base de tu frontend para redirecciones (ajusta según sea necesario)
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

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
        // 1. Obtener detalles del pedido desde Supabase
        const { data: pedido, error: pedidoError } = await supabase
            .from('pedido')
            .select(`
                *,
                detalle_pedido (
                    id_producto,
                    cantidad,
                    precio_unitario
                )
            `)
            .eq('id_pedido', id_pedido)
            .single();

        if (pedidoError) {
            console.error('[WebpaySupabaseController] Error al obtener pedido:', pedidoError);
            return res.status(404).json({ error: `Error al obtener el pedido: ${pedidoError.message}` });
        }

        if (!pedido) {
            return res.status(404).json({ error: `Pedido con ID ${id_pedido} no encontrado.` });
        }

        // Validar si el pedido ya fue pagado o está en un estado que no permite pagar
        if (pedido.id_estado === 3) { // Asumiendo que 3 es 'Pagado'
            return res.status(400).json({ error: `El pedido ${id_pedido} ya ha sido pagado.` });
        }

        const buyOrder = pedido.numero_compra;
        const sessionId = `SESS-${pedido.id_pedido}-${Date.now()}`; // Sesión única para Transbank
        const amount = Math.round(pedido.total_con_impuesto); // Monto total del pedido, Transbank espera enteros para CLP.
        const returnUrl = `${req.protocol}://${req.get('host')}/api/pagos/webpay/retorno`; // URL de retorno a este backend

        // 2. Iniciar transacción con Webpay
        const webpayResponse = await webpayService.iniciarTransaccionWebpay(buyOrder, sessionId, amount, returnUrl);

        // 3. Devolver URL y Token al frontend para la redirección
        res.status(200).json({
            url_webpay: webpayResponse.url,
            token_ws: webpayResponse.token, // Este es el token que el frontend debe enviar a la URL de Webpay
            buy_order: buyOrder, // Opcional, para referencia del frontend
            session_id: sessionId // Opcional
        });

    } catch (error) {
        console.error("[WebpaySupabaseController] Error al crear transacción:", error.message);
        res.status(500).json({ error: error.message || 'Error interno al procesar el inicio del pago.' });
    }
};

/**
 * Maneja el retorno de Webpay después de que el usuario interactúa con la plataforma de pago.
 * Confirma la transacción con Transbank y actualiza el estado del pedido y pago usando Supabase.
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
    const tbkOrdenCompra = (req.method === 'POST' ? req.body?.TBK_ORDEN_COMPRA : req.query?.TBK_ORDEN_COMPRA) || null;

    console.log("[WebpaySupabaseController] Tokens extraídos (defensivo):");
    console.log("token_ws:", tokenWs);
    console.log("TBK_TOKEN:", tbkToken);
    console.log("TBK_ORDEN_COMPRA:", tbkOrdenCompra);

    let redirectUrl = `${FRONTEND_URL}/pago/resultado?estado=error&mensaje=Error%20desconocido`;

    // --- Lógica principal: Primero chequear TBK_TOKEN (anulación/abandono), luego token_ws (confirmación) ---
    if (tbkToken) { // Este es el flujo de anulación o error temprano
        console.log(`[WebpaySupabaseController] Flujo de Anulación/Abandono. TBK_TOKEN: ${tbkToken}`);

        if (tbkOrdenCompra) { // Si la orden de compra viene en el TBK_TOKEN/QUERY
            try {
                console.log(`[WebpaySupabaseController] En flujo de Anulación, buscando pedido por numero_compra: "${tbkOrdenCompra}"`);

                // Buscar pedido usando Supabase
                const { data: pedidoParaActualizar, error: searchError } = await supabase
                    .from('pedido')
                    .select('id_pedido')
                    .eq('numero_compra', tbkOrdenCompra)
                    .order('id_pedido', { ascending: false })
                    .limit(1)
                    .single();

                if (searchError || !pedidoParaActualizar) {
                    console.warn(`[WebpaySupabaseController] Pedido para anulación con numero_compra "${tbkOrdenCompra}" NO ENCONTRADO en Supabase.`);
                } else {
                    console.log(`[WebpaySupabaseController] Pedido para anulación con numero_compra "${tbkOrdenCompra}" ENCONTRADO. ID: ${pedidoParaActualizar.id_pedido}`);

                    // Actualizar pedido a cancelado usando Supabase
                    const { error: updateError } = await supabase
                        .from('pedido')
                        .update({
                            id_estado: 8, // Estado cancelado
                            comentarios: `Pago anulado/abandonado por usuario. TBK_TOKEN: ${tbkToken}`
                        })
                        .eq('id_pedido', pedidoParaActualizar.id_pedido);

                    if (updateError) {
                        console.error("Error actualizando pedido a cancelado:", updateError);
                    }
                }
            } catch (updateErr) {
                console.error("[WebpaySupabaseController] Falló la actualización de pedido tras anulación:", updateErr.message);
            }
        } else {
            console.warn("[WebpaySupabaseController] TBK_ORDEN_COMPRA no disponible para actualizar pedido tras anulación.");
        }

        redirectUrl = `${FRONTEND_URL}/pago/resultado?estado=anulado&mensaje=Pago%20anulado%20por%20el%20usuario`;
        return res.redirect(redirectUrl);

    } else if (tokenWs) { // Este es el flujo de confirmación (normalmente POST con token_ws)
        console.log(`[WebpaySupabaseController] Flujo de Confirmación de Transacción. token_ws: ${tokenWs}`);
        let commitResponse;
        let isTransactionSuccessful = false;
        let transactionDetails = {};

        try {
            commitResponse = await webpayService.confirmarTransaccionWebpay(tokenWs);
            console.log("[WebpaySupabaseController] Respuesta del commit:", commitResponse);

            // Extraer y validar los detalles clave de la respuesta de commit defensivamente
            const commitStatus = commitResponse?.status || 'UNKNOWN';
            const commitResponseCode = commitResponse?.response_code;
            const commitBuyOrder = commitResponse?.buy_order || 'N/A';
            const commitAmount = commitResponse?.amount || 0;
            const commitAuthorizationCode = commitResponse?.authorization_code || null;
            const commitTransactionDate = commitResponse?.transaction_date || new Date().toISOString();

            console.log(`[WebpaySupabaseController] Tipo de commitResponse.status: ${typeof commitStatus}, valor: ${commitStatus}`);
            console.log(`[WebpaySupabaseController] Tipo de commitResponse.response_code: ${typeof commitResponseCode}, valor: ${commitResponseCode}`);

            // Definir el éxito de la transacción
            isTransactionSuccessful = (commitStatus === 'AUTHORIZED' && commitResponseCode === 0);

            // Capturar detalles para usar después
            transactionDetails = {
                status: commitStatus,
                responseCode: commitResponseCode,
                buyOrder: commitBuyOrder,
                amount: commitAmount,
                authorizationCode: commitAuthorizationCode,
                transactionDate: commitTransactionDate
            };

            // Buscar el pedido en Supabase
            const numeroCompraOriginal = transactionDetails.buyOrder;
            if (!numeroCompraOriginal || numeroCompraOriginal === 'N/A') {
                console.error("[WebpaySupabaseController] ERROR CRÍTICO: El buy_order de la respuesta de Transbank es inválido.");
                throw new Error("No se pudo obtener el número de compra de la respuesta de Transbank.");
            }

            console.log(`[WebpaySupabaseController] En flujo de Confirmación, buscando pedido por numero_compra: "${numeroCompraOriginal}"`);

            const { data: pedido, error: pedidoError } = await supabase
                .from('pedido')
                .select('id_pedido, id_moneda, id_sucursal')
                .eq('numero_compra', numeroCompraOriginal)
                .order('id_pedido', { ascending: false })
                .limit(1)
                .single();

            if (pedidoError || !pedido) {
                console.error("[WebpaySupabaseController] ERROR en consulta Supabase al buscar pedido para CONFIRMACIÓN:", pedidoError);
                throw new Error(`Error al mapear buyOrder ("${numeroCompraOriginal}") a un pedido existente: ${pedidoError?.message || 'Pedido no encontrado'}`);
            }

            const idPedidoOriginal = pedido.id_pedido;
            const idMonedaOriginal = pedido.id_moneda || 1;
            const idSucursalReduccion = pedido.id_sucursal || 1;

            console.log(`[WebpaySupabaseController] Pedido para confirmación con numero_compra "${numeroCompraOriginal}" ENCONTRADO. ID: ${idPedidoOriginal}`);

            // --- Lógica de Actualización de Pedido y Creación de Pago (basada en isTransactionSuccessful) ---
            if (isTransactionSuccessful) {
                console.log(`[WebpaySupabaseController] Pago APROBADO para buyOrder: ${transactionDetails.buyOrder}, monto: ${transactionDetails.amount}`);

                // 1. Actualizar estado del pedido a 'Pagado' (ID 3) usando Supabase
                const { error: updatePedidoError } = await supabase
                    .from('pedido')
                    .update({ id_estado: 3 })
                    .eq('id_pedido', idPedidoOriginal);

                if (updatePedidoError) {
                    console.error("Error actualizando pedido a pagado:", updatePedidoError);
                    throw new Error(`Error al actualizar pedido: ${updatePedidoError.message}`);
                }

                // 2. Crear registro de pago usando Supabase
                const datosPago = {
                    id_pedido: idPedidoOriginal,
                    id_metodo: ID_METODO_PAGO_WEBPAY,
                    estado: 'Completado',
                    fecha_pago: transactionDetails.transactionDate,
                    monto: transactionDetails.amount,
                    referencia_transaccion: `${transactionDetails.authorizationCode}-${Date.now()}`,
                    comprobante_url: null,
                    id_moneda: idMonedaOriginal
                };

                console.log("[WebpaySupabaseController] Intentando crear registro de pago con datos:", datosPago);

                const { data: pagoCreado, error: pagoError } = await supabase
                    .from('pago')
                    .insert([datosPago])
                    .select();

                if (pagoError) {
                    console.error("[WebpaySupabaseController] ERROR CRÍTICO al crear registro de pago:", pagoError);
                    throw new Error(`Error al crear pago: ${pagoError.message}`);
                }

                console.log("[WebpaySupabaseController] Registro de pago creado exitosamente:", pagoCreado);

                // 3. REDUCIR STOCK EN EL INVENTARIO usando Supabase
                console.log("[WebpaySupabaseController] Iniciando reducción de stock para el pedido:", idPedidoOriginal);

                // Obtener detalles del pedido para reducir stock
                const { data: pedidoCompleto, error: detalleError } = await supabase
                    .from('pedido')
                    .select(`
                        *,
                        detalle_pedido (
                            id_producto,
                            cantidad,
                            precio_unitario
                        )
                    `)
                    .eq('id_pedido', idPedidoOriginal)
                    .single();

                if (detalleError || !pedidoCompleto) {
                    console.error("[WebpaySupabaseController] ERROR al obtener detalles del pedido para reducción de stock:", detalleError);
                    throw new Error('Error al obtener detalles del pedido para reducir stock.');
                }

                if (pedidoCompleto.detalle_pedido && pedidoCompleto.detalle_pedido.length > 0) {
                    for (const item of pedidoCompleto.detalle_pedido) {
                        const idProducto = item.id_producto;
                        const cantidadComprada = item.cantidad;

                        console.log(`[WebpaySupabaseController] Reduciendo stock: Producto ID ${idProducto}, Cantidad ${cantidadComprada} en Sucursal ID ${idSucursalReduccion}`);

                        // Obtener stock actual usando Supabase
                        const { data: inventarioActual, error: stockError } = await supabase
                            .from('inventario_sucursal')
                            .select('*')
                            .eq('id_producto', idProducto)
                            .eq('id_sucursal', idSucursalReduccion)
                            .single();

                        if (stockError || !inventarioActual) {
                            console.error(`[WebpaySupabaseController] ERROR al obtener stock actual para Producto ID ${idProducto}:`, stockError);
                            throw new Error(`No se pudo obtener stock actual para producto ${idProducto}.`);
                        }

                        const nuevoStock = inventarioActual.stock - cantidadComprada;
                        if (nuevoStock < 0) {
                            console.warn(`[WebpaySupabaseController] ADVERTENCIA: Stock insuficiente para Producto ID ${idProducto}. Stock actual: ${inventarioActual.stock}, Cantidad comprada: ${cantidadComprada}`);
                            throw new Error(`Stock insuficiente para producto ${idProducto}.`);
                        }

                        // Actualizar stock usando Supabase
                        const { error: updateStockError } = await supabase
                            .from('inventario_sucursal')
                            .update({ stock: nuevoStock })
                            .eq('id_inventario', inventarioActual.id_inventario);

                        if (updateStockError) {
                            console.error(`[WebpaySupabaseController] ERROR final al actualizar stock de Producto ID ${idProducto}:`, updateStockError);
                            throw new Error(`Fallo al actualizar stock final para producto ${idProducto}: ${updateStockError.message}`);
                        }

                        console.log(`[WebpaySupabaseController] Stock actualizado para Producto ID ${idProducto}: Nuevo stock ${nuevoStock}`);
                    }
                } else {
                    console.warn("[WebpaySupabaseController] Pedido sin detalles de productos. No se redujo el stock.");
                }
                // --- FIN REDUCCIÓN DE STOCK ---

                redirectUrl = `${FRONTEND_URL}/pago/resultado?estado=exito&orden=${transactionDetails.buyOrder}&monto=${transactionDetails.amount}`;
            } else { // Pago RECHAZADO o con ERROR
                console.log(`[WebpaySupabaseController] Pago RECHAZADO/ERROR para buyOrder: ${transactionDetails.buyOrder}, status: ${transactionDetails.status}, responseCode: ${transactionDetails.responseCode}`);

                // Actualizar pedido a 'Pago Fallido' (id_estado = 8) usando Supabase
                const { error: updateErrorError } = await supabase
                    .from('pedido')
                    .update({
                        id_estado: 8,
                        comentarios: `Pago rechazado. Código: ${transactionDetails.responseCode}. Transbank Status: ${transactionDetails.status}`
                    })
                    .eq('id_pedido', idPedidoOriginal);

                if (updateErrorError) {
                    console.error("Error actualizando pedido a fallido:", updateErrorError);
                }

                const mensajeError = encodeURIComponent(`Pago rechazado. Código: ${transactionDetails.responseCode}. Intente nuevamente.`);
                redirectUrl = `${FRONTEND_URL}/pago/resultado?estado=fallido&orden=${transactionDetails.buyOrder}&mensaje=${mensajeError}`;
            }
            res.redirect(redirectUrl);

        } catch (error) {
            console.error("[WebpaySupabaseController] Error crítico en el flujo de confirmación de Webpay:", error);
            const errorBuyOrder = commitResponse?.buy_order || 'N/A';
            const errorMessage = encodeURIComponent(`Error procesando el pago. Detalles: ${error.message}`);
            redirectUrl = `${FRONTEND_URL}/pago/resultado?estado=error&orden=${errorBuyOrder}&mensaje=${errorMessage}`;
            res.redirect(redirectUrl);
        }
    } else {
        console.error("[WebpaySupabaseController] Ni TBK_TOKEN ni token_ws recibidos. Flujo de retorno no reconocido o URL malformada.");
        redirectUrl = `${FRONTEND_URL}/pago/resultado?estado=error&mensaje=Error%20en%20el%20retorno%20de%20Transbank.%20No%20se%20recibieron%20tokens.`;
        return res.redirect(redirectUrl);
    }
};