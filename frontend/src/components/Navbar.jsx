import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, User, LogOut, ShieldAlert, Map, Globe } from 'lucide-react';

export default function Navbar({ user, onLogout, onOpenLogin, onTriggerReportMode, reportMode, currentServer, onServerSwitch }) {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search-incidents?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

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

        {/* Server Region Selector */}
        <div className="dropdown d-inline">
          <button className="btn-custom btn-custom-sm btn-custom-ghost dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" style={{ padding: '6px 12px', fontSize: '12px' }} title="Seleccionar región del servidor">
            <Globe size={14} className="me-1" /> {currentServer.flag} {currentServer.region}
          </button>
          <ul className="dropdown-menu shadow">
            <li className="dropdown-header small">Selecciona una región:</li>
            <li><button onClick={() => onServerSwitch('colombia')} className="dropdown-item d-flex align-items-center gap-2">
              🇨🇴 Medellín, Colombia
            </button></li>
            <li><button onClick={() => onServerSwitch('usa')} className="dropdown-item d-flex align-items-center gap-2">
              🇺🇸 USA Network
            </button></li>
          </ul>
        </div>

        {user ? (
          <div className="dropdown d-inline">
            <button className="btn-custom btn-custom-sm btn-custom-primary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" style={{ padding: '6px 12px' }}>
              <User size={16} className="me-1" /> {user.name}
            </button>
            <ul className="dropdown-menu dropdown-menu-end shadow">
              <li><span className="dropdown-item-text text-muted small">{user.email}</span></li>
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
