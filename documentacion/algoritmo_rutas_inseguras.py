#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
==============================================================================
ALGORITMO DE LÓGICA DEL NEGOCIO — PROYECTO RUTAS INSEGURAS
==============================================================================
Este script implementa el núcleo algorítmico del sistema "Rutas Inseguras":
 1. Gestión de usuarios y autenticación simulada.
 2. Cálculo de distancias geográficas (Fórmula de Haversine).
 3. Evaluación del nivel de riesgo según incidentes reportados y zonas de peligro.
 4. Factor multiplicador de tiempo según horas pico de tráfico.
 5. Cálculo y recomendación de Ruta Segura vs. Ruta Alternativa.
 6. Motor de alertas preventivas en tiempo real al aproximarse a zonas de riesgo.
 7. Monitoreo y compartición de ubicación con contactos de confianza.
==============================================================================
"""

import math
from datetime import datetime
from typing import List, Dict, Tuple, Optional

# ============================================================================
# DATOS Y ESTRUCTURAS PRINCIPALES
# ============================================================================

class ZonaRiesgo:
    def __init__(self, id_zona: int, nombre: str, nivel_riesgo: str, lat: float, lng: float, radio_m: float):
        self.id_zona = id_zona
        self.nombre = nombre
        self.nivel_riesgo = nivel_riesgo  # 'Bajo', 'Medio', 'Alto'
        self.lat = lat
        self.lng = lng
        self.radio_m = radio_m

class Incidente:
    def __init__(self, id_incidente: int, tipo: str, descripcion: str, lat: float, lng: float, estado: str = 'aprobado'):
        self.id_incidente = id_incidente
        self.tipo = tipo
        self.descripcion = descripcion
        self.lat = lat
        self.lng = lng
        self.estado = estado

class ContactoConfianza:
    def __init__(self, id_contacto: int, nombre: str, telefono: str, relacion: str):
        self.id_contacto = id_contacto
        self.nombre = nombre
        self.telefono = telefono
        self.relacion = relacion

class Usuario:
    def __init__(self, id_usuario: int, nombre: str, correo: str, rol: str):
        self.id_usuario = id_usuario
        self.nombre = nombre
        self.correo = correo
        self.rol = rol
        self.contactos: List[ContactoConfianza] = []

# ============================================================================
# FUNCIONES MATEMÁTICAS Y GEOGRÁFICAS (HAVERSINE)
# ============================================================================

def calcular_distancia_haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calcula la distancia ortodrómica en kilómetros entre dos coordenadas GPS (Haversine).
    """
    R = 6371.0  # Radio de la Tierra en km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    
    a = (math.sin(dlat / 2.0) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * (math.sin(dlon / 2.0) ** 2))
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c

# ============================================================================
# MÓDULO 1: EVALUACIÓN DE TRÁFICO SEGÚN HORA DEL DÍA
# ============================================================================

def obtener_multiplicador_trafico(hora: int, es_dia_laboral: bool = True) -> float:
    """
    Regla del Negocio (RN-04): Determina la densidad del tráfico según el horario.
    Horas Pico (7-9am, 12-1pm, 5-7pm): Tráfico Alto (+50% tiempo).
    """
    horas_pico = [7, 8, 12, 17, 18]
    if es_dia_laboral and hora in horas_pico:
        return 1.5  # 50% más lento
    elif es_dia_laboral and ((6 <= hora <= 10) or (11 <= hora <= 13) or (16 <= hora <= 20)):
        return 1.3  # 30% más lento
    elif hora >= 21 or hora <= 5:
        return 0.9  # 10% más rápido de noche (pero mayor riesgo)
    return 1.0  # Tráfico normal

# ============================================================================
# MÓDULO 2: EVALUACIÓN DE SEGURIDAD Y NIVEL DE RIESGO
# ============================================================================

