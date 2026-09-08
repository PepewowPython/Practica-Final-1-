# Práctica Final — Rutas Inseguras
> **Plataforma de Movilidad Segura y Prevención Ciudadana en Medellín**

---

## 📌 Descripción del Proyecto

**Rutas Inseguras** es una plataforma web integral diseñada para la prevención del delito, la movilidad inteligente y la gestión colaborativa de la seguridad urbana en Medellín. 

Combina un mapa interactivo geolocalizado en tiempo real, un motor de cálculo de rutas seguras basado en **OSRM** que ajusta trayectos según franjas horarias y proximidad a incidentes delictivos, un sistema de denuncias comunitarias con moderación auditada, y un centro de inteligencia analítica para autoridades y analistas de seguridad.

---

## 🛠️ Arquitectura y Tecnologías

El proyecto está estructurado en una arquitectura cliente-servidor desacoplada:

- **Frontend**: React 19, Vite 8, React Router 7, Leaflet.js (Mapas interactivos), Lucide React (Iconografía) y CSS nativo con diseño dinámico.
- **Backend**: Node.js, Express, BcryptJS (Cifrado de contraseñas), JSON Web Token (JWT para autenticación) y CORS.
- **Base de Datos**: 
  - **Entorno de desarrollo/demo**: Backend con almacenamiento en `backend/db.json`.
  - **Entorno relacional de producción**: MariaDB 10.4+ / MySQL 8.0+ en 3FN (`database/rutas_inseguras_mariadb.sql`).

---

## 📁 Estructura del Repositorio

```text
Practica-Final-1-/
├── README.md                                # Documentación principal del repositorio
├── package.json                             # Configuración del Monorepo (Scripts concurrentes)
├── index.js                                 # Punto de entrada / Pruebas sencillas
├── backend/                                 # API RESTful en Node.js + Express
│   ├── server.js                            # Servidor Express con endpoints auth, users, incidentes, etc.
│   ├── db.json                              # Base de datos JSON para desarrollo/demo
│   ├── package.json                         # Dependencias del servidor backend
│   └── .env.example                         # Variables de entorno de ejemplo
├── database/                                # Modelado relacional y scripts SQL
│   ├── DICCIONARIO_BASE_DE_DATOS.md         # Diccionario técnico de tablas y campos (3FN)
│   ├── Modelorelacional.png                 # Diagrama entidad-relación / modelo relacional
│   └── rutas_inseguras_mariadb.sql          # Script SQL MariaDB completo con datos semilla
├── documentacion/                           # Documentación formal y entregables del proyecto
│   ├── Matriz_Rutas_Seguras 5_09_2026.xlsx  # Matriz actualizada de requerimientos e indicadores
│   ├── INSTRUCCIONES_LANZAMIENTO.txt        # Guía detallada de despliegue y solución de problemas
│   ├── BPM_Proyecto_Rutas_Inseguras.md      # Especificación BPMN 2.0 y diagramas de procesos
│   ├── Licitacion_de_Requerimientos.md      # Pliego técnico y criterios de contratación
│   ├── Mapa_de_Navegacion.md                 # Mapa de navegación de vistas, roles y flujos
│   ├── Historias_de_Usuario_Rutas_Inseguras.md # Historias de usuario (HU) con validaciones y RN
│   ├── DICCIONARIO_BASE_DE_DATOS.md         # Diccionario de base de datos (copia sincronizada)
│   ├── consultas_bd.txt                     # 500+ líneas de consultas SQL avanzadas y analíticas
│   ├── consultas_resumidas.txt              # Resumen ejecutivo de consultas MariaDB
│   ├── Estado del Arte “Rutas Inseguras”.docx
│   ├── Manual_Identidad_Visual_RutasInseguras.docx
│   └── SEMI-PRACTICA-FRONTEND.pdf
└── frontend/                                # Aplicación SPA en React 19 + Vite
    ├── src/
    │   ├── App.jsx                          # Componente raíz con enrutamiento y estado global
    │   ├── index.css                        # Tokens de diseño, estilos globales y utilidades
    │   └── components/                      # Componentes visuales y paneles por rol
    │       ├── AdminDashboard.jsx           # Panel de administración de usuarios y RBAC
    │       ├── AnalystDashboard.jsx         # Centro de analítica e inteligencia de seguridad
    │       ├── ModeratorDashboard.jsx       # Panel de moderación y auditoría de reportes
    │       ├── MapContainer.jsx             # Mapa Leaflet interactivo con trazado de rutas
    │       ├── Navbar.jsx                   # Barra de navegación con indicador de rol activo
    │       ├── SidebarPanel.jsx             # Panel lateral con accesos rápidos y perfiles
    │       ├── IncidentForm.jsx             # Formulario emergente para reportar inseguridad
    │       ├── RouteCalculator.jsx          # Calculadora de origen/destino y nivel de riesgo
    │       └── SearchResults.jsx            # Filtro y lista de resultados de incidentes
    └── package.json                         # Dependencias del cliente web
```

---

## 👥 Esquema de Seguridad y Roles (RBAC)

La plataforma implementa control de acceso basado en roles (**RBAC**) con 4 niveles jerárquicos:

