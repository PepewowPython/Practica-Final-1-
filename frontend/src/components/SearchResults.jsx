import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, MapPin, User, AlertTriangle } from 'lucide-react';

export default function SearchResults({ incidents = [] }) {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || searchParams.get('search');
  const [filteredIncidents, setFilteredIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query) {
      setFilteredIncidents(incidents);
    } else {
      const filtered = incidents.filter(inc => 
        inc.title?.toLowerCase().includes(query.toLowerCase()) ||
        inc.description?.toLowerCase().includes(query.toLowerCase()) ||
        inc.type?.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredIncidents(filtered);
    }
    setLoading(false);
  }, [query, incidents]);

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center p-5 flex-grow-1" style={{ minHeight: '400px' }}>
        <Loader2 className="animate-spin text-primary-navy mb-3" size={36} />
        <p className="text-muted">Buscando incidentes...</p>
      </div>
    );
  }

  if (!query && filteredIncidents.length === 0) {
    return (
      <div className="container p-5 text-center">
        <h4 className="text-muted">No hay incidentes registrados</h4>
        <p className="small text-muted mb-4">Los reportes de incidentes de la comunidad aparecerán aquí.</p>
        <Link to="/" className="btn-custom btn-custom-primary">
          <ArrowLeft size={16} /> Volver al Mapa
        </Link>
      </div>
    );
  }

  if (query && filteredIncidents.length === 0) {
    return (
      <div className="container p-5 text-center">
        <h4 className="text-muted">No se encontraron incidentes para "{query}"</h4>
        <p className="small text-muted mb-4">Intenta buscar por tipo (Hurto, Iluminación, Sospechoso), zona o descripción.</p>
        <Link to="/" className="btn-custom btn-custom-primary">
          <ArrowLeft size={16} /> Volver al Mapa
        </Link>
      </div>
    );
  }

  return (
    <div className="ml-results-container animate-fade-in" style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      {/* Back Button */}
      <div className="mb-3">
        <Link to="/" className="text-decoration-none text-muted small d-inline-flex align-items-center gap-1">
          <ArrowLeft size={14} /> Volver al Mapa
        </Link>
      </div>

      <h3 className="mb-4">
        Incidentes Reportados
        <span className="badge bg-navy-primary text-white ms-2">{filteredIncidents.length}</span>
        {query && <span className="text-muted" style={{ fontSize: '0.9rem' }}> — Búsqueda: "{query}"</span>}
      </h3>

      {/* Incidents List */}
      <div className="incident-list-wrapper">
        {filteredIncidents.map((inc) => {
          let badgeClass = 'badge-alto';
          if (inc.type === 'Iluminación') {
            badgeClass = 'badge-medio';
          }
          if (inc.type === 'Sospechoso') {
            badgeClass = 'badge-bajo';
          }

          return (
            <div 
              key={inc.id} 
              className={`incident-card risk-${inc.type === 'Hurto' ? 'alto' : inc.type === 'Iluminación' ? 'medio' : 'bajo'}`}
              style={{ cursor: 'pointer', marginBottom: '12px' }}
            >
              <div className="d-flex justify-content-between align-items-start mb-2">
                <span className={`incident-badge ${badgeClass}`} style={{ display: 'inline-block' }}>
                  {inc.type}
                </span>
                <span className="text-muted small">
                  {inc.date ? new Date(inc.date).toLocaleDateString('es-CO') : 'Fecha no especificada'}
                </span>
              </div>

              <h5 className="mb-2 font-weight-bold text-dark" style={{ fontSize: '1rem' }}>
                {inc.title}
              </h5>

              <p className="text-muted small mb-3" style={{ lineHeight: '1.4', maxHeight: '60px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {inc.description}
              </p>

              <div className="d-flex flex-column gap-2 text-muted small">
                <div className="d-flex align-items-center gap-2">
                  <MapPin size={14} />
                  <span>Medellín, Antioquia</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <User size={14} />
                  <span>Reportado por: {inc.reportedBy || 'Ciudadano Anónimo'}</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <AlertTriangle size={14} />
                  <span>Estado: {inc.status || 'aprobado'}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
