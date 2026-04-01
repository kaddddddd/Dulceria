// controllers/gastosController.js
const { pool } = require('../config/db');

const SELECT = `
  SELECT g.*, c.nombre AS categoria_nombre
  FROM gastos g
  LEFT JOIN categorias_gastos c ON g.categoria_id = c.id
`;

async function getGastos(req, res) {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    let query = SELECT;
    const params = [];
    if (fecha_inicio && fecha_fin) {
      query += ' WHERE g.fecha BETWEEN ? AND ?';
      params.push(fecha_inicio, fecha_fin);
    }
    query += ' ORDER BY c.nombre ASC, g.fecha DESC';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener gastos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function createGasto(req, res) {
  try {
    const { descripcion, monto, fecha, categoria_id } = req.body;
    if (!descripcion || !monto || !fecha)
      return res.status(400).json({ error: 'Descripción, monto y fecha son requeridos' });
    if (monto <= 0)
      return res.status(400).json({ error: 'El monto debe ser mayor a 0' });

    const [result] = await pool.query(
      'INSERT INTO gastos (descripcion, monto, fecha, categoria_id) VALUES (?, ?, ?, ?)',
      [descripcion, monto, fecha, categoria_id || null]
    );
    const [[row]] = await pool.query(`${SELECT} WHERE g.id = ?`, [result.insertId]);
    res.status(201).json(row);
  } catch (error) {
    console.error('Error al crear gasto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function updateGasto(req, res) {
  try {
    const { id } = req.params;
    const { descripcion, monto, fecha, categoria_id } = req.body;
    const [existing] = await pool.query('SELECT id FROM gastos WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Gasto no encontrado' });

    await pool.query(
      'UPDATE gastos SET descripcion = ?, monto = ?, fecha = ?, categoria_id = ? WHERE id = ?',
      [descripcion, monto, fecha, categoria_id || null, id]
    );
    const [[row]] = await pool.query(`${SELECT} WHERE g.id = ?`, [id]);
    res.json(row);
  } catch (error) {
    console.error('Error al actualizar gasto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function deleteGasto(req, res) {
  try {
    const { id } = req.params;
    const [existing] = await pool.query('SELECT id FROM gastos WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Gasto no encontrado' });
    await pool.query('DELETE FROM gastos WHERE id = ?', [id]);
    res.json({ message: 'Gasto eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar gasto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = { getGastos, createGasto, updateGasto, deleteGasto };
