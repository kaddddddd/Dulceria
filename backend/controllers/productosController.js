// controllers/productosController.js
const { pool } = require('../config/db');

// GET /api/productos — Listar todos los productos
async function getProductos(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, v.nombre AS propietario_nombre
       FROM productos p
       LEFT JOIN vendedores v ON p.propietario_id = v.id
       ORDER BY p.nombre ASC`
    );
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// GET /api/productos/:id — Obtener un producto por ID
async function getProductoById(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM productos WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// POST /api/productos — Crear nuevo producto
async function createProducto(req, res) {
  try {
    const { nombre, precio_compra, precio_venta, stock, propietario_id } = req.body;

    if (!nombre || precio_venta === undefined || stock === undefined) {
      return res.status(400).json({ error: 'Nombre, precio_venta y stock son requeridos' });
    }
    if (stock < 0) {
      return res.status(400).json({ error: 'El stock no puede ser negativo' });
    }

    const [result] = await pool.query(
      'INSERT INTO productos (nombre, precio_compra, precio_venta, stock, propietario_id) VALUES (?, ?, ?, ?, ?)',
      [nombre, precio_compra || 0, precio_venta, stock, propietario_id || null]
    );
    const [[newProduct]] = await pool.query(
      `SELECT p.*, v.nombre AS propietario_nombre FROM productos p LEFT JOIN vendedores v ON p.propietario_id = v.id WHERE p.id = ?`,
      [result.insertId]
    );
    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// PUT /api/productos/:id — Actualizar producto
async function updateProducto(req, res) {
  try {
    const { id } = req.params;
    const { nombre, precio_compra, precio_venta, stock, propietario_id } = req.body;

    const [existing] = await pool.query('SELECT id FROM productos WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    await pool.query(
      'UPDATE productos SET nombre = ?, precio_compra = ?, precio_venta = ?, stock = ?, propietario_id = ? WHERE id = ?',
      [nombre, precio_compra || 0, precio_venta, stock, propietario_id || null, id]
    );

    const [[updated]] = await pool.query(
      `SELECT p.*, v.nombre AS propietario_nombre FROM productos p LEFT JOIN vendedores v ON p.propietario_id = v.id WHERE p.id = ?`,
      [id]
    );
    res.json(updated);
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// DELETE /api/productos/:id — Eliminar producto
async function deleteProducto(req, res) {
  try {
    const { id } = req.params;
    const [existing] = await pool.query('SELECT id FROM productos WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Verificar si tiene ventas asociadas
    const [ventas] = await pool.query('SELECT id FROM detalle_ventas WHERE producto_id = ? LIMIT 1', [id]);
    if (ventas.length > 0) {
      return res.status(400).json({ error: 'No se puede eliminar: este producto tiene ventas registradas. Puedes editarlo y dejar el stock en 0.' });
    }

    await pool.query('DELETE FROM productos WHERE id = ?', [id]);
    res.json({ message: 'Producto eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = { getProductos, getProductoById, createProducto, updateProducto, deleteProducto };
