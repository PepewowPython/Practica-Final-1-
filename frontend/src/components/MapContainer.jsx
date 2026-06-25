import React, { useEffect, useRef } from 'react';

export default function MapContainer({ 
  incidents, 
  zones, 
  routeData, 
  reportMode, 
  onMapClick, 
  tempMarkerCoords 
}) {
  const mapRef = useRef(null);
  const leafletMapInstance = useRef(null);
  
  // Layer groups to easily clear/draw layers dynamically
  const zonesGroup = useRef(null);
  const incidentsGroup = useRef(null);
  const routeGroup = useRef(null);
  const tempMarkerGroup = useRef(null);

  // Initialize Map
  useEffect(() => {
    if (!leafletMapInstance.current) {
      // Create map centered in Medellín
      const map = L.map('map', {
        zoomControl: true,
        doubleClickZoom: false
      }).setView([6.2442, -75.5812], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      leafletMapInstance.current = map;

      // Initialize groups
      zonesGroup.current = L.layerGroup().addTo(map);
      incidentsGroup.current = L.layerGroup().addTo(map);
      routeGroup.current = L.layerGroup().addTo(map);
      tempMarkerGroup.current = L.layerGroup().addTo(map);

      // Event listener for clicks on the map
      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        onMapClick(lat, lng);
      });
    }

    return () => {
      if (leafletMapInstance.current) {
        leafletMapInstance.current.remove();
        leafletMapInstance.current = null;
      }
    };
  }, []);

  // Update Zones layer
  useEffect(() => {
    const map = leafletMapInstance.current;
    if (!map || !zonesGroup.current) return;

    zonesGroup.current.clearLayers();

    zones.forEach(zone => {
      L.circle([zone.latitude, zone.longitude], {
        color: zone.color,
        fillColor: zone.color,
        fillOpacity: 0.2,
        radius: zone.radius,
        weight: 1.5
      })
      .bindPopup(`
        <div style="font-family: 'Roboto', sans-serif;">
          <h6 style="color: ${zone.color}; font-weight: bold; margin-bottom: 4px;">ZONA DE RIESGO: ${zone.level.toUpperCase()}</h6>
          <strong>${zone.name}</strong>
          <p style="font-size: 12px; color: #4b5563; margin-top: 4px; margin-bottom: 0;">${zone.description}</p>
        </div>
      `)
      .addTo(zonesGroup.current);
    });
  }, [zones]);

  // Update Incidents layer
  useEffect(() => {
    const map = leafletMapInstance.current;
    if (!map || !incidentsGroup.current) return;

    incidentsGroup.current.clearLayers();

    incidents.forEach(inc => {
      // Choose icon color depending on incident type
      let markerColor = 'var(--maroon-danger)';
      if (inc.type === 'Iluminación') markerColor = '#D97706'; // Dark Tuscan Orange
      if (inc.type === 'Sospechoso') markerColor = '#7C3AED'; // Dark Purple

      const customIcon = L.divIcon({
        className: 'incident-map-marker',
        html: `
          <div style="
            background-color: ${markerColor};
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 2px solid white;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            cursor: pointer;
            transition: transform 0.2s;
          " 
          onmouseover="this.style.transform='scale(1.2)'"
          onmouseout="this.style.transform='scale(1)'">
            <span style="color: white; font-size: 12px; font-weight: bold;">!</span>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const formattedDate = new Date(inc.date).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });

      L.marker([inc.latitude, inc.longitude], { icon: customIcon })
        .bindPopup(`
          <div style="font-family: 'Roboto', sans-serif; max-width: 200px;">
            <div style="font-size: 11px; text-transform: uppercase; font-weight: bold; color: ${markerColor}; margin-bottom: 2px;">
              ${inc.type}
            </div>
            <h6 style="font-weight: bold; font-size: 14px; margin-bottom: 6px; color: #111827;">${inc.title}</h6>
            <p style="font-size: 12px; color: #374151; margin-bottom: 8px; line-height: 1.4;">${inc.description}</p>
            <div style="font-size: 10px; color: #9ca3af; border-top: 1px solid #f3f4f6; padding-top: 4px; display: flex; justify-content: space-between;">
              <span>Por: ${inc.reportedBy}</span>
              <span>${formattedDate}</span>
            </div>
          </div>
        `)
        .addTo(incidentsGroup.current);
    });
  }, [incidents]);

  // Update Temporary Marker (reporting mode)
  useEffect(() => {
    const map = leafletMapInstance.current;
    if (!map || !tempMarkerGroup.current) return;

    tempMarkerGroup.current.clearLayers();

    if (tempMarkerCoords) {
      const tempIcon = L.divIcon({
        className: 'temp-map-marker',
        html: `
          <div style="
            background-color: var(--maroon-danger);
            width: 28px;
            height: 28px;
            border-radius: 50%;
            border: 2px solid white;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 10px rgba(132, 5, 5, 0.5);
            animation: pulse-marker 1s infinite alternate;
          ">
            <span style="color: white; font-size: 14px; font-weight: bold;">+</span>
          </div>
          <style>
            @keyframes pulse-marker {
              from { transform: scale(1); }
              to { transform: scale(1.15); }
            }
          </style>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      L.marker([tempMarkerCoords.lat, tempMarkerCoords.lng], { icon: tempIcon })
        .addTo(tempMarkerGroup.current);

      map.panTo([tempMarkerCoords.lat, tempMarkerCoords.lng]);
    }
  }, [tempMarkerCoords]);

  // Update Routes (Safe route vs alternative route)
  useEffect(() => {
    const map = leafletMapInstance.current;
    if (!map || !routeGroup.current) return;

    routeGroup.current.clearLayers();

    if (routeData) {
      // 1. Draw Safe Route (Navy Solid)
      const safePolyline = L.polyline(routeData.safeRoute, {
        color: '#072F71', // Regal Navy
        weight: 6,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(routeGroup.current);

      // 2. Draw Alternative Route (Green Dashed)
      const altPolyline = L.polyline(routeData.altRoute, {
        color: '#518555', // Sea Green
        weight: 5,
        opacity: 0.8,
        dashArray: '8, 12',
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(routeGroup.current);

      // Start Marker (Origin)
      const startCoords = routeData.safeRoute[0];
      const startIcon = L.divIcon({
        className: 'route-start-marker',
        html: `
          <div style="background-color: #072F71; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });
      L.marker(startCoords, { icon: startIcon })
        .bindPopup('<b>Origen de la ruta</b>')
        .addTo(routeGroup.current);

      // End Marker (Destination)
      const endCoords = routeData.safeRoute[routeData.safeRoute.length - 1];
      const endIcon = L.divIcon({
        className: 'route-end-marker',
        html: `
          <div style="background-color: #518555; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });
      L.marker(endCoords, { icon: endIcon })
        .bindPopup('<b>Destino de la ruta</b>')
        .addTo(routeGroup.current);

      // Auto-fit route in viewport
      const allPoints = [...routeData.safeRoute, ...routeData.altRoute];
      const bounds = L.latLngBounds(allPoints);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [routeData]);

  return (
    <div className="map-container-wrapper">
      <div id="map" ref={mapRef}></div>
      
      {reportMode && !tempMarkerCoords && (
        <div className="map-instructions">
          <strong>Modo Reporte Activo</strong>
          <p style={{ fontSize: '12px', margin: '4px 0 0 0', color: 'var(--text-muted)' }}>
            Toca o haz clic sobre la calle exacta en el mapa donde ocurrió el incidente para seleccionarla.
          </p>
        </div>
      )}
    </div>
  );
}
