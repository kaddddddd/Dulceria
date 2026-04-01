// pages/Ventas.jsx
import { useState, useEffect } from 'react';
import { ventasService, productosService, vendedoresService } from '../services/api';
import Toast from '../components/Toast';
import Confirm from '../components/Confirm';

function fmt(n) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n || 0);
}

function fmtDate(d) {
  return new Date(d).toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function Ventas() {
  const [tab, setTab]             = useState('nueva'); // 'nueva' | 'historial'
  const [productos, setProductos] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [ventas, setVentas]       = useState([]);
  const [cart, setCart]           = useState([]);       // items del carrito
  const [vendedorId, setVendedorId] = useState('');
  const [productoSel, setProductoSel] = useState('');
  const [cantidad, setCantidad]   = useState(1);
  const [loading, setLoading]     = useState(false);
  const [toast, setToast]         = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  function showToast(msg, type = 'success') { setToast({ message: msg, type }); }

  useEffect(() => {
    Promise.all([productosService.getAll(), vendedoresService.getAll()])
      .then(([prods, vends]) => { setProductos(prods); setVendedores(vends); })
      .catch(() => showToast('Error al cargar datos', 'error'));
  }, []);

  useEffect(() => {
    if (tab === 'historial') loadVentas();
  }, [tab]);

  function loadVentas() {
    ventasService.getAll()
      .then(setVentas)
      .catch(() => showToast('Error al cargar historial', 'error'));
  }

  // Agregar producto al carrito
  function handleAddToCart() {
    if (!productoSel) { showToast('Selecciona un producto', 'error'); return; }
    const prod = productos.find(p => p.id === Number(productoSel));
    if (!prod) return;

    // Verificar stock disponible (descontando lo ya en carrito)
    const yaEnCarrito = cart.find(c => c.producto_id === prod.id);
    const cantidadEnCarrito = yaEnCarrito ? yaEnCarrito.cantidad : 0;
    if (cantidadEnCarrito + cantidad > prod.stock) {
      showToast(`Stock insuficiente. Disponible: ${prod.stock - cantidadEnCarrito}`, 'error');
      return;
    }

    if (yaEnCarrito) {
      setCart(cart.map(c => c.producto_id === prod.id
        ? { ...c, cantidad: c.cantidad + cantidad, subtotal: (c.cantidad + cantidad) * c.precio_unitario }
        : c
      ));
    } else {
      setCart([...cart, {
        producto_id: prod.id,
        nombre: prod.nombre,
        cantidad,
        precio_unitario: prod.precio_venta,
        subtotal: cantidad * prod.precio_venta,
      }]);
    }
    setProductoSel('');
    setCantidad(1);
  }

  function removeFromCart(id) {
    setCart(cart.filter(c => c.producto_id !== id));
  }

  function updateQty(id, delta) {
    setCart(cart.map(c => {
      if (c.producto_id !== id) return c;
      const prod = productos.find(p => p.id === id);
      const newQty = c.cantidad + delta;
      if (newQty < 1) return c;
      if (newQty > prod.stock) { showToast('Stock insuficiente', 'error'); return c; }
      return { ...c, cantidad: newQty, subtotal: newQty * c.precio_unitario };
    }));
  }

  const total = cart.reduce((sum, c) => sum + c.subtotal, 0);

  async function handleVender() {
    if (!vendedorId) { showToast('Selecciona un vendedor', 'error'); return; }
    if (cart.length === 0) { showToast('Agrega productos al carrito', 'error'); return; }
    setLoading(true);
    try {
      await ventasService.create({
        vendedor_id: Number(vendedorId),
        items: cart.map(c => ({ producto_id: c.producto_id, cantidad: c.cantidad, precio_unitario: c.precio_unitario })),
      });
      showToast('¡Venta registrada! 🎉');
      setCart([]);
      setVendedorId('');
      // Recargar productos para mostrar stock actualizado
      productosService.getAll().then(setProductos);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteVenta(id) {
    try {
      await ventasService.delete(id);
      showToast('Venta eliminada y stock restaurado');
      setConfirmId(null);
      loadVentas();
      productosService.getAll().then(setProductos);
    } catch (err) {
      showToast(err.message, 'error');
      setConfirmId(null);
    }
  }

  return (
    <div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      {confirmId && (
        <Confirm
          message="¿Eliminar esta venta? El stock será restaurado."
          onConfirm={() => handleDeleteVenta(confirmId)}
          onCancel={() => setConfirmId(null)}
        />
      )}

      <div className="page-title">🛒 Ventas</div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['nueva', 'historial'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`btn ${tab === t ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flex: 1, padding: '10px', fontSize: 13 }}>
            {t === 'nueva' ? '➕ Nueva venta' : '📋 Historial'}
          </button>
        ))}
      </div>

      {/* ── NUEVA VENTA ── */}
      {tab === 'nueva' && (
        <div>
          {/* Selector vendedor */}
          <div className="card">
            <div className="panel-title">👤 Vendedor</div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <select value={vendedorId} onChange={e => setVendedorId(e.target.value)}>
                <option value="">— Selecciona vendedor —</option>
                {vendedores.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
              </select>
            </div>
          </div>

          {/* Agregar producto */}
          <div className="card">
            <div className="panel-title">🍬 Agregar producto</div>
            <div className="form-group">
              <label>Producto</label>
              <select value={productoSel} onChange={e => setProductoSel(e.target.value)}>
                <option value="">— Selecciona producto —</option>
                {productos.filter(p => p.stock > 0).map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} · Stock: {p.stock} · {fmt(p.precio_venta)}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label>Cantidad</label>
              <div className="qty-control">
                <button className="qty-btn" onClick={() => setCantidad(Math.max(1, cantidad - 1))}>−</button>
                <span className="qty-value">{cantidad}</span>
                <button className="qty-btn" onClick={() => setCantidad(cantidad + 1)}>+</button>
              </div>
            </div>
            <button className="btn btn-ghost w-full" onClick={handleAddToCart}>
              ➕ Agregar al carrito
            </button>
          </div>

          {/* Carrito */}
          {cart.length > 0 && (
            <div className="card">
              <div className="panel-title">🛍️ Carrito ({cart.length})</div>
              {cart.map(item => (
                <div className="cart-item" key={item.producto_id}>
                  <div style={{ flex: 1 }}>
                    <div className="cart-item-name">{item.nombre}</div>
                    <div className="cart-item-price">{fmt(item.precio_unitario)} c/u → {fmt(item.subtotal)}</div>
                  </div>
                  <div className="qty-control">
                    <button className="qty-btn" onClick={() => updateQty(item.producto_id, -1)}>−</button>
                    <span className="qty-value">{item.cantidad}</span>
                    <button className="qty-btn" onClick={() => updateQty(item.producto_id, 1)}>+</button>
                    <button className="qty-btn" style={{ color: 'var(--rojo)' }} onClick={() => removeFromCart(item.producto_id)}>✕</button>
                  </div>
                </div>
              ))}

              <div className="total-bar" style={{ marginTop: 16 }}>
                <span className="total-label">TOTAL A COBRAR</span>
                <span className="total-amount">{fmt(total)}</span>
              </div>

              <button className="btn btn-primary" onClick={handleVender} disabled={loading}>
                {loading ? '⏳ Registrando...' : '✅ Confirmar venta'}
              </button>
            </div>
          )}

          {cart.length === 0 && (
            <div className="empty-state" style={{ padding: 20 }}>
              <div className="empty-icon">🛒</div>
              <p>El carrito está vacío</p>
            </div>
          )}
        </div>
      )}

      {/* ── HISTORIAL ── */}
      {tab === 'historial' && (
        <div>
          {ventas.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <p>No hay ventas registradas</p>
            </div>
          ) : (
            <div className="item-list">
              {ventas.map((v, i) => (
                <div className="card" key={v.id} style={{ marginBottom: 0 }}>
                  <div className="card-row">
                    <div style={{ flex: 1 }}>
                      <div className="item-name">Venta #{ventas.length - i}</div>
                      <div className="item-sub">{v.vendedor} · {fmtDate(v.fecha)}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontWeight: 900, color: 'var(--verde)', fontSize: 15 }}>{fmt(v.total)}</span>
                      <button className="btn btn-danger" style={{ padding: '6px 10px' }}
                        onClick={() => setConfirmId(v.id)}>🗑️</button>
                    </div>
                  </div>
                  {/* Expandir detalle */}
                  <button
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--rosa)', fontSize: 12, fontWeight: 700, marginTop: 6, padding: 0 }}
                    onClick={() => setExpandedId(expandedId === v.id ? null : v.id)}>
                    {expandedId === v.id ? '▲ Ocultar detalle' : '▼ Ver detalle'}
                  </button>
                  {expandedId === v.id && v.detalle && (
                    <div style={{ marginTop: 10 }}>
                      {v.detalle.map(d => (
                        <div key={d.id} className="flex-between" style={{ fontSize: 13, padding: '5px 0', borderTop: '1px solid var(--border)' }}>
                          <span>{d.producto_nombre} × {d.cantidad}</span>
                          <span style={{ fontWeight: 700 }}>{fmt(d.subtotal)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
