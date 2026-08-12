# Documentación de Modelado de Procesos de Negocio (BPM / BPMN 2.0)
## Proyecto: "Rutas Inseguras" — Plataforma de Movilidad Segura en Medellín

---

## 1. Introducción y Alcance

### 1.1 Objetivo del Documento
El presente documento tiene como objetivo formalizar y estandarizar la especificación del **Modelado de Procesos de Negocio (BPM - Business Process Management)** y sus correspondientes flujos en notación **BPMN 2.0** para la plataforma **"Rutas Inseguras"**.

Esta especificación detalla las actividades, secuencias, reglas de negocio, actores intervinientes, compuertas de decisión, intercambios de datos y puntos de integración tecnológica dentro del sistema.

### 1.2 Contexto del Proyecto
**"Rutas Inseguras"** es una solución tecnológica web/móvil orientada a la seguridad ciudadana y la movilidad inteligente en la ciudad de Medellín. Permite a los ciudadanos:
1. Consultar trayectos seguros evaluando en tiempo real el tráfico y los niveles de riesgo por criminalidad.
2. Reportar incidentes de inseguridad de forma colaborativa (crowdsourcing).
3. Recibir alertas preventivas geolocalizadas al aproximarse a zonas críticas.
4. Transmitir su ubicación GPS en tiempo real a una red de contactos de confianza ante emergencias.
5. Adquirir equipamiento de seguridad personal a través de la integración con el ecosistema de MercadoLibre.

---

## 2. Matriz de Actores y Roles (Swimlanes)

En la modelación BPMN se establecen los siguientes carriles (lanes) operacionales y tecnológicos:

| Actor / Rol | Tipo | Descripción y Atribuciones |
| :--- | :--- | :--- |
| **Ciudadano / Usuario Final** | Humano (Externo) | Usuario que consulta rutas, reporta incidentes, recibe alertas y comparte su geolocalización SOS. |
| **Moderador de Seguridad** | Humano (Interno) | Operador encargado de auditar, verificar, aprobar o rechazar los reportes ciudadanos de incidentes. |
| **Administrador del Sistema** | Humano (Interno) | Responsable de la gestión de roles, auditoría global y catalogación de zonas de riesgo. |
| **Contactos de Confianza** | Humano (Destinatario) | Red de emergencia del usuario que recibe notificaciones de seguimiento en tiempo real y alertas SOS. |
| **Frontend Web (Vite/React)** | Sistema (Cliente) | Interfaz visual interactiva con mapas, formularios y notificaciones. |
| **Backend API (Node.js/Express)** | Sistema (Servidor) | Núcleo de servicios REST, procesamiento de lógica de negocio y autenticación JWT. |
| **Motor de Evaluación de Riesgo** | Algoritmo | Componente de cálculo espacial que aplica la fórmula de Haversine y ponderaciones de peligro. |
| **Servicio OSRM Routing** | API Externa | Proveedor de cálculo geométrico y ruteo sobre red vial urbana. |
| **API MercadoLibre / Cache** | API Externa / Servicio | Proveedor de catálogo de insumos de protección y equipos de seguridad personal. |

---

## 3. Catálogo General de Procesos de Negocio

| Código BPM | Nombre del Proceso | Tipo de Proceso | Mapeo DB / Requerimiento |
| :--- | :--- | :--- | :--- |
| **BPM-01** | Gestión de Usuarios, Autenticación y Red de Confianza | Soporte / Identidad | RF-01, RF-02, RF-12 / `usuarios`, `contactos_confianza` |
| **BPM-02** | Cálculo y Recomendación de Rutas Seguras con Tráfico Dinámico | Misional / Core | RF-04, RF-05, RN-04, RN-05 / `rutas`, `alternativas_ruta` |
| **BPM-03** | Reporte Ciudadano de Incidentes de Inseguridad | Misional / Crowdsourcing | RF-08 / `incidentes` |
| **BPM-04** | Moderación, Verificación y Catalogación de Zonas de Riesgo | Control / Operativo | RF-06, RF-07, RF-14 / `moderacion_reportes`, `zonas_riesgo` |
| **BPM-05** | Monitoreo GPS y Motor de Alertas Preventivas en Tiempo Real | Misional / Prevención | RF-03, RF-10, RF-11 / `ubicaciones`, `alertas` |
| **BPM-06** | Transmisión de Ubicación de Emergencia / SOS a Contactos | Misional / Emergencia | RF-13 / `ubicaciones_compartidas` |
| **BPM-07** | Consulta e Integración con Catálogo de Seguridad MercadoLibre | Valor Agregado | Integración ML / `/api/items` |

