// controllers/pagoController.js
const PagoModel = require('../models/pagoModel'); // Asegúrate de que esta línea esté presente

// Obtener todos los pagos
exports.obtenerTodos = (req, res) => {
    PagoModel.obtenerTodosLosPagos((err, pagos) => {
        if (err) {
            console.error("Error al obtener todos los pagos:", err);
            return res.status(500).json({ error: 'Error interno al obtener los pagos.' });
        }
        res.status(200).json(pagos);
    });
};

// Obtener un pago por su ID
exports.obtenerPorId = (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'ID de pago inválido.' });
    }
    PagoModel.obtenerPagoPorId(id, (err, pago) => {
        if (err) {
            console.error(`Error al obtener pago con ID ${id}:`, err);
            return res.status(500).json({ error: 'Error interno al obtener el pago.' });
        }
        if (!pago) {
            return res.status(404).json({ error: 'Pago no encontrado.' });
        }
        res.status(200).json(pago);
    });
};

// MODIFICACIÓN CLAVE AQUÍ: Obtener pagos asociados a un pedido específico
// Antes: Devolvía 404 si no encontraba pagos
// Ahora: Devolverá 200 OK con un array vacío [] si no encuentra pagos
exports.obtenerPagosPorPedido = (req, res) => {
    const id_pedido = parseInt(req.params.id_pedido);
    if (isNaN(id_pedido)) {
        return res.status(400).json({ error: 'ID de pedido inválido.' });
    }
    PagoModel.obtenerPagosPorPedidoId(id_pedido, (err, pagos) => {
        if (err) {
            console.error(`Error al obtener pagos para el pedido ${id_pedido}:`, err);
            return res.status(500).json({ error: 'Error interno al obtener los pagos del pedido.' });
        }
        // CAMBIO CLAVE: Siempre devuelve 200 OK, y un array vacío si no hay pagos
        res.status(200).json(pagos || []); //
    });
};