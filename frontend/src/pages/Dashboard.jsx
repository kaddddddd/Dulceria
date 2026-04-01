// pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { dashboardService } from '../services/api';

// Formatea números como moneda COP
function fmt(n) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n || 0);
}

function mesActual() {
  const hoy = new Date();
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
  const fin = hoy.toISOString().split('T')[0];
  return { inicio, fin };
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fechas, setFechas] = useState(mesActual);

  useEffect(() => {
    setLoading(true);
    setError('');
    dashboardService.get({ fecha_inicio: fechas.inicio, fecha_fin: fechas.fin })
      .then(setData)
      .catch(() => setError('No se pudo cargar el dashboard'))
      .finally(() => setLoading(false));
  }, [fechas]);

  if (loading) return <div className="loading">⏳ Cargando resumen...</div>;
  if (error)   return <div className="empty-state"><div className="empty-icon">😕</div><p>{error}</p></div>;
  if (!data)   return null;

  const { resumen, productos_bajo_stock, top_productos, top_vendedores } = data;

  return (
    <div>
      {/* Saludo */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 700 }}>
          Hoy, {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
        <div style={{ fontSize: 20, fontWeight: 900, marginTop: 2 }}>¡Bienvenido! 🍬</div>
      </div>

      {/* Filtro de fechas */}
      <div className="card" style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Desde</label>
          <input type="date" value={fechas.inicio}
            onChange={e => setFechas(f => ({ ...f, inicio: e.target.value }))}
            style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Hasta</label>
          <input type="date" value={fechas.fin}
            onChange={e => setFechas(f => ({ ...f, fin: e.target.value }))}
            style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14 }} />
        </div>
        <button onClick={() => setFechas(mesActual())}
          style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', fontSize: 13, cursor: 'pointer', fontWeight: 700 }}>
          Este mes
        </button>
      </div>

      {/* Stats principales */}
      <div className="stat-grid">
        <div className="stat-card pink">
          <div className="stat-icon">💰</div>
          <div className="stat-label">Ventas</div>
          <div className="stat-value" style={{ fontSize: 16 }}>{fmt(resumen.total_ventas)}</div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon">📤</div>
          <div className="stat-label">Gastos</div>
          <div className="stat-value" style={{ fontSize: 16 }}>{fmt(resumen.total_gastos)}</div>
        </div>
        <div className="stat-card green" style={{ gridColumn: '1 / -1' }}>
          <div className="stat-icon">📈</div>
          <div className="stat-label">Ganancia neta ({fechas.inicio} → {fechas.fin})</div>
          <div className="stat-value">{fmt(resumen.ganancia_neta)}</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon">🛒</div>
          <div className="stat-label">Nº Ventas</div>
          <div className="stat-value">{resumen.num_ventas}</div>
        </div>
        <div className="stat-card" style={{ borderColor: productos_bajo_stock.length > 0 ? 'var(--rojo)' : 'var(--border)' }}>
          <div className="stat-icon">⚠️</div>
          <div className="stat-label">Stock bajo</div>
          <div className="stat-value" style={{ color: productos_bajo_stock.length > 0 ? 'var(--rojo)' : 'var(--verde)' }}>
            {productos_bajo_stock.length}
          </div>
        </div>
      </div>

      {/* Alertas de stock bajo */}
      {productos_bajo_stock.length > 0 && (
        <div className="card" style={{ border: '2px solid var(--rojo)', background: '#FFF8F8', marginBottom: 16 }}>
          <div className="panel-title">⚠️ Stock bajo — requiere reposición</div>
          {productos_bajo_stock.map(p => (
            <div key={p.id} className="flex-between" style={{ padding: '8px 0', borderBottom: '1px solid #FFE0E0' }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{p.nombre}</span>
              <span className="badge badge-red">{p.stock} unid.</span>
            </div>
          ))}
        </div>
      )}

      {/* Top productos */}
      {top_productos.length > 0 && (
        <div className="card">
          <div className="panel-title">🏆 Top productos (este mes)</div>
          {top_productos.map((p, i) => (
            <div key={i} className="flex-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>
                  {['🥇','🥈','🥉','4️⃣','5️⃣'][i]} {p.nombre}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.total_vendido} unidades</div>
              </div>
              <span style={{ fontWeight: 800, color: 'var(--verde)', fontSize: 14 }}>{fmt(p.ingresos)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Top vendedores */}
      {top_vendedores.length > 0 && (
        <div className="card">
          <div className="panel-title">👑 Rendimiento vendedores</div>
          {top_vendedores.map((v, i) => (
            <div key={i} className="flex-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{v.nombre}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{v.num_ventas} ventas realizadas</div>
              </div>
              <span style={{ fontWeight: 800, color: 'var(--morado)', fontSize: 14 }}>{fmt(v.total)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
