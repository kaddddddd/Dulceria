// pages/Gastos.jsx — Gastos organizados por categoría
import { useState, useEffect } from 'react';
import { gastosService, categoriasGastosService } from '../services/api';
import Toast   from '../components/Toast';
import Confirm from '../components/Confirm';

function fmt(n) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n || 0);
}

const hoy = new Date().toISOString().split('T')[0];
const EMPTY = { descripcion: '', monto: '', fecha: hoy, categoria_id: '' };

function mesActualStr() {
  const h = new Date();
  return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, '0')}`;
}

export default function Gastos() {
  const [gastos,      setGastos]      = useState([]);
  const [categorias,  setCategorias]  = useState([]);
  const [form,        setForm]        = useState(EMPTY);
  const [editId,      setEditId]      = useState(null);
  const [showForm,    setShowForm]    = useState(false);
  const [toast,       setToast]       = useState(null);
  const [confirmId,   setConfirmId]   = useState(null);
  const [confirmCat,  setConfirmCat]  = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [mes,         setMes]         = useState(mesActualStr);
  const [nuevaCat,    setNuevaCat]    = useState('');
  const [showCatForm, setShowCatForm] = useState(false);

  function showToast(msg, type = 'success') { setToast({ message: msg, type }); }

  function loadCategorias() {
    return categoriasGastosService.getAll().then(setCategorias).catch(() => {});
  }

  function loadGastos() {
    const [anio, month] = mes.split('-');
    const inicio = `${anio}-${month}-01`;
    const ultimo = new Date(Number(anio), Number(month), 0).getDate();
    const fin    = `${anio}-${month}-${ultimo}`;
    return gastosService.getAll({ fecha_inicio: inicio, fecha_fin: fin })
      .then(setGastos)
      .catch(() => showToast('Error al cargar gastos', 'error'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadCategorias(); }, []);
  useEffect(() => { loadGastos(); }, [mes]);

  async function handleCrearCategoria(e) {
    e.preventDefault();
    if (!nuevaCat.trim()) return;
    try {
      await categoriasGastosService.create({ nombre: nuevaCat.trim() });
      setNuevaCat('');
      setShowCatForm(false);
      showToast('Categoría creada');
      loadCategorias();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleEliminarCategoria() {
    try {
      await categoriasGastosService.delete(confirmCat);
      setConfirmCat(null);
      showToast('Categoría eliminada');
      loadCategorias();
      loadGastos();
    } catch {
      setConfirmCat(null);
      showToast('No se pudo eliminar', 'error');
    }
  }

  function handleEdit(g) {
    setForm({ descripcion: g.descripcion, monto: g.monto, fecha: g.fecha?.split('T')[0] || hoy, categoria_id: g.categoria_id || '' });
    setEditId(g.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleCancel() { setForm(EMPTY); setEditId(null); setShowForm(false); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.descripcion || !form.monto || !form.fecha) {
      showToast('Completa todos los campos', 'error'); return;
    }
    setSaving(true);
    try {
      const payload = { descripcion: form.descripcion, monto: Number(form.monto), fecha: form.fecha, categoria_id: form.categoria_id || null };
      if (editId) {
        await gastosService.update(editId, payload);
        showToast('Gasto actualizado');
      } else {
        await gastosService.create(payload);
        showToast('Gasto registrado');
      }
      handleCancel();
      loadGastos();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      await gastosService.delete(id);
      showToast('Gasto eliminado');
      setConfirmId(null);
      loadGastos();
    } catch (err) {
      showToast(err.message, 'error');
      setConfirmId(null);
    }
  }

  // Agrupar gastos por categoría
  const porCategoria = gastos.reduce((acc, g) => {
    const key = g.categoria_nombre || '— Sin categoría';
    if (!acc[key]) acc[key] = [];
    acc[key].push(g);
    return acc;
  }, {});

  const totalMes = gastos.reduce((s, g) => s + Number(g.monto), 0);

  return (
    <div>
      {toast    && <Toast {...toast} onClose={() => setToast(null)} />}
      {confirmId  && <Confirm message="¿Eliminar este gasto?"      onConfirm={() => handleDelete(confirmId)}      onCancel={() => setConfirmId(null)} />}
      {confirmCat && <Confirm message="¿Eliminar esta categoría? Los gastos de esta categoría quedarán sin categoría." onConfirm={handleEliminarCategoria} onCancel={() => setConfirmCat(null)} />}

      <div className="flex-between mb-16">
        <div className="page-title">📤 Gastos</div>
        {!showForm && (
          <button className="btn btn-primary" style={{ width: 'auto', padding: '10px 16px', fontSize: 13 }}
            onClick={() => setShowForm(true)}>
            + Registrar
          </button>
        )}
      </div>

      {/* Gestión de categorías */}
      {!showForm && (
        <div className="card" style={{ marginBottom: 12, background: 'var(--lila-palido)', border: '1.5px solid var(--morado-claro)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showCatForm || categorias.length > 0 ? 10 : 0 }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>🏷️ Categorías</span>
            <button onClick={() => setShowCatForm(v => !v)}
              style={{ padding: '4px 12px', borderRadius: 8, border: '1.5px solid var(--morado)', background: 'white', color: 'var(--morado)', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Poppins, sans-serif' }}>
              {showCatForm ? 'Cancelar' : '+ Nueva'}
            </button>
          </div>

          {showCatForm && (
            <form onSubmit={handleCrearCategoria} style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input
                value={nuevaCat} onChange={e => setNuevaCat(e.target.value)}
                placeholder="Ej: Empaques, Transporte..."
                style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 14, fontFamily: 'Poppins, sans-serif' }} />
              <button type="submit"
                style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: 'var(--morado)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Poppins, sans-serif' }}>
                Crear
              </button>
            </form>
          )}

          {categorias.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {categorias.map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'white', border: '1.5px solid var(--morado-claro)', borderRadius: 20, padding: '4px 10px' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--morado)' }}>{c.nombre}</span>
                  <button onClick={() => setConfirmCat(c.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1, padding: 0 }}>✕</button>
                </div>
              ))}
            </div>
          )}
          {categorias.length === 0 && !showCatForm && (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Crea categorías para organizar tus gastos.</p>
          )}
        </div>
      )}

      {/* Filtro por mes */}
      {!showForm && (
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Mes</label>
          <input type="month" value={mes} onChange={e => setMes(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 14, fontFamily: 'Poppins, sans-serif' }} />
          <button onClick={() => setMes(mesActualStr())}
            style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--bg)', fontSize: 13, cursor: 'pointer', fontWeight: 700, fontFamily: 'Poppins, sans-serif' }}>
            Este mes
          </button>
        </div>
      )}

      {/* Total del mes */}
      {!showForm && gastos.length > 0 && (
        <div className="card" style={{ background: 'linear-gradient(135deg, var(--lila-palido), #F3E5F5)', border: '2px solid var(--morado-claro)', marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Total gastos — {new Date(mes + '-02').toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--rojo)', marginTop: 4 }}>{fmt(totalMes)}</div>
        </div>
      )}

      {/* Formulario */}
      {showForm && (
        <div className="card" style={{ border: '2px solid var(--lila)', marginBottom: 20 }}>
          <div className="panel-title">{editId ? '✏️ Editar gasto' : '➕ Nuevo gasto'}</div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Descripción *</label>
              <input placeholder="Ej: Compra de empaques"
                value={form.descripcion}
                onChange={e => setForm({ ...form, descripcion: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Categoría</label>
              <select value={form.categoria_id} onChange={e => setForm({ ...form, categoria_id: e.target.value })}>
                <option value="">— Sin categoría —</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Monto *</label>
                <input type="number" min="0" placeholder="0"
                  value={form.monto}
                  onChange={e => setForm({ ...form, monto: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Fecha *</label>
                <input type="date"
                  value={form.fecha}
                  onChange={e => setForm({ ...form, fecha: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn btn-ghost w-full" onClick={handleCancel}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Guardando...' : editId ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista agrupada por categoría */}
      {loading ? (
        <div className="loading">Cargando gastos...</div>
      ) : gastos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📤</div>
          <p>No hay gastos en este período</p>
        </div>
      ) : (
        Object.entries(porCategoria).map(([catNombre, items]) => (
          <div key={catNombre} style={{ marginBottom: 16 }}>
            {/* Encabezado categoría */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, padding: '0 4px' }}>
              <span style={{ fontWeight: 800, fontSize: 13, color: 'var(--morado)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                🏷️ {catNombre}
              </span>
              <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--rojo)' }}>
                {fmt(items.reduce((s, g) => s + Number(g.monto), 0))}
              </span>
            </div>

            <div className="item-list">
              {items.map(g => (
                <div className="item-card" key={g.id}>
                  <div style={{ flex: 1 }}>
                    <div className="item-name">{g.descripcion}</div>
                    <div className="item-sub">
                      {new Date(g.fecha + 'T12:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 900, color: 'var(--rojo)', fontSize: 15 }}>{fmt(g.monto)}</span>
                    <button className="btn btn-edit" onClick={() => handleEdit(g)}>✏️</button>
                    <button className="btn btn-danger" onClick={() => setConfirmId(g.id)}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