| Rol | Nivel | Descripción y Atribuciones en la Plataforma |
| :--- | :---: | :--- |
| **Administrador** | 3 | Acceso al `AdminDashboard`. Control total del sistema, gestión de usuarios, asignación/modificación de roles y suspensión de cuentas. |
| **Moderador** | 2 | Acceso al `ModeratorDashboard`. Evaluación, edición, aprobación o rechazo de reportes de incidentes comunitarios. |
| **Analista de Seguridad** | 2 | Acceso al `AnalystDashboard`. Visualización de métricas de peligrosidad, mapa de calor, análisis por horario y exportación CSV. |
| **Usuario Ciudadano** | 1 | Consulta de rutas seguras (OSRM), mapa interactivo, reporte georreferenciado de incidentes y red de contactos SOS. |

---

## 🚀 Guía de Instalación y Ejecución Local

### Requisitos Previos
- Node.js v18.0.0 o superior
- npm v9.0.0 o superior

### Paso 1: Clonar e instalar dependencias
```bash
git clone <URL_DEL_REPOSITORIO>
cd Practica-Final-1-
npm run install:all
```

### Paso 2: Iniciar la Aplicación

#### Opción A (Recomendada - Servidores Simultáneos)
Ejecuta el siguiente comando en la raíz del proyecto para levantar Backend (puerto `5000`) y Frontend (puerto `5173`) de forma concurrente:
```bash
npm run dev
```

#### Opción B (Terminales Separadas)
- **Terminal 1 (Backend)**: `npm run server` (o `npm run dev:backend`)
- **Terminal 2 (Frontend)**: `npm run dev:frontend`

Abre tu navegador en **`http://localhost:5173/`**.

---

## 🔑 Credenciales de Prueba por Rol

Para probar cada panel específico, puedes iniciar sesión con las siguientes cuentas de prueba preconfiguradas:

- 🟣 **Administrador**: `admin@rutasinseguras.com` / contraseña de cuenta admin
- 🟡 **Moderador**: `moderador@rutasinseguras.com` / contraseña de cuenta moderador
- 🔵 **Analista de Seguridad**: `analista@rutasinseguras.com` / contraseña de cuenta analista
- 🟢 **Usuario Ciudadano**: `prueba@gmail.com` / `Prueba123!` (o `jean@ejemplo.com`)

---

## 📡 Endpoints de la API REST (`backend/server.js`)

| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Autenticación de usuarios y generación de JWT |
| `POST` | `/api/auth/register` | Registro de nuevos usuarios ciudadanos |
| `GET` | `/api/incidents` | Lista pública de incidentes aprobados |
| `POST` | `/api/incidents` | Creación de reporte ciudadano (estado `pendiente`) |
| `PUT` | `/api/incidents/:id/status` | Moderación de estado (`aprobado`/`rechazado`) |
| `GET` | `/api/users` | Lista de usuarios registrados (Requiere rol Admin) |
| `PUT` | `/api/users/:id` | Modificación de rol o estado de usuario |
| `GET` | `/api/zones` | Catálogo de zonas de riesgo |
| `POST` | `/api/routes` | Cálculo de ruta segura y alternativas |
| `GET` | `/api/analytics` | Métricas consolidadas para el Analista de Seguridad |

---

## 📜 Documentación del Proyecto

Toda la documentación técnica se encuentra organizada en las carpetas `documentacion/` y `database/`:
- 📊 **Matriz de Requerimientos**: [`documentacion/Matriz_Rutas_Seguras 5_09_2026.xlsx`](file:///c:/sena/Practica-Final-1-/documentacion/Matriz_Rutas_Seguras%205_09_2026.xlsx)
- 🗄️ **Diccionario de Base de Datos**: [`database/DICCIONARIO_BASE_DE_DATOS.md`](file:///c:/sena/Practica-Final-1-/database/DICCIONARIO_BASE_DE_DATOS.md)
- 💾 **Script SQL MariaDB**: [`database/rutas_inseguras_mariadb.sql`](file:///c:/sena/Practica-Final-1-/database/rutas_inseguras_mariadb.sql)
- 🔎 **Consultas SQL Avanzadas**: [`documentacion/consultas_bd.txt`](file:///c:/sena/Practica-Final-1-/documentacion/consultas_bd.txt)
- 🔄 **Modelo de Procesos BPMN 2.0**: [`documentacion/BPM_Proyecto_Rutas_Inseguras.md`](file:///c:/sena/Practica-Final-1-/documentacion/BPM_Proyecto_Rutas_Inseguras.md)
- 📋 **Historias de Usuario**: [`documentacion/Historias_de_Usuario_Rutas_Inseguras.md`](file:///c:/sena/Practica-Final-1-/documentacion/Historias_de_Usuario_Rutas_Inseguras.md)
- 📋 **Guía de Lanzamiento**: [`documentacion/INSTRUCCIONES_LANZAMIENTO.txt`](file:///c:/sena/Practica-Final-1-/documentacion/INSTRUCCIONES_LANZAMIENTO.txt)

---

## 🤝 Flujo de Trabajo y Colaboración

1. Haz `git pull` antes de comenzar a trabajar.
2. Crea una rama descriptiva para tu tarea: `git checkout -b feature/mi-nueva-funcionalidad`.
3. Haz commits frecuentes con mensajes claros.
4. Antes de subir tus cambios, verifica la compatibilidad ejecutando `npm run dev`.
