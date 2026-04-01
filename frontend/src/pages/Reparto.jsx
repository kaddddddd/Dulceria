// pages/Reparto.jsx
// Productos propios (propietario_id) → 100% del propietario.
// El resto se divide 50 / 50.
import { useState, useEffect, useCallback } from 'react';
import { repartoService, retirosService, vendedoresService } from '../services/api';
import Confirm from '../components/Confirm';
import Toast   from '../components/Toast';

function fmt(n) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n || 0);
}

function mesActual() {
  const hoy    = new Date();
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
  const fin    = hoy.toISOString().split('T')[0];
  return { inicio, fin };
}

const LS_DUENA = 'reparto_vendedor_duena_id';

const inputStyle = {
  padding: '8px 10px', borderRadius: 8,
  border: '1.5px solid var(--border)', fontSize: 14,
  fontFamily: 'Poppins, sans-serif', width: '100%',
};

export default function Reparto() {
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [fechas,     setFechas]     = useState(mesActual);
  const [vendedores, setVendedores] = useState([]);
  const [vendDuena,  setVendDuena]  = useState(() => localStorage.getItem(LS_DUENA) || '');

  const [form,   setForm]   = useState({ persona: '', monto: '', concepto: '', fecha: new Date().toISOString().split('T')[0] });
  const [saving, setSaving] = useState(false);
  const [fError, setFError] = useState('');

  const [confirmId, setConfirmId] = useState(null);
  const [toast,     setToast]     = useState(null);

  function showToast(message, type = 'success') { setToast({ message, type }); }

  useEffect(() => {
    vendedoresService.getAll().then(lista => {
      setVendedores(lista);
      setForm(f => ({ ...f, persona: f.persona || (lista[0]?.nombre ?? '') }));
    }).catch(() => {});
  }, []);

  const cargar = useCallback(() => {
    setLoading(true);
    setError('');
    const params = { fecha_inicio: fechas.inicio, fecha_fin: fechas.fin };
    if (vendDuena) params.duena_id = vendDuena;
    repartoService.get(params)
      .then(setData)
      .catch(() => setError('No se pudo cargar el reparto'))
      .finally(() => setLoading(false));
  }, [fechas, vendDuena]);

  useEffect(() => { cargar(); }, [cargar]);

  function handleVendDuenaChange(e) {
    const val = e.target.value;
    setVendDuena(val);
    val ? localStorage.setItem(LS_DUENA, val) : localStorage.removeItem(LS_DUENA);
  }

  async function handleAgregarRetiro(e) {
    e.preventDefault();
    if (!form.persona)                          { setFError('Selecciona una persona'); return; }
    if (!form.monto || Number(form.monto) <= 0) { setFError('El monto debe ser mayor a 0'); return; }
    setSaving(true);
    setFError('');
    try {
      await retirosService.create({ ...form, monto: Number(form.monto) });
      setForm(f => ({ ...f, monto: '', concepto: '' }));
      showToast('Retiro registrado');
      cargar();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleRetirarPropios() {
    const monto = Math.round(data?.propios?.ingresos || 0);
    if (!monto) return;
    const persona = nombreDuena;
    const fecha   = new Date().toISOString().split('T')[0];
    setSaving(true);
    try {
      await retirosService.create({ persona, monto, concepto: 'Ganancias productos propios', fecha });
      showToast(`Retiro registrado — ${fmt(monto)}`);
      cargar();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleEliminar() {
    try {
      await retirosService.delete(confirmId);
      setConfirmId(null);
      showToast('Retiro eliminado');
      cargar();
    } catch {
      setConfirmId(null);
      showToast('No se pudo eliminar', 'error');
    }
  }

  const nombreDuena    = vendedores.find(v => String(v.id) === String(vendDuena))?.nombre || 'Dueña';
  const nombreVendedor = vendedores.find(v => String(v.id) !== String(vendDuena))?.nombre || 'Vendedora';
  const hayDatos       = data && (data.propios.ingresos > 0 || data.general.ventas > 0);

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {confirmId && (
        <Confirm
          message="¿Eliminar este retiro?"
          onConfirm={handleEliminar}
          onCancel={() => setConfirmId(null)}
        />
      )}

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 800 }}>Reparto de ganancias 💵</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Productos propios 100% · Resto 50 / 50</div>
      </div>

      {/* Configuración: quién es la dueña */}
      <div className="card" style={{ marginBottom: 12, background: 'var(--lila-palido)', border: '1.5px solid var(--morado-claro)' }}>
        <div className="panel-title" style={{ marginBottom: 10 }}>⚙️ Configuración</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 700 }}>¿Quién es la dueña?</label>
          <select value={vendDuena} onChange={handleVendDuenaChange} style={inputStyle}>
            <option value="">— Selecciona —</option>
            {vendedores.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
          </select>
        </div>

        {/* Estado productos propios */}
        {data && !data.tiene_propios && (
          <div style={{ marginTop: 12, background: '#FFF9E6', border: '1px solid #FCD34D', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#92400E' }}>
            ℹ️ No hay productos propios registrados. En <b>Inventario</b>, al agregar o editar un producto puedes indicar que le pertenece a alguien — esas ventas irán 100% a esa persona.
          </div>
        )}
        {data && data.tiene_propios && (
          <div style={{ marginTop: 12, background: '#F0FDF4', border: '1px solid #6EE7B7', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#065F46' }}>
            ✅ {data.productos_propios.length} producto{data.productos_propios.length > 1 ? 's propios' : ' propio'} detectado{data.productos_propios.length > 1 ? 's' : ''} —
            sus ventas van 100% a su propietaria.
          </div>
        )}
      </div>

      {/* Filtro fechas */}
      <div className="card" style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Desde</label>
          <input type="date" value={fechas.inicio} onChange={e => setFechas(f => ({ ...f, inicio: e.target.value }))} style={{ ...inputStyle, width: 'auto' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Hasta</label>
          <input type="date" value={fechas.fin} onChange={e => setFechas(f => ({ ...f, fin: e.target.value }))} style={{ ...inputStyle, width: 'auto' }} />
        </div>
        <button onClick={() => setFechas(mesActual())}
          style={{ padding: '6px 14px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--bg)', fontSize: 13, cursor: 'pointer', fontWeight: 700, fontFamily: 'Poppins, sans-serif' }}>
          Este mes
        </button>
      </div>

      {/* Registrar retiro */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="panel-title">Registrar retiro de caja</div>
        <form onSubmit={handleAgregarRetiro} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 700 }}>Persona</label>
              <select value={form.persona} onChange={e => setForm(f => ({ ...f, persona: e.target.value }))} style={inputStyle}>
                <option value="">— Selecciona —</option>
                {vendedores.map(v => <option key={v.id}>{v.nombre}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 700 }}>Monto</label>
              <input type="number" min="1" placeholder="0" value={form.monto}
                onChange={e => setForm(f => ({ ...f, monto: e.target.value }))} style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 700 }}>Concepto (opcional)</label>
              <input type="text" placeholder="Ej: adelanto semana" value={form.concepto}
                onChange={e => setForm(f => ({ ...f, concepto: e.target.value }))} style={inputStyle} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 700 }}>Fecha</label>
              <input type="date" value={form.fecha}
                onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} style={inputStyle} />
            </div>
          </div>
          {fError && (
            <div style={{ background: '#FEE2E2', color: 'var(--rojo)', fontSize: 13, padding: '8px 12px', borderRadius: 8, fontWeight: 600 }}>
              ⚠️ {fError}
            </div>
          )}
          <button type="submit" disabled={saving}
            style={{ padding: '10px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, var(--rosa), var(--morado))', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'Poppins, sans-serif' }}>
            {saving ? 'Guardando...' : '➕ Registrar retiro'}
          </button>
        </form>
      </div>

      {loading && <div className="loading">Calculando reparto...</div>}
      {error   && <div className="empty-state"><p>{error}</p></div>}

      {data && !loading && (
        <>
          {!hayDatos ? (
            <div className="card" style={{ textAlign: 'center', padding: 24, background: 'var(--lila-palido)' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Sin ventas en este período</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                Cuando haya ventas registradas aquí aparecerá el reparto.
              </div>
            </div>
          ) : (
            <>
              {/* PRODUCTOS PROPIOS — completamente separados */}
              {data.tiene_propios && (
                <div className="card" style={{ marginBottom: 12, border: '2px solid var(--morado-claro)', background: 'linear-gradient(135deg, var(--lila-palido), #fff)' }}>
                  <div className="panel-title">⭐ Productos propios — 100% {nombreDuena}</div>

                  {/* Lista de productos propios */}
                  {data.productos_propios.length > 0 && (
                    <div style={{ marginBottom: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {data.productos_propios.map(p => (
                        <span key={p.id} className="badge badge-purple" style={{ fontSize: 12 }}>{p.nombre}</span>
                      ))}
                    </div>
                  )}

                  <div className="flex-between" style={{ padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 14 }}>Ingresos de productos propios</span>
                    <span style={{ fontWeight: 800, color: 'var(--morado)', fontSize: 16 }}>{fmt(data.propios.ingresos)}</span>
                  </div>
                  {data.propios.ingresos > 0 && (
                    <button onClick={handleRetirarPropios} disabled={saving}
                      style={{ marginTop: 10, width: '100%', padding: '8px', borderRadius: 8, border: 'none', background: 'var(--morado)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Poppins, sans-serif' }}>
                      Retirar todo ({fmt(data.propios.ingresos)})
                    </button>
                  )}
                  {data.propios.ingresos === 0 && (
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '8px 0 0' }}>Sin ventas de productos propios en este período.</p>
                  )}
                </div>
              )}

              {/* GANANCIA GENERAL — 50/50 */}
              <div className="card" style={{ marginBottom: 12 }}>
                <div className="panel-title">📊 Ganancia general · 50 / 50</div>
                <div className="flex-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 14 }}>Ventas generales</span>
                  <span style={{ fontWeight: 700 }}>{fmt(data.general.ventas)}</span>
                </div>
                <div className="flex-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>📤 Gastos (se reinvierte)</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>− {fmt(data.general.gastos)}</span>
                </div>
                <div className="flex-between" style={{ padding: '8px 0' }}>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>💰 Ganancia a dividir</span>
                  <span style={{ fontWeight: 800, color: data.general.ganancia >= 0 ? 'var(--verde)' : 'var(--rojo)', fontSize: 16 }}>
                    {fmt(data.general.ganancia)}
                  </span>
                </div>
              </div>

              {/* Distribución */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div className="stat-card green" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>{nombreDuena}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {data.tiene_propios ? 'Propios + 50% general' : '50% general'}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>{fmt(data.distribucion.dueno.bruto)}</div>
                  <div style={{ fontSize: 12 }}>Retirado: <b style={{ color: 'var(--rojo)' }}>{fmt(data.distribucion.dueno.retirado)}</b></div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--verde)', borderTop: '1px solid var(--border)', paddingTop: 6 }}>
                    Pendiente: {fmt(data.distribucion.dueno.pendiente)}
                  </div>
                </div>
                <div className="stat-card purple" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>{nombreVendedor}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>50% general</div>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>{fmt(data.distribucion.vendedor.bruto)}</div>
                  <div style={{ fontSize: 12 }}>Retirado: <b style={{ color: 'var(--rojo)' }}>{fmt(data.distribucion.vendedor.retirado)}</b></div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--morado)', borderTop: '1px solid var(--border)', paddingTop: 6 }}>
                    Pendiente: {fmt(data.distribucion.vendedor.pendiente)}
                  </div>
                </div>
              </div>

              {/* Historial de retiros */}
              {data.historial.length > 0 && (
                <div className="card">
                  <div className="panel-title">Historial de retiros</div>
                  {data.historial.map(r => (
                    <div key={r.id} className="flex-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>
                          <span className="badge badge-purple">{r.persona}</span>
                          {r.concepto ? ` · ${r.concepto}` : ''}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.fecha?.split('T')[0] || r.fecha}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontWeight: 800, color: 'var(--rojo)' }}>−{fmt(r.monto)}</span>
                        <button onClick={() => setConfirmId(r.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
