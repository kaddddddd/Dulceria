// controllers/vendedoresController.js
const { pool } = require('../config/db');

// GET /api/vendedores — Listar vendedores con total vendido
async function getVendedores(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT
        vend.id,
        vend.nombre,
        vend.foto,
        vend.creado_en,
        COUNT(v.id) AS total_ventas,
        COALESCE(SUM(v.total), 0) AS total_vendido
      FROM vendedores vend
      LEFT JOIN ventas v ON vend.id = v.vendedor_id
      GROUP BY vend.id, vend.nombre, vend.foto, vend.creado_en
      ORDER BY total_vendido DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener vendedores:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// POST /api/vendedores — Crear vendedor
async function createVendedor(req, res) {
  try {
    const { nombre, foto } = req.body;
    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    const [result] = await pool.query(
      'INSERT INTO vendedores (nombre, foto) VALUES (?, ?)', [nombre.trim(), foto || null]
    );
    const [newVendedor] = await pool.query('SELECT * FROM vendedores WHERE id = ?', [result.insertId]);
    res.status(201).json(newVendedor[0]);
  } catch (error) {
    console.error('Error al crear vendedor:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// PUT /api/vendedores/:id — Actualizar vendedor
async function updateVendedor(req, res) {
  try {
    const { id } = req.params;
    const { nombre, foto } = req.body;

    const [existing] = await pool.query('SELECT id FROM vendedores WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Vendedor no encontrado' });
    }

    if (foto !== undefined) {
      await pool.query('UPDATE vendedores SET nombre = ?, foto = ? WHERE id = ?', [nombre, foto || null, id]);
    } else {
      await pool.query('UPDATE vendedores SET nombre = ? WHERE id = ?', [nombre, id]);
    }
    const [updated] = await pool.query('SELECT * FROM vendedores WHERE id = ?', [id]);
    res.json(updated[0]);
  } catch (error) {
    console.error('Error al actualizar vendedor:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// DELETE /api/vendedores/:id — Eliminar vendedor
async function deleteVendedor(req, res) {
  try {
    const { id } = req.params;
    const [existing] = await pool.query('SELECT id FROM vendedores WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Vendedor no encontrado' });
    }

    // Verificar si tiene ventas asociadas
    const [ventas] = await pool.query('SELECT id FROM ventas WHERE vendedor_id = ? LIMIT 1', [id]);
    if (ventas.length > 0) {
      return res.status(400).json({ error: 'No se puede eliminar: el vendedor tiene ventas registradas' });
    }

    await pool.query('DELETE FROM vendedores WHERE id = ?', [id]);
    res.json({ message: 'Vendedor eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar vendedor:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = { getVendedores, createVendedor, updateVendedor, deleteVendedor };
