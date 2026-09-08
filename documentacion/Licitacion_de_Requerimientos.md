# Licitación de Requerimientos

## Plataforma "Rutas Inseguras"

**Entidad solicitante:** Proyecto Rutas Inseguras  
**Objeto:** Contratar el análisis, desarrollo, integración, pruebas, documentación y puesta en operación de una plataforma web para movilidad segura y prevención ciudadana en Medellín.  
**Modalidad:** Licitación de solución tecnológica integral.  
**Versión:** 1.0  
**Fecha:** 8 de septiembre de 2026

> Este documento define el alcance mínimo que debe cumplir cualquier propuesta. La solución existente en este repositorio constituye una línea base funcional y técnica; la propuesta debe conservar la trazabilidad con ella o justificar formalmente cualquier cambio.

## 1. Antecedentes y necesidad

La entidad requiere una plataforma que permita consultar rutas seguras, visualizar incidentes georreferenciados, recibir alertas preventivas y gestionar reportes ciudadanos con control de calidad. El sistema debe servir a ciudadanos, moderadores, analistas de seguridad y administradores, con permisos diferenciados.

La solución debe integrar un frontend web responsivo, una API segura, persistencia de datos geográficos y un sistema de auditoría. Debe poder operar inicialmente con el entorno de demostración existente y quedar preparada para una base de datos relacional MariaDB/MySQL.

## 2. Objetivos de la contratación

1. Implementar una experiencia ciudadana para consultar y calcular rutas seguras.
2. Habilitar el reporte georreferenciado y moderado de incidentes.
3. Proporcionar analítica para identificar tendencias y zonas de riesgo.
4. Aplicar autenticación, autorización RBAC y trazabilidad de acciones.
5. Entregar una solución instalable, documentada, probada y mantenible.

## 3. Usuarios y roles

| Rol | Necesidad principal | Accesos mínimos |
| --- | --- | --- |
| Usuario Ciudadano | Consultar rutas, incidentes y reportar situaciones | Mapa, rutas, incidentes, cuenta y reporte |
| Moderador | Verificar la calidad de los reportes | Cola de moderación, edición, aprobación y rechazo |
| Analista de Seguridad | Analizar patrones de riesgo | Indicadores, filtros, mapa de calor y exportación |
| Administrador | Administrar usuarios y permisos | Gestión de usuarios, roles, estados y configuración |

## 4. Alcance funcional mínimo

| Código | Requerimiento | Prioridad | Evidencia de cumplimiento |
| --- | --- | --- | --- |
| RF-01 | Autenticación y autorización basada en roles | Obligatoria | Pruebas de acceso permitido y denegado por rol |
| RF-02 | Registro, inicio y cierre de sesión y persistencia segura de sesión | Obligatoria | Casos de registro, login, logout y sesión expirada |
| RF-03 | Geolocalización y visualización de la posición del usuario | Alta | Mapa con posición y permisos de ubicación gestionados |
| RF-04 | Cálculo de ruta entre origen y destino | Obligatoria | Ruta trazada con distancia y tiempo estimado |
| RF-05 | Recomendación de ruta alternativa segura | Obligatoria | Alternativa visible cuando la ruta principal presenta riesgo |
| RF-06 | Catalogación y visualización de zonas de riesgo | Alta | Zonas diferenciadas por nivel y representación cartográfica |
| RF-07 | Actualización y trazabilidad del nivel de riesgo | Alta | Historial de cambios y usuario responsable |
| RF-08 | Registro ciudadano de incidentes georreferenciados | Obligatoria | Formulario con coordenadas, tipo, fecha y descripción |
| RF-09 | Verificación y publicación oficial de reportes | Obligatoria | Solo reportes aprobados aparecen en el mapa público |
| RF-10 | Alertas preventivas en tiempo real por proximidad a riesgo | Alta | Alerta disparada dentro del radio configurado |
| RF-11 | Configuración de preferencias de notificación | Alta | Activación y desactivación por tipo de alerta |
| RF-12 | Gestión de contactos de confianza | Alta | Crear, editar y eliminar contactos de emergencia |
| RF-13 | Compartir ubicación en una situación de emergencia | Alta | Sesión SOS y aviso a contactos autorizados |
| RF-14 | Moderación y auditoría de reportes ciudadanos | Obligatoria | Estados, notas, fechas y responsable de cada decisión |
| RF-15 | Auditoría técnica y trazabilidad del sistema | Obligatoria | Registro consultable de eventos relevantes |
| RF-16 | Estadísticas, métricas y analítica de seguridad | Obligatoria | Dashboard filtrable y exportación CSV |

### 4.1 Flujos obligatorios

#### A. Consulta de ruta segura

