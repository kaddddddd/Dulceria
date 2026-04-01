// Cambia esta URL por la de tu backend en Render cuando lo subas
const BASE_URL = 'http://192.168.1.17:3001/api'; // celular físico en WiFi

function fetchWithTimeout(url, options = {}, timeout = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(id));
}

async function handleResponse(res) {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error en la solicitud');
  return data;
}

export const productosService = {
  getAll: () => fetchWithTimeout(`${BASE_URL}/productos`).then(handleResponse),
  create: (data) => fetchWithTimeout(`${BASE_URL}/productos`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  }).then(handleResponse),
  update: (id, data) => fetchWithTimeout(`${BASE_URL}/productos/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  }).then(handleResponse),
  delete: (id) => fetchWithTimeout(`${BASE_URL}/productos/${id}`, { method: 'DELETE' }).then(handleResponse),
};

export const ventasService = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchWithTimeout(`${BASE_URL}/ventas${query ? '?' + query : ''}`).then(handleResponse);
  },
  create: (data) => fetchWithTimeout(`${BASE_URL}/ventas`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  }).then(handleResponse),
  delete: (id) => fetchWithTimeout(`${BASE_URL}/ventas/${id}`, { method: 'DELETE' }).then(handleResponse),
};

export const gastosService = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchWithTimeout(`${BASE_URL}/gastos${query ? '?' + query : ''}`).then(handleResponse);
  },
  create: (data) => fetchWithTimeout(`${BASE_URL}/gastos`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  }).then(handleResponse),
  update: (id, data) => fetchWithTimeout(`${BASE_URL}/gastos/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  }).then(handleResponse),
  delete: (id) => fetchWithTimeout(`${BASE_URL}/gastos/${id}`, { method: 'DELETE' }).then(handleResponse),
};

export const vendedoresService = {
  getAll: () => fetchWithTimeout(`${BASE_URL}/vendedores`).then(handleResponse),
  create: (data) => fetchWithTimeout(`${BASE_URL}/vendedores`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  }).then(handleResponse),
  update: (id, data) => fetchWithTimeout(`${BASE_URL}/vendedores/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  }).then(handleResponse),
  delete: (id) => fetchWithTimeout(`${BASE_URL}/vendedores/${id}`, { method: 'DELETE' }).then(handleResponse),
};

export const dashboardService = {
  get: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchWithTimeout(`${BASE_URL}/dashboard${query ? '?' + query : ''}`).then(handleResponse);
  },
};

export const categoriasGastosService = {
  getAll: () => fetchWithTimeout(`${BASE_URL}/categorias-gastos`).then(handleResponse),
  create: (data) => fetchWithTimeout(`${BASE_URL}/categorias-gastos`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  }).then(handleResponse),
  delete: (id) => fetchWithTimeout(`${BASE_URL}/categorias-gastos/${id}`, { method: 'DELETE' }).then(handleResponse),
};

export const repartoService = {
  get: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchWithTimeout(`${BASE_URL}/reparto${query ? '?' + query : ''}`).then(handleResponse);
  },
};

export const retirosService = {
  create: (data) => fetchWithTimeout(`${BASE_URL}/retiros`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  }).then(handleResponse),
  delete: (id) => fetchWithTimeout(`${BASE_URL}/retiros/${id}`, { method: 'DELETE' }).then(handleResponse),
};
