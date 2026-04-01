-- ============================================
-- DULCERÍA - Script de Base de Datos MySQL
-- ============================================

CREATE DATABASE IF NOT EXISTS dulceria CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dulceria;

-- ============================================
-- TABLA: vendedores
-- ============================================
CREATE TABLE IF NOT EXISTS vendedores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: productos
-- ============================================
CREATE TABLE IF NOT EXISTS productos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  precio_compra DECIMAL(10, 2) NOT NULL DEFAULT 0,
  precio_venta DECIMAL(10, 2) NOT NULL DEFAULT 0,
  stock INT NOT NULL DEFAULT 0,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: ventas
-- ============================================
CREATE TABLE IF NOT EXISTS ventas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vendedor_id INT NOT NULL,
  total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vendedor_id) REFERENCES vendedores(id) ON DELETE RESTRICT
);

-- ============================================
-- TABLA: detalle_ventas
-- ============================================
CREATE TABLE IF NOT EXISTS detalle_ventas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  venta_id INT NOT NULL,
  producto_id INT NOT NULL,
  cantidad INT NOT NULL,
  precio_unitario DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT
);

-- ============================================
-- TABLA: gastos
-- ============================================
CREATE TABLE IF NOT EXISTS gastos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  descripcion VARCHAR(255) NOT NULL,
  monto DECIMAL(10, 2) NOT NULL,
  fecha DATE NOT NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- DATOS DE EJEMPLO
-- ============================================

INSERT INTO vendedores (nombre) VALUES
  ('María López'),
  ('Carlos Pérez'),
  ('Ana Torres');

INSERT INTO productos (nombre, precio_compra, precio_venta, stock) VALUES
  ('Gomitas de fresa', 500, 1000, 50),
  ('Chocolates surtidos', 800, 1500, 30),
  ('Chupetas', 200, 500, 100),
  ('Masmelos', 600, 1200, 40),
  ('Caramelos de menta', 300, 700, 80),
  ('Paletas de frutas', 400, 900, 25);

INSERT INTO gastos (descripcion, monto, fecha) VALUES
  ('Compra de empaque', 15000, CURDATE()),
  ('Transporte de mercancía', 8000, CURDATE());