1. El usuario indica origen y destino.
2. El sistema valida ambos puntos.
3. El motor calcula la ruta base y evalúa riesgo, iluminación, incidentes y horario.
4. El sistema muestra la ruta recomendada, alternativa, distancia, duración y factores de riesgo.
5. Si la ruta directa atraviesa una zona de riesgo alto, se debe destacar y recomendar la alternativa.

#### B. Reporte ciudadano

1. El usuario activa el modo de reporte y selecciona un punto en el mapa.
2. Diligencia tipo, título y descripción del incidente.
3. El sistema valida coordenadas y campos obligatorios.
4. El reporte se almacena inicialmente como `pendiente`.
5. El moderador aprueba, rechaza o edita el reporte dejando trazabilidad.
6. Solo los reportes aprobados quedan disponibles públicamente.

#### C. Moderación

1. El moderador consulta la cola por estado.
2. Inspecciona datos, ubicación y evidencia disponible.
3. Decide aprobar, rechazar o corregir.
4. El sistema registra usuario, fecha, decisión y nota.

#### D. Analítica

1. El analista consulta indicadores por período, tipo, zona y franja horaria.
2. El sistema calcula el índice global de riesgo.
3. Presenta tendencias y ranking de zonas.
4. Permite exportar los resultados en CSV UTF-8.

## 5. Requerimientos no funcionales

| Código | Requisito | Mínimo exigible |
| --- | --- | --- |
| RNF-01 | Seguridad | HTTPS en despliegue, contraseñas con BCrypt y tokens JWT firmados |
| RNF-02 | Control de acceso | Validación de permisos en frontend y backend para los cuatro roles |
| RNF-03 | Rendimiento | Respuesta objetivo de API menor a 300 ms en consultas ordinarias de incidentes |
| RNF-04 | Usabilidad | Interfaz clara, consistente, responsiva y adecuada para uso ciudadano |
| RNF-05 | Compatibilidad | Chrome, Firefox, Edge y navegadores móviles actuales |
| RNF-06 | Integridad | Validación de entradas, prevención de duplicados y manejo de errores |
| RNF-07 | Accesibilidad | Objetivo WCAG 2.1 nivel AA, teclado, foco visible, etiquetas y contraste |
| RNF-08 | Auditoría | Registro de decisiones de moderación y acciones administrativas |
| RNF-09 | Disponibilidad | Recuperación documentada ante fallos y respaldo de la información |
| RNF-10 | Mantenibilidad | Código modular, variables de entorno y documentación de instalación |
| RNF-11 | Privacidad | Minimización de datos, consentimiento para ubicación y control de acceso a SOS |
| RNF-12 | Escalabilidad | Separación frontend/API y posibilidad de migrar de JSON a MariaDB/MySQL |

## 6. Arquitectura y tecnologías de referencia

La propuesta debe mantener interfaces claras entre estas capas:

- **Frontend:** aplicación web React/Vite, navegación por rutas, mapa Leaflet y diseño responsivo.
- **Backend:** API REST Node.js/Express con validación, autenticación, autorización y manejo uniforme de errores.
- **Persistencia:** modelo compatible con el esquema de datos del proyecto y preparado para MariaDB/MySQL.
- **Mapas y ruteo:** servicio cartográfico y motor de rutas documentados, con control de límites, errores y disponibilidad.
- **Despliegue:** configuración por variables de entorno, scripts reproducibles y separación de desarrollo, pruebas y producción.

Se aceptan tecnologías equivalentes si la propuesta demuestra compatibilidad, seguridad, mantenibilidad y ausencia de dependencia propietaria que limite la operación.

## 7. Integraciones mínimas

1. Servicio de mapas y geocodificación.
2. Servicio de cálculo de rutas con geometría y duración.
3. API de autenticación y gestión de sesiones.
4. Persistencia de usuarios, incidentes, zonas, rutas, contactos, alertas y auditoría.
5. Exportación de informes en CSV.

Cada integración debe incluir límites de uso, manejo de indisponibilidad, tiempos de espera, registro de errores y estrategia de sustitución o recuperación.

## 8. Entregables

| Entregable | Contenido mínimo | Momento |
| --- | --- | --- |
| E1. Plan de trabajo | Alcance, cronograma, riesgos, responsables y dependencias | Inicio |
| E2. Diseño de solución | Arquitectura, modelo de datos, seguridad e integraciones | Diseño |
| E3. Prototipo navegable | Flujos principales y validación con usuarios | Antes del desarrollo completo |
| E4. Producto funcional | Frontend, API, base de datos e integraciones | Implementación |
| E5. Pruebas | Unitarias, integración, aceptación, seguridad y rendimiento | Antes de entrega |
| E6. Documentación | Instalación, operación, API, modelo de datos y administración | Entrega |
| E7. Capacitación | Sesión para administración, moderación y analítica | Puesta en operación |
| E8. Soporte | Corrección de defectos y acompañamiento posterior | Garantía |

