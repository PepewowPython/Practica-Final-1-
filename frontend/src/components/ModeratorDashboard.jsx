import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle, XCircle, Edit3, MapPin, Search, Filter, Clock, AlertTriangle, Save, Trash2, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { getApiUrl } from '../config/apiConfig';
import { Link } from 'react-router-dom';

export default function ModeratorDashboard() {
  const [incidents, setIncidents] = useState([]);
  const [activeTab, setActiveTab] = useState('pendiente'); // 'pendiente', 'aprobado', 'rechazado'
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [filterType, setFilterType] = useState('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState('');

  // Editable Form State
  const [editTitle, setEditTitle] = useState('');
  const [editType, setEditType] = useState('Hurto');
  const [editDescription, setEditDescription] = useState('');
  const [editLatitude, setEditLatitude] = useState('');
  const [editLongitude, setEditLongitude] = useState('');
  const [editUbicacion, setEditUbicacion] = useState('');
  const [editNotes, setEditNotes] = useState('');

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${getApiUrl()}/api/moderator/incidents`);
      setIncidents(res.data);
      if (res.data.length > 0 && !selectedIncident) {
        selectIncidentForEdit(res.data[0]);
      }
    } catch (err) {
      console.error('Error fetching moderator queue:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectIncidentForEdit = (inc) => {
    setSelectedIncident(inc);
    setEditTitle(inc.title || '');
    setEditType(inc.type || 'Hurto');
    setEditDescription(inc.description || '');
    setEditLatitude(inc.latitude || 6.2442);
    setEditLongitude(inc.longitude || -75.5812);
    setEditUbicacion(inc.ubicacion || '');
    setEditNotes(inc.notes || '');
    setSaveMessage('');
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedIncident) return;
    try {
      const payload = {
        title: editTitle,
        type: editType,
        description: editDescription,
        latitude: parseFloat(editLatitude),
        longitude: parseFloat(editLongitude),
        ubicacion: editUbicacion,
        status: newStatus,
        notes: editNotes
      };

      const res = await axios.patch(`${getApiUrl()}/api/moderator/incidents/${selectedIncident.id}`, payload);
      
      // Update local state
      setIncidents(prev => prev.map(item => item.id === res.data.id ? res.data : item));
      setSelectedIncident(res.data);
      
      setSaveMessage(`✅ Reporte marcado como ${newStatus.toUpperCase()}`);
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      console.error('Error moderating incident:', err);
      alert('Error al actualizar el estado del reporte');
    }
  };

  const handleDeleteIncident = async () => {
    if (!selectedIncident) return;
    if (!window.confirm(`¿Estás seguro de eliminar permanentemente el reporte "${selectedIncident.title}"?`)) return;

    try {
      await axios.delete(`${getApiUrl()}/api/moderator/incidents/${selectedIncident.id}`);
      const updated = incidents.filter(i => i.id !== selectedIncident.id);
      setIncidents(updated);
      setSelectedIncident(updated[0] || null);
      if (updated[0]) selectIncidentForEdit(updated[0]);
    } catch (err) {
      alert('Error al eliminar el reporte');
    }
  };

  // Filtered Queue
  const filteredQueue = incidents.filter(inc => {
    const matchesTab = activeTab === 'todos' || inc.status === activeTab;
    const matchesType = filterType === 'todos' || inc.type === filterType;
    const matchesSearch = inc.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          inc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          inc.reportedBy?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesType && matchesSearch;
  });

  const pendingCount = incidents.filter(i => i.status === 'pendiente').length;
  const approvedCount = incidents.filter(i => i.status === 'aprobado').length;
  const rejectedCount = incidents.filter(i => i.status === 'rechazado').length;

  return (
    <div className="moderator-dashboard-container" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)', backgroundColor: '#F8FAFC' }}>
      
      {/* Top Header Toolbar */}
      <div style={{ backgroundColor: 'var(--navy-primary)', color: 'white', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link to="/" style={{ color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', backgroundColor: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '6px' }}>
            <ArrowLeft size={16} /> Volver al Mapa
          </Link>
          <h5 className="m-0 font-weight-bold" style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={20} className="text-warning" /> Panel de Moderación y Verificación de Reportes
          </h5>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="badge bg-warning text-dark px-3 py-2 rounded-pill font-weight-bold" style={{ fontSize: '12px' }}>
            ⏳ {pendingCount} Pendientes de Revisión
          </span>
          <span className="badge bg-success px-3 py-2 rounded-pill font-weight-bold" style={{ fontSize: '12px' }}>
            ✓ {approvedCount} Aprobados
          </span>
        </div>
      </div>

      {/* 3-Column Main Workspace */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* COLUMN 1: QUEUE & FILTERS */}
        <div style={{ width: '320px', borderRight: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', height: '100%' }}>
          
          {/* Tabs */}
          <div className="d-flex border-bottom bg-light">
            <button 
              className={`btn flex-grow-1 rounded-0 py-2 btn-sm ${activeTab === 'pendiente' ? 'btn-navy font-weight-bold border-bottom-primary' : 'btn-light text-muted'}`}
              onClick={() => setActiveTab('pendiente')}
              style={activeTab === 'pendiente' ? { backgroundColor: 'white', borderBottom: '3px solid var(--navy-primary)', color: 'var(--navy-primary)' } : {}}
            >
              Pendientes ({pendingCount})
            </button>
            <button 
              className={`btn flex-grow-1 rounded-0 py-2 btn-sm ${activeTab === 'aprobado' ? 'btn-navy font-weight-bold' : 'btn-light text-muted'}`}
              onClick={() => setActiveTab('aprobado')}
              style={activeTab === 'aprobado' ? { backgroundColor: 'white', borderBottom: '3px solid var(--green-success)', color: 'var(--green-success)' } : {}}
            >
              Aprobados ({approvedCount})
            </button>
            <button 
              className={`btn flex-grow-1 rounded-0 py-2 btn-sm ${activeTab === 'rechazado' ? 'btn-navy font-weight-bold' : 'btn-light text-muted'}`}
              onClick={() => setActiveTab('rechazado')}
              style={activeTab === 'rechazado' ? { backgroundColor: 'white', borderBottom: '3px solid var(--maroon-danger)', color: 'var(--maroon-danger)' } : {}}
            >
              Rechazados ({rejectedCount})
            </button>
          </div>

          {/* Filter & Search Bar */}
          <div className="p-2 border-bottom bg-white">
            <div className="input-group input-group-sm mb-2">
              <span className="input-group-text bg-white"><Search size={14} /></span>
              <input
                type="text"
                className="form-control"
                placeholder="Buscar reporte..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select 
              className="form-select form-select-sm" 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="todos">Todos los tipos de incidente</option>
              <option value="Hurto">Hurto / Robo</option>
              <option value="Iluminación">Falta de Iluminación</option>
              <option value="Sospechoso">Actividad Sospechosa</option>
            </select>
          </div>

          {/* Queue List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
            {loading ? (
              <p className="text-center text-muted py-4 small">Cargando cola de moderación...</p>
            ) : filteredQueue.length === 0 ? (
              <div className="text-center py-5 text-muted small">
                <CheckCircle size={32} className="text-success mb-2" /><br />
                No hay reportes en esta categoría.
              </div>
            ) : (
              filteredQueue.map(inc => {
                const isSelected = selectedIncident?.id === inc.id;
                let statusBadge = 'badge bg-warning text-dark';
                if (inc.status === 'aprobado') statusBadge = 'badge bg-success';
                if (inc.status === 'rechazado') statusBadge = 'badge bg-danger';

                return (
                  <div
                    key={inc.id}
                    onClick={() => selectIncidentForEdit(inc)}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      marginBottom: '8px',
                      cursor: 'pointer',
                      border: isSelected ? '2px solid var(--navy-primary)' : '1px solid #E2E8F0',
                      backgroundColor: isSelected ? '#EFF6FF' : 'white',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-start mb-1">
                      <span className={statusBadge} style={{ fontSize: '10px' }}>
                        {inc.status ? inc.status.toUpperCase() : 'PENDIENTE'}
                      </span>
                      <span className="text-muted" style={{ fontSize: '10px' }}>
                        {new Date(inc.date).toLocaleDateString()}
                      </span>
                    </div>
                    <strong className="d-block text-dark small text-truncate">{inc.title}</strong>
                    <div className="text-muted small text-truncate" style={{ fontSize: '11px' }}>
                      📍 {inc.ubicacion || 'Medellín'}
                    </div>
                    <div className="d-flex justify-content-between align-items-center mt-2" style={{ fontSize: '10px', color: '#64748B' }}>
                      <span>Por: {inc.reportedBy || 'Anónimo'}</span>
                      <span className="badge bg-light text-dark border">{inc.type}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* COLUMN 2: GEOGRAPHIC INSPECTION & MAP PREVIEW */}
        <div style={{ flex: 1, backgroundColor: '#FFFFFF', padding: '20px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          {selectedIncident ? (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                <div>
                  <span className="text-muted small">Inspeccionando Incidente #{selectedIncident.id}</span>
                  <h4 className="m-0 font-weight-bold text-dark">{selectedIncident.title}</h4>
                </div>
                <span className={`badge ${selectedIncident.status === 'aprobado' ? 'bg-success' : selectedIncident.status === 'rechazado' ? 'bg-danger' : 'bg-warning text-dark'} px-3 py-2`}>
                  Estado Actual: {selectedIncident.status ? selectedIncident.status.toUpperCase() : 'PENDIENTE'}
                </span>
              </div>

              {/* Geo Info Panel */}
              <div className="card border-0 bg-light p-3 mb-4 shadow-sm">
                <h6 className="font-weight-bold text-navy d-flex align-items-center gap-2 mb-2">
                  <MapPin size={16} /> Ubicación Geográfica Detectada
                </h6>
                <div className="row g-2 text-dark small">
                  <div className="col-md-4">
                    <strong>Dirección / Referencia:</strong><br/>
                    <span>{selectedIncident.ubicacion}</span>
                  </div>
                  <div className="col-md-4">
                    <strong>Coordenadas GPS:</strong><br/>
                    <code>Lat: {selectedIncident.latitude}, Lng: {selectedIncident.longitude}</code>
                  </div>
                  <div className="col-md-4">
                    <strong>Fecha y Hora de Reporte:</strong><br/>
                    <span>{new Date(selectedIncident.date).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Interactive Inspection Map Representation */}
              <div className="rounded overflow-hidden mb-4 border" style={{ height: '240px', backgroundColor: '#E2E8F0', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <iframe
                  title="Inspection Map"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  src={`https://maps.google.com/maps?q=${selectedIncident.latitude},${selectedIncident.longitude}&z=16&output=embed`}
                />
              </div>

              {/* Public Card Preview */}
              <div className="p-3 border rounded bg-white shadow-sm">
                <span className="text-muted small d-block mb-2 font-weight-bold">👁️ Vista Previa Pública (Así se mostrará al ciudadano):</span>
                <div className={`incident-card risk-${selectedIncident.type === 'Hurto' ? 'alto' : selectedIncident.type === 'Iluminación' ? 'medio' : 'bajo'} m-0`}>
                  <div className="d-flex justify-content-between align-items-start">
                    <span className="badge badge-alto">{editType}</span>
                    <span className="text-muted" style={{ fontSize: '11px' }}>{new Date(selectedIncident.date).toLocaleDateString()}</span>
                  </div>
                  <h6 className="m-0 font-weight-bold mt-1 text-dark">{editTitle || 'Título del reporte'}</h6>
                  <p className="text-muted small mt-1 mb-2">{editDescription || 'Sin descripción previa.'}</p>
                  <div className="d-flex justify-content-between text-muted" style={{ fontSize: '11px' }}>
                    <span>📍 {editUbicacion || 'Medellín'}</span>
                    <span>Reportó: {selectedIncident.reportedBy}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-5 text-muted">
              Selecciona un reporte de la lista de la izquierda para comenzar la moderación.
            </div>
          )}
        </div>

        {/* COLUMN 3: EDITING & VERIFICATION FORM */}
        <div style={{ width: '380px', borderLeft: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {selectedIncident ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <h5 className="font-weight-bold text-navy mb-3 d-flex align-items-center gap-2">
                <Edit3 size={18} /> Formulario de Edición y Control
              </h5>

              {saveMessage && (
                <div className="alert alert-success p-2 small mb-3 animate-fade-in">
                  {saveMessage}
                </div>
              )}

              <form style={{ flex: 1 }}>
                <div className="form-group-custom mb-3">
                  <label className="form-label-custom">Título Normalizado *</label>
                  <input
                    type="text"
                    className="form-input-custom"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group-custom mb-3">
                  <label className="form-label-custom">Tipo de Incidente *</label>
                  <select
                    className="form-input-custom form-select"
                    value={editType}
                    onChange={(e) => setEditType(e.target.value)}
                  >
                    <option value="Hurto">Hurto / Robo</option>
                    <option value="Iluminación">Falta de Iluminación</option>
                    <option value="Sospechoso">Actividad Sospechosa</option>
                  </select>
                </div>

                <div className="form-group-custom mb-3">
                  <label className="form-label-custom">Dirección / Referencia</label>
                  <input
                    type="text"
                    className="form-input-custom"
                    value={editUbicacion}
                    onChange={(e) => setEditUbicacion(e.target.value)}
                  />
                </div>

                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="form-label-custom">Latitud</label>
                    <input
                      type="number"
                      step="0.0001"
                      className="form-input-custom"
                      value={editLatitude}
                      onChange={(e) => setEditLatitude(e.target.value)}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label-custom">Longitud</label>
                    <input
                      type="number"
                      step="0.0001"
                      className="form-input-custom"
                      value={editLongitude}
                      onChange={(e) => setEditLongitude(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group-custom mb-3">
                  <label className="form-label-custom">Descripción Saneada</label>
                  <textarea
                    className="form-input-custom"
                    rows="3"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    style={{ height: 'auto' }}
                  ></textarea>
                </div>

                <div className="form-group-custom mb-3">
                  <label className="form-label-custom text-navy">🔒 Notas Internas de Moderación (Privadas)</label>
                  <textarea
                    className="form-input-custom"
                    rows="2"
                    placeholder="Escribe razones de aprobación o hallazgos..."
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    style={{ height: 'auto', backgroundColor: '#FFFBEB', borderColor: '#FCD34D' }}
                  ></textarea>
                </div>
              </form>

              {/* Action Buttons */}
              <div className="border-top pt-3 mt-auto d-flex flex-column gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdateStatus('aprobado')}
                  className="btn-custom btn-custom-primary w-100 py-2 d-flex align-items-center justify-content-center gap-2"
                  style={{ backgroundColor: 'var(--green-success)' }}
                >
                  <CheckCircle size={18} /> Aprobar y Publicar en Mapa
                </button>

                <div className="d-flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus('rechazado')}
                    className="btn-custom btn-custom-danger flex-grow-1 py-2 d-flex align-items-center justify-content-center gap-1"
                  >
                    <XCircle size={16} /> Rechazar (Falso)
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleDeleteIncident}
                    className="btn-custom btn-custom-secondary py-2"
                    title="Eliminar registro"
                  >
                    <Trash2 size={16} className="text-danger" />
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>

      </div>
    </div>
  );
}
