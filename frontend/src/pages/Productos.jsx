// pages/Productos.jsx
import { useState, useEffect } from 'react';
import { productosService, vendedoresService } from '../services/api';
import Toast from '../components/Toast';
import Confirm from '../components/Confirm';

const EMPTY_FORM = { nombre: '', precio_compra: '', precio_venta: '', stock: '', propietario_id: '' };

function fmt(n) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n || 0);
}

export default function Productos() {
  const [productos,   setProductos]   = useState([]);
  const [vendedores,  setVendedores]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [editId,      setEditId]      = useState(null);
  const [showForm,    setShowForm]    = useState(false);
  const [toast,       setToast]       = useState(null);
  const [confirmId,   setConfirmId]   = useState(null);
  const [saving,      setSaving]      = useState(false);

  const loadProductos = () =>
    productosService.getAll()
      .then(setProductos)
      .catch(() => showToast('Error al cargar productos', 'error'))
      .finally(() => setLoading(false));

  useEffect(() => {
    loadProductos();
    vendedoresService.getAll().then(setVendedores).catch(() => {});
  }, []);

  function showToast(message, type = 'success') {
    setToast({ message, type });
  }

  function handleEdit(p) {
    setForm({
      nombre: p.nombre,
      precio_compra: p.precio_compra,
      precio_venta: p.precio_venta,
      stock: p.stock,
      propietario_id: p.propietario_id ?? '',
    });
    setEditId(p.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleCancel() {
    setForm(EMPTY_FORM);
    setEditId(null);
    setShowForm(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.nombre || form.precio_venta === '' || form.stock === '') {
      showToast('Completa todos los campos requeridos', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        nombre: form.nombre,
        precio_compra: Number(form.precio_compra) || 0,
        precio_venta: Number(form.precio_venta),
        stock: Number(form.stock),
        propietario_id: form.propietario_id ? Number(form.propietario_id) : null,
      };
      if (editId) {
        await productosService.update(editId, payload);
        showToast('Producto actualizado');
      } else {
        await productosService.create(payload);
        showToast('Producto creado');
      }
      handleCancel();
      loadProductos();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      await productosService.delete(id);
      showToast('Producto eliminado');
      setConfirmId(null);
      loadProductos();
    } catch (err) {
      showToast(err.message, 'error');
      setConfirmId(null);
    }
  }

  function stockClass(s) {
    if (s === 0) return 'stock-low';
    if (s < 10)  return 'stock-warn';
    return 'stock-ok';
  }

  return (
    <div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      {confirmId && (
        <Confirm
          message="¿Eliminar este producto?"
          onConfirm={() => handleDelete(confirmId)}
          onCancel={() => setConfirmId(null)}
        />
      )}

      <div className="flex-between mb-16">
        <div className="page-title">📦 Inventario</div>
        {!showForm && (
          <button className="btn btn-primary" style={{ width: 'auto', padding: '10px 16px', fontSize: 13 }}
            onClick={() => setShowForm(true)}>
            + Agregar
          </button>
        )}
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="card" style={{ border: '2px solid var(--rosa)', marginBottom: 20 }}>
          <div className="panel-title">{editId ? '✏️ Editar producto' : '➕ Nuevo producto'}</div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nombre del producto *</label>
              <input
                placeholder="Ej: Gomitas de fresa"
                value={form.nombre}
                onChange={e => setForm({ ...form, nombre: e.target.value })}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Precio compra</label>
                <input type="number" min="0" placeholder="0"
                  value={form.precio_compra}
                  onChange={e => setForm({ ...form, precio_compra: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Precio venta *</label>
                <input type="number" min="0" placeholder="0"
                  value={form.precio_venta}
                  onChange={e => setForm({ ...form, precio_venta: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>{editId ? 'Stock actual *' : 'Stock inicial *'}</label>
              <input type="number" min="0" placeholder="0"
                value={form.stock}
                onChange={e => setForm({ ...form, stock: e.target.value })} />
              {editId && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  Este valor reemplaza el stock actual. El stock baja solo cuando se registra una venta.
                </div>
              )}
            </div>

            {/* Propietario — producto propio */}
            <div className="form-group">
              <label>¿Este producto es de alguien en específico?</label>
              <select
                value={form.propietario_id}
                onChange={e => setForm({ ...form, propietario_id: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 14, fontFamily: 'Poppins, sans-serif', background: '#fff' }}
              >
                <option value="">No — va al pool general (50 / 50)</option>
                {vendedores.map(v => (
                  <option key={v.id} value={v.id}>{v.nombre} — 100% para ella</option>
                ))}
              </select>
              {form.propietario_id && (
                <div style={{ fontSize: 12, color: 'var(--morado)', marginTop: 4, fontWeight: 600 }}>
                  Las ventas de este producto irán 100% a {vendedores.find(v => String(v.id) === String(form.propietario_id))?.nombre}.
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn btn-ghost w-full" onClick={handleCancel}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Guardando...' : editId ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="loading">Cargando productos...</div>
      ) : productos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <p>No hay productos registrados</p>
        </div>
      ) : (
        <div className="item-list">
          {productos.map(p => (
            <div className="item-card" key={p.id}>
              <div style={{ flex: 1 }}>
                <div className="item-name">
                  {p.nombre}
                  {p.propietario_nombre && (
                    <span className="badge badge-purple" style={{ marginLeft: 8, fontSize: 11 }}>
                      100% {p.propietario_nombre}
                    </span>
                  )}
                </div>
                <div className="item-sub">
                  Venta: {fmt(p.precio_venta)} · Compra: {fmt(p.precio_compra)}
                </div>
                <div className="item-sub" style={{ marginTop: 4 }}>
                  Stock:{' '}
                  <span className={stockClass(p.stock)}>
                    {p.stock === 0 ? '⚠ Sin stock' : `${p.stock} unid.`}
                  </span>
                </div>
              </div>
              <div className="item-actions">
                <button className="btn btn-edit" onClick={() => handleEdit(p)}>✏️</button>
                <button className="btn btn-danger" onClick={() => setConfirmId(p.id)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
