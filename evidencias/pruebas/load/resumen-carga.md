# Resumen prueba de carga — RNF-05

Fecha de ejecución: 2026-10-05
Entorno: Firebase Emulator Suite (local)
Herramienta: autocannon

## Configuración
- Eventos en el emulador: 503
- Conexiones simultáneas: 10
- Duración por endpoint: 30 segundos

## Resultados

### GET /api/events (listado)
- Solicitudes por segundo: 247 req/s
- Latencia p99: 56 ms
- Errores: 0

### GET /api/events?search=... (búsqueda)
- Solicitudes por segundo: 266 req/s
- Latencia p99: 44 ms
- Errores: 0

## Observación
El emulador corre localmente sin latencia de red
real. Estos números sirven para comparar versiones
del código entre sí, no como medida del sistema
desplegado en Vercel con Firestore real.

## Criterio de aceptación (RNF-05)
El sistema debe funcionar correctamente con al menos
500 eventos registrados y 10 usuarios simultáneos
sin degradación visible del rendimiento.

Estado: CUMPLE — 503 eventos, 10 conexiones,
cero errores, latencia p99 menor a 60 ms en
ambos endpoints.
