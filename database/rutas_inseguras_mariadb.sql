-- ==============================================================================
-- SCRIPT DE BASE DE DATOS MARIADB / MYSQL: RUTAS INSEGURAS
-- Proyecto: Rutas Inseguras - Movilidad Ciudadana Protegida
-- Versión: 1.0 (Normalizada en Tercera Forma Normal 3FN)
-- Compatible con: MariaDB 10.4+ / MySQL 8.0+
-- Basado en la Matriz de Requerimientos (RF-01 a RF-16 / RI-01 a RI-16)
-- ==============================================================================

DROP DATABASE IF EXISTS rutas_inseguras_db;
CREATE DATABASE IF NOT EXISTS rutas_inseguras_db
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE rutas_inseguras_db;

-- ------------------------------------------------------------------------------
-- 1. TABLA ROLES (RI-01)
-- ------------------------------------------------------------------------------
CREATE TABLE roles (
  id_rol INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Identificador único del rol',
  nombre_rol VARCHAR(50) NOT NULL UNIQUE COMMENT 'Nombre del rol (ej: Administrador, Moderador, Usuario)',
  descripcion TEXT NULL COMMENT 'Descripción detallada de los permisos del rol',
  nivel_acceso INT NOT NULL DEFAULT 1 COMMENT 'Nivel jerárquico de acceso (1: Usuario, 2: Moderador, 3: Admin)'
) ENGINE=InnoDB COMMENT='Tabla de catálogo de roles del sistema';

