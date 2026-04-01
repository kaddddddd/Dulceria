# 🍬 Dulcería — Sistema de Gestión de Negocio

Aplicación completa para gestionar un negocio de dulces: inventario, ventas, gastos y vendedores.

---

## 📁 Estructura del proyecto

```
dulceria/
├── backend/
│   ├── config/
│   │   └── db.js               # Conexión MySQL (pool)
│   ├── controllers/
│   │   ├── productosController.js
│   │   ├── ventasController.js
│   │   ├── gastosController.js
│   │   ├── vendedoresController.js
│   │   └── dashboardController.js
│   ├── routes/
│   │   ├── productos.js
│   │   ├── ventas.js
│   │   ├── gastos.js
│   │   ├── vendedores.js
│   │   └── dashboard.js
│   ├── database/
│   │   └── schema.sql          # Script SQL listo para importar
│   ├── .env.example            # Plantilla de variables de entorno
│   ├── package.json
│   └── server.js               # Entrada del servidor Express
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Toast.jsx       # Notificaciones
    │   │   └── Confirm.jsx     # Diálogo confirmación
    │   ├── pages/
    │   │   ├── Dashboard.jsx   # Pantalla principal / métricas
    │   │   ├── Productos.jsx   # Inventario
    │   │   ├── Ventas.jsx      # Nueva venta + historial
    │   │   ├── Gastos.jsx      # Registro de gastos
    │   │   └── Vendedores.jsx  # Equipo de vendedores
    │   ├── services/
    │   │   └── api.js          # Todas las llamadas HTTP al backend
    │   ├── App.jsx             # Raíz con navegación
    │   ├── main.jsx
    │   └── index.css           # Sistema de diseño completo
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## 🚀 Instalación paso a paso

### 1. Requisitos previos

- [Node.js](https://nodejs.org) v18 o superior
- [MySQL](https://dev.mysql.com/downloads/) 8.0 o superior
- Git (opcional)

### 2. Crear la base de datos en MySQL

Abre tu cliente MySQL (MySQL Workbench, DBeaver, o terminal) y ejecuta:

```sql
-- Opción A: desde terminal
mysql -u root -p < backend/database/schema.sql

-- Opción B: copiar y pegar en MySQL Workbench
-- Abre el archivo backend/database/schema.sql y ejecútalo completo
```

Esto crea:
- Base de datos `dulceria`
- Tablas: `productos`, `ventas`, `detalle_ventas`, `gastos`, `vendedores`
- Datos de ejemplo para empezar

### 3. Configurar el backend

```bash
cd backend

# Copiar archivo de configuración
cp .env.example .env
```

Edita el archivo `.env` con tus datos de MySQL:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_contraseña_aqui
DB_NAME=dulceria
PORT=3001
```

Instala las dependencias:

```bash
npm install
```

### 4. Configurar el frontend

```bash
cd ../frontend
npm install
```

### 5. Ejecutar el proyecto

Abre **dos terminales**:

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Verás: ✅ Conexión a MySQL exitosa
# Verás: 🚀 Servidor corriendo en http://localhost:3001
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# Verás: ➜ Local: http://localhost:5173
```

Abre tu navegador en **http://localhost:5173** 🎉

---

## 🗄️ Tablas de la base de datos

```sql
vendedores      → id, nombre, creado_en
productos       → id, nombre, precio_compra, precio_venta, stock
ventas          → id, vendedor_id (FK), total, fecha
detalle_ventas  → id, venta_id (FK), producto_id (FK), cantidad, precio_unitario, subtotal
gastos          → id, descripcion, monto, fecha
```

---

## 🔌 API REST — Endpoints disponibles

| Método | Ruta                    | Descripción                    |
|--------|-------------------------|--------------------------------|
| GET    | /api/productos          | Listar productos               |
| POST   | /api/productos          | Crear producto                 |
| PUT    | /api/productos/:id      | Actualizar producto            |
| DELETE | /api/productos/:id      | Eliminar producto              |
| GET    | /api/ventas             | Historial de ventas            |
| POST   | /api/ventas             | Registrar venta (con carrito)  |
| DELETE | /api/ventas/:id         | Eliminar venta (restaura stock)|
| GET    | /api/gastos             | Listar gastos                  |
| POST   | /api/gastos             | Registrar gasto                |
| PUT    | /api/gastos/:id         | Actualizar gasto               |
| DELETE | /api/gastos/:id         | Eliminar gasto                 |
| GET    | /api/vendedores         | Vendedores con total vendido   |
| POST   | /api/vendedores         | Crear vendedor                 |
| PUT    | /api/vendedores/:id     | Actualizar vendedor            |
| DELETE | /api/vendedores/:id     | Eliminar vendedor              |
| GET    | /api/dashboard          | Resumen del negocio            |
| GET    | /api/health             | Estado del servidor            |

### Ejemplo: registrar una venta

```json
POST /api/ventas
{
  "vendedor_id": 1,
  "items": [
    { "producto_id": 1, "cantidad": 3, "precio_unitario": 1000 },
    { "producto_id": 2, "cantidad": 1, "precio_unitario": 1500 }
  ]
}
```

---

## 💡 Funcionalidades clave

- ✅ **Stock automático**: al registrar una venta, el stock se descuenta automáticamente
- ✅ **Validación de stock**: no permite vender más de lo disponible
- ✅ **Transacciones MySQL**: la venta es atómica (si falla algo, se revierte todo)
- ✅ **Restaurar stock**: al eliminar una venta, el stock vuelve
- ✅ **Ganancia neta**: dashboard calcula ventas − gastos en tiempo real
- ✅ **Alertas de stock bajo**: productos con menos de 10 unidades aparecen destacados
- ✅ **Ranking de vendedores**: ordenados por mayor venta

---

## 🛠️ Solución de problemas

**Error de conexión a MySQL:**
- Verifica que MySQL esté corriendo: `sudo systemctl status mysql`
- Comprueba usuario y contraseña en `.env`
- Asegúrate de haber ejecutado el `schema.sql`

**Puerto en uso:**
- Cambia `PORT=3001` en `.env` a otro número (ej: 3002)
- Actualiza el proxy en `frontend/vite.config.js` con el nuevo puerto

**CORS error:**
- Verifica que el frontend corre en `http://localhost:5173`
- El proxy de Vite redirige `/api/*` al backend automáticamente

---

## 📱 Diseño

La interfaz está optimizada para móvil (max-width: 430px) con:
- Navegación inferior tipo app nativa
- Colores de dulcería: rosa, morado, amarillo
- Fuentes: Pacifico (títulos) + Nunito (texto)
- Carrito de compra interactivo para registrar ventas

---

*Desarrollado para pequeños negocios de dulces 🍭🍬🍫*
