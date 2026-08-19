# Documento de Historias de Usuario - Proyecto "Rutas Inseguras"

---

## 📌 ÉPICA 1: SEGURIDAD, AUTENTICACIÓN Y CONTROL DE ACCESO (RBAC)

---

### HU-01 – Gestión de Perfiles, Roles y Permisos del Sistema (RBAC)
**Yo como** Administrador del Sistema,  
**quiero** asignar, modificar roles y gestionar el estado (activo/suspendido) de las cuentas de usuario,  
**para** garantizar un esquema de seguridad basado en roles (RBAC) y restringir el acceso a los módulos críticos del sistema.

#### 📝 Validaciones de Campo:
| Campo | Validación | Alerta / Mensaje |
| :--- | :--- | :--- |
| `id_usuario` | Obligatorio, identificador único en la base de datos | "El ID del usuario es requerido y debe ser válido" |
| `role` | Obligatorio, valores permitidos: `Usuario Ciudadano`, `Moderador`, `Analista de Seguridad`, `Administrador` | "Debe seleccionar un rol válido dentro de los definidos por el sistema" |
| `status` | Obligatorio, valores permitidos: `activo`, `suspendido` | "El estado del usuario solo puede ser activo o suspendido" |

#### 🔔 Alertas y Notificaciones del Sistema:
- 🔔 **Alerta de confirmación**: `¿Está seguro de cambiar el rol del usuario '${nombre}' a '${role}'?`
- 🔔 **Alerta de suspensión**: `¿Está seguro de suspender la cuenta de '${nombre}'? El usuario perderá acceso inmediato a la plataforma.`
- 🔔 **Alerta de éxito**: `Rol del usuario '${nombre}' actualizado correctamente a '${role}'`
- 🔔 **Alerta de error**: `No tiene permisos suficientes para modificar el rol de un Administrador principal (RN-01)`

#### ⚙️ Reglas de Negocio Aplicadas:
- **RN-01 (Jerarquía de Administrador)**: Solo usuarios con el rol `Administrador` pueden acceder a la ruta `/admin` y cambiar roles o suspender usuarios.
- **RN-02 (Persistencia de Sesión)**: Si un usuario es suspendido, su token JWT queda invalidado automáticamente en su próxima petición.

#### 📊 Información Requerida (RI-01):
**Estructura de la Tabla / Entidad:** `users`
- `id` (PK)
- `name` (VARCHAR)
- `email` (VARCHAR, Unique)
- `password` (VARCHAR, bcrypt hash)
- `phone` (VARCHAR)
- `role` (ENUM: 'Usuario Ciudadano', 'Moderador', 'Analista de Seguridad', 'Administrador')
- `status` (ENUM: 'activo', 'suspendido')
- `contacts` (JSON Array)

#### 🖥️ Requisitos de Interfaz (UI):
- Selector desplegable (*select*) dinámico en la tabla de usuarios con cambios en tiempo real.
- Badges de color por rol: Púrpura (Admin), Amarillo (Moderador), Azul (Analista), Gris (Ciudadano).
- Indicadores visuales de cuenta suspendida (opacidad reducida y etiqueta en rojo).

#### ⚠️ Casos Borde:
- Intentar degradar el rol del único Administrador activo del sistema → Bloquear acción y mostrar alerta.
- Modificar un usuario cuyo token haya sido eliminado simultáneamente.

---

### HU-02 – Registro, Autenticación y Gestión de Contactos de Emergencia
**Yo como** Usuario Ciudadano,  
**quiero** registrarme con mis datos personales, iniciar sesión mediante credenciales seguras y gestionar mis contactos de confianza,  
**para** acceder a las funciones personalizadas del mapa y contar con una red de apoyo en situaciones de riesgo.

#### 📝 Validaciones de Campo:
| Campo | Validación | Alerta / Mensaje |
| :--- | :--- | :--- |
| `name` | Obligatorio, mínimo 3 caracteres, máximo 100 | "El nombre completo es obligatorio (mínimo 3 caracteres)" |
| `email` | Obligatorio, formato de correo válido, único en el sistema | "Ingrese un correo electrónico válido y no registrado previamente" |
| `password` | Obligatorio, mínimo 8 caracteres, al menos 1 letra y 1 número | "La contraseña debe tener al menos 8 caracteres, incluyendo letras y números" |
| `phone` | Opcional, formato telefónico colombiano (10 dígitos) | "El número celular debe contener 10 dígitos (Ej: 3001234567)" |
| `contacts` | Array de máximo 5 contactos (`nombre`, `phone`, `relacion`) | "Puede registrar hasta 5 contactos de emergencia" |

