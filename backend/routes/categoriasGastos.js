const express = require('express');
const router  = express.Router();
const { getCategorias, createCategoria, deleteCategoria } = require('../controllers/categoriasGastosController');

router.get('/',      getCategorias);
router.post('/',     createCategoria);
router.delete('/:id', deleteCategoria);

module.exports = router;
