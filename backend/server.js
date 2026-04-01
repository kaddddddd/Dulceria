// server.js — Punto de entrada del servidor Express
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { testConnection, initTables } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middlewares ──────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Rutas API ────────────────────────────────────────────
app.use('/api/productos',  require('./routes/productos'));
app.use('/api/ventas',     require('./routes/ventas'));
app.use('/api/gastos',     require('./routes/gastos'));
app.use('/api/vendedores', require('./routes/vendedores'));
app.use('/api/dashboard',  require('./routes/dashboard'));
app.use('/api/retiros',          require('./routes/retiros'));
app.use('/api/reparto',          require('./routes/reparto'));
app.use('/api/categorias-gastos', require('./routes/categoriasGastos'));

// ── Ruta de salud ────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '🍬 Dulcería API funcionando correctamente' });
});

// ── Manejo de rutas no encontradas ───────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// ── Manejo global de errores ─────────────────────────────
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// ── Iniciar servidor ─────────────────────────────────────
async function startServer() {
  await testConnection();
  await initTables();
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📋 Rutas disponibles:`);
    console.log(`   GET  /api/health`);
    console.log(`   ---  /api/productos`);
    console.log(`   ---  /api/ventas`);
    console.log(`   ---  /api/gastos`);
    console.log(`   ---  /api/vendedores`);
    console.log(`   GET  /api/dashboard`);
  });
}

startServer();