#### 🔔 Alertas y Notificaciones del Sistema:
- 🔔 **Login Exitoso**: `¡Bienvenido de nuevo, ${nombre}! Redirigiendo al mapa seguro...`
- 🔔 **Login Fallido**: `Credenciales inválidas. Verifique su correo o contraseña.`
- 🔔 **Registro Exitoso**: `Cuenta creada con éxito. Ya puede iniciar sesión.`
- 🔔 **Contacto Guardado**: `Red de contactos de emergencia actualizada correctamente.`

#### ⚙️ Reglas de Negocio Aplicadas:
- **RN-03 (Cifrado de Contraseñas)**: Las contraseñas se almacenan mediante *hash* unidireccional utilizando `bcrypt` (factor de costo 10).
- **RN-04 (Autenticación JWT)**: El inicio de sesión genera un token JSON Web Token de 7 días de vigencia guardado en `localStorage`.

#### 📊 Información Requerida (RI-02):
**Estructura de Objeto Contactos (`contacts`):**
- `name` (VARCHAR)
- `phone` (VARCHAR)
- `relacion` (VARCHAR, opcional: Familiar, Amigo, etc.)

#### 🖥️ Requisitos de Interfaz (UI):
- Modal interactivo de Inicio de Sesión y Registro accesible desde el Navbar y la pestaña "Mi Cuenta".
- Pestaña dedicada a "Red de Confianza" con capacidad para agregar/eliminar contactos rápidamente.

#### ⚠️ Casos Borde:
- Registro con correo existente → Mostrar mensaje amigable impidiendo el duplicado.
- Intento de login por usuario suspendido → "Su cuenta se encuentra suspendida. Contacte soporte."

---

## 📌 ÉPICA 2: REPORTES Y MONITOREO DE INSEGURIDAD CIUDADANA

---

### HU-03 – Reporte Georreferenciado de Incidentes en Tiempo Real
**Yo como** Usuario Ciudadano o Testigo,  
**quiero** marcar un punto geográfico en el mapa e ingresar los detalles de un evento de inseguridad (Hurto, Sospechoso, Falta de Iluminación),  
**para** alertar a la comunidad sobre zonas de riesgo y alimentar el sistema de prevención.

#### 📝 Validaciones de Campo:
| Campo | Validación | Alerta / Mensaje |
| :--- | :--- | :--- |
| `title` | Obligatorio, mínimo 5 caracteres, máximo 120 | "El título del reporte es obligatorio y debe resumir el incidente" |
| `type` | Obligatorio, valores: `Hurto`, `Iluminación`, `Sospechoso` | "Seleccione la tipología de inseguridad adecuada" |
| `latitude` | Obligatorio, coordenada dentro del rango urbano | "Debe seleccionar un punto válido en el mapa para la latitud" |
| `longitude` | Obligatorio, coordenada dentro del rango urbano | "Debe seleccionar un punto válido en el mapa para la longitud" |
| `description` | Opcional, texto explicativo detallado | "La descripción no puede exceder los 500 caracteres" |

#### 🔔 Alertas y Notificaciones del Sistema:
- 🔔 **Modo Reporte**: `Haz clic sobre cualquier punto del mapa para fijar la ubicación del incidente.`
- 🔔 **Alerta de Envío**: `¡Gracias por tu civismo! Tu reporte ha sido enviado a la cola de moderación.`
- 🔔 **Alerta de Cancelación**: `Reporte cancelado. La marca temporal ha sido removida.`

#### ⚙️ Reglas de Negocio Aplicadas:
- **RN-05 (Flujo de Moderación)**: Todo incidente creado por un ciudadano ingresa por defecto en estado `status = 'pendiente'` y no es público hasta su aprobación.
- **RN-06 (Anonimato Opcional)**: Si el usuario no ha iniciado sesión, el reporte se atribuye a `Anónimo`.

#### 📊 Información Requerida (RI-03):
**Estructura de la Tabla / Entidad:** `incidents`
- `id` (PK, string `inc-timestamp`)
- `title` (VARCHAR)
- `type` (VARCHAR: Hurto, Iluminación, Sospechoso)
- `description` (TEXT)
- `latitude` (FLOAT / DOUBLE)
- `longitude` (FLOAT / DOUBLE)
- `ubicacion` (VARCHAR)
- `date` (DATETIME ISO 8601)
- `reportedBy` (VARCHAR)
- `status` (ENUM: 'pendiente', 'aprobado', 'rechazado')
- `notes` (TEXT, observaciones de moderación)

