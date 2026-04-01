// controllers/retirosController.js
const { pool } = require('../config/db');

// GET /api/retiros
async function getRetiros(req, res) {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    let query = 'SELECT * FROM retiros';
    const params = [];

    if (fecha_inicio && fecha_fin) {
      query += ' WHERE fecha BETWEEN ? AND ?';
      params.push(fecha_inicio, fecha_fin);
    }
    query += ' ORDER BY fecha DESC, creado_en DESC';

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener retiros:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// POST /api/retiros
async function createRetiro(req, res) {
  try {
    const { persona, monto, concepto, fecha } = req.body;
    if (!persona || !monto || !fecha) {
      return res.status(400).json({ error: 'Persona, monto y fecha son requeridos' });
    }
    if (monto <= 0) {
      return res.status(400).json({ error: 'El monto debe ser mayor a 0' });
    }

    const [result] = await pool.query(
      'INSERT INTO retiros (persona, monto, concepto, fecha) VALUES (?, ?, ?, ?)',
      [persona, monto, concepto || '', fecha]
    );
    const [newRetiro] = await pool.query('SELECT * FROM retiros WHERE id = ?', [result.insertId]);
    res.status(201).json(newRetiro[0]);
  } catch (error) {
    console.error('Error al crear retiro:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// DELETE /api/retiros/:id
async function deleteRetiro(req, res) {
  try {
    const { id } = req.params;
    const [existing] = await pool.query('SELECT id FROM retiros WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Retiro no encontrado' });
    }
    await pool.query('DELETE FROM retiros WHERE id = ?', [id]);
    res.json({ message: 'Retiro eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar retiro:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = { getRetiros, createRetiro, deleteRetiro };
