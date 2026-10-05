# Prueba de carga (RNF-05)

Fecha: 2026-10-05T18:12:40.581Z. 10 conexiones concurrentes, 30 s por endpoint, 503 eventos en Firestore Emulator.
Servidor: build de producción de Next (next start) en local. Criterio: 0 errores, 0 respuestas no 2xx, p99 < 1000 ms.

| Endpoint | Peticiones | Req/s | Errores | No 2xx | p50 (ms) | p90 (ms) | p99 (ms) | Máx (ms) | Resultado |
|---|---|---|---|---|---|---|---|---|---|
| GET /api/events | 7473 | 249 | 0 | 0 | 39 | 42 | 49 | 109 | Aprobado |
| GET /api/events?clientName=bancolombia&year=2025&place=cali | 7896 | 263 | 0 | 0 | 37 | 40 | 45 | 68 | Aprobado |

Limitación: el emulador de Firestore corre en un solo proceso Java local y no replica la latencia de red ni el escalado de Firestore en producción. Los números sirven para comparar versiones del código y detectar cuellos de botella del servidor, no como medida absoluta del sistema desplegado en Vercel.
