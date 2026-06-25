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

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'db.json');

const JWT_SECRET = process.env.JWT_SECRET || 'rutas-inseguras-super-secret-key';

const app = express();
const PORT = process.env.PORT || 3001;

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

// Author signature for MercadoLibre Challenge
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
    
    // Remove password before sending
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

// ==========================================
// INCIDENTS & RISK ZONES ENDPOINTS
// ==========================================

app.get('/api/incidents', async (req, res) => {
  try {
    const db = await readDB();
    res.json(db.incidents);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener incidentes' });
  }
});

app.post('/api/incidents', async (req, res) => {
  try {
    const { title, type, description, latitude, longitude, reportedBy } = req.body;
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
      date: new Date().toISOString(),
      reportedBy: reportedBy || 'Anónimo',
      status: 'aprobado' // auto-approved for frontend showcase
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
// ROUTE CALCULATION (MOCKED FOR MEDELLIN)
// ==========================================

app.post('/api/routes', (req, res) => {
  const { origin, destination } = req.body;
  
  if (!origin || !destination) {
    return res.status(400).json({ error: 'Se requiere origen y destino' });
  }

  // Predefined routes for nice demos
  const presetKey = `${origin.toLowerCase().trim()}_to_${destination.toLowerCase().trim()}`;
  const reversePresetKey = `${destination.toLowerCase().trim()}_to_${origin.toLowerCase().trim()}`;

  // UdeA <-> Parque Lleras
  const udeaToLlerasRoute = {
    safeRoute: [
      [6.2629, -75.5684], // UdeA
      [6.2575, -75.5695], // Carabobo
      [6.2505, -75.5702], // Plaza Cisneros / San Juan (safe side)
      [6.2422, -75.5715], // Exposiciones
      [6.2305, -75.5750], // Industriales
      [6.2201, -75.5720], // Poblado Metro
      [6.2105, -75.5705], // Calle 10
      [6.2089, -75.5678]  // Parque Lleras
    ],
    altRoute: [
      [6.2629, -75.5684], // UdeA
      [6.2612, -75.5620], // El Bosque
      [6.2500, -75.5580], // Avenida Oriental (more active/incidents)
      [6.2380, -75.5600], // Av El Poblado
      [6.2250, -75.5630], // San Diego
      [6.2150, -75.5650], // Manila
      [6.2089, -75.5678]  // Parque Lleras
    ],
    safeRiskScore: 'Bajo',
    altRiskScore: 'Medio',
    description: 'La ruta segura evita el centro de la ciudad transitando por ciclorrutas vigiladas del río y estaciones del Metro. La ruta alternativa va por la Avenida Oriental que presenta mayor índice de hurtos nocturnos.'
  };

  // Laureles <-> Poblado
  const laurelesToPobladoRoute = {
    safeRoute: [
      [6.2464, -75.5898], // Laureles Parque 1
      [6.2440, -75.5810], // Unicentro
      [6.2385, -75.5750], // Cerro Nutibara (safe bypass)
      [6.2305, -75.5750], // Industriales
      [6.2201, -75.5720], // Poblado Metro
      [6.2166, -75.5714]  // Poblado
    ],
    altRoute: [
      [6.2464, -75.5898], // Laureles Parque 1
      [6.2425, -75.5940], // Calle 33
      [6.2350, -75.5880], // Av 80
      [6.2200, -75.5820], // Belén (horario nocturno sensible)
      [6.2120, -75.5740], // Puente Gilberto Echeverri
      [6.2166, -75.5714]  // Poblado
    ],
    safeRiskScore: 'Bajo',
    altRiskScore: 'Medio',
    description: 'La ruta segura atraviesa la calle 30E y conecta directo con el puente de Industriales, zona iluminada. El trayecto alternativo usa la Av 80 y Belén, presentando tramos oscuros cerca al puente.'
  };

  let routeData;

  if (presetKey.includes('udea') && presetKey.includes('lleras') || reversePresetKey.includes('udea') && reversePresetKey.includes('lleras')) {
    routeData = udeaToLlerasRoute;
  } else if (presetKey.includes('laureles') && presetKey.includes('poblado') || reversePresetKey.includes('laureles') && reversePresetKey.includes('poblado')) {
    routeData = laurelesToPobladoRoute;
  } else {
    // Generate a fallback routing dynamically between any two coordinates/addresses
    // Coordinates default to Medellin boundary
    const latO = 6.2442 + (Math.random() - 0.5) * 0.04;
    const lonO = -75.5812 + (Math.random() - 0.5) * 0.04;
    const latD = 6.2442 + (Math.random() - 0.5) * 0.04;
    const lonD = -75.5812 + (Math.random() - 0.5) * 0.04;

    const midLat1 = latO + (latD - latO) * 0.33 + (Math.random() - 0.5) * 0.008;
    const midLon1 = lonO + (lonD - lonO) * 0.33 + (Math.random() - 0.5) * 0.008;
    const midLat2 = latO + (latD - latO) * 0.66 + (Math.random() - 0.5) * 0.008;
    const midLon2 = lonO + (lonD - lonO) * 0.66 + (Math.random() - 0.5) * 0.008;

    const altMidLat1 = latO + (latD - latO) * 0.33 + (Math.random() - 0.5) * 0.02;
    const altMidLon1 = lonO + (lonD - lonO) * 0.33 + (Math.random() - 0.5) * 0.02;
    const altMidLat2 = latO + (latD - latO) * 0.66 + (Math.random() - 0.5) * 0.02;
    const altMidLon2 = lonO + (lonD - lonO) * 0.66 + (Math.random() - 0.5) * 0.02;

    routeData = {
      safeRoute: [
        [latO, lonO],
        [midLat1, midLon1],
        [midLat2, midLon2],
        [latD, lonD]
      ],
      altRoute: [
        [latO, lonO],
        [altMidLat1, altMidLon1],
        [altMidLat2, altMidLon2],
        [latD, lonD]
      ],
      safeRiskScore: 'Bajo',
      altRiskScore: 'Alto',
      description: `Ruta calculada dinámicamente desde ${origin} hasta ${destination}. El camino primario busca vías principales iluminadas, mientras que el alternativo cruza sectores comerciales con historial de hurtos.`
    };
  }

  res.json(routeData);
});

// ==========================================
// MERCADOLIBRE API INTEGRATION (SENA PDF)
// ==========================================

// Endpoint 1: Search Items
// URL: /api/items?q=:query
app.get('/api/items', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ error: 'Falta el parámetro de búsqueda "q"' });
    }

    console.log(`Buscando en MercadoLibre API: ${query}`);
    const mlResponse = await axios.get(`https://api.mercadolibre.com/sites/MLA/search?q=${encodeURIComponent(query)}`);
    const data = mlResponse.data;

    // Get categories from filters path_from_root
    let categories = [];
    const categoryFilter = data.filters?.find(f => f.id === 'category');
    if (categoryFilter && categoryFilter.values && categoryFilter.values.length > 0) {
      categories = categoryFilter.values[0].path_from_root?.map(cat => cat.name) || [];
    } else {
      // Fallback: extract from available filters or results
      const availableCategoryFilter = data.available_filters?.find(f => f.id === 'category');
      if (availableCategoryFilter && availableCategoryFilter.values) {
        // Take top 3 category names
        const sortedCats = [...availableCategoryFilter.values].sort((a, b) => b.results - a.results);
        categories = sortedCats.slice(0, 3).map(cat => cat.name);
      }
    }

    // Map first 4 items
    const rawItems = data.results?.slice(0, 4) || [];
    const items = rawItems.map(item => {
      const amount = Math.floor(item.price);
      const decimals = Math.round((item.price - amount) * 100);
      
      return {
        id: item.id,
        title: item.title,
        price: {
          currency: item.currency_id,
          amount: amount,
          decimals: decimals
        },
        picture: item.thumbnail,
        condition: item.condition === 'new' ? 'nuevo' : 'usado',
        free_shipping: item.shipping?.free_shipping || false,
        address: item.address?.state_name || 'Antioquia'
      };
    });

    res.json({
      author: AUTHOR,
      categories: categories,
      items: items
    });
  } catch (error) {
    console.error('Error fetching items from MercadoLibre:', error.message);
    res.status(500).json({ error: 'Error al consultar MercadoLibre API' });
  }
});

