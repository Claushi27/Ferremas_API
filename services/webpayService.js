// services/webpayService.js
const { WebpayPlus, Options, IntegrationApiKeys, IntegrationCommerceCodes, Environment } = require('transbank-sdk');

// Configurar para el ambiente de INTEGRACIÓN (pruebas)
const tx = new WebpayPlus.Transaction(new Options(IntegrationCommerceCodes.WEBPAY_PLUS, IntegrationApiKeys.WEBPAY, Environment.Integration));

/**
 * Inicia una transacción en Webpay Plus.
 * @param {string} buyOrder - Orden de compra única para la transacción.
 * @param {string} sessionId - ID de sesión único para la transacción.
 * @param {number} amount - Monto de la transacción.
 * @param {string} returnUrl - URL a la que Transbank redirigirá al usuario después del pago.
 * @returns {Promise<object>} Objeto con token y url para redirigir a Webpay.
 */
async function iniciarTransaccionWebpay(buyOrder, sessionId, amount, returnUrl) {
    console.log(`[WebpayService] Iniciando transacción: buyOrder=${buyOrder}, sessionId=${sessionId}, amount=${amount}, returnUrl=${returnUrl}`);
    try {
        const createResponse = await tx.create(buyOrder, sessionId, amount, returnUrl);
        console.log("[WebpayService] Respuesta de tx.create:", createResponse);
        return createResponse; // Contiene { token, url }
    } catch (error) {
        console.error("[WebpayService] Error en tx.create:", error);
        throw error; // Relanzar para que el controlador lo maneje
    }
}

/**
 * Confirma una transacción en Webpay Plus.
 * @param {string} tokenWs - Token recibido en la URL de retorno.
 * @returns {Promise<object>} Objeto con la respuesta detallada de la confirmación.
 */
async function confirmarTransaccionWebpay(tokenWs) {
    console.log(`[WebpayService] Confirmando transacción con tokenWs: ${tokenWs}`);
    try {
        const commitResponse = await tx.commit(tokenWs);
        console.log("[WebpayService] Respuesta de tx.commit:", commitResponse);
        return commitResponse;
    } catch (error) {
        console.error("[WebpayService] Error en tx.commit:", error);
        throw error; // Relanzar para que el controlador lo maneje
    }
}

module.exports = {
    iniciarTransaccionWebpay,
    confirmarTransaccionWebpay,
};