---

## 3.5 DIAGRAMA BPMN GLOBAL DEL SISTEMA (MACROPROCESO END-TO-END CON SWIMLANES)

A continuación se representa la arquitectura global de procesos de negocio de **"Rutas Inseguras"** organizada en carriles (*Swimlanes*) para diferenciar la responsabilidad de cada actor y capa tecnológica:

```mermaid
flowchart TB
    subgraph POOL_CIUDADANO["POOL 1: CIUDADANO / USUARIO FINAL"]
        direction LR
        E_Start(["🟢 Evento Inicio: Necesidad Movilidad / Incidente"])
        T_Auth["[BPM-01] Registrarse / Iniciar Sesión"]
        T_ReqRoute["[BPM-02] Solicitar Origen y Destino"]
        T_SelectRoute["Seleccionar Ruta Sugerida o Alternativa"]
        T_ReportInc["[BPM-03] Reportar Incidente de Inseguridad"]
        T_GPSNav["[BPM-05] Desplazarse con GPS Activo"]
        T_SOS["[BPM-06] Activar Botón de Emergencia SOS"]
        T_Shop["[BPM-07] Consultar Equipamiento de Seguridad"]
        E_EndUser(["🔴 Evento Fin: Destino Alcanzado / Alerta Gestionada"])
    end

    subgraph POOL_FRONTEND["POOL 2: FRONTEND WEB (Vite / React Client)"]
        direction LR
        F_AuthUI["Renderizar Formulario Auth & JWT State"]
        F_Geocode["Geocodificar Landmarks de Medellín"]
        F_MapRender["Renderizar Mapa Leaflet con Capas de Riesgo"]
        F_FormInc["Capturar Coordenadas y Detalles del Incidente"]
        F_GPSMonitor["Transmitir Posición GPS Continua"]
        F_SoundAlert["Disparar Alerta Sonora & Banner Emergencia"]
        F_ShopUI["Desplegar Catálogo MercadoLibre"]
    end

    subgraph POOL_BACKEND["POOL 3: BACKEND API (Node.js / Express Server)"]
        direction LR
        B_AuthService["Servicio Auth: Bcrypt Hash & Firma JWT"]
        B_TrafficService["[RN-04] Evaluar Factor Tráfico según Hora/Día"]
        B_RiskEngine["[Motor Riesgo] Calcular Haversine vs Zonas & Incidentes"]
        B_DecisionRoute{"¿Ruta Principal es Alto Riesgo? (RN-05)"}
        B_RecAlt["Asignar Recomendada: Ruta Alternativa"]
        B_RecMain["Asignar Recomendada: Ruta Directa"]
        B_IncService["Registrar Incidente en estado 'pendiente'"]
        B_GeofenceEngine{"¿Usuario a <= Radio + 300m de Zona Roja? (RN-10)"}
        B_TriggerAlert["Generar Registro Alerta Preventiva"]
        B_SOSTracker["Crear Sesión en ubicaciones_compartidas"]
        B_MLService["Gestionar API MercadoLibre / Cache Fallback 403"]
    end

    subgraph POOL_MODERACION["POOL 4: EQUIPO DE MODERACIÓN & ADMIN"]
        direction LR
        M_Review["Revisar Bandeja de Incidentes Pendientes"]
        M_Decision{"¿Incidente Válido y Fidedigno? (RN-14)"}
        M_Approve["Aprobar Reporte y Publicar en Mapa Público"]
        M_Reject["Rechazar y Archivar Reporte"]
        M_UpdateZone["Recalcular Radio / Nivel de Riesgo de Zona"]
    end

    subgraph POOL_EXTERNOS["POOL 5: SERVICIOS EXTERNOS & CONTACTOS"]
        direction LR
        Ext_OSRM["OSRM Routing Engine (driving API)"]
        Ext_ML["MercadoLibre Public API"]
        Ext_Contacts["Contactos de Confianza (Red SOS)"]
    end

    %% Flujos de Información Inter-Pools %%
    E_Start --> T_Auth
    T_Auth --> F_AuthUI
    F_AuthUI --> B_AuthService
    
    T_ReqRoute --> F_Geocode
    F_Geocode --> B_TrafficService
    B_TrafficService --> Ext_OSRM
    Ext_OSRM --> B_RiskEngine
    B_RiskEngine --> B_DecisionRoute
    
    B_DecisionRoute -- "Sí (Puntaje >= 5.0)" --> B_RecAlt
    B_DecisionRoute -- "No (Puntaje < 5.0)" --> B_RecMain
    
    B_RecAlt --> F_MapRender
    B_RecMain --> F_MapRender
    F_MapRender --> T_SelectRoute
    T_SelectRoute --> T_GPSNav
    
    T_GPSNav --> F_GPSMonitor
    F_GPSMonitor --> B_GeofenceEngine
    
    B_GeofenceEngine -- "Sí" --> B_TriggerAlert
    B_TriggerAlert --> F_SoundAlert
    
    T_ReportInc --> F_FormInc
    F_FormInc --> B_IncService
    B_IncService --> M_Review
    
    M_Review --> M_Decision
    M_Decision -- "Sí" --> M_Approve
    M_Decision -- "No" --> M_Reject
    M_Approve --> M_UpdateZone
    M_UpdateZone --> B_RiskEngine
    
    T_SOS --> B_SOSTracker
    B_SOSTracker --> Ext_Contacts
    
    T_Shop --> F_ShopUI
    F_ShopUI --> B_MLService
    B_MLService --> Ext_ML
    
    T_GPSNav --> E_EndUser
```