#### 🖥️ Requisitos de Interfaz (UI):
- Cursor dinámico `crosshair` mientras el modo reporte está activo.
- Pin o marcador temporal de color rojo sobre Leaflet.js al hacer clic.
- Tarjeta de formulario emergente flotante con captura automática de dirección/coordenadas.

---

## 📌 ÉPICA 3: MODERACIÓN Y VERIFICACIÓN DE ALERTAS (CALIDAD DE DATOS)

---

### HU-04 – Panel de Moderación, Verificación y Edición de Reportes
**Yo como** Moderador Certificado,  
**quiero** evaluar los reportes en estado pendiente, ajustar sus datos geográficos/descriptivos y aprobarlos o rechazarlos,  
**para** garantizar que solo información verídica y saneada sea publicada en el mapa comunitario.

#### 📝 Validaciones de Campo:
| Campo | Validación | Alerta / Mensaje |
| :--- | :--- | :--- |
| `title` (edición) | Obligatorio, texto normalizado | "El título normalizado no puede estar vacío" |
| `status` (decisión) | Obligatorio, valores: `aprobado`, `rechazado`, `pendiente` | "Seleccione una decisión de moderación válida" |
| `notes` | Opcional, justificación técnica del moderador | "Las notas de moderación son privadas e internas" |

#### 🔔 Alertas y Notificaciones del Sistema:
- 🔔 **Aprobación**: `✅ Reporte #${id} marcado como APROBADO y visible en el mapa.`
- 🔔 **Rechazo**: `❌ Reporte #${id} marcado como RECHAZADO (Falsa Alarma).`
- 🔔 **Eliminación**: `¿Confirmas la eliminación permanente del reporte de la base de datos?`

#### ⚙️ Reglas de Negocio Aplicadas:
- **RN-07 (Visibilidad en Mapa)**: Solo los incidentes con `status = 'aprobado'` son servidos en las peticiones públicas del mapa ciudadano `/api/incidents`.
- **RN-08 (Auditoría de Moderación)**: Todo cambio realizado guarda una nota y fecha de moderación.

#### 🖥️ Requisitos de Interfaz (UI):
- Interfaz modular en 3 columnas: (1) Lista con filtros, (2) Inspección geográfica con vista previa en vivo, (3) Formulario de edición con botones de acción directo.
- Insignia de estado en color: Verde (Aprobado), Amarillo (Pendiente), Rojo (Rechazado).

---

## 📌 ÉPICA 4: NAVEGACIÓN Y RUTA SEGURA INTELIGENTE

---

### HU-05 – Cálculo de Rutas Seguras con Evasión de Zonas de Riesgo
**Yo como** Usuario Ciudadano o Peatón Nocturno,  
**quiero** ingresar un punto de origen y destino para calcular el trayecto más seguro,  
**para** evitar atravesar sectores con alta incidencia de hurtos o falta de alumbrado público.

#### 📝 Validaciones de Campo:
| Campo | Validación | Alerta / Mensaje |
| :--- | :--- | :--- |
| `origin` | Obligatorio, dirección o nombre de sector válido en Medellín | "Ingrese un punto de origen válido (Ej: Parque Berrío)" |
| `destination` | Obligatorio, dirección o punto de llegada | "Ingrese un punto de destino válido (Ej: Universidad de Antioquia)" |

#### 🔔 Alertas y Notificaciones del Sistema:
- 🔔 **Cálculo Exitoso**: `Ruta segura calculada. Evitando 2 zonas de alto riesgo.`
- 🔔 **Alerta de Tráfico**: `Horario de alta congestión detectado (Multiplicador de tiempo aplicado).`
- 🔔 **Sin Coincidencia**: `No se encontraron rutas peatonales disponibles entre estos dos puntos.`

#### ⚙️ Reglas de Negocio Aplicadas:
- **RN-09 (Ponderación de Seguridad)**: El algoritmo Dijkstra/A* prioriza vías iluminadas y penaliza trayectos dentro del radio de amortiguamiento de zonas con nivel `alto` de riesgo.
- **RN-10 (Ajuste por Horario)**: En franjas nocturnas (18:00 a 05:00 hrs), el peso de riesgo de las zonas se incrementa un 50%.

#### 🖥️ Requisitos de Interfaz (UI):
- Formulario de trazado en el Sidebar con sugerencias de puntos frecuentados.
- Renderizado de la ruta en color verde brillante sobre el mapa con resumen de distancia (km) y tiempo estimado (min).

---

## 📌 ÉPICA 5: INTELIGENCIA Y ANALÍTICA DE SEGURIDAD URBANA

---