## 9. Criterios de aceptación

La solución será aceptada cuando se cumplan, como mínimo, estas condiciones:

- Los cuatro roles pueden autenticarse y solo acceden a las funciones autorizadas.
- El mapa permite consultar incidentes aprobados y calcular una ruta con alternativa.
- Un reporte ciudadano recorre correctamente los estados `pendiente`, `aprobado` o `rechazado`.
- La decisión de moderación queda auditada con usuario, fecha y observación.
- Las métricas se filtran y exportan sin pérdida de información ni caracteres corruptos.
- Se validan entradas inválidas, errores de servicios externos y sesiones expiradas.
- La interfaz funciona en escritorio y móvil sin pérdida de funciones esenciales.
- Las pruebas críticas no presentan defectos bloqueantes o de seguridad alta.
- La instalación desde cero se puede reproducir siguiendo la documentación entregada.

## 10. Pruebas mínimas requeridas

El proponente debe entregar casos y resultados para:

- Login válido, credenciales inválidas, usuario suspendido y expiración de token.
- Acceso directo no autorizado a `/admin`, `/moderador` y `/analitica`.
- Reporte sin coordenadas, con datos inválidos y con envío exitoso.
- Aprobación, rechazo, edición y consulta histórica de un incidente.
- Ruta sin alternativa, ruta con riesgo alto y servicio de ruteo no disponible.
- Alertas dentro y fuera del radio configurado.
- Exportación CSV con tildes, caracteres especiales y filtros aplicados.
- Carga concurrente de consultas públicas y recuperación ante error de base de datos.

## 11. Criterios de evaluación de propuestas

| Criterio | Ponderación |
| --- | ---: |
| Cumplimiento funcional de RF-01 a RF-16 | 30% |
| Seguridad, privacidad y control de acceso | 20% |
| Calidad técnica, arquitectura y mantenibilidad | 15% |
| Plan de implementación, pruebas y migración | 15% |
| Experiencia del equipo en mapas, geodatos y plataformas web | 10% |
| Soporte, garantía y transferencia de conocimiento | 5% |
| Costo total de propiedad | 5% |
| **Total** | **100%** |

Las propuestas que no cumplan un requisito obligatorio de seguridad, autorización o trazabilidad podrán ser declaradas no elegibles, independientemente de su puntuación económica.

## 12. Contenido obligatorio de la propuesta

El oferente debe presentar:

1. Carta de presentación y vigencia de la oferta.
2. Comprensión del problema y alcance propuesto.
3. Matriz de cumplimiento requisito por requisito.
4. Arquitectura técnica y tecnologías.
5. Cronograma con hitos, dependencias y responsables.
6. Equipo de trabajo y experiencia demostrable.
7. Plan de pruebas, seguridad, respaldo y continuidad.
8. Plan de capacitación, soporte y garantía.
9. Presupuesto desglosado por fase, licencia, infraestructura y operación.
10. Riesgos, supuestos, exclusiones y dependencias externas.

## 13. Condiciones de garantía y soporte

- Corrección sin costo de defectos que impidan cumplir los criterios de aceptación.
- Clasificación de incidentes por severidad y tiempos de atención definidos en la propuesta.
- Entrega del código fuente, configuraciones y documentación acordadas.
- Prohibición de incluir credenciales, claves o datos reales en el repositorio de entrega.
- Transferencia de conocimiento al equipo designado por la entidad.

## 14. Trazabilidad documental

La propuesta debe relacionar cada requisito con su implementación, prueba y evidencia. Como mínimo, debe utilizar los siguientes documentos del proyecto:

- [Mapa de Navegación](Mapa_de_Navegacion.md)
- [Historias de Usuario](Historias_de_Usuario_Rutas_Inseguras.md)
- [Especificación BPM](BPM_Proyecto_Rutas_Inseguras.md)
- [Diccionario de Base de Datos](DICCIONARIO_BASE_DE_DATOS.md)
- `database/rutas_inseguras_mariadb.sql`

La matriz de trazabilidad final debe tener las columnas: código, requisito, módulo, componente o endpoint, caso de prueba, evidencia, estado y observaciones.

## 15. Exclusiones iniciales

Salvo que se coticen como ampliaciones, quedan fuera del alcance base:

- Aplicaciones móviles nativas independientes para Android o iOS.
- Integración directa con sistemas policiales o de emergencia gubernamentales.
- Compra de dispositivos GPS, cámaras, sensores o infraestructura física.
- Moderación automática basada en inteligencia artificial.
- Operación 24/7 por parte del proveedor después del período de garantía.

Toda exclusión debe quedar explícita en la propuesta para evitar ambigüedad contractual.
