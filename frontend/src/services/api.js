// services/api.js
// Capa de servicios: todas las llamadas al backend desde aquí

const BASE_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

// Función auxiliar para manejar respuestas
async function handleResponse(res) {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error en la solicitud');
  return data;
}

// ── PRODUCTOS ────────────────────────────────────────────
export const productosService = {
  getAll: () => fetch(`${BASE_URL}/productos`).then(handleResponse),
  getById: (id) => fetch(`${BASE_URL}/productos/${id}`).then(handleResponse),
  create: (data) => fetch(`${BASE_URL}/productos`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
  }).then(handleResponse),
  update: (id, data) => fetch(`${BASE_URL}/productos/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
  }).then(handleResponse),
  delete: (id) => fetch(`${BASE_URL}/productos/${id}`, { method: 'DELETE' }).then(handleResponse),
};

// ── VENTAS ───────────────────────────────────────────────
export const ventasService = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${BASE_URL}/ventas${query ? '?' + query : ''}`).then(handleResponse);
  },
  create: (data) => fetch(`${BASE_URL}/ventas`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
  }).then(handleResponse),
  delete: (id) => fetch(`${BASE_URL}/ventas/${id}`, { method: 'DELETE' }).then(handleResponse),
};

// ── GASTOS ───────────────────────────────────────────────
export const gastosService = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${BASE_URL}/gastos${query ? '?' + query : ''}`).then(handleResponse);
  },
  create: (data) => fetch(`${BASE_URL}/gastos`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
  }).then(handleResponse),
  update: (id, data) => fetch(`${BASE_URL}/gastos/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
  }).then(handleResponse),
  delete: (id) => fetch(`${BASE_URL}/gastos/${id}`, { method: 'DELETE' }).then(handleResponse),
};

// ── VENDEDORES ───────────────────────────────────────────
export const vendedoresService = {
  getAll: () => fetch(`${BASE_URL}/vendedores`).then(handleResponse),
  create: (data) => fetch(`${BASE_URL}/vendedores`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
  }).then(handleResponse),
  update: (id, data) => fetch(`${BASE_URL}/vendedores/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
  }).then(handleResponse),
  delete: (id) => fetch(`${BASE_URL}/vendedores/${id}`, { method: 'DELETE' }).then(handleResponse),
};

// ── DASHBOARD ────────────────────────────────────────────
export const dashboardService = {
  get: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${BASE_URL}/dashboard${query ? '?' + query : ''}`).then(handleResponse);
  },
};

// ── CATEGORÍAS GASTOS ────────────────────────────────────
export const categoriasGastosService = {
  getAll: () => fetch(`${BASE_URL}/categorias-gastos`).then(handleResponse),
  create: (data) => fetch(`${BASE_URL}/categorias-gastos`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  }).then(handleResponse),
  delete: (id) => fetch(`${BASE_URL}/categorias-gastos/${id}`, { method: 'DELETE' }).then(handleResponse),
};

// ── REPARTO ──────────────────────────────────────────────
export const repartoService = {
  get: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${BASE_URL}/reparto${query ? '?' + query : ''}`).then(handleResponse);
  },
};

// ── RETIROS ──────────────────────────────────────────────
export const retirosService = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${BASE_URL}/retiros${query ? '?' + query : ''}`).then(handleResponse);
  },
  create: (data) => fetch(`${BASE_URL}/retiros`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  }).then(handleResponse),
  delete: (id) => fetch(`${BASE_URL}/retiros/${id}`, { method: 'DELETE' }).then(handleResponse),
};
