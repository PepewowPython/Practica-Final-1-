/**
 * API Configuration - Multi-Region Support
 * Soporta múltiples servidores: Colombia (Medellín) y USA
 */

const API_SERVERS = {
  colombia: {
    name: 'Medellín, Colombia',
    url: 'http://localhost:5000',
    region: 'CO',
    flag: '🇨🇴'
  },
  usa: {
    name: 'USA Network',
    url: 'http://localhost:5001',
    region: 'USA',
    flag: '🇺🇸'
  }
};

// Default server
let currentServer = 'colombia';

/**
 * Obtener la URL base del API actual
 */
export function getApiUrl() {
  return API_SERVERS[currentServer].url;
}

/**
 * Obtener la configuración del servidor actual
 */
export function getCurrentServer() {
  return API_SERVERS[currentServer];
}

/**
 * Cambiar el servidor activo
 */
export function switchServer(serverKey) {
  if (API_SERVERS[serverKey]) {
    currentServer = serverKey;
    localStorage.setItem('selectedServer', serverKey);
    console.log(`Switched to ${API_SERVERS[serverKey].name} server`);
    return true;
  }
  return false;
}

/**
 * Obtener todos los servidores disponibles
 */
export function getAvailableServers() {
  return Object.entries(API_SERVERS).map(([key, config]) => ({
    key,
    ...config
  }));
}

/**
 * Cargar preferencia del servidor desde localStorage
 */
export function initializeServerFromStorage() {
  const savedServer = localStorage.getItem('selectedServer');
  if (savedServer && API_SERVERS[savedServer]) {
    currentServer = savedServer;
    console.log(`Restored server preference: ${API_SERVERS[savedServer].name}`);
  }
}

// Inicializar al cargar el módulo
initializeServerFromStorage();
