import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import axios from 'axios';

// Import components
import SplashScreen from './components/SplashScreen';
import Navbar from './components/Navbar';
import SidebarPanel from './components/SidebarPanel';
import MapContainer from './components/MapContainer';
import IncidentForm from './components/IncidentForm';
import SearchResults from './components/SearchResults';
import ProductDetail from './components/ProductDetail';

export default function App() {
  // Global States
  const [user, setUser] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [zones, setZones] = useState([]);
  
  // Routing / Map states
  const [routeData, setRouteData] = useState(null);
  const [reportMode, setReportMode] = useState(false);
  const [tempMarkerCoords, setTempMarkerCoords] = useState(null);
  const [sidebarTab, setSidebarTab] = useState('rutas');

  // Load user and map data on mount
  useEffect(() => {
    // 1. Try restoring session
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    }

    // 2. Fetch incidents and zones
    fetchMapData();
  }, []);

  const fetchMapData = async () => {
    try {
      const [incidentsRes, zonesRes] = await Promise.all([
        axios.get('http://localhost:3001/api/incidents'),
        axios.get('http://localhost:3001/api/zones')
      ]);
      setIncidents(incidentsRes.data);
      setZones(zonesRes.data);
    } catch (error) {
      console.error('Error fetching incidents/zones maps data:', error);
    }
  };

  // Auth Handlers
  const handleLoginSuccess = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    setSidebarTab('cuenta'); // switch to profile view
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setSidebarTab('cuenta');
  };

  const handleOpenLogin = () => {
    setSidebarTab('cuenta');
  };

  // Map Handlers
  const handleTriggerReportMode = () => {
    setReportMode(!reportMode);
    setTempMarkerCoords(null);
  };

  const handleMapClick = (lat, lng) => {
    if (reportMode) {
      setTempMarkerCoords({ lat, lng });
    }
  };

  const handleIncidentSubmit = async (newIncident) => {
    try {
      const res = await axios.post('http://localhost:3001/api/incidents', newIncident);
      // Update list
      setIncidents(prev => [res.data, ...prev]);
      
      // Reset modes
      setReportMode(false);
      setTempMarkerCoords(null);
      setSidebarTab('incidentes'); // open incident list to show it
      
      alert('¡Gracias por tu civismo! Tu reporte de inseguridad ha sido registrado y es visible para toda la comunidad.');
    } catch (error) {
      console.error('Error reporting incident:', error);
      alert('Ocurrió un error al enviar el reporte. Por favor reintenta.');
    }
  };

  const handleIncidentCancel = () => {
    setTempMarkerCoords(null);
  };

  const handleCalculateRoute = async (origin, destination) => {
    try {
      const res = await axios.post('http://localhost:3001/api/routes', { origin, destination });
      setRouteData(res.data);
    } catch (error) {
      console.error('Error calculating safe route:', error);
      alert('No se pudo calcular la ruta. Inténtalo de nuevo.');
    }
  };

  const handleClearRoute = () => {
    setRouteData(null);
  };

  const handleCenterMapOnCoords = (lat, lng) => {
    // Dispatch custom event to let MapContainer center it, or simple selector
    // Access Leaflet map instance indirectly is cleaner if we just pan coordinates in leaflet container via state or event,
    // since MapContainer receives coordinates and updates. We can pass a center coords state!
    // But since MapContainer handles zooming, we can also use a window event or let it pan.
    // Let's pass the coords as a temporary route or marker focus state.
    // For simplicity, we can let MapContainer handle centering when incidents change or by checking if a clickedIncident state is passed.
    // Let's pass clickedIncident state to MapContainer!
    // Wait, let's just make it center by setting tempMarkerCoords briefly, or since MapContainer has a prop tempMarkerCoords, 
    // we can set tempMarkerCoords to center!
    // Let's pass targetCenterCoords state:
    setTempMarkerCoords({ lat, lng });
  };

  return (
    <Router>
      {/* Visual Identity Splash Screen */}
      <SplashScreen />

      {/* Persistent top navbar */}
      <Navbar 
        user={user} 
        onLogout={handleLogout} 
        onOpenLogin={handleOpenLogin}
        onTriggerReportMode={handleTriggerReportMode}
        reportMode={reportMode}
      />

      <Routes>
        {/* Main interactive map view */}
        <Route 
          path="/" 
          element={
            <div className="app-container">
              <SidebarPanel
                user={user}
                onLoginSuccess={handleLoginSuccess}
                onLogout={handleLogout}
                incidents={incidents}
                onCalculateRoute={handleCalculateRoute}
                onClearRoute={handleClearRoute}
                routeData={routeData}
                onCenterMap={handleCenterMapOnCoords}
                activeTab={sidebarTab}
                setActiveTab={setSidebarTab}
              />
              
              <MapContainer
                incidents={incidents}
                zones={zones}
                routeData={routeData}
                reportMode={reportMode}
                onMapClick={handleMapClick}
                tempMarkerCoords={tempMarkerCoords}
              />

              {tempMarkerCoords && reportMode && (
                <IncidentForm
                  coords={tempMarkerCoords}
                  user={user}
                  onSubmit={handleIncidentSubmit}
                  onCancel={handleIncidentCancel}
                />
              )}
            </div>
          } 
        />

        {/* MercadoLibre Search Practice Views (SENA Challenge) */}
        <Route path="/items" element={<SearchResults />} />
        <Route path="/items/:id" element={<ProductDetail />} />
      </Routes>
    </Router>
  );
}