def evaluar_riesgo_punto(lat: float, lng: float, incidentes: List[Incidente], zonas: List[ZonaRiesgo]) -> Tuple[float, List[str]]:
    """
    Analiza la peligrosidad de un punto individual analizando proximidad a incidentes y zonas de riesgo.
    """
    puntaje_riesgo = 0.0
    detalles_amenazas = []
    
    # 1. Evaluar proximidad a incidentes reportados (radio de 500 metros)
    for inc in incidentes:
        if inc.estado != 'aprobado':
            continue
        dist_km = calcular_distancia_haversine(lat, lng, inc.lat, inc.lng)
        if dist_km <= 0.5:  # 500m
            puntaje_riesgo += 2.5
            detalles_amenazas.append(f"Incidente cercano ({inc.tipo}): {dist_km*1000:.0f}m")
            
    # 2. Evaluar inclusión o cercanía a Zonas de Riesgo clasificadas
    for zona in zonas:
        dist_km = calcular_distancia_haversine(lat, lng, zona.lat, zona.lng)
        radio_km = zona.radio_m / 1000.0
        if dist_km <= radio_km:
            if zona.nivel_riesgo == 'Alto':
                puntaje_riesgo += 4.0
            elif zona.nivel_riesgo == 'Medio':
                puntaje_riesgo += 2.0
            detalles_amenazas.append(f"Dentro de Zona {zona.nivel_riesgo} Riesgo: {zona.nombre}")
            
    return puntaje_riesgo, detalles_amenazas

def analizar_seguridad_trayecto(coordenadas: List[Tuple[float, float]], incidentes: List[Incidente], zonas: List[ZonaRiesgo]) -> Dict:
    """
    Evalúa el trayecto completo calculando el promedio de riesgo y nivel global.
    """
    suma_riesgo = 0.0
    amenazas_totales = []
    
    for lat, lng in coordenadas:
        riesgo_punto, amenazas = evaluar_riesgo_punto(lat, lng, incidentes, zonas)
        suma_riesgo += riesgo_punto
        amenazas_totales.extend(amenazas)
        
    promedio_riesgo = suma_riesgo / max(len(coordenadas), 1)
    
    # Clasificación formal de la ruta (RF-04 / RF-06)
    if promedio_riesgo >= 5.0:
        nivel_global = 'Alto'
    elif promedio_riesgo >= 2.5:
        nivel_global = 'Medio'
    else:
        nivel_global = 'Bajo'
        
    return {
        'puntaje_promedio': round(promedio_riesgo, 2),
        'nivel_global': nivel_global,
        'amenazas_detectadas': list(set(amenazas_totales))
    }

# ============================================================================
# MÓDULO 3: MOTOR DE CÁLCULO Y RECOMENDACIÓN DE RUTAS
# ============================================================================

def calcular_ruta_optima(origen_coords: Tuple[float, float], 
                        destino_coords: Tuple[float, float],
                        incidentes: List[Incidente],
                        zonas: List[ZonaRiesgo],
                        hora_actual: int) -> Dict:
    """
    RF-04 & RF-05: Calcula Ruta Directa vs. Ruta Alternativa Desviada de Peligros.
    Prioriza la seguridad sobre el tiempo de trayecto (RN-05).
    """
    lat1, lon1 = origen_coords
    lat2, lon2 = destino_coords
    
    distancia_lineal = calcular_distancia_haversine(lat1, lon1, lat2, lon2)
    # Factor de tortuosidad urbana estimado para Medellín (~1.35)
    distancia_real_km = distancia_lineal * 1.35
    tiempo_base_min = (distancia_real_km / 30.0) * 60.0  # Velocidad promedio 30 km/h
    
    multiplicador_tr = obtener_multiplicador_trafico(hora_actual)
    tiempo_final_min = round(tiempo_base_min * multiplicador_tr)
    
    # Generar waypoints para la Ruta Principal (Directa)
    ruta_principal_coords = [
        (lat1, lon1),
        (lat1 + (lat2 - lat1)*0.33, lon1 + (lon2 - lon1)*0.33),
        (lat1 + (lat2 - lat1)*0.66, lon1 + (lon2 - lon1)*0.66),
        (lat2, lon2)
    ]
    
    # Generar waypoints para la Ruta Alternativa (Desviada ligeramente para evadir centros de riesgo)
    desvio_lat = 0.008
    desvio_lon = -0.006
    ruta_alt_coords = [
        (lat1, lon1),
        (lat1 + (lat2 - lat1)*0.33 + desvio_lat, lon1 + (lon2 - lon1)*0.33 + desvio_lon),
        (lat1 + (lat2 - lat1)*0.66 + desvio_lat, lon1 + (lon2 - lon1)*0.66 + desvio_lon),
        (lat2, lon2)
    ]
    
    eval_principal = analizar_seguridad_trayecto(ruta_principal_coords, incidentes, zonas)
    eval_alt = analizar_seguridad_trayecto(ruta_alt_coords, incidentes, zonas)
    
    # Criterio de recomendación (RN-05: Seguridad sobre Rapidez)
    if eval_principal['nivel_global'] == 'Alto' and eval_alt['nivel_global'] != 'Alto':
        recomendacion = "Ruta Alternativa Recomendada"
        razon = "La ruta directa cruza zonas de alto riesgo reportado. Se sugiere la alternativa para mayor seguridad."
        es_alt_mejor = True
    else:
        recomendacion = "Ruta Directa Recomendada"
        razon = "La ruta directa presenta condiciones aceptables de seguridad y menor tiempo."
        es_alt_mejor = False
        
    return {
        'origen': origen_coords,
        'destino': destino_coords,
        'distancia_km': round(distancia_real_km, 2),
        'tiempo_estimado_min': tiempo_final_min,
        'factor_trafico': multiplicador_tr,
        'ruta_principal': {
            'nivel_riesgo': eval_principal['nivel_global'],
            'puntaje': eval_principal['puntaje_promedio'],
            'amenazas': eval_principal['amenazas_detectadas']
        },
        'ruta_alternativa': {
            'distancia_km': round(distancia_real_km * 1.08, 2),
            'tiempo_estimado_min': round(tiempo_final_min * 1.1),
            'nivel_riesgo': eval_alt['nivel_global'],
            'puntaje': eval_alt['puntaje_promedio'],
            'amenazas': eval_alt['amenazas_detectadas']
        },
        'recomendacion_final': recomendacion,
        'justificacion': razon
    }

