// App.jsx — Componente raíz con navegación
import { useState } from 'react';
import Dashboard  from './pages/Dashboard';
import Productos  from './pages/Productos';
import Ventas     from './pages/Ventas';
import Gastos     from './pages/Gastos';
import Vendedores from './pages/Vendedores';
import Reparto    from './pages/Reparto';

const PAGES = [
  { id: 'dashboard',  label: 'Inicio',      icon: '🏠', component: Dashboard },
  { id: 'ventas',     label: 'Ventas',       icon: '🛒', component: Ventas },
  { id: 'productos',  label: 'Inventario',   icon: '📦', component: Productos },
  { id: 'gastos',     label: 'Gastos',       icon: '📤', component: Gastos },
  { id: 'vendedores', label: 'Equipo',       icon: '👤', component: Vendedores },
  { id: 'reparto',    label: 'Reparto',      icon: '💵', component: Reparto },
];

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const current = PAGES.find(p => p.id === activePage);
  const PageComponent = current.component;

  return (
    <div className="app-shell">
      {/* Top bar */}
      <div className="top-bar">
        <div>
          <div className="subtitle">🍬 Mi Negocio</div>
          <h1>Dulces KAV</h1>
        </div>
        <div style={{ fontSize: 32 }}>🍭</div>
      </div>

      {/* Contenido */}
      <div className="page-content">
        <PageComponent />
      </div>

      {/* Bottom nav */}
      <nav className="bottom-nav">
        {PAGES.map(page => (
          <button
            key={page.id}
            className={`nav-btn ${activePage === page.id ? 'active' : ''}`}
            onClick={() => setActivePage(page.id)}
          >
            <span className="icon">{page.icon}</span>
            {page.label}
            {activePage === page.id && <span className="nav-pip" />}
          </button>
        ))}
      </nav>
    </div>
  );
}
