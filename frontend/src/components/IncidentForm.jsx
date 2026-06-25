import React, { useState } from 'react';
import { AlertCircle, ShieldAlert } from 'lucide-react';

export default function IncidentForm({ coords, user, onSubmit, onCancel }) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Hurto');
  const [description, setDescription] = useState('');
  const [reportedBy, setReportedBy] = useState(user ? user.name : 'Anónimo');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !type) return;

    onSubmit({
      title,
      type,
      description,
      latitude: coords.lat,
      longitude: coords.lng,
      reportedBy
    });
  };

  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      right: '20px',
      zIndex: 1000,
      width: '320px',
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
      border: '1px solid var(--border-light)',
      overflow: 'hidden'
    }} className="animate-fade-in">
      <div style={{
        backgroundColor: 'var(--maroon-danger)',
        color: 'white',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <ShieldAlert size={18} />
        <h6 className="m-0 font-weight-bold" style={{ color: 'white' }}>Reportar Incidente de Riesgo</h6>
      </div>

      <form onSubmit={handleSubmit} className="p-3">
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }} className="d-flex justify-content-between">
          <span>Lat: {coords.lat.toFixed(5)}</span>
          <span>Lon: {coords.lng.toFixed(5)}</span>
        </div>

        <div className="form-group-custom">
          <label className="form-label-custom">Título del Reporte *</label>
          <input
            type="text"
            className="form-input-custom"
            placeholder="Ej: Asalto con moto, Calle oscura"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="form-group-custom">
          <label className="form-label-custom">Tipo de Incidente *</label>
          <select 
            className="form-input-custom form-select"
            value={type}
            onChange={(e) => setType(e.target.value)}
            required
            style={{ appearance: 'auto' }}
          >
            <option value="Hurto">Hurto / Robo</option>
            <option value="Iluminación">Falta de Iluminación</option>
            <option value="Sospechoso">Actividad Sospechosa</option>
          </select>
        </div>

        <div className="form-group-custom">
          <label className="form-label-custom">Descripción / Detalles</label>
          <textarea
            className="form-input-custom"
            rows="3"
            placeholder="Describe qué ocurrió, si hubo heridos o presencia policial..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ height: 'auto', resize: 'vertical' }}
          ></textarea>
        </div>

        <div className="form-group-custom">
          <label className="form-label-custom">Reportado Por</label>
          <input
            type="text"
            className="form-input-custom"
            placeholder="Tu nombre (o dejar anónimo)"
            value={reportedBy}
            onChange={(e) => setReportedBy(e.target.value)}
          />
        </div>

        <div className="d-flex gap-2 mt-3">
          <button type="submit" className="btn-custom btn-custom-danger flex-grow-1 py-2">
            Enviar Reporte
          </button>
          <button type="button" onClick={onCancel} className="btn-custom btn-custom-secondary py-2">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
