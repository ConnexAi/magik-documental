# Pruebas — MAGIK Producciones

Suite de pruebas automatizadas del sistema: API (Vitest + supertest), documentos PDF/XLSX, reglas de Firebase, E2E (Playwright) y carga (autocannon). Todo corre contra el **Firebase Emulator local**. Nunca toca el proyecto de producción.

## Requisitos

| Herramienta | Versión | Nota |
|---|---|---|
| Node.js | 20 o superior | Probado con Node 24 |
| Java (JDK) | 17 o superior | Lo necesita el emulador de Firestore. Con Java 21+ se puede actualizar `firebase-tools` a la v15. |
| Firebase CLI | 14.x | Ya viene como dependencia de desarrollo (`firebase-tools`). No hace falta instalarla global; los scripts usan `npx firebase`. |

Instalación, una sola vez:

```bash
npm install
npx playwright install chromium
```

Si prefieres tener la CLI global: `npm install -g firebase-tools@14`.

## Cómo se aísla de producción

- El emulador corre con el proyecto `demo-magik` (`.firebaserc`). Firebase trata cualquier proyecto con prefijo `demo-` como local y nunca contacta recursos reales.
- El servidor de pruebas recibe por variables de entorno **todas** las claves de `.env.local` con valores de prueba, incluida una llave privada desechable generada en cada arranque. Next da prioridad a `process.env` sobre `.env.local`, así que las credenciales reales nunca se cargan.
- `tests/support/env.ts` aborta la ejecución si alguna variable no apunta al emulador.
- El servidor se compila en `.next-test/`, no en `.next/`, para no mezclarse con el build normal. La variable `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true` solo existe en ese build y conecta el SDK del navegador al emulador.

## Ejecutar

### 1. Encender el emulador (terminal 1)

```bash
npm run test:emulators
```

Levanta Auth (9099), Firestore (8080) y Storage (9199). Déjalo corriendo.

### 2. Ejecutar las pruebas (terminal 2)

```bash
npm run test          # API, documentos y reglas (Vitest)
npm run test:e2e      # E2E en Chromium (Playwright)
npm run test:load     # Carga: 500 eventos, 10 usuarios, 30 s por endpoint
npm run test:results  # Genera tests/RESULTADOS.md, .csv y PRUEBAS_MANUALES.md
```

Cada comando recarga la semilla, compila el servidor de pruebas y lo apaga al terminar. La compilación tarda alrededor de 1 minuto. Si no cambiaste código desde la última corrida, puedes omitirla:

```bash
TEST_SKIP_BUILD=1 npm run test
```

### Todo de una vez

```bash
npm run test:all
```

Usa `firebase emulators:exec`: enciende el emulador, corre API + E2E + resultados y lo apaga. La prueba de carga se corre aparte con `npm run test:load`, porque tarda más de un minuto.

### Solo cargar la semilla

```bash
npm run test:seed
```

Útil para explorar la app a mano contra el emulador.

## Datos semilla (`tests/emulator/seed.ts`)

| Dato | Valor |
|---|---|
| Admin | `test-admin@magikenter.com` / `Test1234!` |
| Colaborador | `test-colab@magikenter.com` / `Test1234!` |
| Eventos | EVT-0001 (Bancolombia, corporativo, 2026), EVT-0002 (Corfecali, entretenimiento, 2025), EVT-0003 (UAO, especial, 2026) |
| Cotización | COT-001-2026 en EVT-0001: 3 ítems en 2 rubros, descuento 180.000, IVA. Total 4.165.000 |
| Orden | OS-001-2026 en EVT-0001, proveedor Sonido Total SAS, anticipo y saldo |
| Catálogo | Rubros Audio (2 productos) e Iluminación (1 producto) |
| Proveedor / cliente | Sonido Total SAS / Bancolombia (vinculado a EVT-0001) |
| Plantilla | «Cotización estándar» con v1 en el historial |
| Portafolio | 1 item visible y 1 oculto |

## Estructura

```
tests/
  api/            Vitest + supertest: matriz de seguridad y un archivo por módulo
  documents/      PDF (pdf-parse) y XLSX (xlsx) generados por las API Routes
  rules/          firestore.rules y storage.rules con @firebase/rules-unit-testing
  e2e/            Playwright: login, eventos, cotizaciones, portal
  load/           autocannon (RNF-05)
  emulator/       semilla
  support/        entorno, emulador, servidor de pruebas, sesiones
  results/        catálogo de casos (HU/RF/RNF) y generador de resultados
  RESULTADOS.md / RESULTADOS.csv / PRUEBAS_MANUALES.md   (generados)
evidencias/pruebas/
  api/            salida de Vitest (txt, json, junit) y los PDF/XLSX verificados
  e2e/            capturas por paso (<ID>-<paso>.png), JSON y artefactos
  reporte-e2e/    reporte HTML de Playwright (abrir index.html)
  load/           resultados de autocannon (json, reporte-autocannon.md generado)
                  y resumen-carga.md (resumen para la tesis, se edita a mano)
  manual/         capturas de los casos manuales (MAN-xx.png)
```

## Agregar una prueba

1. Escribe la prueba con un ID al inicio del título: `it("API-EVT-14 · descripción", ...)`.
2. Agrega el ID con su HU, criterio, RF/RNF, pasos y resultado esperado en `tests/results/catalog.ts`.
3. Ejecuta las pruebas y `npm run test:results`. Si un ID se ejecuta sin estar en el catálogo, el generador lo reporta y termina con error.

## Requisitos RF/RNF

`tests/results/requisitos.ts` tiene un listado **provisional** de 11 RF y 6 RNF, derivado de las HU y de CLAUDE.md, porque el repositorio no tiene el oficial. Reemplaza los textos por los del documento de tesis y vuelve a generar los resultados.