---

## 4. Detalle Técnico y Diagramas BPMN por Módulo

---

### 4.1 BPM-01: Gestión de Usuarios, Autenticación y Red de Confianza

#### Descripción del Flujo
Este proceso gobierna el ciclo de vida de registro, inicio de sesión y configuración del perfil del ciudadano, incluyendo el registro de sus contactos de confianza para casos de emergencia.

#### Reglas de Negocio Aplicadas
- **RN-01**: Las contraseñas deben almacenarse bajo hash BCrypt con factor de costo 10.
- **RN-02**: Todo correo electrónico debe ser único en el sistema.
- **RN-12**: Un usuario puede registrar $N$ contactos de confianza indicando nombre, teléfono y parentesco.

```mermaid
sequenceDiagram
    autonumber
    actor C as Ciudadano
    participant FE as Frontend Web
    participant BE as Backend Server
    participant DB as Base de Datos

    alt Registro de Usuario
        C->>FE: Ingresa Datos (Nombre, Correo, Password, Teléfono)
        FE->>BE: POST /api/auth/register
        BE->>DB: Consultar duplicidad de correo (usuarios)
        alt Correo Ya Existe
            DB-->>BE: Usuario encontrado
            BE-->>FE: HTTP 400 (Error: Correo ya registrado)
            FE-->>C: Muestra alerta de error
        else Correo Disponible
            BE->>BE: Hash Password con bcrypt (salt=10)
            BE->>DB: INSERT INTO usuarios (estado='activo')
            DB-->>BE: ID Usuario creado
            BE->>BE: Generar Token JWT (Expiración 7 días)
            BE-->>FE: HTTP 201 (Token + Datos Usuario)
            FE-->>C: Redirige a Panel Principal
        end
    else Inicio de Sesión
        C->>FE: Ingresa Credenciales (Correo, Password)
        FE->>BE: POST /api/auth/login
        BE->>DB: Consultar usuario por correo
        alt Usuario No Existe o Password Incumplido
            BE-->>FE: HTTP 400 (Credenciales inválidas)
            FE-->>C: Muestra error de autenticación
        else Credenciales Válidas
            BE->>BE: Generar Token JWT
            BE-->>FE: HTTP 200 (Token + User Profile)
            FE-->>C: Sesión Iniciada
        end
    else Configuración de Red de Confianza
        C->>FE: Agrega/Actualiza Contactos de Emergencia
        FE->>BE: POST /api/auth/contacts (Header Bearer Token)
        BE->>BE: Validar Token JWT
        BE->>DB: UPDATE usuarios SET contacts = JSON
        BE-->>FE: HTTP 200 (Contactos actualizados)
        FE-->>C: Confirmación visual de red guardada
    end
```

---

### 4.2 BPM-02: Cálculo y Recomendación de Rutas Seguras con Tráfico Dinámico

#### Descripción del Flujo
Es el proceso central de la plataforma. Recibe una solicitud de origen y destino, geocodifica los puntos, obtiene la ruta geométrica desde OSRM, aplica multiplicadores de densidad de tráfico según el horario y evalúa el nivel de riesgo espacial en base a incidentes y zonas de peligro.

