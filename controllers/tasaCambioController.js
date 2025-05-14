// controllers/tasaCambioController.js
const exchangeRateService = require('../services/exchangeRateService');
const TasaCambioModel = require('../models/tasaCambioModel');

/**
 * Endpoint para forzar la actualización de la tasa USD a CLP desde la API externa
 * y guardarla en la base de datos.
 */
exports.actualizarTasaUsdClpEnBD = async (req, res) => {
    try {
        const tasaUsdClp = await exchangeRateService.obtenerTasaEspecifica('USD', 'CLP');

        if (tasaUsdClp === null) {
            return res.status(502).json({ error: 'No se pudo obtener la tasa de cambio de la API externa.' });
        }

        // Obtener IDs de moneda para USD y CLP (asumiendo que existen en tu tabla 'moneda')
        // Podrías hardcodearlos si los conoces y no cambian, pero obtenerlos es más robusto.
        let idUsd, idClp;
        try {
            idUsd = await new Promise((resolve, reject) => {
                TasaCambioModel.obtenerIdMonedaPorCodigo('USD', (err, id) => {
                    if (err || !id) return reject(err || new Error('ID de USD no encontrado'));
                    resolve(id);
                });
            });
            idClp = await new Promise((resolve, reject) => {
                TasaCambioModel.obtenerIdMonedaPorCodigo('CLP', (err, id) => {
                    if (err || !id) return reject(err || new Error('ID de CLP no encontrado'));
                    resolve(id);
                });
            });
        } catch (dbError) {
            console.error("[TasaCambioController] Error obteniendo IDs de moneda:", dbError);
            return res.status(500).json({ error: 'Error de configuración de base de datos: Monedas USD o CLP no encontradas.' });
        }

        TasaCambioModel.guardarOActualizarTasa(idUsd, idClp, tasaUsdClp, (err, result) => {
            if (err) {
                console.error("[TasaCambioController] Error al guardar/actualizar tasa en BD:", err);
                return res.status(500).json({ error: 'Error interno al guardar la tasa de cambio.' });
            }
            res.status(200).json({ 
                message: 'Tasa USD a CLP actualizada y guardada exitosamente.', 
                tasa: tasaUsdClp,
                resultadoDB: result 
            });
        });

    } catch (error) { // Captura errores de las llamadas async/await a exchangeRateService
        console.error("[TasaCambioController] Error general en actualizarTasaUsdClpEnBD:", error);
        res.status(500).json({ error: 'Error procesando la solicitud de tasa de cambio.' });
    }
};

/**
 * Endpoint para obtener la tasa de conversión más reciente entre dos monedas desde la BD.
 */
exports.obtenerTasaAlmacenada = async (req, res) => {
    const { monedaOrigenCodigo, monedaDestinoCodigo } = req.query; // ej. ?monedaOrigenCodigo=USD&monedaDestinoCodigo=CLP

    if (!monedaOrigenCodigo || !monedaDestinoCodigo) {
        return res.status(400).json({ error: 'Los parámetros monedaOrigenCodigo y monedaDestinoCodigo son requeridos.' });
    }

    try {
        let idMonedaOrigen, idMonedaDestino;
         try {
            idMonedaOrigen = await new Promise((resolve, reject) => {
                TasaCambioModel.obtenerIdMonedaPorCodigo(monedaOrigenCodigo, (err, id) => {
                    if (err || !id) return reject(err || new Error(`ID de ${monedaOrigenCodigo} no encontrado`));
                    resolve(id);
                });
            });
            idMonedaDestino = await new Promise((resolve, reject) => {
                TasaCambioModel.obtenerIdMonedaPorCodigo(monedaDestinoCodigo, (err, id) => {
                    if (err || !id) return reject(err || new Error(`ID de ${monedaDestinoCodigo} no encontrado`));
                    resolve(id);
                });
            });
        } catch (dbError) {
            console.error("[TasaCambioController] Error obteniendo IDs de moneda para obtenerTasaAlmacenada:", dbError);
            return res.status(400).json({ error: `Error: Una o ambas monedas (${monedaOrigenCodigo}, ${monedaDestinoCodigo}) no se encontraron en la base de datos.` });
        }

        TasaCambioModel.obtenerTasaReciente(idMonedaOrigen, idMonedaDestino, (err, tasaInfo) => {
            if (err) {
                console.error("[TasaCambioController] Error al obtener tasa almacenada:", err);
                return res.status(500).json({ error: 'Error interno al obtener la tasa de cambio almacenada.' });
            }
            if (!tasaInfo) {
                return res.status(404).json({ 
                    message: `No se encontró una tasa de cambio almacenada para ${monedaOrigenCodigo} a ${monedaDestinoCodigo}. Puede intentar actualizarla primero.` 
                });
            }
            res.status(200).json(tasaInfo);
        });
    } catch (error) {
        console.error("[TasaCambioController] Error general en obtenerTasaAlmacenada:", error);
        res.status(500).json({ error: 'Error procesando la solicitud para obtener la tasa almacenada.' });
    }
};

/**
 * Lista todas las tasas guardadas en la BD (para administración o depuración)
 */
exports.listarTasasGuardadas = (req, res) => {
    TasaCambioModel.listarTodasLasTasasGuardadas((err, tasas) => {
        if (err) {
            console.error("[TasaCambioController] Error al listar tasas guardadas:", err);
            return res.status(500).json({ error: 'Error interno al listar las tasas guardadas.' });
        }
        res.status(200).json(tasas);
    });
};