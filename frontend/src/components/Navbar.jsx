import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, User, LogOut, ShieldAlert, Map, ShieldCheck, BarChart2, Settings, Shield } from 'lucide-react';

export default function Navbar({ user, onLogout, onOpenLogin, onTriggerReportMode, reportMode, onSwitchDemoRole }) {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search-incidents?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const userRole = user?.role || 'Usuario Ciudadano';
  const isAdmin = userRole === 'Administrador';
  const isModerator = userRole === 'Moderador' || isAdmin;
  const isAnalyst = userRole === 'Analista de Seguridad' || isAdmin;

  return (
    <nav className="navbar-custom">
      <Link to="/" className="navbar-brand-custom">
        <img 
          src="/logos/10_logo_compacto_negativo.png" 
          alt="Rutas Inseguras Logo" 
          className="navbar-logo"
        />
      </Link>

      <form className="search-box-container" onSubmit={handleSearchSubmit}>
        <Search className="search-icon-inside" size={18} />
        <input
          type="text"
          className="search-input"
          placeholder="Buscar incidentes por tipo, zona o descripción..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </form>

      <div className="nav-links-custom">
        <Link to="/" className={`nav-link-custom ${location.pathname === '/' ? 'active' : ''}`}>
          <Map size={16} className="me-1 d-inline" /> Mapa
        </Link>

        {isModerator && (
          <Link to="/moderador" className={`nav-link-custom ${location.pathname === '/moderador' ? 'active font-weight-bold text-warning' : ''}`}>
            <ShieldCheck size={16} className="me-1 d-inline" /> Moderación
          </Link>
        )}

        {isAnalyst && (
          <Link to="/analitica" className={`nav-link-custom ${location.pathname === '/analitica' ? 'active font-weight-bold text-info' : ''}`}>
            <BarChart2 size={16} className="me-1 d-inline" /> Analítica
          </Link>
        )}

        {isAdmin && (
          <Link to="/admin" className={`nav-link-custom ${location.pathname === '/admin' ? 'active font-weight-bold' : ''}`} style={{ color: '#E9D5FF' }}>
            <Settings size={16} className="me-1 d-inline" /> Admin
          </Link>
        )}

        {location.pathname === '/' && (
          <button 
            onClick={onTriggerReportMode} 
            className={`btn-custom btn-custom-sm ${reportMode ? 'btn-custom-danger' : 'btn-custom-ghost'}`}
            style={{ padding: '6px 12px' }}
          >
            <ShieldAlert size={16} /> 
            {reportMode ? 'Haz clic en el Mapa...' : 'Reportar Inseguridad'}
          </button>
        )}

        {/* Demo Role Switcher Dropdown */}
        {onSwitchDemoRole && (
          <div className="dropdown d-inline">
            <button className="btn btn-outline-light btn-sm dropdown-toggle py-1 px-2" type="button" data-bs-toggle="dropdown" style={{ fontSize: '11px', opacity: 0.85 }}>
              ⚡ Rol Demo: <strong>{userRole}</strong>
            </button>
            <ul className="dropdown-menu dropdown-menu-end shadow" style={{ fontSize: '12px' }}>
              <li><h6 className="dropdown-header">Cambiar Rol Rápido (Pruebas)</h6></li>
              <li><button className="dropdown-item" onClick={() => onSwitchDemoRole('Usuario Ciudadano')}>👤 Usuario Ciudadano</button></li>
              <li><button className="dropdown-item" onClick={() => onSwitchDemoRole('Moderador')}>🛡️ Moderador Certificado</button></li>
              <li><button className="dropdown-item" onClick={() => onSwitchDemoRole('Analista de Seguridad')}>📊 Analista de Seguridad</button></li>
              <li><button className="dropdown-item" onClick={() => onSwitchDemoRole('Administrador')}>👑 Administrador del Sistema</button></li>
            </ul>
          </div>
        )}

        {user ? (
          <div className="dropdown d-inline">
            <button className="btn-custom btn-custom-sm btn-custom-primary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" style={{ padding: '6px 12px' }}>
              <User size={16} className="me-1" /> {user.name}
            </button>
            <ul className="dropdown-menu dropdown-menu-end shadow">
              <li>
                <div className="px-3 py-2">
                  <strong className="d-block text-dark">{user.name}</strong>
                  <span className="text-muted small d-block">{user.email}</span>
                  <span className="badge bg-navy-primary text-white mt-1" style={{ fontSize: '10px' }}>
                    Rol: {userRole}
                  </span>
                </div>
              </li>
              <li><hr className="dropdown-divider" /></li>
              {isAdmin && (
                <li>
                  <Link to="/admin" className="dropdown-item d-flex align-items-center gap-2">
                    <Settings size={14} /> Panel Administración
                  </Link>
                </li>
              )}
              {isModerator && (
                <li>
                  <Link to="/moderador" className="dropdown-item d-flex align-items-center gap-2">
                    <ShieldCheck size={14} /> Panel Moderación
                  </Link>
                </li>
              )}
              {isAnalyst && (
                <li>
                  <Link to="/analitica" className="dropdown-item d-flex align-items-center gap-2">
                    <BarChart2 size={14} /> Centro de Analítica
                  </Link>
                </li>
              )}
              <li><hr className="dropdown-divider" /></li>
              <li>
                <button onClick={onLogout} className="dropdown-item text-danger d-flex align-items-center gap-2">
                  <LogOut size={14} /> Cerrar Sesión
                </button>
              </li>
            </ul>
          </div>
        ) : (
          <button onClick={onOpenLogin} className="btn-custom btn-custom-sm btn-custom-primary" style={{ padding: '6px 12px' }}>
            <User size={16} /> Iniciar Sesión
          </button>
        )}
      </div>
    </nav>
  );
}