-- ------------------------------------------------------------------------------
-- 2. TABLA USUARIOS (RI-02)
-- ------------------------------------------------------------------------------
CREATE TABLE usuarios (
  id_usuario INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Identificador único del usuario',
  nombre VARCHAR(100) NOT NULL COMMENT 'Nombre completo del usuario',
  correo VARCHAR(150) NOT NULL UNIQUE COMMENT 'Correo electrónico (Login ID)',
  contrasena VARCHAR(255) NOT NULL COMMENT 'Hash de contraseña (bcrypt)',
  telefono VARCHAR(20) NULL COMMENT 'Teléfono de contacto',
  estado ENUM('activo', 'inactivo', 'bloqueado') NOT NULL DEFAULT 'activo' COMMENT 'Estado de la cuenta',
  fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de creación',
  id_rol INT NOT NULL COMMENT 'Clave foránea hacia tabla Roles',
  CONSTRAINT fk_usuarios_roles FOREIGN KEY (id_rol) 
    REFERENCES roles(id_rol) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Tabla principal de usuarios registrados';

-- ------------------------------------------------------------------------------
-- 3. TABLA UBICACIONES (RI-03)
-- ------------------------------------------------------------------------------
CREATE TABLE ubicaciones (
  id_ubicacion INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Identificador de registro de ubicación',
  id_usuario INT NOT NULL COMMENT 'Usuario al que pertenece el registro',
  latitud DECIMAL(10,8) NOT NULL COMMENT 'Coordenada Latitud GPS',
  longitud DECIMAL(11,8) NOT NULL COMMENT 'Coordenada Longitud GPS',
  fecha_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp de la captura',
  CONSTRAINT fk_ubicaciones_usuarios FOREIGN KEY (id_usuario) 
    REFERENCES usuarios(id_usuario) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Historial de geolocalización en tiempo real';

-- ------------------------------------------------------------------------------
-- 4. TABLA RUTAS (RI-04)
-- ------------------------------------------------------------------------------
CREATE TABLE rutas (
  id_ruta INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Identificador de la consulta de ruta',
  id_usuario INT NOT NULL COMMENT 'Usuario que consultó la ruta',
  origen VARCHAR(255) NOT NULL COMMENT 'Dirección o punto de origen',
  destino VARCHAR(255) NOT NULL COMMENT 'Dirección o punto de destino',
  distancia DECIMAL(8,2) NOT NULL COMMENT 'Distancia total calculada en kilómetros',
  duracion_estimada_min INT NOT NULL DEFAULT 0 COMMENT 'Tiempo estimado en minutos',
  nivel_riesgo ENUM('Bajo', 'Medio', 'Alto') NOT NULL DEFAULT 'Bajo' COMMENT 'Nivel global de riesgo de la ruta',
  fecha_consulta DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora del cálculo',
  CONSTRAINT fk_rutas_usuarios FOREIGN KEY (id_usuario) 
    REFERENCES usuarios(id_usuario) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Registro de rutas solicitadas y analizadas';

-- ------------------------------------------------------------------------------
-- 5. TABLA ALTERNATIVAS_RUTA (RI-05)
-- ------------------------------------------------------------------------------
CREATE TABLE alternativas_ruta (
  id_alternativa INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Identificador de la ruta alternativa',
  id_ruta INT NOT NULL COMMENT 'Ruta principal a la que pertenece esta opción',
  descripcion TEXT NOT NULL COMMENT 'Detalles del trazado alternativo',
  distancia_alt DECIMAL(8,2) NOT NULL COMMENT 'Distancia de la ruta alternativa en km',
  duracion_min INT NOT NULL COMMENT 'Duración estimada en minutos',
  nivel_riesgo ENUM('Bajo', 'Medio', 'Alto') NOT NULL DEFAULT 'Bajo' COMMENT 'Nivel de riesgo de la alternativa',
  CONSTRAINT fk_alternativas_rutas FOREIGN KEY (id_ruta) 
    REFERENCES rutas(id_ruta) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Opciones alternativas de rutas con menor riesgo';

-- ------------------------------------------------------------------------------
-- 6. TABLA ZONAS_RIESGO (RI-06)
-- ------------------------------------------------------------------------------
CREATE TABLE zonas_riesgo (
  id_zona INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Identificador único de la zona peligrosa',
  nombre_zona VARCHAR(150) NOT NULL COMMENT 'Nombre o barrio de la zona',
  nivel_riesgo ENUM('Bajo', 'Medio', 'Alto') NOT NULL DEFAULT 'Alto' COMMENT 'Nivel de peligro de la zona',
  latitud DECIMAL(10,8) NOT NULL COMMENT 'Latitud centro de la zona',
  longitud DECIMAL(11,8) NOT NULL COMMENT 'Longitud centro de la zona',
  radio_metros INT NOT NULL DEFAULT 500 COMMENT 'Radio de peligro en metros',
  coordenadas TEXT NULL COMMENT 'Geometría JSON/Polígono si aplica',
  fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de registro inicial'
) ENGINE=InnoDB COMMENT='Catálogo de zonas geográficas clasificadas por riesgo';

-- ------------------------------------------------------------------------------
-- 7. TABLA HISTORIAL_RIESGO (RI-07)
-- ------------------------------------------------------------------------------
CREATE TABLE historial_riesgo (
  id_historial INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Identificador del registro histórico',
  id_zona INT NOT NULL COMMENT 'Zona asociada',
  fecha_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha del cambio de nivel',
  nivel_riesgo_anterior ENUM('Bajo', 'Medio', 'Alto') NULL COMMENT 'Nivel previo',
  nivel_riesgo_nuevo ENUM('Bajo', 'Medio', 'Alto') NOT NULL COMMENT 'Nuevo nivel asignado',
  motivo VARCHAR(255) NULL COMMENT 'Razón de la actualización (ej: aumento de reportes)',
  CONSTRAINT fk_historial_zonas FOREIGN KEY (id_zona) 
    REFERENCES zonas_riesgo(id_zona) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Histórico de modificaciones en los niveles de riesgo de zonas';

-- ------------------------------------------------------------------------------
-- 8. TABLA INCIDENTES (RI-08)
-- ------------------------------------------------------------------------------
CREATE TABLE incidentes (
  id_incidente INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Identificador del reporte de incidente',
  id_usuario INT NOT NULL COMMENT 'Usuario que reporta el hecho',
  tipo_incidente VARCHAR(100) NOT NULL COMMENT 'Categoría (Hurtos, Acoso, Robo a mano armada, etc.)',
  descripcion TEXT NULL COMMENT 'Detalles acontecidos',
  latitud DECIMAL(10,8) NOT NULL COMMENT 'Latitud donde ocurrió',
  longitud DECIMAL(11,8) NOT NULL COMMENT 'Longitud donde ocurrió',
  ubicacion VARCHAR(255) NOT NULL COMMENT 'Dirección de referencia',
  fecha_reporte DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora del reporte',
  estado ENUM('pendiente', 'aprobado', 'rechazado') NOT NULL DEFAULT 'pendiente' COMMENT 'Estado del reporte',
  CONSTRAINT fk_incidentes_usuarios FOREIGN KEY (id_usuario) 
    REFERENCES usuarios(id_usuario) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Reportes ciudadanos de incidentes de inseguridad';

-- ------------------------------------------------------------------------------
-- 9. TABLA REPORTES (RI-09)
-- ------------------------------------------------------------------------------
CREATE TABLE reportes (
  id_reporte INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Identificador de publicación de reporte',
  id_incidente INT NOT NULL UNIQUE COMMENT 'Incidente validado asociado',
  estado ENUM('publicado', 'archivado') NOT NULL DEFAULT 'publicado' COMMENT 'Estado de la publicación',
  fecha_publicacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de publicación oficial en mapa',
  CONSTRAINT fk_reportes_incidentes FOREIGN KEY (id_incidente) 
    REFERENCES incidentes(id_incidente) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Publicaciones visibles de incidentes verificados';

-- ------------------------------------------------------------------------------
-- 10. TABLA ALERTAS (RI-10)
-- ------------------------------------------------------------------------------
CREATE TABLE alertas (
  id_alerta INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Identificador único de la alerta',
  id_usuario INT NOT NULL COMMENT 'Usuario destinatario',
  tipo_alerta VARCHAR(100) NOT NULL COMMENT 'Tipo de alerta (Aproximación a zona roja, Incidente cercano)',
  descripcion TEXT NOT NULL COMMENT 'Mensaje preventivo enviado',
  fecha_alerta DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Momento de emisión',
  estado ENUM('enviada', 'leida', 'descartada') NOT NULL DEFAULT 'enviada' COMMENT 'Estado de recepción por el usuario',
  CONSTRAINT fk_alertas_usuarios FOREIGN KEY (id_usuario) 
    REFERENCES usuarios(id_usuario) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Notificaciones de alerta preventivas generadas en tiempo real';

-- ------------------------------------------------------------------------------
-- 11. TABLA PREFERENCIAS_ALERTAS (RI-11)
-- ------------------------------------------------------------------------------
CREATE TABLE preferencias_alertas (
  id_preferencia INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Identificador de preferencia',
  id_usuario INT NOT NULL COMMENT 'Usuario propietario de la configuración',
  tipo_alerta VARCHAR(100) NOT NULL COMMENT 'Categoría de alerta (ej: Zonas Alto Riesgo, Incidentes Recientes)',
  estado TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1 = Habilitada, 0 = Deshabilitada',
  CONSTRAINT fk_preferencias_usuarios FOREIGN KEY (id_usuario) 
    REFERENCES usuarios(id_usuario) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Configuraciones personalizadas de notificación por usuario';

-- ------------------------------------------------------------------------------
-- 12. TABLA CONTACTOS_CONFIANZA (RI-12)
-- ------------------------------------------------------------------------------
CREATE TABLE contactos_confianza (
  id_contacto INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Identificador de contacto de confianza',
  id_usuario INT NOT NULL COMMENT 'Usuario que añade el contacto',
  nombre_contacto VARCHAR(100) NOT NULL COMMENT 'Nombre completo del contacto de emergencia',
  telefono VARCHAR(20) NOT NULL COMMENT 'Número telefónico o celular',
  relacion VARCHAR(50) NULL COMMENT 'Parentesco o relación (Familiar, Amigo, Pareja)',
  CONSTRAINT fk_contactos_usuarios FOREIGN KEY (id_usuario) 
    REFERENCES usuarios(id_usuario) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Red de contactos de emergencia de los usuarios';

-- ------------------------------------------------------------------------------
-- 13. TABLA UBICACIONES_COMPARTIDAS (RI-13)
-- ------------------------------------------------------------------------------
CREATE TABLE ubicaciones_compartidas (
  id_compartido INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Identificador de sesión compartida',
  id_usuario INT NOT NULL COMMENT 'Usuario que comparte su trayecto',
  id_contacto INT NOT NULL COMMENT 'Contacto receptor autorizado',
  fecha_inicio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Inicio de emisión de ubicación',
  fecha_fin DATETIME NULL COMMENT 'Fin de la sesión de monitoreo',
  estado ENUM('activa', 'finalizada') NOT NULL DEFAULT 'activa' COMMENT 'Estado del seguimiento',
  CONSTRAINT fk_compartido_usuario FOREIGN KEY (id_usuario) 
    REFERENCES usuarios(id_usuario) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_compartido_contacto FOREIGN KEY (id_contacto) 
    REFERENCES contactos_confianza(id_contacto) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Sesiones activas e históricas de ubicación compartida';

-- ------------------------------------------------------------------------------
-- 14. TABLA MODERACION_REPORTES (RI-14)
-- ------------------------------------------------------------------------------
CREATE TABLE moderacion_reportes (
  id_moderacion INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Identificador de la moderación',
  id_incidente INT NOT NULL COMMENT 'Incidente bajo proceso de revisión',
  id_moderador INT NOT NULL COMMENT 'Usuario con rol de Moderador/Admin',
  estado_revision ENUM('aprobado', 'rechazado', 'requiere_cambios') NOT NULL COMMENT 'Dictamen del moderador',
  observaciones TEXT NULL COMMENT 'Comentarios o notas de revisión',
  fecha_revision DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Momento de la moderación',
  CONSTRAINT fk_moderacion_incidente FOREIGN KEY (id_incidente) 
    REFERENCES incidentes(id_incidente) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_moderacion_moderador FOREIGN KEY (id_moderador) 
    REFERENCES usuarios(id_usuario) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Registro de auditoría y revisión de reportes ciudadanos';

-- ------------------------------------------------------------------------------
-- 15. TABLA AUDITORIA (RI-15 / RNF-11)
-- ------------------------------------------------------------------------------
CREATE TABLE auditoria (
  id_auditoria INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Identificador del evento de auditoría',
  id_usuario INT NULL COMMENT 'Usuario responsable de la acción (NULL si es sistema)',
  accion VARCHAR(100) NOT NULL COMMENT 'Operación realizada (ej: REGISTRO_USUARIO, INCIDENTE_CREADO)',
  detalles TEXT NULL COMMENT 'Detalles técnicos o JSON de la transacción',
  fecha_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Momento exacto de la operación',
  CONSTRAINT fk_auditoria_usuario FOREIGN KEY (id_usuario) 
    REFERENCES usuarios(id_usuario) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Bitácora de seguridad y auditoría general del sistema';

-- ------------------------------------------------------------------------------
-- 16. TABLA ESTADISTICAS (RI-16)
-- ------------------------------------------------------------------------------
CREATE TABLE estadisticas (
  id_estadistica INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Identificador del informe generado',
  tipo_reporte VARCHAR(100) NOT NULL COMMENT 'Nombre del reporte (ej: Incidentes por Mes, Zonas Más Peligrosas)',
  fecha_generacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de cálculo de métricas',
  resultado JSON NOT NULL COMMENT 'Resultado de la analítica en formato JSON'
) ENGINE=InnoDB COMMENT='Informes consolidados y métricas de seguridad';

-- ==============================================================================
-- CREACIÓN DE ÍNDICES PARA OPTIMIZACIÓN DE CONSULTAS
-- ==============================================================================
CREATE INDEX idx_usuarios_correo ON usuarios(correo);
CREATE INDEX idx_ubicaciones_coords ON ubicaciones(latitud, longitud);
CREATE INDEX idx_incidentes_coords ON incidentes(latitud, longitud);
CREATE INDEX idx_zonas_coords ON zonas_riesgo(latitud, longitud);
CREATE INDEX idx_rutas_usuario ON rutas(id_usuario);
CREATE INDEX idx_alertas_usuario ON alertas(id_usuario, estado);

-- ==============================================================================
-- TRIGGERS PARA AUTOMATIZACIÓN Y AUDITORÍA (RNF-11)
-- ==============================================================================
DELIMITER //

CREATE TRIGGER trg_auditoria_nuevo_usuario
AFTER INSERT ON usuarios
FOR EACH ROW
BEGIN
  INSERT INTO auditoria (id_usuario, accion, detalles)
  VALUES (NEW.id_usuario, 'REGISTRO_USUARIO', CONCAT('Usuario registrado: ', NEW.correo));
END;
//

CREATE TRIGGER trg_auditoria_nuevo_incidente
AFTER INSERT ON incidentes
FOR EACH ROW
BEGIN
  INSERT INTO auditoria (id_usuario, accion, detalles)
  VALUES (NEW.id_usuario, 'INCIDENTE_REPORTADO', CONCAT('Tipo: ', NEW.tipo_incidente, ' en ', NEW.ubicacion));
END;
//

DELIMITER ;

-- ==============================================================================
-- DATOS SEMILLA (SEED DATA REALISTA PARA MEDELLÍN)
-- ==============================================================================

-- 1. Roles
INSERT INTO roles (id_rol, nombre_rol, descripcion, nivel_acceso) VALUES
(1, 'Administrador', 'Control total del sistema, gestión de usuarios y configuraciones', 3),
(2, 'Moderador', 'Validación de reportes ciudadanos e incidentes', 2),
(3, 'Usuario Ciudadano', 'Uso de la app, consulta de rutas y reporte de incidentes', 1);

-- 2. Usuarios
INSERT INTO usuarios (id_usuario, nombre, correo, contrasena, telefono, estado, id_rol) VALUES
(1, 'Admin Sistema', 'admin@rutasinseguras.com', '$2a$10$e8w.R/X/0.q.3G3WzZ1JceP7Q.K1O8Z4v5w9.e6V3l8F9.', '3000000000', 'activo', 1),
(2, 'Moderador Medellín', 'moderador@rutasinseguras.com', '$2a$10$e8w.R/X/0.q.3G3WzZ1JceP7Q.K1O8Z4v5w9.e6V3l8F9.', '3011111111', 'activo', 2),
(3, 'Jean Crespo', 'jean@ejemplo.com', '$2a$10$e8w.R/X/0.q.3G3WzZ1JceP7Q.K1O8Z4v5w9.e6V3l8F9.', '3022222222', 'activo', 3),
(4, 'Samuel Pérez', 'samuel@ejemplo.com', '$2a$10$e8w.R/X/0.q.3G3WzZ1JceP7Q.K1O8Z4v5w9.e6V3l8F9.', '3033333333', 'activo', 3);

-- 3. Zonas de Riesgo en Medellín
INSERT INTO zonas_riesgo (id_zona, nombre_zona, nivel_riesgo, latitud, longitud, radio_metros) VALUES
(1, 'Sector Parque de las Luces / San Antonio', 'Alto', 6.24530000, -75.56840000, 600),
(2, 'Sector Prado Centro Norte', 'Medio', 6.25700000, -75.56500000, 450),
(3, 'Alrededores Universidad de Antioquia (Noche)', 'Alto', 6.26290000, -75.56840000, 500),
(4, 'El Poblado - Zona Rosa (Frecuencia de Cosquilleo)', 'Medio', 6.20890000, -75.56780000, 400);

-- 4. Incidentes Reportados
INSERT INTO incidentes (id_incidente, id_usuario, tipo_incidente, descripcion, latitud, longitud, ubicacion, estado) VALUES
(1, 3, 'Hurtos de Celulares (Cosquilleo)', 'Robo de teléfono celular a transeúnte mientras esperaba transporte público.', 6.24530000, -75.56840000, 'Parque Berrio / Calle 50', 'aprobado'),
(2, 4, 'Robo a Mano Armada', 'Sujeto en motocicleta despojó de pertenencias a peatón.', 6.26290000, -75.56840000, 'Calle 67 con Cra 53 - UdeA', 'aprobado'),
(3, 3, 'Acoso Callejero', 'Reporte de intimidación verbal a grupo de personas en la noche.', 6.20890000, -75.56780000, 'Parque Lleras - El Poblado', 'aprobado');

-- 5. Publicación de Reportes Validados
INSERT INTO reportes (id_reporte, id_incidente, estado) VALUES
(1, 1, 'publicado'),
(2, 2, 'publicado'),
(3, 3, 'publicado');

-- 6. Contactos de Confianza
INSERT INTO contactos_confianza (id_contacto, id_usuario, nombre_contacto, telefono, relacion) VALUES
(1, 3, 'María Crespo', '3109876543', 'Familiar'),
(2, 3, 'Carlos Gómez', '3201234567', 'Amigo');

-- 7. Preferencias de Alertas
INSERT INTO preferencias_alertas (id_preferencia, id_usuario, tipo_alerta, estado) VALUES
(1, 3, 'Zonas de Alto Riesgo', 1),
(2, 3, 'Incidentes Recientes', 1),
(3, 4, 'Zonas de Alto Riesgo', 1);

-- 8. Moderaciones
INSERT INTO moderacion_reportes (id_moderacion, id_incidente, id_moderador, estado_revision, observaciones) VALUES
(1, 1, 2, 'aprobado', 'Verificado por reporte policial local.'),
(2, 2, 2, 'aprobado', 'Confirmado con coordenadas válidas.'),
(3, 3, 2, 'aprobado', 'Verificado por testimonio.');

-- 9. Estadísticas Semilla
INSERT INTO estadisticas (id_estadistica, tipo_reporte, resultado) VALUES
(1, 'Consolidado Mensual de Incidentes', '{"mes": "Julio 2026", "total_incidentes": 3, "tipo_mas_frecuente": "Hurtos de Celulares", "zona_mayor_riesgo": "Parque de las Luces"}');

-- ==============================================================================
-- FIN DEL SCRIPT SQL
-- ==============================================================================
