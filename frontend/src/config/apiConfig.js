/**
 * API Configuration - Rutas Inseguras Medellín
 */

const API_SERVER = {
  name: 'Medellín, Colombia',
  url: 'http://localhost:5000',
  region: 'CO',
  flag: '🇨🇴'
};

/**
 * Obtener la URL base del API actual
 */
export function getApiUrl() {
  return API_SERVER.url;
}

/**
 * Obtener la configuración del servidor actual
 */
export function getCurrentServer() {
  return API_SERVER;
}

