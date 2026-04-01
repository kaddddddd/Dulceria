// controllers/ventasController.js
const { pool } = require('../config/db');

// GET /api/ventas — Historial de ventas con detalle
async function getVentas(req, res) {
  try {
    const { fecha_inicio, fecha_fin } = req.query;

    let query = `
      SELECT 
        v.id,
        v.total,
        v.fecha,
        vend.nombre AS vendedor,
        vend.id AS vendedor_id
      FROM ventas v
      JOIN vendedores vend ON v.vendedor_id = vend.id
    `;
    const params = [];

    if (fecha_inicio && fecha_fin) {
      query += ' WHERE DATE(v.fecha) BETWEEN ? AND ?';
      params.push(fecha_inicio, fecha_fin);
    }
    query += ' ORDER BY v.fecha DESC';

    const [ventas] = await pool.query(query, params);

    // Para cada venta, obtener el detalle de productos
    for (const venta of ventas) {
      const [detalle] = await pool.query(
        `SELECT dv.*, p.nombre AS producto_nombre
         FROM detalle_ventas dv
         JOIN productos p ON dv.producto_id = p.id
         WHERE dv.venta_id = ?`,
        [venta.id]
      );
      venta.detalle = detalle;
    }

    res.json(ventas);
  } catch (error) {
    console.error('Error al obtener ventas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// POST /api/ventas — Registrar nueva venta
async function createVenta(req, res) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { vendedor_id, items } = req.body;
    // items: [{ producto_id, cantidad, precio_unitario }]

    if (!vendedor_id || !items || items.length === 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'Vendedor e ítems son requeridos' });
    }

    let total = 0;

    // Calcular total y verificar que los productos existen
    for (const item of items) {
      const [rows] = await connection.query(
        'SELECT id, nombre, stock FROM productos WHERE id = ?',
        [item.producto_id]
      );
      if (rows.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: `Producto ID ${item.producto_id} no encontrado` });
      }
      total += item.precio_unitario * item.cantidad;
    }

    // Insertar la venta principal
    const [ventaResult] = await connection.query(
      'INSERT INTO ventas (vendedor_id, total) VALUES (?, ?)',
      [vendedor_id, total]
    );
    const ventaId = ventaResult.insertId;

    // Insertar detalle y descontar stock de forma atómica
    for (const item of items) {
      const subtotal = item.precio_unitario * item.cantidad;

      await connection.query(
        'INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)',
        [ventaId, item.producto_id, item.cantidad, item.precio_unitario, subtotal]
      );

      // Descuenta solo si hay stock suficiente — operación atómica, evita stock negativo
      const [upd] = await connection.query(
        'UPDATE productos SET stock = stock - ? WHERE id = ? AND stock >= ?',
        [item.cantidad, item.producto_id, item.cantidad]
      );

      if (upd.affectedRows === 0) {
        await connection.rollback();
        const [[prod]] = await connection.query('SELECT nombre, stock FROM productos WHERE id = ?', [item.producto_id]);
        return res.status(400).json({
          error: `Stock insuficiente para "${prod.nombre}". Disponible: ${prod.stock}, solicitado: ${item.cantidad}`
        });
      }
    }

    await connection.commit();

    // Devolver la venta con detalle
    const [newVenta] = await connection.query(
      `SELECT v.*, vend.nombre AS vendedor FROM ventas v JOIN vendedores vend ON v.vendedor_id = vend.id WHERE v.id = ?`,
      [ventaId]
    );
    const [detalle] = await connection.query(
      `SELECT dv.*, p.nombre AS producto_nombre FROM detalle_ventas dv JOIN productos p ON dv.producto_id = p.id WHERE dv.venta_id = ?`,
      [ventaId]
    );
    newVenta[0].detalle = detalle;

    res.status(201).json(newVenta[0]);
  } catch (error) {
    await connection.rollback();
    console.error('Error al crear venta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    connection.release();
  }
}

// DELETE /api/ventas/:id — Eliminar venta (devuelve stock)
async function deleteVenta(req, res) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;

    const [existing] = await connection.query('SELECT id FROM ventas WHERE id = ?', [id]);
    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    // Devolver stock antes de eliminar
    const [detalles] = await connection.query(
      'SELECT producto_id, cantidad FROM detalle_ventas WHERE venta_id = ?', [id]
    );
    for (const d of detalles) {
      await connection.query('UPDATE productos SET stock = stock + ? WHERE id = ?', [d.cantidad, d.producto_id]);
    }

    await connection.query('DELETE FROM ventas WHERE id = ?', [id]);
    await connection.commit();
    res.json({ message: 'Venta eliminada y stock restaurado' });
  } catch (error) {
    await connection.rollback();
    console.error('Error al eliminar venta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    connection.release();
  }
}

module.exports = { getVentas, createVenta, deleteVenta };
