# Mapa de Navegacion

## Plataforma "Rutas Inseguras"

Este diagrama representa la navegacion implementada actualmente en el frontend React. Las rutas indicadas corresponden a `frontend/src/App.jsx` y los accesos visibles por rol a `frontend/src/components/Navbar.jsx`.

```mermaid
flowchart TD
    Inicio([Entrada a la aplicacion]) --> Splash[Pantalla inicial / SplashScreen]
    Splash --> Mapa[Mapa ciudadano\nRuta: /]

    Mapa --> Navbar[Barra de navegacion]
    Mapa --> Panel[Panel lateral]
    Mapa --> Leaflet[Mapa interactivo]

    Navbar --> Buscar[Buscar incidentes]
    Buscar --> Resultados[Resultados de incidentes\nRuta: /search-incidents?q=...]
    Resultados --> Mapa

    Navbar --> Reportar[Activar modo reportar inseguridad]
    Reportar --> Leaflet
    Leaflet --> Formulario[Seleccionar punto y abrir formulario]
    Formulario --> Enviar[Enviar reporte]
    Enviar --> Moderacion[Cola de moderacion]
    Enviar --> Mapa

    Panel --> Rutas[Tab Rutas]
    Rutas --> OrigenDestino[Ingresar origen y destino]
    OrigenDestino --> Calcular[Calcular ruta segura]
    Calcular --> RutaResultado[Mostrar ruta principal\ny alternativa en el mapa]
    RutaResultado --> Mapa

    Panel --> Incidentes[Tab Incidentes]
    Incidentes --> ListaIncidentes[Consultar incidentes visibles]
    ListaIncidentes --> Centrar[Centrar mapa en incidente]
    Centrar --> Mapa

    Panel --> Cuenta[Tab Mi Cuenta]
    Navbar --> Login[Iniciar sesion]
    Login --> Cuenta
    Cuenta --> Perfil[Perfil y contactos de emergencia]
    Cuenta --> Cerrar[Cerrar sesion]
    Cerrar --> Mapa

    Mapa --> Roles{Rol del usuario}
    Roles --> Ciudadano[Usuario Ciudadano]
    Roles --> Moderador[Moderador]
    Roles --> Analista[Analista de Seguridad]
    Roles --> Admin[Administrador]

    Moderador --> PanelModeracion[Panel de moderacion\nRuta: /moderador]
    Analista --> PanelAnalitica[Centro de analitica\nRuta: /analitica]
    Admin --> PanelAdmin[Panel de administracion\nRuta: /admin]

    PanelModeracion --> Mapa
    PanelAnalitica --> Mapa
    PanelAdmin --> Mapa

    classDef primary fill:#0b3954,color:#fff,stroke:#06283d,stroke-width:2px
    classDef role fill:#f4a261,color:#17202a,stroke:#c76d22,stroke-width:1px
    classDef route fill:#e8f1f2,color:#17202a,stroke:#397d8c,stroke-width:1px
    class Mapa,Navbar,Panel,Leaflet primary
    class Ciudadano,Moderador,Analista,Admin role
    class Resultados,PanelModeracion,PanelAnalitica,PanelAdmin route
```

## Rutas de la aplicacion

| Ruta | Vista | Acceso desde la interfaz |
| --- | --- | --- |
| `/` | Mapa ciudadano, rutas seguras, incidentes, cuenta y reportes | Todos los usuarios |
| `/search-incidents?q=...` | Resultados de busqueda de incidentes | Buscador de la barra superior |
| `/moderador` | Moderacion de reportes | Moderador y Administrador |
| `/analitica` | Analisis e indicadores de seguridad | Analista de Seguridad y Administrador |
| `/admin` | Gestion de usuarios y roles | Administrador |

## Navegacion interna del mapa

- **Rutas:** calcula y visualiza una ruta segura y su alternativa.
- **Incidentes:** consulta los reportes y permite centrar el mapa en un punto.
- **Mi Cuenta:** permite iniciar sesion, consultar el perfil y gestionar contactos de emergencia.
- **Reportar inseguridad:** activa el modo de seleccion de un punto del mapa y abre el formulario de reporte.

> Nota: los accesos por rol se ocultan en la barra de navegacion cuando el rol no corresponde. La proteccion de rutas frente a acceso directo debe validarse tambien en el backend mediante autenticacion y autorizacion.
