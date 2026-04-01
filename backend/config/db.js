// config/db.js
// Configuración de la conexión a MySQL usando mysql2 con pool de conexiones
const mysql = require('mysql2/promise');
require('dotenv').config();

// Pool de conexiones para mejor rendimiento
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'dulceria',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+00:00',
});

// Función para verificar la conexión al iniciar
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conexión a MySQL exitosa');
    connection.release();
  } catch (error) {
    console.error('❌ Error conectando a MySQL:', error.message);
    process.exit(1);
  }
}

// Crea tablas que pueden no existir en instalaciones anteriores
async function initTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS retiros (
      id        INT AUTO_INCREMENT PRIMARY KEY,
      persona   VARCHAR(100)   NOT NULL,
      monto     DECIMAL(10,2)  NOT NULL,
      concepto  VARCHAR(255)   DEFAULT '',
      fecha     DATE           NOT NULL,
      creado_en TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS categorias_gastos (
      id        INT AUTO_INCREMENT PRIMARY KEY,
      nombre    VARCHAR(100)   NOT NULL UNIQUE,
      creado_en TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
    )
  `);
  // Añade categoria_id a gastos si no existe
  const [colsCat] = await pool.query(`SHOW COLUMNS FROM gastos LIKE 'categoria_id'`);
  if (colsCat.length === 0) {
    await pool.query(`ALTER TABLE gastos ADD COLUMN categoria_id INT DEFAULT NULL`);
    await pool.query(`ALTER TABLE gastos ADD CONSTRAINT fk_gastos_categoria FOREIGN KEY (categoria_id) REFERENCES categorias_gastos(id) ON DELETE SET NULL`).catch(() => {});
  }
  // Añade propietario_id a productos si no existe (producto propio → 100% del propietario)
  const [colsProp] = await pool.query(`SHOW COLUMNS FROM productos LIKE 'propietario_id'`);
  if (colsProp.length === 0) {
    await pool.query(`ALTER TABLE productos ADD COLUMN propietario_id INT DEFAULT NULL`);
    await pool.query(`ALTER TABLE productos ADD CONSTRAINT fk_productos_propietario FOREIGN KEY (propietario_id) REFERENCES vendedores(id) ON DELETE SET NULL`).catch(() => {});
  }
  // Añade foto a vendedores si no existe (base64 de la imagen de perfil)
  const [colsFoto] = await pool.query(`SHOW COLUMNS FROM vendedores LIKE 'foto'`);
  if (colsFoto.length === 0) {
    await pool.query(`ALTER TABLE vendedores ADD COLUMN foto MEDIUMTEXT DEFAULT NULL`);
  }
}

module.exports = { pool, testConnection, initTables };
