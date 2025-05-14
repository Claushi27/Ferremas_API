// services/exchangeRateService.js
const axios = require('axios');

// IMPORTANTE: Esta es TU API Key
const API_KEY = 'c72c9c4a82b5b623f0f70e4c'; 
const BASE_URL = `https://v6.exchangerate-api.com/v6/${API_KEY}`; // Asegúrate que API_KEY aquí esté definida y correcta

/**
 * Obtiene las últimas tasas de cambio desde una moneda base (por defecto USD).
 * @param {string} monedaBase - El código de la moneda base (ej. 'USD', 'EUR'). Por defecto 'USD'.
 * @returns {Promise<object|null>} Objeto con las tasas de conversión o null en caso de error.
 */
async function obtenerTasasDeConversion(monedaBase = 'USD') {
    try {
        // Log para depurar las variables
        console.log(`[ExchangeRateService] API_KEY: ${API_KEY}`);
        console.log(`[ExchangeRateService] BASE_URL construida: ${BASE_URL}`);
        console.log(`[ExchangeRateService] monedaBase recibida: ${monedaBase}`);

        const monedaBaseUpper = monedaBase.toUpperCase();
        const url = `${BASE_URL}/latest/${monedaBaseUpper}`; // Aquí se construye la URL final
        
        console.log(`[ExchangeRateService] Solicitando tasas de cambio desde URL final: ${url}`); // Log de la URL final
        
        const response = await axios.get(url);

        if (response.data && response.data.result === 'success' && response.data.conversion_rates) {
            console.log(`[ExchangeRateService] Tasas obtenidas exitosamente para ${monedaBaseUpper}.`);
            return response.data.conversion_rates;
        } else {
            console.error("[ExchangeRateService] Error en la respuesta de la API de tasas:", response.data);
            return null;
        }
    } catch (error) {
        if (error.isAxiosError && error.message.includes('Invalid URL')) { // Chequeo específico para Invalid URL
             console.error(`[ExchangeRateService] Error: URL Inválida. La URL construida fue: ${BASE_URL}/latest/${monedaBase ? monedaBase.toUpperCase() : 'MONEDA_BASE_UNDEFINED'}`);
        } else if (error.response) {
            console.error("[ExchangeRateService] Error de respuesta de API:", error.response.status, error.response.data);
        } else if (error.request) {
            console.error("[ExchangeRateService] No se recibió respuesta de API:", error.request);
        } else {
            console.error("[ExchangeRateService] Error al configurar la solicitud a API:", error.message);
        }
        return null;
    }
}

/**
 * Obtiene específicamente la tasa de conversión de una moneda origen a una moneda destino.
 */
async function obtenerTasaEspecifica(monedaOrigen = 'USD', monedaDestino = 'CLP') {
    console.log(`[ExchangeRateService] Solicitando tasa de ${monedaOrigen} a ${monedaDestino}`);
    const tasasDesdeOrigen = await obtenerTasasDeConversion(monedaOrigen); // No es necesario toUpperCase() aquí si la función ya lo hace
    
    if (tasasDesdeOrigen && tasasDesdeOrigen[monedaDestino.toUpperCase()]) {
        const tasa = parseFloat(tasasDesdeOrigen[monedaDestino.toUpperCase()]);
        console.log(`[ExchangeRateService] Tasa ${monedaOrigen} a ${monedaDestino} obtenida: ${tasa}`);
        return tasa;
    }
    console.error(`[ExchangeRateService] No se pudo obtener la tasa de ${monedaOrigen} a ${monedaDestino}. TasasDesdeOrigen:`, tasasDesdeOrigen);
    return null;
}

module.exports = {
    obtenerTasasDeConversion,
    obtenerTasaEspecifica
};