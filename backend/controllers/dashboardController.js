// controllers/dashboardController.js
const { pool } = require('../config/db');

// GET /api/dashboard — Resumen general del negocio
async function getDashboard(req, res) {
  try {
    const { fecha_inicio, fecha_fin } = req.query;

    // Parámetros de fecha (por defecto mes actual)
    const inicio = fecha_inicio || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const fin = fecha_fin || new Date().toISOString().split('T')[0];

    // Total vendido en el período
    const [[{ total_ventas }]] = await pool.query(
      `SELECT COALESCE(SUM(total), 0) AS total_ventas FROM ventas WHERE DATE(fecha) BETWEEN ? AND ?`,
      [inicio, fin]
    );

    // Total gastado en el período
    const [[{ total_gastos }]] = await pool.query(
      `SELECT COALESCE(SUM(monto), 0) AS total_gastos FROM gastos WHERE fecha BETWEEN ? AND ?`,
      [inicio, fin]
    );

    // Ganancia neta
    const ganancia_neta = total_ventas - total_gastos;

    // Número de ventas en el período
    const [[{ num_ventas }]] = await pool.query(
      `SELECT COUNT(*) AS num_ventas FROM ventas WHERE DATE(fecha) BETWEEN ? AND ?`,
      [inicio, fin]
    );

    // Productos con stock bajo (menos de 10 unidades)
    const [productos_bajo_stock] = await pool.query(
      `SELECT id, nombre, stock FROM productos WHERE stock < 10 ORDER BY stock ASC`
    );

    // Top 5 productos más vendidos
    const [top_productos] = await pool.query(
      `SELECT p.nombre, SUM(dv.cantidad) AS total_vendido, SUM(dv.subtotal) AS ingresos
       FROM detalle_ventas dv
       JOIN ventas v ON dv.venta_id = v.id
       JOIN productos p ON dv.producto_id = p.id
       WHERE DATE(v.fecha) BETWEEN ? AND ?
       GROUP BY p.id, p.nombre
       ORDER BY total_vendido DESC
       LIMIT 5`,
      [inicio, fin]
    );

    // Top vendedores en el período
    const [top_vendedores] = await pool.query(
      `SELECT vend.nombre, COUNT(v.id) AS num_ventas, COALESCE(SUM(v.total), 0) AS total
       FROM vendedores vend
       LEFT JOIN ventas v ON vend.id = v.vendedor_id AND DATE(v.fecha) BETWEEN ? AND ?
       GROUP BY vend.id, vend.nombre
       ORDER BY total DESC`,
      [inicio, fin]
    );

    // Ventas de los últimos 7 días para gráfico
    const [ventas_recientes] = await pool.query(
      `SELECT DATE(fecha) AS dia, SUM(total) AS total, COUNT(*) AS cantidad
       FROM ventas
       WHERE DATE(fecha) >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
       GROUP BY DATE(fecha)
       ORDER BY dia ASC`
    );

    res.json({
      periodo: { inicio, fin },
      resumen: {
        total_ventas: Number(total_ventas),
        total_gastos: Number(total_gastos),
        ganancia_neta: Number(ganancia_neta),
        num_ventas: Number(num_ventas),
      },
      productos_bajo_stock,
      top_productos,
      top_vendedores,
      ventas_recientes,
    });
  } catch (error) {
    console.error('Error al obtener dashboard:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = { getDashboard };
