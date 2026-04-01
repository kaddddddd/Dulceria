// pages/Vendedores.jsx
import { useState, useEffect, useRef } from 'react';
import { vendedoresService } from '../services/api';
import Toast from '../components/Toast';
import Confirm from '../components/Confirm';

function fmt(n) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n || 0);
}

function Avatar({ foto, nombre, size = 48 }) {
  const initials = nombre ? nombre.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';
  if (foto) {
    return (
      <img
        src={foto}
        alt={nombre}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--morado-claro)', flexShrink: 0 }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg, var(--lila), var(--morado))',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 800, fontSize: size * 0.36,
      border: '2px solid var(--morado-claro)',
    }}>
      {initials}
    </div>
  );
}

function FotoInput({ value, onChange }) {
  const inputRef = useRef(null);

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => onChange(ev.target.result);
    reader.readAsDataURL(file);
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 4 }}>
      <div
        onClick={() => inputRef.current.click()}
        style={{ cursor: 'pointer', position: 'relative' }}
        title="Cambiar foto"
      >
        <Avatar foto={value} nombre="" size={64} />
        <div style={{
          position: 'absolute', bottom: 0, right: 0,
          background: 'var(--morado)', borderRadius: '50%',
          width: 22, height: 22, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 12, border: '2px solid #fff',
        }}>
          📷
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <button type="button"
          onClick={() => inputRef.current.click()}
          style={{ fontSize: 13, color: 'var(--morado)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, padding: 0, fontFamily: 'Poppins, sans-serif' }}>
          {value ? 'Cambiar foto' : 'Agregar foto'}
        </button>
        {value && (
          <button type="button"
            onClick={() => { onChange(null); inputRef.current.value = ''; }}
            style={{ fontSize: 12, color: 'var(--rojo)', background: 'none', border: 'none', cursor: 'pointer', marginLeft: 10, fontFamily: 'Poppins, sans-serif' }}>
            Quitar
          </button>
        )}
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>JPG o PNG · recomendado cuadrada</div>
      </div>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
    </div>
  );
}

const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32'];

export default function Vendedores() {
  const [vendedores, setVendedores] = useState([]);
  const [showForm,   setShowForm]   = useState(false);
  const [form,       setForm]       = useState({ nombre: '', foto: null });
  const [editId,     setEditId]     = useState(null);
  const [editForm,   setEditForm]   = useState({ nombre: '', foto: null });
  const [toast,      setToast]      = useState(null);
  const [confirmId,  setConfirmId]  = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [loading,    setLoading]    = useState(true);

  function showToast(msg, type = 'success') { setToast({ message: msg, type }); }

  const loadVendedores = () =>
    vendedoresService.getAll()
      .then(setVendedores)
      .catch(() => showToast('Error al cargar vendedores', 'error'))
      .finally(() => setLoading(false));

  useEffect(() => { loadVendedores(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.nombre.trim()) { showToast('Ingresa un nombre', 'error'); return; }
    setSaving(true);
    try {
      await vendedoresService.create({ nombre: form.nombre.trim(), foto: form.foto || null });
      showToast('Vendedor creado');
      setForm({ nombre: '', foto: null });
      setShowForm(false);
      loadVendedores();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(id) {
    if (!editForm.nombre.trim()) { showToast('Ingresa un nombre', 'error'); return; }
    try {
      await vendedoresService.update(id, { nombre: editForm.nombre.trim(), foto: editForm.foto });
      showToast('Vendedor actualizado');
      setEditId(null);
      loadVendedores();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleDelete(id) {
    try {
      await vendedoresService.delete(id);
      showToast('Vendedor eliminado');
      setConfirmId(null);
      loadVendedores();
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
          message="¿Eliminar este vendedor? Solo es posible si no tiene ventas."
          onConfirm={() => handleDelete(confirmId)}
          onCancel={() => setConfirmId(null)}
        />
      )}

      <div className="flex-between mb-16">
        <div className="page-title">👤 Vendedores</div>
        {!showForm && (
          <button className="btn btn-primary" style={{ width: 'auto', padding: '10px 16px', fontSize: 13 }}
            onClick={() => setShowForm(true)}>
            + Agregar
          </button>
        )}
      </div>

      {/* Formulario nuevo vendedor */}
      {showForm && (
        <div className="card" style={{ border: '2px solid var(--rosa)', marginBottom: 20 }}>
          <div className="panel-title">➕ Nuevo vendedor</div>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label>Foto de perfil</label>
              <FotoInput value={form.foto} onChange={foto => setForm(f => ({ ...f, foto }))} />
            </div>
            <div className="form-group">
              <label>Nombre completo *</label>
              <input placeholder="Ej: María López"
                value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn btn-ghost w-full"
                onClick={() => { setShowForm(false); setForm({ nombre: '', foto: null }); }}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="loading">Cargando vendedores...</div>
      ) : vendedores.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👤</div>
          <p>No hay vendedores registrados</p>
        </div>
      ) : (
        <div className="item-list">
          {vendedores.map((v, i) => (
            <div className="card" key={v.id} style={{ marginBottom: 0, border: i < 3 ? `2px solid ${rankColors[i]}44` : '1.5px solid var(--border)' }}>
              {editId === v.id ? (
                <div>
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 12, fontWeight: 700 }}>Foto de perfil</label>
                    <FotoInput value={editForm.foto} onChange={foto => setEditForm(f => ({ ...f, foto }))} />
                  </div>
                  <input
                    style={{ width: '100%', padding: '10px 12px', border: '2px solid var(--rosa)', borderRadius: 10, fontFamily: 'Poppins, sans-serif', fontSize: 15, fontWeight: 600, marginBottom: 10, boxSizing: 'border-box' }}
                    value={editForm.nombre}
                    onChange={e => setEditForm(f => ({ ...f, nombre: e.target.value }))}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditId(null)}>Cancelar</button>
                    <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => handleUpdate(v.id)}>Guardar</button>
                  </div>
                </div>
              ) : (
                <div className="card-row">
                  <Avatar foto={v.foto} nombre={v.nombre} size={52} />
                  <div style={{ flex: 1, marginLeft: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {i < 3 && <span style={{ fontSize: 16 }}>{'🥇🥈🥉'[i]}</span>}
                      <div className="item-name">{v.nombre}</div>
                    </div>
                    <div className="item-sub">
                      {v.total_ventas} ventas · <span style={{ color: 'var(--verde)', fontWeight: 800 }}>{fmt(v.total_vendido)}</span>
                    </div>
                  </div>
                  <div className="item-actions">
                    <button className="btn btn-edit" onClick={() => { setEditId(v.id); setEditForm({ nombre: v.nombre, foto: v.foto || null }); }}>✏️</button>
                    <button className="btn btn-danger" onClick={() => setConfirmId(v.id)}>🗑️</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