#### Reglas de Negocio Aplicadas
- **RN-04 (Evaluación de Tráfico)**:
  - Horas Pico (07:00-09:00, 12:00-13:00, 17:00-19:00): Multiplicador x1.5 (+50% tiempo).
  - Horas Hombro (06:00-10:00, 11:00-13:00, 16:00-20:00): Multiplicador x1.3 (+30% tiempo).
  - Horario Nocturno (21:00-05:00): Multiplicador x0.9 (-10% tiempo, pero alerta de riesgo elevado).
  - Horario Valle: Multiplicador x1.0.
- **RN-05 (Prioridad de Recomendación)**: Si la ruta directa atraviesa una zona de *Riesgo Alto* (Puntaje $\ge 5.0$), el sistema **recomienda obligatoriamente la Ruta Alternativa**, fundamentando el desvío por razones de seguridad.

```mermaid
flowchart TD
    Start([Inicio: Solicitud de Ruta]) --> Input[Ingreso de Origen y Destino]
    Input --> Geocode[Geocodificación / Lookup Medellín Landmarks]
    
    Geocode --> CallOSRM[Solicitar trazado a OSRM API / driving]
    CallOSRM --> CheckOSRM{¿OSRM Responde?}
    
    CheckOSRM -- Sí --> MainGeometry[Generar Coordenadas Ruta Principal]
    CheckOSRM -- No/Error --> FallbackGeo[Generar Ruta Fallback Interpolada]
    
    MainGeometry --> AltGen[Generar Ruta Alternativa con Desvío Lat/Lng]
    FallbackGeo --> AltGen
    
    AltGen --> TrafficCalc[Calcular Multiplicador de Tráfico según Hora actual]
    
    TrafficCalc --> RiskEvalMain[Motor Riesgo: Haversine vs Incidentes y Zonas]
    RiskEvalMain --> RiskEvalAlt[Evaluar Riesgo de Ruta Alternativa]
    
    RiskEvalMain --> EvaluateScores{¿Ruta Principal es Alto Riesgo?}
    
    EvaluateScores -- Sí --> RecAlt[Recomendar Ruta Alternativa por Mayor Seguridad]
    EvaluateScores -- No --> EvaluateTime{¿Ruta Principal es 5min más lenta?}
    
    EvaluateTime -- Sí --> RecAltTime[Recomendar Ruta Alternativa por Rapidez]
    EvaluateTime -- No --> RecMain[Recomendar Ruta Principal: Balance Óptimo]
    
    RecAlt --> Render[Renderizar Mapa Leaflet / Capas de Color y Métricas]
    RecAltTime --> Render
    RecMain --> Render
    
    Render --> End([Fin: Presentación de Opciones al Usuario])
```

---

### 4.3 BPM-03: Reporte Ciudadano de Incidentes de Inseguridad

#### Descripción del Flujo
Permite a cualquier usuario presenciar o notificar un evento delictivo (hurto, atraco, falta de iluminación, acoso, etc.), marcando la coordenada exacta en el mapa e ingresando los detalles del suceso.

#### Reglas de Negocio Aplicadas
- **RN-08**: El reporte requiere coordenadas válidas, categoría, descripción y emisor.
- **RN-09**: El reporte ingresa inicialmente en estado `pendiente` para revisión del moderador (o `aprobado` de forma automática en modo demostración operacional).

```mermaid
sequenceDiagram
    autonumber
    actor C as Ciudadano
    participant FE as UI Frontend
    participant BE as Backend Express
    participant DB as Persistencia db.json / DB

    C->>FE: Hace clic en "Reportar Inseguridad"
    FE->>C: Despliega Formulario y Marcador Interactivo
    C->>FE: Selecciona Punto GPS + Tipo Incidente + Descripción
    FE->>BE: POST /api/incidents (Payload JSON)
    BE->>BE: Validar campos requeridos (Título, Tipo, Lat, Lng)
    BE->>BE: Asignar ID único (inc-timestamp) y fecha ISO
    BE->>DB: Guardar en colección "incidents"
    DB-->>BE: Registro Exitoso
    BE-->>FE: HTTP 201 Created (Incidente Registrado)
    FE->>FE: Actualizar Layer de Marcadores en el Mapa
    FE-->>C: Mensaje de confirmación: "Incidente reportado exitosamente"
```

---

### 4.4 BPM-04: Moderación, Verificación y Catalogación de Zonas de Riesgo

#### Descripción del Flujo
Proceso de control mediante el cual un Moderador o Administrador analiza los reportes pendientes, verifica su autenticidad y los consolida en la capa pública de la plataforma o ajusta los polígonos/radios de las zonas de riesgo urbanas.

