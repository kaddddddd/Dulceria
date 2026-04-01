// routes/vendedores.js
const express = require('express');
const router = express.Router();
const { getVendedores, createVendedor, updateVendedor, deleteVendedor } = require('../controllers/vendedoresController');

router.get('/', getVendedores);
router.post('/', createVendedor);
router.put('/:id', updateVendedor);
router.delete('/:id', deleteVendedor);

module.exports = router;
