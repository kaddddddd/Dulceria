// controllers/categoriasGastosController.js
const { pool } = require('../config/db');

async function getCategorias(req, res) {
  try {
    const [rows] = await pool.query('SELECT * FROM categorias_gastos ORDER BY nombre ASC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function createCategoria(req, res) {
  try {
    const { nombre } = req.body;
    if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre es requerido' });
    const [result] = await pool.query(
      'INSERT INTO categorias_gastos (nombre) VALUES (?)', [nombre.trim()]
    );
    const [[row]] = await pool.query('SELECT * FROM categorias_gastos WHERE id = ?', [result.insertId]);
    res.status(201).json(row);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Ya existe esa categoría' });
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function deleteCategoria(req, res) {
  try {
    const { id } = req.params;
    await pool.query('UPDATE gastos SET categoria_id = NULL WHERE categoria_id = ?', [id]);
    await pool.query('DELETE FROM categorias_gastos WHERE id = ?', [id]);
    res.json({ message: 'Categoría eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = { getCategorias, createCategoria, deleteCategoria };
