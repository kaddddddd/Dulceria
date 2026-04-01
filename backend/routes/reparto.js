// routes/reparto.js
const express = require('express');
const router  = express.Router();
const { getReparto } = require('../controllers/repartoController');

router.get('/', getReparto);

module.exports = router;
