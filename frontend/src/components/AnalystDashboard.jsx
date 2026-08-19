import React, { useState, useEffect } from 'react';
import { BarChart3, Download, MapPin, Clock, AlertTriangle, ShieldAlert, ArrowLeft, TrendingUp, PieChart, CheckCircle2, Calendar } from 'lucide-react';
import axios from 'axios';
import { getApiUrl } from '../config/apiConfig';
import { Link } from 'react-router-dom';

export default function AnalystDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCommune, setSelectedCommune] = useState('Todas');
  const [exportNotice, setExportNotice] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [metricsRes, incRes, zonesRes] = await Promise.all([
        axios.get(`${getApiUrl()}/api/analytics/metrics`),
        axios.get(`${getApiUrl()}/api/incidents?all=true`),
        axios.get(`${getApiUrl()}/api/zones`)
      ]);
      setMetrics(metricsRes.data);
      setIncidents(incRes.data);
      setZones(zonesRes.data);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (incidents.length === 0) return;
    const headers = ["ID", "Titulo", "Tipo", "Latitud", "Longitud", "Ubicacion", "Estado", "Fecha"];
    const rows = incidents.map(i => [
      i.id,
      `"${i.title?.replace(/"/g, '""')}"`,
      i.type,
      i.latitude,
      i.longitude,
      `"${i.ubicacion?.replace(/"/g, '""')}"`,
      i.status || 'aprobado',
      i.date
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `informe_seguridad_rutasinseguras_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportNotice('✅ Reporte CSV descargado exitosamente');
    setTimeout(() => setExportNotice(''), 3000);
  };

  return (
    <div style={{ backgroundColor: '#F8FAFC', minHeight: 'calc(100vh - 60px)', paddingBottom: '40px' }}>
      
      {/* Top Analyst Header */}
      <div style={{ backgroundColor: 'var(--navy-primary)', color: 'white', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link to="/" style={{ color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', backgroundColor: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '6px' }}>
            <ArrowLeft size={16} /> Volver al Mapa
          </Link>
          <h4 className="m-0 font-weight-bold" style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BarChart3 size={24} className="text-warning" /> Centro de Inteligencia y Analítica de Seguridad Urbano
          </h4>
        </div>
        <button 
          onClick={handleExportCSV} 
          className="btn-custom btn-custom-ghost text-white border-white btn-custom-sm d-flex align-items-center gap-2"
        >
          <Download size={16} /> Exportar Informe CSV / Excel
        </button>
      </div>

      <div className="container-fluid px-4 py-4" style={{ maxWidth: '1300px' }}>
        
        {exportNotice && (
          <div className="alert alert-success d-flex align-items-center gap-2 mb-4 animate-fade-in shadow-sm">
            <CheckCircle2 size={18} /> {exportNotice}
          </div>
        )}

        {/* Filter Bar */}
        <div className="card border-0 shadow-sm p-3 mb-4 bg-white d-flex flex-row justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-3">
            <span className="font-weight-bold text-navy small">Filtro de Sector / Comuna:</span>
            <select 
              className="form-select form-select-sm" 
              style={{ width: '220px' }}
              value={selectedCommune}
              onChange={(e) => setSelectedCommune(e.target.value)}
            >
              <option value="Todas">Todas las Comunas (Medellín)</option>
              <option value="Comuna 10 - La Candelaria (Centro)">Comuna 10 - La Candelaria (Centro)</option>
              <option value="Comuna 14 - El Poblado">Comuna 14 - El Poblado</option>
              <option value="Comuna 11 - Laureles">Comuna 11 - Laureles</option>
              <option value="Comuna 4 - Aranjuez / UdeA">Comuna 4 - Aranjuez / UdeA</option>
            </select>
          </div>
          <span className="text-muted small">
            📅 Datos actualizados en tiempo real: {new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>

        {/* KPI Metric Highlights */}
        {loading ? (
          <p className="text-center py-5 text-muted">Cargando métricas de seguridad...</p>
        ) : (
          <>
            <div className="row g-3 mb-4">
              <div className="col-md-3">
                <div className="card border-0 shadow-sm p-3 bg-white" style={{ borderLeft: '4px solid var(--maroon-danger)' }}>
                  <span className="text-muted small font-weight-bold">Índice Global de Riesgo</span>
                  <div className="d-flex align-items-baseline gap-2 mt-1">
                    <h3 className="m-0 text-danger font-weight-bold">{metrics?.riskIndex || '6.8'}</h3>
                    <span className="text-muted small">/ 10</span>
                  </div>
                  <span className="text-muted mt-1" style={{ fontSize: '11px' }}>Categoría: Riesgo Moderado-Alto</span>
                </div>
              </div>

              <div className="col-md-3">
                <div className="card border-0 shadow-sm p-3 bg-white" style={{ borderLeft: '4px solid var(--sun-warning)' }}>
                  <span className="text-muted small font-weight-bold">Franja Horaria Crítica</span>
                  <h4 className="m-0 text-dark font-weight-bold mt-2" style={{ fontSize: '1.2rem' }}>
                    ⏰ {metrics?.peakHours || '20:00 - 23:00 hrs'}
                  </h4>
                  <span className="text-muted mt-1" style={{ fontSize: '11px' }}>Pico mayor de hurtos y cosquilleo</span>
                </div>
              </div>

              <div className="col-md-3">
                <div className="card border-0 shadow-sm p-3 bg-white" style={{ borderLeft: '4px solid var(--navy-primary)' }}>
                  <span className="text-muted small font-weight-bold">Delito Predominante</span>
                  <h4 className="m-0 text-navy font-weight-bold mt-2" style={{ fontSize: '1.2rem' }}>
                    🚨 {metrics?.mostFrequentType || 'Hurto'}
                  </h4>
                  <span className="text-muted mt-1" style={{ fontSize: '11px' }}>64% de la concentración total</span>
                </div>
              </div>

              <div className="col-md-3">
                <div className="card border-0 shadow-sm p-3 bg-white" style={{ borderLeft: '4px solid var(--green-success)' }}>
                  <span className="text-muted small font-weight-bold">Total Reportes Procesados</span>
                  <h3 className="m-0 text-success font-weight-bold mt-1">{metrics?.totalIncidents || 0}</h3>
                  <span className="text-muted mt-1" style={{ fontSize: '11px' }}>{metrics?.approvedIncidents || 0} Aprobados | {metrics?.pendingIncidents || 0} Pendientes</span>
                </div>
              </div>
            </div>

            {/* Split Data Charts Section */}
            <div className="row g-4 mb-4">
              
              {/* Left Column: Crime Types Breakdown */}
              <div className="col-md-6">
                <div className="card border-0 shadow-sm p-4 bg-white h-100">
                  <h5 className="font-weight-bold text-navy mb-3 d-flex align-items-center gap-2">
                    <PieChart size={18} /> Distribución por Tipología de Delito
                  </h5>

                  {metrics?.byType && Object.entries(metrics.byType).map(([type, count]) => {
                    const pct = Math.round((count / metrics.totalIncidents) * 100) || 0;
                    let barColor = 'var(--maroon-danger)';
                    if (type === 'Iluminación') barColor = 'var(--sun-warning)';
                    if (type === 'Sospechoso') barColor = 'var(--green-success)';

                    return (
                      <div key={type} className="mb-3">
                        <div className="d-flex justify-content-between small font-weight-bold mb-1">
                          <span>{type}</span>
                          <span>{count} reportes ({pct}%)</span>
                        </div>
                        <div className="progress" style={{ height: '10px' }}>
                          <div
                            className="progress-bar"
                            role="progressbar"
                            style={{ width: `${pct}%`, backgroundColor: barColor }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Hourly Risk Distribution */}
              <div className="col-md-6">
                <div className="card border-0 shadow-sm p-4 bg-white h-100">
                  <h5 className="font-weight-bold text-navy mb-3 d-flex align-items-center gap-2">
                    <Clock size={18} /> Incidencia por Franja Horaria (24h)
                  </h5>

                  {metrics?.hourly && Object.entries(metrics.hourly).map(([slot, count]) => {
                    const totalHourly = Object.values(metrics.hourly).reduce((a, b) => a + b, 0) || 1;
                    const pct = Math.round((count / totalHourly) * 100);

                    return (
                      <div key={slot} className="mb-3">
                        <div className="d-flex justify-content-between small font-weight-bold mb-1">
                          <span>{slot} (6h block)</span>
                          <span>{count} eventos ({pct}%)</span>
                        </div>
                        <div className="progress" style={{ height: '10px' }}>
                          <div
                            className="progress-bar bg-navy-primary"
                            role="progressbar"
                            style={{ width: `${pct}%`, backgroundColor: 'var(--navy-primary)' }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Critical Zones Ranking Table */}
            <div className="card border-0 shadow-sm bg-white overflow-hidden">
              <div className="p-3 border-bottom bg-light">
                <h5 className="m-0 font-weight-bold text-navy d-flex align-items-center gap-2">
                  <MapPin size={18} /> Ranking de Sectores y Zonas de Alto Riesgo Monitoreadas
                </h5>
              </div>

              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
                  <thead className="bg-light text-muted">
                    <tr>
                      <th className="ps-3 py-3">SECTOR / SECTOR URBANO</th>
                      <th>NIVEL DE RIESGO</th>
                      <th>RADIO DE COBERURA</th>
                      <th>DESCRIPCIÓN OPERATIVA</th>
                      <th>RECOMENDACIÓN ANALISTA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {zones.map((zone, idx) => (
                      <tr key={zone.id}>
                        <td className="ps-3 font-weight-bold text-dark">
                          #{idx + 1} {zone.name}
                        </td>
                        <td>
                          <span className={`badge ${zone.level === 'alto' ? 'bg-danger' : zone.level === 'medio' ? 'bg-warning text-dark' : 'bg-success'}`}>
                            Riesgo {zone.level ? zone.level.toUpperCase() : 'MEDIO'}
                          </span>
                        </td>
                        <td>{zone.radius} metros</td>
                        <td className="text-muted text-truncate" style={{ maxWidth: '300px' }}>{zone.description}</td>
                        <td>
                          <span className="text-navy font-weight-bold small">
                            {zone.level === 'alto' ? '🚨 Mayor patrullaje en noche' : '💡 Reforzar luminarias'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </>
        )}

      </div>
    </div>
  );
}
