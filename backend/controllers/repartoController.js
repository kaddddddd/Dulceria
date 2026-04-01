// controllers/repartoController.js
// Productos con propietario_id → 100% del propietario, no entran al pool general.
// Ganancia general = ventas_generales − gastos → 50/50.
const { pool } = require('../config/db');

async function getReparto(req, res) {
  try {
    const { fecha_inicio, fecha_fin, duena_id } = req.query;
    const inicio = fecha_inicio || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const fin    = fecha_fin    || new Date().toISOString().split('T')[0];

    // Total ventas
    const [[{ total_ventas }]] = await pool.query(
      `SELECT COALESCE(SUM(total), 0) AS total_ventas FROM ventas WHERE DATE(fecha) BETWEEN ? AND ?`,
      [inicio, fin]
    );

    // Ingresos de productos propios (propietario_id IS NOT NULL)
    const [[{ ingresos_propios }]] = await pool.query(
      `SELECT COALESCE(SUM(dv.subtotal), 0) AS ingresos_propios
       FROM detalle_ventas dv
       JOIN ventas    v ON dv.venta_id    = v.id
       JOIN productos p ON dv.producto_id = p.id
       WHERE DATE(v.fecha) BETWEEN ? AND ?
         AND p.propietario_id IS NOT NULL
         ${duena_id ? 'AND p.propietario_id = ?' : ''}`,
      duena_id ? [inicio, fin, duena_id] : [inicio, fin]
    );

    // Productos propios registrados
    const [productos_propios] = await pool.query(
      `SELECT p.id, p.nombre, v.nombre AS propietario
       FROM productos p
       JOIN vendedores v ON p.propietario_id = v.id
       ${duena_id ? 'WHERE p.propietario_id = ?' : 'WHERE p.propietario_id IS NOT NULL'}`,
      duena_id ? [duena_id] : []
    );

    // Ventas generales (sin propios)
    const ventas_generales = Number(total_ventas) - Number(ingresos_propios);

    // Gastos → solo se restan al pool general
    const [[{ total_gastos }]] = await pool.query(
      `SELECT COALESCE(SUM(monto), 0) AS total_gastos FROM gastos WHERE fecha BETWEEN ? AND ?`,
      [inicio, fin]
    );

    const ganancia_general = ventas_generales - Number(total_gastos);

    // Distribución
    const dueno_bruto    = Number(ingresos_propios) + ganancia_general * 0.5;
    const vendedor_bruto = ganancia_general * 0.5;

    // Retiros
    const [retiros_raw] = await pool.query(
      `SELECT persona, COALESCE(SUM(monto), 0) AS total_retirado
       FROM retiros WHERE fecha BETWEEN ? AND ? GROUP BY persona`,
      [inicio, fin]
    );
    const retiros_map = {};
    retiros_raw.forEach(r => { retiros_map[r.persona] = Number(r.total_retirado); });

    const dueno_retirado    = retiros_map['Dueño']    || 0;
    const vendedor_retirado = retiros_map['Vendedor'] || 0;

    const [historial] = await pool.query(
      `SELECT * FROM retiros WHERE fecha BETWEEN ? AND ? ORDER BY fecha DESC`,
      [inicio, fin]
    );

    res.json({
      periodo: { inicio, fin },
      tiene_propios: productos_propios.length > 0,
      productos_propios,
      propios: { ingresos: Number(ingresos_propios) },
      general: {
        ventas:   ventas_generales,
        gastos:   Number(total_gastos),
        ganancia: ganancia_general,
      },
      distribucion: {
        dueno: {
          bruto:     dueno_bruto,
          retirado:  dueno_retirado,
          pendiente: Math.max(0, dueno_bruto - dueno_retirado),
        },
        vendedor: {
          bruto:     vendedor_bruto,
          retirado:  vendedor_retirado,
          pendiente: Math.max(0, vendedor_bruto - vendedor_retirado),
        },
      },
      historial,
    });
  } catch (error) {
    console.error('Error al calcular reparto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = { getReparto };
