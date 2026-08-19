import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import { getApiUrl } from './config/apiConfig';

// Import components
import SplashScreen from './components/SplashScreen';
import Navbar from './components/Navbar';
import SidebarPanel from './components/SidebarPanel';
import MapContainer from './components/MapContainer';
import IncidentForm from './components/IncidentForm';
import SearchResults from './components/SearchResults';

// Import Role Dashboards
import ModeratorDashboard from './components/ModeratorDashboard';
import AdminDashboard from './components/AdminDashboard';
import AnalystDashboard from './components/AnalystDashboard';

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
      const apiUrl = getApiUrl();
      const [incidentsRes, zonesRes] = await Promise.all([
        axios.get(`${apiUrl}/api/incidents`),
        axios.get(`${apiUrl}/api/zones`)
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

  // Quick Demo Role Switcher
  const handleSwitchDemoRole = (newRole) => {
    const activeUser = user || {
      id: 'demo-user',
      name: 'Usuario Demo',
      email: 'demo@rutasinseguras.com',
      phone: '3000000000',
      contacts: []
    };

    const updatedUser = { ...activeUser, role: newRole };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
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
      const res = await axios.post(`${getApiUrl()}/api/incidents`, newIncident);
      // Update list
      setIncidents(prev => [res.data, ...prev]);
      
      // Reset modes
      setReportMode(false);
      setTempMarkerCoords(null);
      setSidebarTab('incidentes'); // open incident list to show it
      
      alert('¡Gracias por tu civismo! Tu reporte de inseguridad ha sido enviado a la cola de moderación. Una vez verificado por nuestro equipo, se mostrará públicamente.');
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
      const res = await axios.post(`${getApiUrl()}/api/routes`, { origin, destination });
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
        onSwitchDemoRole={handleSwitchDemoRole}
      />

      <Routes>
        {/* Main interactive map view (Citizen) */}
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

        {/* Role 2: Moderator View */}
        <Route path="/moderador" element={<ModeratorDashboard />} />

        {/* Role 3: Analyst Intelligence Dashboard View */}
        <Route path="/analitica" element={<AnalystDashboard />} />

        {/* Role 4: System Admin User Management View */}
        <Route path="/admin" element={<AdminDashboard />} />

        {/* Incident Search Results */}
        <Route path="/search-incidents" element={<SearchResults incidents={incidents} searchType="incidents" />} />
      </Routes>
    </Router>
  );
}