# ============================================================================
# MÓDULO 4: MOTOR DE ALERTAS EN TIEMPO REAL Y MONITOREO (RF-10 / RF-13)
# ============================================================================

def verificar_alerta_aproximacion(lat_actual: float, lng_actual: float, zonas: List[ZonaRiesgo]) -> Optional[Dict]:
    """
    RF-10 & RN-10: Genera alertas preventivas automáticas cuando el usuario se aproxima a zonas de alto riesgo.
    """
    for zona in zonas:
        if zona.nivel_riesgo == 'Alto':
            dist_km = calcular_distancia_haversine(lat_actual, lng_actual, zona.lat, zona.lng)
            dist_m = dist_km * 1000.0
            # Alerta si está a menos de 300m del límite de la zona
            if dist_m <= (zona.radio_m + 300):
                return {
                    'alerta_activada': True,
                    'tipo_alerta': 'Aproximación a Zona de Alto Riesgo',
                    'zona': zona.nombre,
                    'distancia_metros': round(dist_m),
                    'mensaje': f"⚠️ ALERTA PREVENTIVA: Se está aproximando al sector {zona.nombre} (Peligro Alto). Tome precauciones."
                }
    return None

def compartir_ubicacion_emergencia(usuario: Usuario, lat: float, lng: float) -> Dict:
    """
    RF-12 & RF-13: Comparte la ubicación en tiempo real con los contactos de confianza registrados.
    """
    if not usuario.contactos:
        return {'exito': False, 'mensaje': 'El usuario no tiene contactos de confianza configurados.'}
    
    notificaciones_enviadas = []
    for c in usuario.contactos:
        notificaciones_enviadas.append({
            'contacto': c.nombre,
            'telefono': c.telefono,
            'relacion': c.relacion,
            'enviado': True,
            'mensaje': f"🆘 SOS/Tracking: {usuario.nombre} compartió su posición actual (Lat: {lat}, Lng: {lng})."
        })
        
    return {
        'exito': True,
        'usuario': usuario.nombre,
        'fecha_inicio': datetime.now().isoformat(),
        'contactos_notificados': notificaciones_enviadas
    }

# ============================================================================
# DEMOSTRACIÓN DEL ALGORITMO Y PRUEBA DE EJECUCIÓN
# ============================================================================