```mermaid
flowchart TD
    StartMod([Inicio: Módulo de Moderación]) --> FetchPending[Obtener Listado de Incidentes Pendientes]
    FetchPending --> SelectInc[Moderador Selecciona Incidente a Evaluar]
    
    SelectInc --> CheckEv[Analizar Evidencias / Coordenadas / Duplicados]
    CheckEv --> Decision{¿Incidente Válido y Único?}
    
    Decision -- No --> Reject[Marcar como Rechazado en DB]
    Reject --> LogReject[Registrar en moderacion_reportes]
    
    Decision -- Requiere Ajuste --> RequestInfo[Solicitar Corrección / Marcar requiere_cambios]
    
    Decision -- Sí --> Approve[Aprobar Incidente]
    Approve --> CreateReport[Insertar Registro en Tabla reportes]
    CreateReport --> UpdateZone{¿Altera densidad de zona existente?}
    
    UpdateZone -- Sí --> RecalcZone[Recalcular Radio y Nivel de Riesgo de Zona]
    RecalcZone --> AuditZone[Insertar Trazabilidad en historial_riesgo]
    UpdateZone -- No --> AuditMod[Registrar en moderacion_reportes]
    AuditZone --> AuditMod
    
    LogReject --> EndMod([Fin Proceso Moderación])
    AuditMod --> EndMod
```

---

### 4.5 BPM-05: Monitoreo GPS y Motor de Alertas Preventivas en Tiempo Real

#### Descripción del Flujo
Servicio en segundo plano que monitorea la trayectoria GPS del usuario en movimiento. Al detectar que la distancia a una zona clasificada de *Alto Riesgo* es inferior al umbral preventivo (300 metros del borde), el sistema emite una notificación de advertencia inmediata.

#### Reglas de Negocio Aplicadas
- **RN-10 (Geocerca Preventiva)**: Distancia de activación $D \le (\text{Radio de Zona} + 300\text{m})$.
- **RN-11 (Filtro de Preferencias)**: La alerta se despliega únicamente si el usuario mantiene activado ese tipo de notificación en sus preferencias.

```mermaid
stateDiagram-v2
    [*] --> Standby: Usuario activa Navegación / GPS
    
    state Standby {
        [*] --> CapturandoGPS: Emisión de Coordenada Lat/Lng
        CapturandoGPS --> CalculandoDistancia: Haversine contra Zonas Alto Riesgo
    }
    
    CalculandoDistancia --> EnZonaSegura: Distancia > (Radio + 300m)
    EnZonaSegura --> CapturandoGPS: Siguiente Intervalo GPS
    
    CalculandoDistancia --> AlertaGeocerca: Distancia <= (Radio + 300m)
    
    state AlertaGeocerca {
        [*] --> ValidarPreferencia: Consultar preferencias_alertas
        ValidarPreferencia --> DispararNotificacion: Habilitado = True
        DispararNotificacion --> GuardarHistorial: INSERT INTO alertas
    }
    
    GuardarHistorial --> CapturandoGPS: Continúa Monitoreo
```

---

### 4.6 BPM-06: Transmisión de Ubicación de Emergencia / SOS a Contactos de Confianza

#### Descripción del Flujo
Permite activar una sesión de pánico o monitoreo continuo en tiempo real. La posición GPS del usuario se retransmite a su red de contactos de emergencia registrados en `contactos_confianza`.

```mermaid
sequenceDiagram
    autonumber
    actor C as Ciudadano en Riesgo
    participant FE as App Frontend
    participant BE as Backend Server
    actor CC as Contacto de Confianza

    C->>FE: Presiona Botón "Compartir Ubicación / SOS"
    FE->>BE: POST /api/auth/contacts (Obtener Red)
    BE-->>FE: Retorna Lista de Contactos Registrados
    alt Sin Contactos Registrados
        FE-->>C: Alerta: "Debe registrar al menos 1 contacto de confianza"
    else Con Contactos Configurados
        FE->>BE: Iniciar Sesión de Tracking (Lat, Lng, UserID)
        BE->>BE: Registrar Registro en ubicaciones_compartidas (estado='activa')
        BE->>CC: Envío de SMS / WhatsApp / Push ("SOS: Posición en tiempo real")
        BE-->>FE: HTTP 200 (Sesión de Transmisión Activa)
        loop Cada 10 segundos
            FE->>BE: Transmitir actualización GPS (Lat, Lng)
            BE->>CC: Actualizar enlace de seguimiento dinámico
        end
        C->>FE: Presiona "Detener Seguimiento"
        FE->>BE: UPDATE ubicaciones_compartidas SET estado='finalizada'
        BE-->>FE: Sesión Cerrada
        FE-->>C: Notificación de finalización de transmisión
    end
```