### HU-06 – Centro de Analítica, Métricas de Peligrosidad y Exportación
**Yo como** Analista de Seguridad o Autoridad,  
**quiero** visualizar paneles estadísticos, concentración de delitos por franja horaria y exportar los reportes en CSV,  
**para** tomar decisiones informadas, enfocar recursos de patrullaje y evaluar tendencias criminales.

#### 📝 Validaciones de Campo:
| Campo | Validación | Alerta / Mensaje |
| :--- | :--- | :--- |
| `comuna` / `sector` | Filtro dinámico opcional | "Seleccione una comuna para filtrar las estadísticas" |

#### 🔔 Alertas y Notificaciones del Sistema:
- 🔔 **Exportación CSV**: `✅ Informe de seguridad exportado en formato CSV exitosamente.`
- 🔔 **Métricas Actualizadas**: `Datos del mapa de calor sincronizados.`

#### ⚙️ Reglas de Negocio Aplicadas:
- **RN-11 (Cálculo del Índice de Riesgo)**: El Índice Global de Riesgo se calcula automáticamente mediante la fórmula:  
  `Riesgo = Math.min((totalIncidentes * 1.2 + totalZonas * 0.8), 10.0)`.
- **RN-12 (Estructura de Exportación)**: El archivo CSV descargado incluye encabezados normalizados con codificación UTF-8.

#### 🖥️ Requisitos de Interfaz (UI):
- Cuadro de mando (Dashboard) con tarjetas KPI, barras de progreso por tipo de delito y gráfica por bloques horarios.
- Tabla con ranking de zonas de riesgo y botón primario de exportación CSV.

---

## 🛠️ REQUERIMIENTOS NO FUNCIONALES (RNF)

| Código | Requerimiento No Funcional | Descripción / Requisito | Criterio de Aceptación / Consideración |
| :--- | :--- | :--- | :--- |
| **RNF-01** | **Seguridad en Comunicaciones** | El sistema debe implementar HTTPS y cifrado de credenciales. | Las contraseñas se encriptan con `bcrypt` (costo 10) y los tokens de sesión utilizan firma JWT. |
| **RNF-02** | **Control de Acceso (RBAC)** | Gestión estricta de rutas y permisos según 4 roles. | Rutas `/admin`, `/moderador` y `/analitica` protegidas frente a usuarios sin el rol correspondientes. |
| **RNF-03** | **Desempeño y Carga** | La API de respuesta de incidentes debe responder en < 300ms. | Consultas optimizadas con estructura JSON ligera y soporte MariaDB. |
| **RNF-04** | **Usabilidad (UX)** | El diseño debe transmitir alta calidad estética y profesionalismo. | Paleta corporativa (Navy `#072F71`, Maroon `#840505`, Sun `#F0C862`), tipografía moderna y micro-animaciones. |
| **RNF-05** | **Compatibilidad Cross-Platform** | La aplicación web debe ser totalmente responsiva. | Funcionamiento verificado en navegadores desktop (Chrome, Firefox, Edge) y navegadores móviles. |
| **RNF-06** | **Integridad de Datos** | Prevención de duplicados e incoherencia de datos. | Validaciones estrictas en frontend y backend antes de insertar usuarios o reportes. |
| **RNF-07** | **Accesibilidad** | La interfaz debe ser accesible según guías WCAG 2.1 Nivel AA. | Contrastes de color legibles y soporte para navegación con teclado y lectores de pantalla. |
| **RNF-08** | **Trazabilidad y Auditoría** | Registro histórico de acciones administrativas y de moderación. | Guardado de campo `notes` y `date` en cada cambio realizado a un reporte o usuario. |

---

### 📊 Priorización y Categorización de Requerimientos No Funcionales

1. **🛡️ Seguridad y Control de Acceso (Prioridad Máxima)**
   - **RNF-01**: Cifrado HTTPS y contraseñas `bcrypt`.
   - **RNF-02**: Control de acceso granular RBAC para 4 roles.
   - **RNF-06**: Integridad y validación de campos obligatorios.

2. **⚡ Rendimiento y Trazabilidad (Prioridad Alta)**
   - **RNF-03**: Tiempos de respuesta de API < 300ms.
   - **RNF-08**: Auditoría de decisiones de moderación.

3. **🎨 Experiencia de Usuario y Accesibilidad (Prioridad Media)**
   - **RNF-04**: Sistema de diseño estético con paleta de color y glassmorphism.
   - **RNF-05**: Adaptabilidad móvil y multidispositivo.
   - **RNF-07**: Cumplimiento de accesibilidad WCAG 2.1 AA.
