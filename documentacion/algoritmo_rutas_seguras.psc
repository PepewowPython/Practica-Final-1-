Algoritmo RutasSegurasYAlertas
	// =========================================================================
	// SISTEMA RUTAS INSEGURAS - DEMOSTRACIÓN DE LÓGICA EN PSEINT
	// Basado en el Diccionario de Base de Datos y la Matriz de Requerimientos:
	// - RF-04: Cálculo de Rutas Seguras (Tabla 'rutas' y 'alternativas_ruta')
	// - RF-06: Zonas de Riesgo (Tabla 'zonas_riesgo')
	// - RF-10: Alertas Preventivas (Tabla 'alertas')
	// - RF-12/13: Contactos de Confianza (Tabla 'contactos_confianza')
	// =========================================================================
	
	// DEFINICIÓN DE VARIABLES
	Definir latOrigen, lonOrigen, latDestino, lonDestino Como Real;
	Definir horaConsulta, opcionMenu Como Entero;
	Definir distanciaDirecta, tiempoEstimado, factorTrafico Como Real;
	Definir puntajeRiesgoDirecta, puntajeRiesgoAlt Como Real;
	Definir nivelRiesgoDirecta, nivelRiesgoAlt Como Cadena;
	Definir latZona1, lonZona1, latZona2, lonZona2, latZona3, lonZona3 Como Real;
	Definir distAZona1, distAZona2, distAZona3 Como Real;
	Definir nombreContacto, telefonoContacto Como Cadena;
	Definir usuarioRegistrado Como Cadena;
	
	usuarioRegistrado <- "Jean Crespo";
	
	// 1. CARGA DE ZONAS DE RIESGO DE REFERENCIA (TABLA zonas_riesgo)
	// Zona 1: Parque de las Luces (Alto Riesgo)
	latZona1 <- 6.2453; lonZona1 <- -75.5684;
	// Zona 2: Prado Centro (Medio Riesgo)
	latZona2 <- 6.2570; lonZona2 <- -75.5650;
	// Zona 3: UdeA Sector Noche (Alto Riesgo)
	latZona3 <- 6.2629; lonZona3 <- -75.5684;
	
	Escribir "=================================================================";
	Escribir "   SISTEMA DE LÓGICA Y NAVEGACIÓN SEGURA - RUTAS INSEGURAS (PSEINT)";
	Escribir "=================================================================";
	Escribir "Bienvenido, ", usuarioRegistrado;
	Escribir "";
	
	Repetir
		Escribir "MENÚ PRINCIPAL DE OPERACIONES:";
		Escribir "1. Calcular Ruta Segura y Evaluar Riesgo (RF-04 / RF-05)";
		Escribir "2. Simular Verificación GPS de Alertas Preventivas (RF-10)";
		Escribir "3. Simular Envío de Ubicación SOS a Contacto de Confianza (RF-13)";
		Escribir "4. Salir";
		Escribir "Seleccione una opción (1-4): ";
		Leer opcionMenu;
		
		Segun opcionMenu Hacer
			1:
				Escribir "";
				Escribir "--- MÓDULO 1: CÁLCULO DE RUTA Y EVALUACIÓN DE RIESGO ---";
				Escribir "Ingrese Latitud Origen (ej: 6.2629 UdeA): ";
				Leer latOrigen;
				Escribir "Ingrese Longitud Origen (ej: -75.5684): ";
				Leer lonOrigen;
				Escribir "Ingrese Latitud Destino (ej: 6.2453 Parque Luces): ";
				Leer latDestino;
				Escribir "Ingrese Longitud Destino (ej: -75.5684): ";
				Leer lonDestino;
				Escribir "Ingrese Hora Actual del Día (0 - 23): ";
				Leer horaConsulta;
				
				// Cálculo aproximado de distancia euclidiana escalada a km
				distanciaDirecta <- abs(latDestino - latOrigen) * 111.0 + abs(lonDestino - lonOrigen) * 111.0;
				Si distanciaDirecta < 0.5 Entonces
					distanciaDirecta <- 0.5;
				FinSi
				
				// Evaluación de Tráfico por Horario (RN-04)
				Si (horaConsulta >= 7 Y horaConsulta <= 9) O (horaConsulta >= 12 Y horaConsulta <= 13) O (horaConsulta >= 17 Y horaConsulta <= 19) Entonces
					factorTrafico <- 1.5; // Hora pico (+50% tiempo)
					Escribir "[INFO TRÁFICO]: Estado ALTO (Hora Pico). Factor 1.5x";
				Sino
					Si horaConsulta >= 21 O horaConsulta <= 5 Entonces
						factorTrafico <- 0.9; // Tráfico fluido de noche
						Escribir "[INFO TRÁFICO]: Estado FLUIDO (Horario Nocturno). Factor 0.9x";
					Sino
						factorTrafico <- 1.0; // Tráfico Normal
						Escribir "[INFO TRÁFICO]: Estado NORMAL. Factor 1.0x";
					FinSi
				FinSi
				
				tiempoEstimado <- (distanciaDirecta / 30.0) * 60.0 * factorTrafico;
				
				// Evaluación de Proximidad a Zonas de Riesgo
				distAZona1 <- abs(latOrigen - latZona1) * 111.0 + abs(lonOrigen - lonZona1) * 111.0;
				distAZona3 <- abs(latOrigen - latZona3) * 111.0 + abs(lonOrigen - lonZona3) * 111.0;
				
				puntajeRiesgoDirecta <- 0.0;
				Si distAZona1 <= 0.6 Entonces
					puntajeRiesgoDirecta <- puntajeRiesgoDirecta + 4.0;
				FinSi
				Si distAZona3 <= 0.6 Entonces
					puntajeRiesgoDirecta <- puntajeRiesgoDirecta + 4.0;
				FinSi
				
				// Determinar Clasificación de Riesgo
				Si puntajeRiesgoDirecta >= 4.0 Entonces
					nivelRiesgoDirecta <- "Alto";
				Sino
					Si puntajeRiesgoDirecta >= 2.0 Entonces
						nivelRiesgoDirecta <- "Medio";
					Sino
						nivelRiesgoDirecta <- "Bajo";
					FinSi
				FinSi
				
				Escribir "";
				Escribir "=== RESULTADO DE NAVEGACIÓN RECOMENDADA ===";
				Escribir "Distancia Calculada: ", distanciaDirecta, " km";
				Escribir "Tiempo Estimado: ", Redondear(tiempoEstimado), " minutos";
				Escribir "Nivel de Riesgo Ruta Directa: ", nivelRiesgoDirecta;
				
				Si nivelRiesgoDirecta = "Alto" Entonces
					Escribir "⚠️ RECOMENDACIÓN: Se sugiere activar la RUTA ALTERNATIVA por desviarse de zonas peligrosas.";
				Sino
					Escribir "✅ RECOMENDACIÓN: Ruta Directa segura y óptima para el usuario.";
				FinSi
				Escribir "";
				
			2:
				Escribir "";
				Escribir "--- MÓDULO 2: VERIFICACIÓN GPS DE ALERTAS PREVENTIVAS (RF-10) ---";
				Escribir "Ingrese su Latitud GPS actual: ";
				Leer latOrigen;
				Escribir "Ingrese su Longitud GPS actual: ";
				Leer lonOrigen;
				
				distAZona1 <- (abs(latOrigen - latZona1) + abs(lonOrigen - lonZona1)) * 111.0;
				
				Escribir "Distancia a Zona de Alto Riesgo (Parque de las Luces): ", Redondear(distAZona1 * 1000), " metros.";
				
				Si distAZona1 <= 0.5 Entonces
					Escribir "🚨 ¡ALERTA AUTOMÁTICA EMITIDA!";
					Escribir "Mensaje: 'Se encuentra a menos de 500m de la Zona de Alto Riesgo (Parque de las Luces). Mantenga precaución.'";
				Sino
					Escribir "🟢 Zona Segura. No se detectan peligros inmediatos dentro del radio de alerta.";
				FinSi
				Escribir "";
				
			3:
				Escribir "";
				Escribir "--- MÓDULO 3: ENVÍO DE UBICACIÓN SOS A CONTACTO DE CONFIANZA (RF-12 / RF-13) ---";
				Escribir "Ingrese Nombre del Contacto de Confianza: ";
				Leer nombreContacto;
				Escribir "Ingrese Teléfono Celular del Contacto: ";
				Leer telefonoContacto;
				
				Escribir "";
				Escribir "📡 Transmitiendo ubicación en tiempo real...";
				Escribir "Mensaje SOS enviado exitosamente a: ", nombreContacto, " (", telefonoContacto, ")";
				Escribir "Contenido: 'SOS RUTAS INSEGURAS - ", usuarioRegistrado, " está compartiendo su posición GPS en tiempo real.'";
				Escribir "";
				
			4:
				Escribir "Saliendo del sistema Rutas Inseguras. ¡Buen viaje y manténgase seguro!";
				
			De Otro Modo:
				Escribir "Opción no válida. Intente nuevamente.";
		FinSegun
		
	Hasta Que opcionMenu = 4
FinAlgoritmo