---

### 4.7 BPM-07: Consulta e Integración con Catálogo de Seguridad MercadoLibre

#### Descripción del Flujo
Ofrece al usuario la posibilidad de buscar y adquirir equipamiento de protección personal (cascos homologados, linternas tácticas, chalecos reflectivos, alarmas sonoras, candados de seguridad). Implementa un patrón de **Resiliencia y Auto-Recuperación (Self-healing)** para evitar interrupciones en caso de bloqueos externos (HTTP 403 o fallas de red).

```mermaid
flowchart TD
    StartML([Inicio: Buscador de Equipamiento]) --> QueryInput[Usuario consulta: ej. casco, linterna]
    QueryInput --> CallMLAPI[Backend ejecuta GET a API MercadoLibre]
    
    CallMLAPI --> ResponseCheck{¿Respuesta HTTP 200 OK?}
    
    ResponseCheck -- Sí --> FormatML[Formatear Items según Firmado Autor]
    ResponseCheck -- No/403 Forbidden --> FallbackML[Activar Catálogo Local Mock en Caché]
    
    FallbackML --> MatchCat[Filtrar Productos Mock por Categoría y Relevancia]
    MatchCat --> FormatMock[Formatear Estructura con Precios COP e Imágenes]
    
    FormatML --> SendJSON[Responder JSON al Frontend con Firma de Autor]
    FormatMock --> SendJSON
    
    SendJSON --> RenderUI[Renderizar Grid de Productos en UI]
    RenderUI --> EndML([Fin del Proceso de Consulta])
```

---

## 5. Matriz de Trazabilidad (BPM vs. Requerimientos e Indicadores KPIs)

### 5.1 Matriz de Alineación de Requerimientos

| Código BPM | Requerimiento Funcional | Tabla de Base de Datos Principal | Criterio de Aceptación / Verificación |
| :--- | :--- | :--- | :--- |
| **BPM-01** | RF-01, RF-02, RF-12 | `usuarios`, `contactos_confianza` | Registro exitoso, hash bcrypt verificado y gestión de contactos. |
| **BPM-02** | RF-04, RF-05, RN-04, RN-05 | `rutas`, `alternativas_ruta` | Desvío automático si ruta directa es de Alto Riesgo; cálculo de minutos con tráfico. |
| **BPM-03** | RF-08 | `incidentes` | Incidente ubicado geométricamente con tipo y descripción persistida. |
| **BPM-04** | RF-06, RF-07, RF-14 | `moderacion_reportes`, `zonas_riesgo` | Dictamen de moderación registrado y auditoría en `historial_riesgo`. |
| **BPM-05** | RF-03, RF-10, RF-11 | `ubicaciones`, `alertas` | Alerta disparada al estar a menos de (Radio + 300m) de zona roja. |
| **BPM-06** | RF-13 | `ubicaciones_compartidas` | Notificación enviada a contactos y sesión de seguimiento activa. |
| **BPM-07** | Integración ML API | Endpoint `/api/items` | Respuesta en < 500ms con fallback resiliente ante fallas 403. |

---

### 5.2 Indicadores Clave de Desempeño (KPIs del Negocio)

1. **Tiempo de Cálculo de Ruta Segura ($KPI_1$)**:
   $$\text{Tiempo Promedio} \le 1.5 \text{ segundos desde la solicitud del usuario.}$$
2. **Efectividad de Desvío Preventivo ($KPI_2$)**:
   $$\% \text{ Rutas Alternativas Adoptadas} = \left( \frac{\text{Rutas Alternativas Seleccionadas}}{\text{Total Rutas de Alto Riesgo Calculadas}} \right) \times 100 \ge 85\%$$
3. **Tiempo de Respuesta a Alertas SOS ($KPI_3$)**:
   $$\text{Despacho Notificación a Contactos} \le 3.0 \text{ segundos desde el clic en SOS.}$$
4. **Tasa de Resiliencia del Catálogo ($KPI_4$)**:
   $$\text{Disponibilidad del Servicio de Equipamiento} = 99.9\% \text{ (gracias al motor Fallback Local).}$$
