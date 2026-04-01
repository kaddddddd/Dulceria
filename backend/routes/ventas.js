// routes/ventas.js
const express = require('express');
const router = express.Router();
const { getVentas, createVenta, deleteVenta } = require('../controllers/ventasController');

router.get('/', getVentas);
router.post('/', createVenta);
router.delete('/:id', deleteVenta);

module.exports = router;
