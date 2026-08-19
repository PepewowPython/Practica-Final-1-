import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mysql from 'mysql2/promise';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'db.json');

const JWT_SECRET = process.env.JWT_SECRET || 'rutas-inseguras-super-secret-key';
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'rutas_inseguras_db',
  waitForConnections: true,
  connectionLimit: 10
};

let mariaDbPool = null;
let mariaDbReady = false;

async function initMariaDB() {
  try {
    const configuredFields = [process.env.DB_HOST, process.env.DB_PORT, process.env.DB_USER, process.env.DB_NAME];
    if (!configuredFields.some(Boolean)) {
      console.log('MariaDB not configured. Using local JSON database fallback.');
      return;
    }

    mariaDbPool = mysql.createPool(DB_CONFIG);
    const connection = await mariaDbPool.getConnection();
    await connection.ping();
    connection.release();
    mariaDbReady = true;
    console.log(`MariaDB connected to ${DB_CONFIG.database}@${DB_CONFIG.host}:${DB_CONFIG.port}`);
  } catch (error) {
    console.warn('MariaDB unavailable. Falling back to JSON database:', error.message);
    mariaDbPool = null;
    mariaDbReady = false;
  }
}

await initMariaDB();

function mapUserRow(row) {
  return {
    id: row.id_usuario ?? row.id,
    name: row.nombre ?? row.name,
    email: row.correo ?? row.email,
    phone: row.telefono ?? '',
    role: row.nombre_rol ?? row.role ?? 'Usuario Ciudadano',
    contacts: []
  };
}

async function findUserByEmailMaria(email) {
  if (!mariaDbPool) return null;
  const [rows] = await mariaDbPool.query(
    `SELECT u.*, r.nombre_rol
     FROM usuarios u
     LEFT JOIN roles r ON r.id_rol = u.id_rol
     WHERE LOWER(u.correo) = LOWER(?) LIMIT 1`,
    [email]
  );
  return rows[0] || null;
}

async function createUserMaria({ name, email, password, phone }) {
  if (!mariaDbPool) return null;

  const [roleRows] = await mariaDbPool.query(
    'SELECT id_rol FROM roles WHERE nombre_rol = ? LIMIT 1',
    ['Usuario Ciudadano']
  );

  const roleId = roleRows[0]?.id_rol || 3;
  const [result] = await mariaDbPool.query(
    'INSERT INTO usuarios (nombre, correo, contrasena, telefono, estado, id_rol) VALUES (?, ?, ?, ?, ?, ?)',
    [name, email.toLowerCase(), password, phone || '', 'activo', roleId]
  );

  const [rows] = await mariaDbPool.query(
    `SELECT u.*, r.nombre_rol
     FROM usuarios u
     LEFT JOIN roles r ON r.id_rol = u.id_rol
     WHERE u.id_usuario = ? LIMIT 1`,
    [result.insertId]
  );

  return rows[0] || null;
}

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Helper to read database
async function readDB() {
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading db.json, returning empty template:', error);
    return { users: [], incidents: [], zones: [] };
  }
}

// Helper to write database
async function writeDB(data) {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// Author signature
const AUTHOR = {
  name: 'Jean',
  lastname: 'Crespo'
};

// ==========================================
// AUTHENTICATION ENDPOINTS
// ==========================================

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    if (mariaDbReady) {
      const existing = await findUserByEmailMaria(email);
      if (existing) {
        return res.status(400).json({ error: 'El correo ya está registrado' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const created = await createUserMaria({ name, email, password: hashedPassword, phone });
      if (!created) {
        return res.status(500).json({ error: 'No se pudo crear el usuario en MariaDB' });
      }

      const user = mapUserRow(created);
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
      return res.status(201).json({ token, user: { ...user, password: undefined } });
    }

    const db = await readDB();
    const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(400).json({ error: 'El correo ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: String(Date.now()),
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone: phone || '',
      contacts: []
    };

    db.users.push(newUser);
    await writeDB(db);

    const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json({ token, user: userWithoutPassword });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor al registrar usuario' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    if (mariaDbReady) {
      const userRow = await findUserByEmailMaria(email);
      if (!userRow) {
        return res.status(400).json({ error: 'Credenciales inválidas' });
      }

      const isMatch = await bcrypt.compare(password, userRow.contrasena);
      if (!isMatch) {
        return res.status(400).json({ error: 'Credenciales inválidas' });
      }

      const user = mapUserRow(userRow);
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({ token, user });
    }

    const db = await readDB();
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor al iniciar sesión' });
  }
});

// Get/update contacts
app.post('/api/auth/contacts', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No autorizado' });
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const { contacts } = req.body; // array of {name, phone}
    if (!Array.isArray(contacts)) {
      return res.status(400).json({ error: 'El formato de contactos debe ser un array' });
    }

    const db = await readDB();
    const userIdx = db.users.findIndex(u => u.id === decoded.userId);
    if (userIdx === -1) return res.status(404).json({ error: 'Usuario no encontrado' });

    db.users[userIdx].contacts = contacts;
    await writeDB(db);

    res.json({ success: true, contacts: db.users[userIdx].contacts });
  } catch (err) {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
});

