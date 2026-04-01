// routes/retiros.js
const express = require('express');
const router  = express.Router();
const { getRetiros, createRetiro, deleteRetiro } = require('../controllers/retirosController');

router.get('/',     getRetiros);
router.post('/',    createRetiro);
router.delete('/:id', deleteRetiro);

module.exports = router;