if __name__ == '__main__':
    print("=" * 80)
    print("   EJECUCIÓN DEL ALGORITMO DE LÓGICA DEL NEGOCIO — RUTAS INSEGURAS")
    print("=" * 80)
    
    # 1. Cargar Datos Semilla de Prueba (Medellín)
    zonas_prueba = [
        ZonaRiesgo(1, "Parque de las Luces / San Antonio", "Alto", 6.2453, -75.5684, 500),
        ZonaRiesgo(2, "Prado Centro Norte", "Medio", 6.2570, -75.5650, 400),
        ZonaRiesgo(3, "Alrededores UdeA (Sector Noche)", "Alto", 6.2629, -75.5684, 500),
        ZonaRiesgo(4, "Parque Lleras", "Medio", 6.2089, -75.5678, 350)
    ]
    
    incidentes_prueba = [
        Incidente(101, "Hurto Celular", "Cosquilleo en estación de metro", 6.2453, -75.5684, 'aprobado'),
        Incidente(102, "Atraco con Arma", "Asalto en acera lateral", 6.2629, -75.5684, 'aprobado')
    ]
    
    # Crear usuario de ejemplo
    usr = Usuario(1, "Jean Crespo", "jean@ejemplo.com", "Usuario Ciudadano")
    usr.contactos.append(ContactoConfianza(1, "María Crespo", "3109876543", "Familiar"))
    usr.contactos.append(ContactoConfianza(2, "Carlos Gómez", "3201234567", "Amigo"))
    
    # 2. Probar Cálculo de Ruta (De UdeA a Parque de las Luces en Hora Pico 18:00 hrs)
    origen_udea = (6.2629, -75.5684)
    destino_luces = (6.2453, -75.5684)
    hora_simulada = 18  # 6:00 PM (Hora pico)
    
    print("\n>>> 1. SOLICITUD DE CÁLCULO DE RUTA SEGURA")
    print(f"Origen: Universidad de Antioquia {origen_udea}")
    print(f"Destino: Parque de las Luces {destino_luces}")
    print(f"Hora de consulta: {hora_simulada}:00 hrs (Hora Pico)")
    
    resultado_ruta = calcular_ruta_optima(origen_udea, destino_luces, incidentes_prueba, zonas_prueba, hora_simulada)
    
    print("\n--- RESULTADO DEL ANÁLISIS ALGORTÍMICO ---")
    print(f"Distancia Estimada: {resultado_ruta['distancia_km']} km")
    print(f"Tiempo de Viaje (con Tráfico): {resultado_ruta['tiempo_estimado_min']} minutos")
    print(f"Nivel de Riesgo Ruta Directa: {resultado_ruta['ruta_principal']['nivel_riesgo']} (Puntaje: {resultado_ruta['ruta_principal']['puntaje']})")
    print(f"Amenazas Detectadas en Ruta Directa: {resultado_ruta['ruta_principal']['amenazas']}")
    print(f"\nNivel de Riesgo Ruta Alternativa: {resultado_ruta['ruta_alternativa']['nivel_riesgo']} (Puntaje: {resultado_ruta['ruta_alternativa']['puntaje']})")
    print(f"DECISIÓN DEL SISTEMA: {resultado_ruta['recomendacion_final']}")
    print(f"JUSTIFICACIÓN: {resultado_ruta['justificacion']}")
    
    # 3. Probar Alerta de Aproximación
    posicion_actual_usuario = (6.2460, -75.5680)  # Cerca al Parque de las Luces
    print("\n>>> 2. VERIFICACIÓN DE ALERTA EN TIEMPO REAL (GPS)")
    print(f"Posición GPS Usuario: {posicion_actual_usuario}")
    alerta = verificar_alerta_aproximacion(posicion_actual_usuario[0], posicion_actual_usuario[1], zonas_prueba)
    if alerta:
        print(f"STATUS: {alerta['mensaje']}")
    else:
        print("STATUS: Zona segura. No se requieren alertas.")
        
    # 4. Probar Compartir Ubicación SOS
    print("\n>>> 3. TRANSMISIÓN DE UBICACIÓN A CONTACTOS DE CONFIANZA")
    resultado_sos = compartir_ubicacion_emergencia(usr, posicion_actual_usuario[0], posicion_actual_usuario[1])
    print(f"Estado Transmisión: {resultado_sos['exito']}")
    for n in resultado_sos['contactos_notificados']:
        print(f" -> Enviado a {n['contacto']} ({n['telefono']}): {n['mensaje']}")
        
    print("\n" + "=" * 80)
    print("   FIN DE LA EJECUCIÓN Algorítmica")
    print("=" * 80)