app.post('/api/dev/test-user', async (req, res) => {
  try {
    const payload = {
      name: req.body.name || 'Usuario Prueba',
      email: req.body.email || 'prueba@rutasinseguras.com',
      password: req.body.password || 'Prueba123!',
      phone: req.body.phone || '3005551234'
    };

    if (mariaDbReady) {
      const existing = await findUserByEmailMaria(payload.email);
      if (existing) {
        return res.status(200).json({
          message: 'El usuario de prueba ya existe en MariaDB',
          source: 'mariadb',
          user: mapUserRow(existing)
        });
      }

      const hashedPassword = await bcrypt.hash(payload.password, 10);
      const created = await createUserMaria({
        name: payload.name,
        email: payload.email,
        password: hashedPassword,
        phone: payload.phone
      });

      return res.status(201).json({
        message: 'Usuario de prueba creado en MariaDB',
        source: 'mariadb',
        user: mapUserRow(created)
      });
    }

    const db = await readDB();
    const existing = db.users.find(u => u.email.toLowerCase() === payload.email.toLowerCase());
    if (existing) {
      return res.status(200).json({ message: 'El usuario de prueba ya existía en JSON', source: 'json', user: existing });
    }

    const hashedPassword = await bcrypt.hash(payload.password, 10);
    const newUser = {
      id: String(Date.now()),
      name: payload.name,
      email: payload.email.toLowerCase(),
      password: hashedPassword,
      phone: payload.phone,
      contacts: []
    };

    db.users.push(newUser);
    await writeDB(db);

    return res.status(201).json({
      message: 'Usuario de prueba creado en JSON',
      source: 'json',
      user: { ...newUser, password: undefined }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error creando usuario de prueba', details: error.message });
  }
});

// ==========================================
// INCIDENTS & RISK ZONES ENDPOINTS
// ==========================================

app.get('/api/incidents', async (req, res) => {
  try {
    const db = await readDB();
    const { status, all } = req.query;
    if (all === 'true') {
      return res.json(db.incidents);
    }
    if (status) {
      return res.json(db.incidents.filter(i => i.status === status));
    }
    // Default for citizen view: approved or legacy un-statused incidents
    const publicIncidents = db.incidents.filter(i => !i.status || i.status === 'aprobado');
    res.json(publicIncidents);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener incidentes' });
  }
});

app.post('/api/incidents', async (req, res) => {
  try {
    const { title, type, description, latitude, longitude, reportedBy, ubicacion, status } = req.body;
    if (!title || !type || !latitude || !longitude) {
      return res.status(400).json({ error: 'Faltan campos del incidente' });
    }

    const db = await readDB();
    const newIncident = {
      id: `inc-${Date.now()}`,
      title,
      type,
      description: description || '',
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      ubicacion: ubicacion || `Lat ${parseFloat(latitude).toFixed(4)}, Lng ${parseFloat(longitude).toFixed(4)}`,
      date: new Date().toISOString(),
      reportedBy: reportedBy || 'Anónimo',
      status: status || 'pendiente', // Sent to moderation queue by default
      notes: 'Pendiente de moderación comunitaria'
    };

    db.incidents.push(newIncident);
    await writeDB(db);

    res.status(201).json(newIncident);
  } catch (err) {
    res.status(500).json({ error: 'Error al guardar incidente' });
  }
});

app.get('/api/zones', async (req, res) => {
  try {
    const db = await readDB();
    res.json(db.zones);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener zonas de riesgo' });
  }
});

// ==========================================
// ADMIN ENDPOINTS (USER MANAGEMENT)
// ==========================================

app.get('/api/admin/users', async (req, res) => {
  try {
    const db = await readDB();
    const safeUsers = db.users.map(({ password, ...u }) => u);
    res.json(safeUsers);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener lista de usuarios' });
  }
});

app.patch('/api/admin/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { role, status, name, phone } = req.body;
    const db = await readDB();
    const userIdx = db.users.findIndex(u => u.id === String(id));
    if (userIdx === -1) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (role) db.users[userIdx].role = role;
    if (status) db.users[userIdx].status = status;
    if (name) db.users[userIdx].name = name;
    if (phone !== undefined) db.users[userIdx].phone = phone;

    await writeDB(db);
    const { password, ...updatedUser } = db.users[userIdx];
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

app.delete('/api/admin/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    const initialLen = db.users.length;
    db.users = db.users.filter(u => u.id !== String(id));
    if (db.users.length === initialLen) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    await writeDB(db);
    res.json({ message: 'Usuario eliminado exitosamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

// ==========================================
// MODERATOR ENDPOINTS (INCIDENT VERIFICATION)
// ==========================================

app.get('/api/moderator/incidents', async (req, res) => {
  try {
    const db = await readDB();
    res.json(db.incidents);
  } catch (err) {
    res.status(500).json({ error: 'Error al cargar cola de moderación' });
  }
});

app.patch('/api/moderator/incidents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, type, description, latitude, longitude, ubicacion, status, notes } = req.body;
    const db = await readDB();
    const incIdx = db.incidents.findIndex(i => i.id === String(id));
    if (incIdx === -1) {
      return res.status(404).json({ error: 'Incidente no encontrado' });
    }

    if (title) db.incidents[incIdx].title = title;
    if (type) db.incidents[incIdx].type = type;
    if (description !== undefined) db.incidents[incIdx].description = description;
    if (latitude) db.incidents[incIdx].latitude = parseFloat(latitude);
    if (longitude) db.incidents[incIdx].longitude = parseFloat(longitude);
    if (ubicacion) db.incidents[incIdx].ubicacion = ubicacion;
    if (status) db.incidents[incIdx].status = status;
    if (notes !== undefined) db.incidents[incIdx].notes = notes;

    await writeDB(db);
    res.json(db.incidents[incIdx]);
  } catch (err) {
    res.status(500).json({ error: 'Error al moderar incidente' });
  }
});

app.delete('/api/moderator/incidents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    db.incidents = db.incidents.filter(i => i.id !== String(id));
    await writeDB(db);
    res.json({ message: 'Incidente eliminado por el moderador' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar incidente' });
  }
});

// ==========================================
// ANALYST ENDPOINTS (SECURITY INTELLIGENCE)
// ==========================================

app.get('/api/analytics/metrics', async (req, res) => {
  try {
    const db = await readDB();
    const totalIncidents = db.incidents.length;
    const approvedIncidents = db.incidents.filter(i => i.status === 'aprobado').length;
    const pendingIncidents = db.incidents.filter(i => i.status === 'pendiente').length;
    const rejectedIncidents = db.incidents.filter(i => i.status === 'rechazado').length;

    // Type distribution
    const byType = {};
    db.incidents.forEach(i => {
      byType[i.type] = (byType[i.type] || 0) + 1;
    });

    // Hourly distribution
    const hourly = { Mañana: 0, Tarde: 0, Noche: 0, Madrugada: 0 };
    db.incidents.forEach(i => {
      const h = new Date(i.date).getHours();
      if (h >= 6 && h < 12) hourly.Mañana++;
      else if (h >= 12 && h < 18) hourly.Tarde++;
      else if (h >= 18 && h < 24) hourly.Noche++;
      else hourly.Madrugada++;
    });

    // Risk Index (Scale 1-10)
    const riskIndex = (totalIncidents * 1.2 + db.zones.length * 0.8).toFixed(1);

    res.json({
      totalIncidents,
      approvedIncidents,
      pendingIncidents,
      rejectedIncidents,
      byType,
      hourly,
      riskIndex: Math.min(parseFloat(riskIndex), 9.5),
      peakHours: '20:00 - 23:00 hrs',
      mostFrequentType: Object.entries(byType).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Hurto',
      zonesCount: db.zones.length,
      calculatedAt: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al calcular métricas analíticas' });
  }
});


// ==========================================
// ROUTE CALCULATION WITH TRAFFIC ANALYSIS
// ==========================================

// Helper: Calculate traffic multiplier based on time of day and zones
function calculateTrafficMultiplier(hour, dayOfWeek) {
  // Rush hours: 7-9am, 12-1pm, 5-7pm
  const rushHours = [7, 8, 12, 17, 18];
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
  
  if (isWeekday && rushHours.includes(hour)) {
    return 1.5; // 50% slower
  } else if (isWeekday && ((hour >= 6 && hour <= 10) || (hour >= 11 && hour <= 13) || (hour >= 16 && hour <= 20))) {
    return 1.3; // 30% slower
  } else if (hour >= 21 || hour <= 5) {
    return 0.9; // 10% faster at night
  }
  return 1.0; // Normal traffic
}

// Helper: Calculate security risk for a coordinate based on incidents database
async function calculateSecurityRisk(latitude, longitude, incidents, zones) {
  let riskScore = 0;
  let nearbyIncidents = [];
  
  // Check proximity to incidents (within 0.01 degrees ≈ 1 km)
  incidents.forEach(incident => {
    const distance = Math.sqrt(
      Math.pow(incident.latitude - latitude, 2) + 
      Math.pow(incident.longitude - longitude, 2)
    );
    if (distance < 0.01) {
      nearbyIncidents.push(incident);
      riskScore += 2;
    }
  });
  
  // Check proximity to high-risk zones
  zones.forEach(zone => {
    const distance = Math.sqrt(
      Math.pow(zone.latitude - latitude, 2) + 
      Math.pow(zone.longitude - longitude, 2)
    );
    const radiusInDegrees = zone.radius / 111000; // Convert meters to degrees
    
    if (distance < radiusInDegrees) {
      if (zone.level === 'alto') riskScore += 3;
      if (zone.level === 'medio') riskScore += 1.5;
    }
  });
  
  return { riskScore, nearbyIncidents };
}

// Helper: Calculate route security and traffic scores
async function analyzeRoute(coordinates, incidents, zones) {
  let totalRisk = 0;
  let securityIncidents = [];
  
  for (const coord of coordinates) {
    const { riskScore, nearbyIncidents } = await calculateSecurityRisk(coord[0], coord[1], incidents, zones);
    totalRisk += riskScore;
    securityIncidents.push(...nearbyIncidents);
  }
  
  const avgRisk = totalRisk / coordinates.length;
  
  let securityLevel = 'Bajo';
  if (avgRisk > 5) securityLevel = 'Alto';
  else if (avgRisk > 2.5) securityLevel = 'Medio';
  
  return { securityLevel, avgRisk, securityIncidents };
}

// Helper: Get route from OSRM
async function getRouteFromOSRM(originCoords, destCoords) {
  try {
    // Validate coordinates are within reasonable bounds
    if (!originCoords || !destCoords || originCoords.length < 2 || destCoords.length < 2) {
      console.error('Invalid coordinates format');
      return null;
    }

    const url = `http://router.project-osrm.org/route/v1/driving/${originCoords[1]},${originCoords[0]};${destCoords[1]},${destCoords[0]}?overview=full&geometries=geojson`;
    const response = await axios.get(url, { timeout: 5000 });
    
    if (response.data && response.data.routes && response.data.routes.length > 0) {
      const route = response.data.routes[0];
      const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]); // Convert to [lat, lng]
      const distance = route.distance / 1000; // Convert to km
      const duration = route.duration / 60; // Convert to minutes
      
      return { coordinates, distance, duration };
    } else if (response.data && response.data.code === 'NoRoute') {
      console.warn('OSRM: No route found between coordinates');
      return null;
    }
  } catch (error) {
    console.error('OSRM API error:', error.message);
  }
  return null;
}

// Helper: Generate fallback route (straight line with intermediate points)
function generateFallbackRoute(originCoords, destCoords, distance = 5, duration = 10) {
  const midLat1 = originCoords[0] + (destCoords[0] - originCoords[0]) * 0.33;
  const midLon1 = originCoords[1] + (destCoords[1] - originCoords[1]) * 0.33;
  const midLat2 = originCoords[0] + (destCoords[0] - originCoords[0]) * 0.66;
  const midLon2 = originCoords[1] + (destCoords[1] - originCoords[1]) * 0.66;
  
  return {
    coordinates: [
      originCoords,
      [midLat1, midLon1],
      [midLat2, midLon2],
      destCoords
    ],
    distance,
    duration
  };
}

// Helper: Address to coordinates (basic Medellin landmark mapping)
async function addressToCoordinates(address) {
  const landmarks = {
    'universidad de antioquia': [6.2629, -75.5684],
    'udea': [6.2629, -75.5684],
    'parque lleras': [6.2089, -75.5678],
    'lleras': [6.2089, -75.5678],
    'parque de las luces': [6.2453, -75.5684],
    'san antonio': [6.2453, -75.5684],
    'parque berrio': [6.2494, -75.5678],
    'berrio': [6.2494, -75.5678],
    'prado centro': [6.2570, -75.5650],
    'prado': [6.2570, -75.5650],
    'parque de la milagrosa': [6.2453, -75.5851],
    'milagrosa': [6.2453, -75.5851],
    'pedregal': [6.2104, -75.5683],
    'laureles': [6.2464, -75.5898],
    'parque arvi': [6.2659, -75.5475],
    'centro comercial': [6.2485, -75.5685],
    'centro': [6.2485, -75.5685],
    'medellín': [6.2442, -75.5812],
    'medellin': [6.2442, -75.5812],
    'envigado': [6.1835, -75.5854],
    'poblado': [6.2166, -75.5714],
    'el poblado': [6.2166, -75.5714],
    'terminal norte': [6.2709, -75.5658],
    'terminal': [6.2709, -75.5658],
    'bello': [6.3305, -75.5267],
    'itagui': [6.1738, -75.5813],
    'itagüí': [6.1738, -75.5813],
    'sabaneta': [6.1631, -75.5899]
  };
  
  const normalized = address.toLowerCase().trim();
  for (const [key, coords] of Object.entries(landmarks)) {
    if (normalized.includes(key)) {
      return coords;
    }
  }
  
  // Default to Medellín center with small random variation
  return [6.2442, -75.5812];
}

app.post('/api/routes', async (req, res) => {
  try {
    const { origin, destination } = req.body;
    
    if (!origin || !destination) {
      return res.status(400).json({ error: 'Se requiere origen y destino' });
    }

    // Get coordinates for origin and destination
    const originCoords = await addressToCoordinates(origin);
    const destCoords = await addressToCoordinates(destination);

    // Get database
    const db = await readDB();
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();
    
    // Get routes from OSRM, with fallback
    let primaryRoute = await getRouteFromOSRM(originCoords, destCoords);
    if (!primaryRoute) {
      console.log('OSRM failed for primary route, using fallback');
      primaryRoute = generateFallbackRoute(originCoords, destCoords);
    }
    
    // Generate alternative route slightly different
    const altOrigin = [originCoords[0] + (Math.random() - 0.5) * 0.015, originCoords[1] + (Math.random() - 0.5) * 0.015];
    let altRoute = await getRouteFromOSRM(altOrigin, destCoords);
    if (!altRoute) {
      console.log('OSRM failed for alt route, using fallback');
      altRoute = generateFallbackRoute(altOrigin, destCoords, primaryRoute.distance * 1.05, primaryRoute.duration * 1.07);
    }

    // Calculate traffic impact
    const trafficMultiplier = calculateTrafficMultiplier(hour, dayOfWeek);
    
    // Analyze security for both routes
    const primarySecurity = await analyzeRoute(primaryRoute.coordinates, db.incidents, db.zones);
    const altSecurity = await analyzeRoute(altRoute.coordinates, db.incidents, db.zones);

    // Calculate final times with traffic
    const primaryTime = Math.round(primaryRoute.duration * trafficMultiplier);
    const altTime = Math.round(altRoute.duration * trafficMultiplier);

    // Determine traffic status
    const getTrafficStatus = (multiplier) => {
      if (multiplier >= 1.4) return { status: 'Alto', color: '#FF0000', icon: '🔴' };
      if (multiplier >= 1.2) return { status: 'Medio', color: '#FFA500', icon: '🟠' };
      return { status: 'Bajo', color: '#00AA00', icon: '🟢' };
    };

    const primaryTraffic = getTrafficStatus(trafficMultiplier);
    const altTraffic = getTrafficStatus(trafficMultiplier);

    // Recommend best route
    let recommendation = 'primary';
    let recommendationReason = '';
    
    if (primarySecurity.securityLevel === 'Alto' && altSecurity.securityLevel !== 'Alto') {
      recommendation = 'alternative';
      recommendationReason = 'Mejor seguridad';
    } else if (primaryTime > altTime + 5) {
      recommendation = 'alternative';
      recommendationReason = 'Más rápida';
    } else {
      recommendationReason = 'Mejor balance seguridad-tráfico';
    }

    // Format response
    const response = {
      origin,
      destination,
      calculatedAt: new Date().toISOString(),
      trafficConditions: primaryTraffic.status,
      hour,
      
      safeRoute: primaryRoute.coordinates,
      safeRouteDistance: parseFloat(primaryRoute.distance.toFixed(2)),
      safeRouteDuration: primaryTime,
      safeRouteDurationText: `${Math.floor(primaryTime / 60)}h ${primaryTime % 60}m`,
      safeRiskScore: primarySecurity.securityLevel,
      safeTrafficStatus: primaryTraffic.status,
      safeTrafficIcon: primaryTraffic.icon,
      safeTrafficColor: primaryTraffic.color,

      altRoute: altRoute.coordinates,
      altRouteDistance: parseFloat(altRoute.distance.toFixed(2)),
      altRouteDuration: altTime,
      altRouteDurationText: `${Math.floor(altTime / 60)}h ${altTime % 60}m`,
      altRiskScore: altSecurity.securityLevel,
      altTrafficStatus: altTraffic.status,
      altTrafficIcon: altTraffic.icon,
      altTrafficColor: altTraffic.color,

      recommendation: recommendation === 'primary' ? 'Ruta segura (Recomendada)' : 'Ruta alternativa (Recomendada)',
      recommendationReason,
      
      description: `${recommendation === 'primary' ? 'Ruta segura' : 'Ruta alternativa'} de ${primaryRoute.distance.toFixed(1)}km (${primaryTime}min con tráfico actual). Tráfico: ${primaryTraffic.status}. Seguridad: ${primarySecurity.securityLevel === 'Alto' ? '⚠️ Alta peligrosidad' : '✅ Zona segura'}.`
    };

    res.json(response);

  } catch (error) {
    console.error('Route calculation error:', error);
    res.status(500).json({ error: 'Error al calcular ruta: ' + error.message });
  }
});



// Serve static assets in production if dist exists
const clientDistPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(clientDistPath));

// Handle React routing, return all non-API requests to React index.html
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
    if (err) {
      // In development or if build doesn't exist, return a descriptive error page or continue
      res.status(200).send(`
        <div style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h2 style="color: #072F71;">Servidor Backend Activo</h2>
          <p>La API está funcionando. Para acceder a la interfaz gráfica en modo de desarrollo, abre: 
             <a href="http://localhost:5173" style="color: #518555; font-weight: bold;">http://localhost:5173</a>
          </p>
          <hr style="max-width: 400px; margin: 30px auto;" />
          <p style="font-size: 12px; color: #6B7280;">Para producción, ejecuta <code>npm run build</code> en la carpeta frontend.</p>
        </div>
      `);
    }
  });
});

// Server listener
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