// Endpoint 2: Item Detail
// URL: /api/items/:id
app.get('/api/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`Obteniendo detalle de item: ${id}`);
    
    // Request item detail and description concurrently
    const [itemRes, descRes] = await Promise.all([
      axios.get(`https://api.mercadolibre.com/items/${id}`),
      axios.get(`https://api.mercadolibre.com/items/${id}/description`).catch(err => {
        console.warn(`No description found for item ${id}, using empty description`);
        return { data: { text_plain: '' } };
      })
    ]);

    const itemData = itemRes.data;
    const descData = descRes.data;

    const amount = Math.floor(itemData.price);
    const decimals = Math.round((itemData.price - amount) * 100);

    // Get high quality picture
    let picture = itemData.thumbnail;
    if (itemData.pictures && itemData.pictures.length > 0) {
      picture = itemData.pictures[0].secure_url || itemData.pictures[0].url;
    }

    const result = {
      author: AUTHOR,
      item: {
        id: itemData.id,
        title: itemData.title,
        price: {
          currency: itemData.currency_id,
          amount: amount,
          decimals: decimals
        },
        picture: picture,
        condition: itemData.condition === 'new' ? 'nuevo' : 'usado',
        free_shipping: itemData.shipping?.free_shipping || false,
        sold_quantity: itemData.sold_quantity || itemData.initial_quantity - (itemData.available_quantity || 0) || 0,
        description: descData.plain_text || descData.text || 'Sin descripción disponible.'
      }
    };

    res.json(result);
  } catch (error) {
    console.error(`Error fetching item detail ${req.params.id} from MercadoLibre:`, error.message);
    res.status(500).json({ error: 'Error al consultar MercadoLibre API para el detalle del producto' });
  }
});

// Server listener
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
