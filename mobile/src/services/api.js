import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://dulceria-lzto.onrender.com/api';

function fetchWithTimeout(url, options = {}, timeout = 15000) {
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

// GET con caché: muestra datos guardados si el servidor no responde
async function getWithCache(url) {
  const cacheKey = `cache_${url}`;
  try {
    const res = await fetchWithTimeout(url);
    const data = await handleResponse(res);
    await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
    return data;
  } catch (err) {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
    throw err;
  }
}

// Ping para mantener Render despierto
export function pingBackend() {
  fetch(`${BASE_URL}/productos`).catch(() => {});
}

export const productosService = {
  getAll: () => getWithCache(`${BASE_URL}/productos`),
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
    return getWithCache(`${BASE_URL}/ventas${query ? '?' + query : ''}`);
  },
  create: (data) => fetchWithTimeout(`${BASE_URL}/ventas`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  }).then(handleResponse),
  delete: (id) => fetchWithTimeout(`${BASE_URL}/ventas/${id}`, { method: 'DELETE' }).then(handleResponse),
};

export const gastosService = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return getWithCache(`${BASE_URL}/gastos${query ? '?' + query : ''}`);
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
  getAll: () => getWithCache(`${BASE_URL}/vendedores`),
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
    return getWithCache(`${BASE_URL}/dashboard${query ? '?' + query : ''}`);
  },
};

export const categoriasGastosService = {
  getAll: () => getWithCache(`${BASE_URL}/categorias-gastos`),
  create: (data) => fetchWithTimeout(`${BASE_URL}/categorias-gastos`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  }).then(handleResponse),
  delete: (id) => fetchWithTimeout(`${BASE_URL}/categorias-gastos/${id}`, { method: 'DELETE' }).then(handleResponse),
};

export const repartoService = {
  get: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return getWithCache(`${BASE_URL}/reparto${query ? '?' + query : ''}`);
  },
};

export const retirosService = {
  create: (data) => fetchWithTimeout(`${BASE_URL}/retiros`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  }).then(handleResponse),
  delete: (id) => fetchWithTimeout(`${BASE_URL}/retiros/${id}`, { method: 'DELETE' }).then(handleResponse),
};
