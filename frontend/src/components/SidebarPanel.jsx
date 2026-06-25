import React, { useState } from 'react';
import { Navigation, AlertTriangle, ShieldAlert, Heart, Plus, Trash2, User, KeyRound, MapPin } from 'lucide-react';
import axios from 'axios';

export default function SidebarPanel({
  user,
  onLoginSuccess,
  onLogout,
  incidents,
  onCalculateRoute,
  onClearRoute,
  routeData,
  onCenterMap,
  activeTab,
  setActiveTab
}) {
  // Routing form state
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');

  // Auth states
  const [isRegistering, setIsRegistering] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authError, setAuthError] = useState('');

  // Contact state
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');

  // Suggest routes helper
  const handleSuggestionClick = (orig, dest) => {
    setOrigin(orig);
    setDestination(dest);
    onCalculateRoute(orig, dest);
  };

  // Auth submit
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const url = isRegistering 
        ? 'http://localhost:5000/api/auth/register' 
        : 'http://localhost:5000/api/auth/login';
      
      const payload = isRegistering 
        ? { name: authName, email: authEmail, password: authPassword, phone: authPhone }
        : { email: authEmail, password: authPassword };

      const res = await axios.post(url, payload);
      onLoginSuccess(res.data);
      
      // Reset fields
      setAuthPassword('');
      setAuthError('');
    } catch (err) {
      setAuthError(err.response?.data?.error || 'Ocurrió un error en la autenticación');
    }
  };

  // Contact add
  const handleAddContact = async (e) => {
    e.preventDefault();
    if (!newContactName || !newContactPhone) return;

    try {
      const token = localStorage.getItem('token');
      const updatedContacts = [...(user.contacts || []), { name: newContactName, phone: newContactPhone }];
      
      const res = await axios.post(
        'http://localhost:5000/api/auth/contacts', 
        { contacts: updatedContacts },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      onLoginSuccess({ token, user: { ...user, contacts: res.data.contacts } });
      setNewContactName('');
      setNewContactPhone('');
    } catch (err) {
      alert('Error al guardar contacto');
    }
  };

  // Contact delete
  const handleDeleteContact = async (indexToDelete) => {
    try {
      const token = localStorage.getItem('token');
      const updatedContacts = user.contacts.filter((_, idx) => idx !== indexToDelete);
      
      const res = await axios.post(
        'http://localhost:5000/api/auth/contacts', 
        { contacts: updatedContacts },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      onLoginSuccess({ token, user: { ...user, contacts: res.data.contacts } });
    } catch (err) {
      alert('Error al eliminar contacto');
    }
  };

  const handleRouteSubmit = (e) => {
    e.preventDefault();
    if (origin && destination) {
      onCalculateRoute(origin, destination);
    }
  };

  return (
    <div className="sidebar-panel">
      {/* Tab Headers */}
      <ul className="nav nav-tabs nav-fill border-bottom bg-white" style={{ position: 'sticky', top: 0, zIndex: 5 }}>
        <li className="nav-item">
          <button 
            className={`nav-link border-0 rounded-0 py-3 ${activeTab === 'rutas' ? 'active font-weight-bold' : ''}`}
            style={activeTab === 'rutas' ? { color: 'var(--navy-primary)', borderBottom: '3px solid var(--navy-primary) !important' } : { color: 'var(--text-muted)' }}
            onClick={() => setActiveTab('rutas')}
          >
            <Navigation size={16} className="me-1 d-inline" /> Rutas
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link border-0 rounded-0 py-3 ${activeTab === 'incidentes' ? 'active font-weight-bold' : ''}`}
            style={activeTab === 'incidentes' ? { color: 'var(--navy-primary)', borderBottom: '3px solid var(--navy-primary) !important' } : { color: 'var(--text-muted)' }}
            onClick={() => setActiveTab('incidentes')}
          >
            <AlertTriangle size={16} className="me-1 d-inline" /> Incidentes
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link border-0 rounded-0 py-3 ${activeTab === 'cuenta' ? 'active font-weight-bold' : ''}`}
            style={activeTab === 'cuenta' ? { color: 'var(--navy-primary)', borderBottom: '3px solid var(--navy-primary) !important' } : { color: 'var(--text-muted)' }}
            onClick={() => setActiveTab('cuenta')}
          >
            <User size={16} className="me-1 d-inline" /> {user ? 'Perfil' : 'Acceso'}
          </button>
        </li>
      </ul>

      {/* Tab Body */}
      <div className="p-3 flex-grow-1">
        
        {/* ==================== TAB 1: RUTAS SEGURAS ==================== */}
        {activeTab === 'rutas' && (
          <div>
            <h5 className="mb-3">Calcular Ruta Segura</h5>
            <form onSubmit={handleRouteSubmit} className="mb-4">
              <div className="form-group-custom">
                <label className="form-label-custom">Origen</label>
                <input
                  type="text"
                  className="form-input-custom"
                  placeholder="Ej: Universidad de Antioquia"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  required
                />
              </div>
              <div className="form-group-custom">
                <label className="form-label-custom">Destino</label>
                <input
                  type="text"
                  className="form-input-custom"
                  placeholder="Ej: Parque Lleras"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  required
                />
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="btn-custom btn-custom-primary flex-grow-1 py-2">
                  Buscar Ruta
                </button>
                {routeData && (
                  <button type="button" onClick={onClearRoute} className="btn-custom btn-custom-secondary py-2">
                    Limpiar
                  </button>
                )}
              </div>
            </form>

            {/* Quick Demo Suggestions */}
            {!routeData && (
              <div className="bg-white p-3 rounded shadow-sm mb-3">
                <span className="text-muted small d-block mb-2 font-weight-bold">Búsquedas sugeridas (Medellín):</span>
                <button 
                  type="button" 
                  onClick={() => handleSuggestionClick('Universidad de Antioquia', 'Parque Lleras')}
                  className="btn btn-outline-secondary btn-sm w-100 mb-2 text-start"
                  style={{ fontSize: '12px' }}
                >
                  📍 UdeA hacia Parque Lleras
                </button>
                <button 
                  type="button" 
                  onClick={() => handleSuggestionClick('Laureles', 'Poblado')}
                  className="btn btn-outline-secondary btn-sm w-100 text-start"
                  style={{ fontSize: '12px' }}
                >
                  📍 Laureles hacia El Poblado
                </button>
              </div>
            )}

            {/* Route calculations info */}
            {routeData && (
              <div className="bg-white p-3 rounded shadow-sm border-left-navy animate-fade-in">
                <h6 className="font-weight-bold text-primary-navy d-flex align-items-center gap-1">
                  <Navigation size={16} /> Resultados del Análisis
                </h6>
                <hr className="my-2" />
                
                <div className="mb-2">
                  <span className="d-block small text-muted">Ruta Recomendada (Continua Navy):</span>
                  <span className="badge badge-bajo">Riesgo {routeData.safeRiskScore}</span>
                </div>
                <div className="mb-2">
                  <span className="d-block small text-muted">Ruta Alternativa (Punteada Verde):</span>
                  <span className="badge badge-medio">Riesgo {routeData.altRiskScore}</span>
                </div>
                
                <p className="small text-dark mt-3 mb-0" style={{ lineHeight: '1.4' }}>
                  {routeData.description}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 2: INCIDENTES ==================== */}
        {activeTab === 'incidentes' && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="m-0">Últimos Reportes</h5>
              <span className="badge bg-navy-primary text-white">{incidents.length} total</span>
            </div>
            
            {incidents.length === 0 ? (
              <p className="text-muted text-center py-4 small">No se han registrado reportes.</p>
            ) : (
              <div className="incident-list-wrapper">
                {incidents.map((inc) => {
                  let badgeClass = 'badge-alto';
                  if (inc.type === 'Iluminación') badgeClass = 'badge-medio';
                  if (inc.type === 'Sospechoso') badgeClass = 'badge-bajo';

                  return (
                    <div 
                      key={inc.id} 
                      className={`incident-card risk-${inc.type === 'Hurto' ? 'alto' : inc.type === 'Iluminación' ? 'medio' : 'bajo'}`}
                      onClick={() => onCenterMap(inc.latitude, inc.longitude)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <span className={`incident-badge ${badgeClass}`}>{inc.type}</span>
                        <span className="text-muted" style={{ fontSize: '10px' }}>
                          {new Date(inc.date).toLocaleDateString()}
                        </span>
                      </div>
                      <h6 className="m-0 font-weight-bold text-dark" style={{ fontSize: '0.95rem' }}>{inc.title}</h6>
                      <p className="text-muted small mt-1 mb-2 text-truncate-2" style={{ lineHeight: '1.3' }}>
                        {inc.description}
                      </p>
                      <div className="d-flex align-items-center justify-content-between text-muted" style={{ fontSize: '10px' }}>
                        <span className="d-flex align-items-center gap-1">
                          <MapPin size={10} /> Medellín
                        </span>
                        <span>Por: {inc.reportedBy}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 3: MI CUENTA / ACCESO ==================== */}
        {activeTab === 'cuenta' && (
          <div>
            {!user ? (
              // Login / Register Form
              <div className="bg-white p-3 rounded shadow-sm">
                <h5 className="mb-3 text-center">{isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}</h5>
                
                {authError && (
                  <div className="alert alert-danger p-2 small" role="alert">
                    {authError}
                  </div>
                )}

                <form onSubmit={handleAuthSubmit}>
                  {isRegistering && (
                    <>
                      <div className="form-group-custom">
                        <label className="form-label-custom">Nombre Completo</label>
                        <input
                          type="text"
                          className="form-input-custom"
                          value={authName}
                          onChange={(e) => setAuthName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group-custom">
                        <label className="form-label-custom">Teléfono</label>
                        <input
                          type="tel"
                          className="form-input-custom"
                          value={authPhone}
                          onChange={(e) => setAuthPhone(e.target.value)}
                          placeholder="Ej: 3001234567"
                        />
                      </div>
                    </>
                  )}
                  <div className="form-group-custom">
                    <label className="form-label-custom">Correo Electrónico</label>
                    <input
                      type="email"
                      className="form-input-custom"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group-custom">
                    <label className="form-label-custom">Contraseña</label>
                    <input
                      type="password"
                      className="form-input-custom"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      required
                    />
                  </div>

                  <button type="submit" className="btn-custom btn-custom-primary w-100 mt-2">
                    {isRegistering ? 'Registrarse' : 'Ingresar'}
                  </button>
                </form>

                <hr />
                <p className="text-center small text-muted m-0">
                  {isRegistering ? '¿Ya tienes una cuenta?' : '¿No tienes cuenta todavía?'}
                  <button 
                    type="button" 
                    className="btn btn-link btn-sm p-0 ms-1"
                    onClick={() => {
                      setIsRegistering(!isRegistering);
                      setAuthError('');
                    }}
                  >
                    {isRegistering ? 'Inicia Sesión' : 'Regístrate aquí'}
                  </button>
                </p>
              </div>
            ) : (
              // User Profile details & Contacts of Confidence
              <div>
                <div className="bg-white p-3 rounded shadow-sm mb-4">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <div style={{ backgroundColor: 'var(--navy-primary)', color: 'white', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifycontent: 'center', fontWeight: 'bold' }} className="justify-content-center">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h6 className="m-0 font-weight-bold text-dark">{user.name}</h6>
                      <span className="text-muted small">{user.email}</span>
                    </div>
                  </div>
                  {user.phone && <p className="small text-muted m-0">📞 Teléfono: {user.phone}</p>}
                  
                  <button 
                    onClick={onLogout} 
                    className="btn-custom btn-custom-secondary btn-custom-sm w-100 mt-3"
                  >
                    Cerrar Sesión
                  </button>
                </div>

                {/* Contacts of Confidence System (RF-12) */}
                <div className="bg-white p-3 rounded shadow-sm">
                  <h6 className="font-weight-bold text-dark d-flex align-items-center gap-2 mb-3">
                    <Heart size={16} className="text-danger" /> Contactos de Confianza
                  </h6>
                  
                  <p className="text-muted" style={{ fontSize: '11px', lineHeight: '1.4' }}>
                    Agrega contactos a los que podrás enviar reportes rápidos o compartir tu ubicación real.
                  </p>

                  <div className="contact-list-box mb-3">
                    {(!user.contacts || user.contacts.length === 0) ? (
                      <span className="text-muted d-block text-center py-2 small">Ninguno registrado aún</span>
                    ) : (
                      user.contacts.map((contact, idx) => (
                        <div key={idx} className="d-flex justify-content-between align-items-center border-bottom py-2" style={{ fontSize: '13px' }}>
                          <div>
                            <strong>{contact.name}</strong>
                            <div className="text-muted" style={{ fontSize: '11px' }}>{contact.phone}</div>
                          </div>
                          <button 
                            onClick={() => handleDeleteContact(idx)} 
                            className="btn btn-link text-danger p-0 border-0"
                            title="Eliminar"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <form onSubmit={handleAddContact} className="border-top pt-3">
                    <div className="form-group-custom">
                      <input
                        type="text"
                        className="form-input-custom form-control-sm"
                        placeholder="Nombre Contacto"
                        value={newContactName}
                        onChange={(e) => setNewContactName(e.target.value)}
                        style={{ height: '34px', fontSize: '12px' }}
                        required
                      />
                    </div>
                    <div className="form-group-custom">
                      <input
                        type="tel"
                        className="form-input-custom form-control-sm"
                        placeholder="Teléfono (ej: 310123...)"
                        value={newContactPhone}
                        onChange={(e) => setNewContactPhone(e.target.value)}
                        style={{ height: '34px', fontSize: '12px' }}
                        required
                      />
                    </div>
                    <button type="submit" className="btn-custom btn-custom-ghost btn-custom-sm w-100 py-1" style={{ height: '32px' }}>
                      <Plus size={14} /> Añadir Contacto
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
