# MAGIK Producciones — Contexto del proyecto

## Qué es este proyecto
Prototipo web de gestión documental y presentación corporativa para MAGIK Producciones, empresa de Cali dedicada a producción técnica de eventos audiovisuales. Proyecto de grado — Juan José Gómez, Universidad Autónoma de Occidente, 2026.

## Stack
- Next.js 14 con App Router y TypeScript estricto (sin any)
- Firebase: Firestore, Authentication, Storage
- Tailwind CSS + shadcn/ui con Radix
- pdfmake para generación de PDFs en API Routes
- Vercel para deploy

## Estructura de carpetas
- app/(auth)/ → rutas públicas: login
- app/(dashboard)/ → rutas protegidas: admin + colaborador
- app/portal/ → portal público sin autenticación
- app/api/ → API Routes del servidor
- components/ui/ → shadcn/ui auto-generados (no modificar)
- components/magik/ → componentes propios del sistema
- lib/firebase.ts → cliente Firebase (singleton)
- lib/firebase-admin.ts → Admin SDK solo para servidor
- lib/firestore.ts → todos los helpers de Firestore
- lib/types.ts → todos los tipos del dominio

## Roles del sistema
- admin → acceso total, gestiona usuarios, plantillas, catálogo, portal
- collaborator → crea eventos, genera documentos, sube archivos

## Autenticación
- Firebase Authentication con email/password
- Roles implementados como custom claims en Firebase Auth
- Cookies: magik_token (JWT) y magik_role (rol del usuario)
- middleware.ts protege todas las rutas según rol

## Paleta de colores MAGIK (extraída del logo)
- Crimson principal: #D4004E (botones primarios, sidebar activo)
- Blue accent: #0090D9 (badge colaborador, estados info)
- Green accent: #6AA613 (badge cliente, éxito)
- Amber: #C97A1A (advertencias, borrador)
- Dark bg-base: #0E0E0F | bg-surface: #161618 | bg-elevated: #1E1E21
- Light bg-base: #F9F8F5 (off-white crema) | bg-surface: #FFFFFF
- Modo oscuro predeterminado (defaultTheme="dark")

## Tipografía
- Fuente: Inter (Google Fonts, variable --font-inter)
- Display/H1: 22px weight 500 | H2: 16px weight 500 | Body: 13px weight 400 | Secondary: 11px | Label uppercase: 10px weight 500

## Convenciones de código
- TypeScript estricto — cero uso de any
- Componentes en PascalCase, archivos en kebab-case
- Hooks custom en /hooks con prefijo use
- Tipos del dominio solo en lib/types.ts
- Queries Firestore solo en lib/firestore.ts, nunca en componentes
- Cada API Route valida el rol con Firebase Admin antes de operar
- Commits en inglés: feat: / fix: / chore:

## Estado actual del proyecto
- Sprint 0 completado: tipos, Firebase, middleware, Tailwind, globals.css, layout raiz
- Sprint 1 completado: login, JWT con custom claims, dos roles (admin/collaborator),
  guards de rutas, dashboard skeleton, sidebar con nav por rol, toggle tema,
  panel de gestion de usuarios completo, hydration fixes
- Sprint 2 completado: CRUD de eventos, consecutivo automatico EVT-0001,
  busqueda por cliente/año/tipo/lugar, detalle de evento con tab bar minimalista
- Sprint 3 completado: catalogo de rubros y productos, cotizaciones con PDF y XLSX,
  ordenes de servicio con PDF y XLSX, consecutivos automaticos COT y OS,
  duplicar cotizacion, sistema de plantillas con Firebase Storage y control de
  versiones, drag and drop para subir plantillas, fix rowSpan PDF, fix firma SVG,
  sharp para conversion SVG a PNG en pdfmake
- Sprint 4 completado: gestion de archivos por evento con Firebase Storage,
  categorias predefinidas y custom, renombrado de archivos, directorio de
  proveedores con autocompletado en ordenes, portal publico con landing page,
  slider de portafolio con autoplay, animaciones de scroll, panel admin de
  portafolio con selector de fotos desde archivos del evento
- Sprint actual: Sprint 5 — Directorio de clientes, pruebas y entrega final

## Documentos corporativos
- Cotización: desglose de servicios y precios por rubros para clientes
- Orden de servicio: solicitud de elementos a proveedores por rubros
- Rubros del catálogo: Audio, Iluminación, Tarimas, Carpas, Mobiliario, Video, Pantallas LED
- Tipos de evento: corporativo, entretenimiento, especial
- Consecutivo de eventos: EVT-0001, EVT-0002...

## Lo que NO hace este sistema
- Sin facturación ni contabilidad
- Sin nómina
- Sin integración con sistemas de terceros
- Storage de Firebase pendiente de configurar (requiere plan Blaze)

## Lecciones aprendidas
- Next.js App Router: los grupos (nombre) NO agregan segmento a la URL.
  app/(dashboard)/events/ resuelve a /events, no /dashboard/events.
  Para rutas bajo /dashboard/ usar app/dashboard/ sin paréntesis.
  El grupo (dashboard) solo se usa para aplicar el layout compartido.
- El rol client fue eliminado del sistema.
  El portal /portal es público sin login. Solo existen dos roles:
  admin y collaborator.
- El componente Input de shadcn/ui no usa forwardRef — usar Controller
  de react-hook-form en lugar de register() para todos los campos en
  dialogs y formularios complejos.
- Cookies httpOnly no son accesibles desde document.cookie en el cliente.
  magik_token es httpOnly true (seguridad), magik_role es httpOnly false
  (necesita ser leído por el cliente para la UI).
- Cualquier lógica que dependa de cookies del browser debe usar el patrón
  mounted (useState + useEffect) para evitar hydration mismatch entre
  servidor y cliente.
- Firestore no permite where() + orderBy() en campos diferentes sin índice
  compuesto. Solución: aplicar el orderBy en memoria con sort() cuando hay
  filtros activos.
- Nunca usar emojis en la UI, solo iconos de lucide-react.
- pdfmake no soporta SVG directamente — usar sharp para convertir SVG a PNG
  antes de pasar a pdfmake: sharp(svgBuffer).png().toBuffer()
- Firebase Storage requiere plan Blaze para funcionar. Las reglas deben
  permitir read/write a usuarios autenticados en match /{allPaths=**}
- ExcelJS para generacion de XLSX con estilos, proteccion de hojas e imagenes
- Firestore where() + orderBy() en campos distintos requiere indice compuesto.
  Solucion: filtrar en memoria despues del orderBy.
- NativeSelect con color-scheme: dark resuelve el problema de contraste del
  dropdown nativo en modo oscuro.

## Verificacion RNF-01 — Acciones frecuentes
- Crear evento: 2 clics (boton nuevo + guardar)
- Buscar evento: 1 clic (campo busqueda siempre visible)
- Ver detalle evento: 1 clic (fila de la tabla)
- Generar PDF: 3 clics (evento → tab → descargar)
- Crear cotizacion: 3 clics (evento → tab → nueva cotizacion)
RNF-01 cumplido: todas las acciones frecuentes en maximo 3 clics.
