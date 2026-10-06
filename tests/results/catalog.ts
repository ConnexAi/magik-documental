// Metadatos de cada caso de prueba (trazabilidad HU / RF / RNF). Los IDs
// coinciden con el prefijo del título de cada prueba; build-results.ts cruza
// este catálogo con los reportes de Vitest, Playwright y autocannon.
import { MATRIX, type MatrixRow } from "../api/security-matrix";

export interface CaseMeta {
  id: string;
  tipo: string;
  hu: string[];
  criterio: string;
  req: string[];
  flujo: string;
  pasos: string;
  esperado: string;
  evidencia: string;
}

export interface ManualCase {
  id: string;
  hu: string[];
  req: string[];
  titulo: string;
  precondiciones: string;
  pasos: string[];
  esperado: string;
  captura: string;
}

const API_LOG = "evidencias/pruebas/api/vitest-output.txt";
const e2e = (id: string, steps: string[]) => steps.map((s) => `evidencias/pruebas/e2e/${id}-${s}.png`).join("; ");

// ── Matriz de seguridad (generada) ──────────────────────────────────────────
function secCases(): CaseMeta[] {
  const out: CaseMeta[] = [];
  MATRIX.forEach((row: MatrixRow, i: number) => {
    const n = String(i + 1).padStart(2, "0");
    const route = `${row.method.toUpperCase()} ${row.path}`;
    const req = Array.from(new Set([row.rf, "RF-07", "RNF-06"]));
    const base = { tipo: "API seguridad", hu: [row.hu], req, flujo: route, evidencia: API_LOG };
    const publico = row.level === "public";
    out.push({
      ...base, id: `SEC-${n}-1`,
      criterio: !publico
        ? "Ruta protegida rechaza peticiones sin sesión"
        : row.anonStatus === 401
          ? "Ruta pública que valida el idToken del cuerpo: rechaza uno inválido"
          : "Ruta pública accesible sin sesión",
      pasos: `Enviar ${route} sin cookies`,
      esperado: publico ? `HTTP ${row.anonStatus}` : 'HTTP 401 {"error":"no_session"}',
    });
    out.push({
      ...base, id: `SEC-${n}-2`,
      criterio: "La cookie magik_role falsificada no autoriza",
      pasos: `Enviar ${route} solo con Cookie: magik_role=admin (sin magik_token)`,
      esperado: publico ? `HTTP ${row.anonStatus} (mismo trato que sin sesión)` : "HTTP 401",
    });
    if (row.level === "admin") {
      out.push({
        ...base, id: `SEC-${n}-3`,
        criterio: "Colaborador con token válido no accede a operaciones de admin",
        pasos: `Enviar ${route} con el token del colaborador`,
        esperado: 'HTTP 403 {"error":"forbidden"}',
      });
    } else if (row.level === "session") {
      out.push({
        ...base, id: `SEC-${n}-3`,
        criterio: "Colaborador con token válido accede a operaciones de cualquier rol",
        pasos: `Enviar ${route} con el token del colaborador`,
        esperado: "HTTP 2xx",
      });
    }
    out.push({
      ...base, id: `SEC-${n}-4`,
      criterio: "Admin con token válido opera normalmente",
      pasos: `Enviar ${route} con el token del admin`,
      esperado: `HTTP ${row.adminStatus}`,
    });
  });
  return out;
}

const api = (
  id: string, hu: string[], req: string[], flujo: string, criterio: string, pasos: string, esperado: string
): CaseMeta => ({ id, tipo: "API", hu, req, flujo, criterio, pasos, esperado, evidencia: API_LOG });

export const CASES: CaseMeta[] = [
  ...secCases(),
  api("SEC-X1", ["HU-09"], ["RF-07", "RNF-06"], "POST /api/auth/set-role", "Cambiar rol exige token de admin", "Enviar set-role con Cookie: magik_role=admin", "HTTP 401"),
  api("SEC-X2", ["HU-09"], ["RF-07", "RNF-06"], "POST /api/auth/set-role", "Un token inventado no autoriza", "Enviar set-role con magik_token inventado y magik_role=admin", 'HTTP 401 {"error":"invalid_session"}'),
  api("SEC-X3", ["HU-01"], ["RF-01", "RF-07", "RNF-06"], "DELETE /api/events/[id]", "Eliminar evento exige sesión", "Enviar DELETE sin cookies", "HTTP 401"),
  api("SEC-X4", ["HU-08"], ["RF-05", "RF-07", "RNF-06"], "DELETE /api/catalog/rubros/[id]", "Colaborador no elimina rubros", "Enviar DELETE con token del colaborador", "HTTP 403"),
  api("SEC-X5", ["HU-15"], ["RF-09"], "GET /api/portfolio", "El portafolio público no exige sesión", "Enviar GET sin cookies", "HTTP 200"),
  api("SEC-X6", ["HU-09"], ["RF-07", "RNF-06"], "GET /dashboard/admin/users", "Las páginas del panel verifican el token, no solo la cookie", "Pedir la página con magik_token inventado y magik_role=admin", "Redirección a /login sin datos de usuarios en el HTML"),

  api("API-EVT-01", ["HU-01"], ["RF-01"], "Crear evento", "Consecutivo automático EVT-0001", "POST /api/events con datos válidos", "HTTP 201 y consecutivo = contador + 1 (EVT-000X)"),
  api("API-EVT-02", ["HU-01"], ["RF-01"], "Crear evento", "El evento aparece en el listado", "GET /api/events tras crear", "El listado incluye el evento creado"),
  api("API-EVT-03", ["HU-01"], ["RF-01"], "Crear evento", "Consecutivo único", "5 POST /api/events simultáneos", "5 consecutivos distintos"),
  api("API-EVT-04", ["HU-10"], ["RF-02"], "Buscar eventos", "Búsqueda por cliente", "GET /api/events?clientName=bancolombia", "Solo eventos cuyo cliente contiene «bancolombia»"),
  api("API-EVT-05", ["HU-10"], ["RF-02"], "Buscar eventos", "Búsqueda por año", "GET /api/events?year=2025", "Solo eventos con fecha en 2025"),
  api("API-EVT-06", ["HU-10"], ["RF-02"], "Buscar eventos", "Búsqueda por tipo", "GET /api/events?eventType=especial", "Solo eventos de tipo especial"),
  api("API-EVT-07", ["HU-10"], ["RF-02"], "Buscar eventos", "Búsqueda por lugar", "GET /api/events?place=pascual", "Solo EVT-0002"),
  api("API-EVT-08", ["HU-10"], ["RF-02"], "Buscar eventos", "Filtros combinados", "GET con cliente+año+tipo+lugar", "Solo EVT-0001"),
  api("API-EVT-14", ["HU-10"], ["RF-02"], "Buscar eventos", "Búsqueda por consecutivo", "GET /api/events?consecutive=EVT-0002", "Solo EVT-0002"),
  api("API-EVT-15", ["HU-10"], ["RF-02"], "Buscar eventos", "Consecutivo parcial y sin distinguir mayúsculas", "GET ?consecutive=evt-0003 y ?consecutive=EVT-9999", "Solo EVT-0003; lista vacía si no existe"),
  api("API-EVT-09", ["HU-10"], ["RF-02"], "Buscar eventos", "Respuesta en menos de 1 segundo", "Medir GET /api/events con filtros", "< 1000 ms"),
  api("API-EVT-10", ["HU-01"], ["RF-01"], "Crear evento", "Campos obligatorios validados", "POST /api/events sin cliente, tipo, lugar ni fecha", "HTTP 400 con los campos faltantes"),
  api("API-EVT-11", ["HU-02"], ["RF-01"], "Ver evento", "ID inexistente", "GET /api/events/no-existe-123", "HTTP 404"),
  api("API-EVT-12", ["HU-01"], ["RF-01", "RF-07", "RNF-06"], "Eliminar evento", "Colaborador no elimina eventos", "DELETE como colaborador", "HTTP 403 y el evento sigue existiendo"),
  api("API-EVT-13", ["HU-01"], ["RF-01"], "Eliminar evento", "Admin elimina eventos", "DELETE como admin", "HTTP 200 y luego 404"),

  api("API-COT-01", ["HU-03"], ["RF-06"], "Crear cotización", "Consecutivo COT-000-AAAA", "POST /api/events/evt-0001/quotes", "HTTP 201 y COT-<contador+1>-<año>"),
  api("API-COT-02", ["HU-03"], ["RF-06"], "Crear cotización", "Subtotal, descuento, IVA y total", "Ítems 3.680.000, descuento 180.000, IVA", "subtotal 3.680.000; total 4.165.000"),
  api("API-COT-03", ["HU-03"], ["RF-06"], "Crear cotización", "El servidor recalcula los totales", "POST con subtotal=1 y total=1", "subtotal y total recalculados (3.680.000)"),
  api("API-COT-04", ["HU-03"], ["RF-06"], "Editar cotización", "Editar descuento recalcula total", "PATCH discount=680.000", "total 3.570.000"),
  api("API-COT-05", ["HU-11"], ["RF-02"], "Duplicar cotización", "Conserva ítems y condiciones, nuevo consecutivo", "POST .../duplicate sobre COT-001-2026", "Mismos ítems, descuento, IVA, forma de pago y total; consecutivo siguiente"),
  api("API-COT-06", ["HU-03"], ["RF-06", "RF-07"], "Eliminar cotización", "Colaborador no elimina", "DELETE como colaborador", "HTTP 403"),
  api("API-COT-07", ["HU-03"], ["RF-06"], "Eliminar cotización", "Admin elimina", "DELETE como admin", "HTTP 200"),

  api("API-OS-01", ["HU-16"], ["RF-10"], "Crear orden", "Autocompletado llena razón social, contacto, correo y celular", "GET /api/providers y mapear con providerToOrderFields", "Todos los campos del proveedor llenos"),
  api("API-OS-02", ["HU-04"], ["RF-06", "RF-10"], "Crear orden", "Consecutivo OS-000-AAAA con proveedor, fechas y pago", "POST /api/events/evt-0001/orders", "HTTP 201, OS-<n>-<año> y datos guardados"),
  api("API-OS-03", ["HU-04"], ["RF-06", "RF-07"], "Eliminar orden", "Colaborador no elimina", "DELETE como colaborador", "HTTP 403"),
  api("API-OS-04", ["HU-04"], ["RF-06"], "Eliminar orden", "Admin elimina", "DELETE como admin", "HTTP 200"),

  api("API-CAT-01", ["HU-07"], ["RF-05"], "Catálogo", "Admin crea rubro disponible en autocompletado", "POST rubro como admin; GET /api/catalog como colaborador", "El rubro aparece"),
  api("API-CAT-02", ["HU-08"], ["RF-05"], "Catálogo", "Colaborador crea rubro", "POST rubro como colaborador", "HTTP 201"),
  api("API-CAT-03", ["HU-08"], ["RF-05"], "Catálogo", "Producto del colaborador disponible para todos", "POST producto como colaborador; GET como admin", "El producto aparece"),
  api("API-CAT-04", ["HU-07"], ["RF-05"], "Catálogo", "Admin edita producto y se refleja de inmediato", "PATCH precio; GET catálogo", "Precio actualizado"),
  api("API-CAT-05", ["HU-07"], ["RF-05"], "Catálogo", "Admin edita rubro y se refleja de inmediato", "PATCH nombre; GET catálogo", "Nombre actualizado"),
  api("API-CAT-06", ["HU-08"], ["RF-05", "RF-07"], "Catálogo", "Colaborador no elimina rubros", "DELETE rubro como colaborador", "HTTP 403 y el rubro sigue"),
  api("API-CAT-07", ["HU-08"], ["RF-05", "RF-07"], "Catálogo", "Colaborador no elimina productos", "DELETE producto como colaborador", "HTTP 403"),
  api("API-CAT-08", ["HU-07"], ["RF-05"], "Catálogo", "Admin elimina producto y rubro", "DELETE como admin", "HTTP 200 y desaparecen"),

  api("API-TPL-01", ["HU-05"], ["RF-04", "RF-07"], "Plantillas", "Colaborador no publica versión", "POST versions como colaborador", "HTTP 403 y versión activa 1"),
  api("API-TPL-02", ["HU-05"], ["RF-04"], "Plantillas", "La nueva versión queda activa", "POST versions v2 como admin", "activeVersion 2 y storageUrl de v2"),
  api("API-TPL-03", ["HU-05"], ["RF-04"], "Plantillas", "La versión anterior pasa al historial", "GET versions", "Versiones [2, 1]"),
  api("API-TPL-04", ["HU-18"], ["RF-04", "RNF-04"], "Plantillas", "Historial con número, fecha, autor y nota", "GET versions", "v2 con fecha, autor «Admin Pruebas» y changelog"),
  api("API-TPL-05", ["HU-06"], ["RF-03", "RF-04"], "Plantillas", "Colaborador solo recibe la versión activa", "GET /api/templates/tpl-0001 como colaborador", "Sin URL de v1 ni lista de versiones"),
  api("API-TPL-07", ["HU-06"], ["RF-04", "RF-07", "RNF-04"], "Plantillas", "Colaborador no accede a versiones antiguas", "GET /api/templates/tpl-0001/versions como colaborador", "HTTP 403 sin URL de v1"),
  api("API-TPL-06", ["HU-06"], ["RF-03"], "Plantillas", "Listado sin versiones antiguas", "GET /api/templates como colaborador", "Sin URL de v1"),

  api("API-FIL-01", ["HU-12"], ["RF-08", "RNF-04"], "Archivos", "Nombre, categoría, fecha y autor", "POST metadatos de archivo", "Se guardan los 4 datos y el nombre del autor"),
  api("API-FIL-02", ["HU-12"], ["RF-08"], "Archivos", "Categoría nueva", "POST con categoría «Planos»", "HTTP 201 con la categoría personalizada"),
  api("API-FIL-06", ["HU-12"], ["RF-02", "RF-08"], "Archivos", "Buscar dentro del evento por tipo de documento", "GET /api/events/evt-0001/files?category=Foto y ?category=Rider", "Solo archivos de la categoría pedida"),
  api("API-FIL-03", ["HU-13"], ["RF-08"], "Archivos", "Renombrar no altera el archivo ni su enlace", "PATCH name", "storageUrl y tamaño iguales"),
  api("API-FIL-04", ["HU-13"], ["RF-08", "RF-07"], "Archivos", "Colaborador no elimina archivos", "DELETE como colaborador", "HTTP 403"),
  api("API-FIL-05", ["HU-13"], ["RF-08"], "Archivos", "Admin elimina archivos", "DELETE como admin", "HTTP 200 y sale del listado"),

  api("API-POR-01", ["HU-15"], ["RF-09"], "Portal", "Solo items visibles", "GET /api/portfolio sin sesión", "Solo visible=true; el oculto no aparece"),
  api("API-POR-02", ["HU-15"], ["RF-09", "RNF-06"], "Portal", "Sin datos internos", "GET /api/portfolio sin sesión", "Solo campos públicos; sin pdfUrl, createdBy, consecutivos"),
  api("API-POR-03", ["HU-14"], ["RF-09"], "Portafolio", "POST exige sesión", "POST /api/portfolio sin cookies", "HTTP 401"),
  api("API-POR-04", ["HU-14"], ["RF-09"], "Portafolio", "Máximo 5 fotos (6 rechazadas)", "POST con 6 fotos", "HTTP 400"),
  api("API-POR-05", ["HU-14"], ["RF-09"], "Portafolio", "Hasta 5 fotos aceptadas", "POST con 5 fotos", "HTTP 201"),
  api("API-POR-06", ["HU-14"], ["RF-09"], "Portafolio", "Editar con más de 5 fotos", "PATCH con 6 fotos", "HTTP 400"),
  api("API-POR-07", ["HU-14"], ["RF-09"], "Portafolio", "Ocultar y reordenar", "PATCH visible=false, order=2", "Orden actualizado; sale del portal"),
  api("API-POR-08", ["HU-15"], ["RF-09"], "Portal", "/portal sin sesión y sin documentos", "GET /portal", "HTTP 200; visible sí, oculto no; sin rutas de documentos"),

  api("API-CLI-01", ["HU-17"], ["RF-11", "RF-01"], "Clientes", "Vincular cliente al crear evento", "POST /api/events con clientId", "eventIds del cliente incluye el evento"),
  api("API-CLI-02", ["HU-17"], ["RF-11"], "Clientes", "La ficha lista sus eventos", "GET /api/clients/cli-0001", "Lista EVT-0001 y el evento nuevo"),
  api("API-CLI-04", ["HU-17"], ["RF-11"], "Clientes", "La ficha lista eventos y cotizaciones", "GET /api/clients/cli-0001", "eventIds, ≥ 1 evento y COT-001-2026 con estado y fecha"),
  api("API-CLI-05", ["HU-17"], ["RF-11"], "Clientes", "Sin límite de 10 eventos en la ficha", "Vincular 11 eventos más y GET /api/clients/cli-0001", "Se listan todos los eventos del cliente"),
  api("API-PRV-01", ["HU-16"], ["RF-10", "RF-07"], "Proveedores", "Colaborador no crea proveedores", "POST /api/providers como colaborador", "HTTP 403"),
  api("API-PRV-02", ["HU-16"], ["RF-10"], "Proveedores", "Admin crea proveedor disponible para el autocompletado", "POST como admin; GET como colaborador", "HTTP 201 y aparece en el directorio"),
  api("API-PRV-03", ["HU-16"], ["RF-10", "RF-07"], "Proveedores", "Colaborador no elimina proveedores", "DELETE /api/providers/prov-0001 como colaborador", "HTTP 403 y el proveedor sigue"),
  api("API-PRV-04", ["HU-16"], ["RF-10"], "Proveedores", "Admin elimina proveedores", "DELETE como admin", "HTTP 200 y sale del directorio"),
  api("API-CLI-03", ["HU-17"], ["RF-11"], "Clientes", "Cliente disponible para autocompletado", "GET /api/clients como colaborador", "Incluye cli-0001"),

  { id: "DOC-PDF-01", tipo: "Documento", hu: ["HU-03"], req: ["RF-06", "RNF-03"], flujo: "PDF cotización", criterio: "PDF válido y no vacío", pasos: "GET .../quotes/quote-0001/pdf", esperado: "HTTP 200, application/pdf, cabecera %PDF-, > 5 KB", evidencia: "evidencias/pruebas/api/cotizacion-COT-001-2026.pdf" },
  { id: "DOC-PDF-02", tipo: "Documento", hu: ["HU-03"], req: ["RF-06", "RNF-03"], flujo: "PDF cotización", criterio: "Consecutivo en el PDF", pasos: "Extraer texto con pdf-parse", esperado: "Contiene COT-001-2026", evidencia: "evidencias/pruebas/api/cotizacion-COT-001-2026.pdf" },
  { id: "DOC-PDF-03", tipo: "Documento", hu: ["HU-03"], req: ["RF-06", "RNF-03"], flujo: "PDF cotización", criterio: "Totales calculados en el PDF", pasos: "Extraer texto con pdf-parse", esperado: "3.680.000 / 180.000 / 3.500.000 / 665.000 / 4.165.000", evidencia: "evidencias/pruebas/api/cotizacion-COT-001-2026.pdf" },
  { id: "DOC-PDF-04", tipo: "Documento", hu: ["HU-03"], req: ["RF-06", "RNF-03"], flujo: "PDF cotización", criterio: "Tabla agrupada por rubro", pasos: "Extraer texto con pdf-parse", esperado: "Secciones Audio e Iluminación con sus productos en orden", evidencia: "evidencias/pruebas/api/cotizacion-COT-001-2026.pdf" },
  { id: "DOC-PDF-05", tipo: "Documento", hu: ["HU-03"], req: ["RF-06", "RNF-03"], flujo: "PDF cotización", criterio: "Datos de cliente y evento", pasos: "Extraer texto con pdf-parse", esperado: "Cliente, atención y fecha del evento", evidencia: "evidencias/pruebas/api/cotizacion-COT-001-2026.pdf" },
  { id: "DOC-PDF-06", tipo: "Documento", hu: ["HU-04"], req: ["RF-06", "RNF-03"], flujo: "PDF orden", criterio: "Consecutivo, proveedor, fechas y pago", pasos: "GET .../orders/order-0001/pdf y extraer texto", esperado: "OS-001-2026, datos del proveedor, fechas, ANTICIPO y SALDO", evidencia: "evidencias/pruebas/api/orden-OS-001-2026.pdf" },
  { id: "DOC-PDF-07", tipo: "Documento", hu: ["HU-03", "HU-04"], req: ["RF-06"], flujo: "Generación de documentos", criterio: "Ningún rol modifica la plantilla base al generar documentos", pasos: "Generar PDF y XLSX de cotización y orden como admin y como colaborador; comparar plantillas y versiones antes y después", esperado: "Plantillas y versiones idénticas", evidencia: API_LOG },
  { id: "DOC-XLS-01", tipo: "Documento", hu: ["HU-03"], req: ["RF-06"], flujo: "XLSX cotización", criterio: "Excel válido", pasos: "GET .../quotes/quote-0001/xlsx y leer con xlsx", esperado: "Tipo OOXML, cabecera PK, se abre sin error", evidencia: "evidencias/pruebas/api/cotizacion-COT-001-2026.xlsx" },
  { id: "DOC-XLS-02", tipo: "Documento", hu: ["HU-03"], req: ["RF-06"], flujo: "XLSX cotización", criterio: "Filas esperadas", pasos: "Leer hoja «Cotización»", esperado: "Encabezado COT-001-2026, rubros, productos, subtotal, IVA y total", evidencia: "evidencias/pruebas/api/cotizacion-COT-001-2026.xlsx" },
  { id: "DOC-XLS-03", tipo: "Documento", hu: ["HU-04"], req: ["RF-06"], flujo: "XLSX orden", criterio: "Filas esperadas", pasos: "Leer hoja «Orden de Servicio»", esperado: "OS-001-2026, rubro AUDIO, ítems y TOTAL SERVICIOS", evidencia: "evidencias/pruebas/api/orden-OS-001-2026.xlsx" },

  { id: "RUL-01", tipo: "Reglas", hu: ["HU-09"], req: ["RF-07", "RNF-06"], flujo: "Firestore rules", criterio: "El navegador no lee Firestore", pasos: "getDoc autenticado con @firebase/rules-unit-testing", esperado: "Permiso denegado", evidencia: API_LOG },
  { id: "RUL-02", tipo: "Reglas", hu: ["HU-09"], req: ["RF-07", "RNF-06"], flujo: "Firestore rules", criterio: "El navegador no escribe Firestore", pasos: "setDoc como admin desde cliente", esperado: "Permiso denegado", evidencia: API_LOG },
  { id: "RUL-03", tipo: "Reglas", hu: ["HU-12"], req: ["RF-08", "RNF-06"], flujo: "Storage rules", criterio: "Sin sesión no se sube a Storage", pasos: "uploadString sin autenticación", esperado: "Permiso denegado", evidencia: API_LOG },
  { id: "RUL-04", tipo: "Reglas", hu: ["HU-12"], req: ["RF-08"], flujo: "Storage rules", criterio: "Usuario autenticado sube a Storage", pasos: "uploadString autenticado", esperado: "Permitido", evidencia: API_LOG },

  { id: "RUL-05", tipo: "Reglas", hu: ["HU-05"], req: ["RF-03", "RF-07", "RNF-06"], flujo: "Storage rules · templates/", criterio: "Colaborador no escribe plantillas", pasos: "uploadString en templates/ con claim role=collaborator", esperado: "Permiso denegado", evidencia: API_LOG },
  { id: "RUL-06", tipo: "Reglas", hu: ["HU-05"], req: ["RF-03", "RF-04"], flujo: "Storage rules · templates/", criterio: "Admin escribe plantillas", pasos: "uploadString en templates/ con claim role=admin", esperado: "Permitido", evidencia: API_LOG },
  { id: "RUL-07", tipo: "Reglas", hu: ["HU-06"], req: ["RF-03"], flujo: "Storage rules · templates/", criterio: "Admin lee plantillas", pasos: "getBytes de templates/ con claim role=admin", esperado: "Permitido", evidencia: API_LOG },
  { id: "RUL-08", tipo: "Reglas", hu: ["HU-06"], req: ["RF-03"], flujo: "Storage rules · templates/", criterio: "Colaborador lee (descarga) plantillas", pasos: "getBytes de templates/ con claim role=collaborator", esperado: "Permitido", evidencia: API_LOG },
  { id: "RUL-09", tipo: "Reglas", hu: ["HU-06"], req: ["RF-03", "RNF-06"], flujo: "Storage rules · templates/", criterio: "Sin sesión no lee plantillas", pasos: "getBytes de templates/ sin autenticación", esperado: "Permiso denegado", evidencia: API_LOG },
  { id: "RUL-10", tipo: "Reglas", hu: ["HU-12"], req: ["RNF-06"], flujo: "Storage rules", criterio: "Sin comodín general: rutas no previstas cerradas", pasos: "uploadString en otra-ruta/ autenticado", esperado: "Permiso denegado", evidencia: API_LOG },
  { id: "E2E-AUTH-01", tipo: "E2E", hu: ["HU-09"], req: ["RF-07"], flujo: "Login", criterio: "Admin entra al panel", pasos: "Abrir /login, ingresar credenciales de admin, Ingresar", esperado: "URL /dashboard/events y menú Usuarios visible", evidencia: e2e("E2E-AUTH-01", ["1-login", "2-panel-admin"]) },
  { id: "E2E-AUTH-02", tipo: "E2E", hu: ["HU-09"], req: ["RF-07", "RNF-06"], flujo: "Login", criterio: "Colaborador no ve el módulo de usuarios", pasos: "Login como colaborador", esperado: "URL /dashboard/events sin menú Usuarios", evidencia: e2e("E2E-AUTH-02", ["1-panel-colaborador"]) },
  { id: "E2E-AUTH-03", tipo: "E2E", hu: ["HU-09"], req: ["RF-07", "RNF-06"], flujo: "Acceso", criterio: "Sin sesión no se entra al panel", pasos: "Abrir /dashboard/events sin login", esperado: "Redirección a /login", evidencia: e2e("E2E-AUTH-03", ["1-redirigido-login"]) },
  { id: "E2E-AUTH-04", tipo: "E2E", hu: ["HU-09"], req: ["RF-07", "RNF-06"], flujo: "Acceso", criterio: "Colaborador no accede a /dashboard/admin", pasos: "Login colaborador; abrir /dashboard/admin/users", esperado: "Redirección a /dashboard/events", evidencia: e2e("E2E-AUTH-04", ["1-redirigido-eventos"]) },
  { id: "E2E-AUTH-05", tipo: "E2E", hu: ["HU-09"], req: ["RNF-06"], flujo: "Acceso", criterio: "Cookies falsificadas no dan acceso", pasos: "Inyectar magik_token inventado + magik_role=admin; abrir /dashboard/admin/users", esperado: "Redirección a /login sin datos de usuarios", evidencia: e2e("E2E-AUTH-05", ["1-cookies-falsas-login"]) },
  { id: "E2E-EVT-01", tipo: "E2E", hu: ["HU-01"], req: ["RF-01", "RNF-01"], flujo: "Crear evento", criterio: "Crear evento en máximo 3 clics", pasos: "Panel → Nuevo evento (clic 1) → llenar campos → Crear evento (clic 2)", esperado: "Evento con EVT-000X en el listado con ≤ 3 clics", evidencia: e2e("E2E-EVT-01", ["1-listado-inicial", "2-formulario", "3-evento-en-listado"]) },
  { id: "E2E-EVT-02", tipo: "E2E", hu: ["HU-01"], req: ["RF-01"], flujo: "Crear evento", criterio: "El listado muestra datos vivos al recargar", pasos: "Recargar /dashboard/events", esperado: "El evento creado sigue visible", evidencia: e2e("E2E-EVT-02", ["1-listado-recargado"]) },
  { id: "E2E-EVT-03", tipo: "E2E", hu: ["HU-02"], req: ["RF-01", "RNF-01"], flujo: "Ver evento", criterio: "Pestañas en máximo 3 clics", pasos: "Clic en la fila (1) → clic en pestaña (2)", esperado: "Pestañas Cotizaciones, Órdenes, Archivos y Otros visibles", evidencia: e2e("E2E-EVT-03", ["1-detalle-pestanas", "2-pestana-archivos"]) },
  { id: "E2E-EVT-04", tipo: "E2E", hu: ["HU-10"], req: ["RF-02", "RNF-01"], flujo: "Buscar eventos", criterio: "Filtrar y limpiar el filtro", pasos: "Escribir «bancolombia» en Cliente; luego borrar", esperado: "Solo EVT-0001; al limpiar vuelve la lista completa", evidencia: e2e("E2E-EVT-04", ["1-busqueda-cliente", "2-filtro-limpio"]) },
  { id: "E2E-COT-01", tipo: "E2E", hu: ["HU-03"], req: ["RF-06", "RNF-01"], flujo: "Crear cotización", criterio: "Crear cotización y descargar el PDF", pasos: "Evento EVT-0003 → Nueva cotización → llenar y agregar ítem → Crear → Descargar PDF", esperado: "Cotización en la tabla con su total; archivo PDF descargado y válido", evidencia: `${e2e("E2E-COT-01", ["1-detalle-evento", "2-formulario-con-item", "3-cotizacion-creada"])}; evidencias/pruebas/e2e/E2E-COT-01-cotizacion-descargada.pdf` },
  { id: "E2E-POR-01", tipo: "E2E", hu: ["HU-15"], req: ["RF-09"], flujo: "Portal", criterio: "Carga sin login y muestra contacto", pasos: "Abrir /portal sin sesión", esperado: "HTTP 200, sección de contacto", evidencia: e2e("E2E-POR-01", ["1-portal"]) },
  { id: "E2E-POR-02", tipo: "E2E", hu: ["HU-15"], req: ["RF-09"], flujo: "Portal", criterio: "Galería con eventos visibles", pasos: "Abrir /portal y buscar las fotos", esperado: "Foto del evento visible; el oculto no aparece", evidencia: e2e("E2E-POR-02", ["1-galeria"]) },
  { id: "E2E-POR-03", tipo: "E2E", hu: ["HU-15"], req: ["RF-09", "RNF-06"], flujo: "Portal", criterio: "Sin enlaces a documentos internos", pasos: "Revisar todos los href y el HTML", esperado: "Ningún enlace a /api, /dashboard, PDF, XLSX o Storage", evidencia: e2e("E2E-POR-03", ["1-enlaces-revisados"]) },
  { id: "E2E-POR-04", tipo: "E2E", hu: ["HU-15"], req: ["RF-09", "RNF-02"], flujo: "Portal", criterio: "Portal en celular", pasos: "Abrir /portal a 390×844", esperado: "Sin desborde horizontal", evidencia: e2e("E2E-POR-04", ["1-portal-movil"]) },

  { id: "E2E-CAT-01", tipo: "E2E", hu: ["HU-07"], req: ["RF-05"], flujo: "Catálogo", criterio: "Admin edita producto sin recargar", pasos: "Catálogo → rubro Iluminación → Editar producto → cambiar nombre y precio → Guardar cambios", esperado: "La fila muestra los datos nuevos y el catálogo de la API los refleja", evidencia: e2e("E2E-CAT-01", ["1-catalogo", "2-dialogo-edicion", "3-producto-actualizado"]) },
  { id: "E2E-CAT-02", tipo: "E2E", hu: ["HU-08"], req: ["RF-05", "RF-07"], flujo: "Catálogo", criterio: "Colaborador no ve editar producto", pasos: "Login colaborador → Catálogo → rubro Audio", esperado: "Sin botón Editar producto; sí Agregar producto", evidencia: e2e("E2E-CAT-02", ["1-catalogo-colaborador"]) },
  { id: "E2E-CLI-01", tipo: "E2E", hu: ["HU-17"], req: ["RF-11"], flujo: "Clientes", criterio: "Ficha con eventos y cotizaciones", pasos: "Login admin → Clientes → fila Bancolombia", esperado: "Eventos con EVT-0001 y sección Cotizaciones con COT-001-2026 en Borrador", evidencia: e2e("E2E-CLI-01", ["1-ficha-cliente"]) },
  { id: "E2E-MOV-01", tipo: "E2E", hu: ["HU-15"], req: ["RNF-02"], flujo: "Acceso móvil", criterio: "Panel y portal en Android (Chromium)", pasos: "Pixel 7: abrir /portal, login, ver eventos, abrir menú, ir a Plantillas", esperado: "Sin desborde de página; la tabla se desplaza para ver todas las columnas; menú y navegación funcionan", evidencia: e2e("E2E-MOV-01", ["1-portal", "2-eventos", "2b-tabla-desplazada", "3-menu", "4-plantillas"]) },
  { id: "E2E-MOV-02", tipo: "E2E", hu: ["HU-15"], req: ["RNF-02"], flujo: "Acceso móvil", criterio: "Panel y portal en iPhone (Safari/WebKit)", pasos: "iPhone 13: abrir /portal, login, ver eventos, abrir menú, ir a Plantillas", esperado: "Sin desborde de página; la tabla se desplaza para ver todas las columnas; menú y navegación funcionan", evidencia: e2e("E2E-MOV-02", ["1-portal", "2-eventos", "2b-tabla-desplazada", "3-menu", "4-plantillas"]) },
  { id: "LOAD-01", tipo: "Carga", hu: ["HU-10"], req: ["RNF-05"], flujo: "GET /api/events", criterio: "10 usuarios concurrentes, 30 s, 503 eventos", pasos: "autocannon -c 10 -d 30 con token de colaborador", esperado: "0 errores, 0 no-2xx, p99 < 1000 ms", evidencia: "evidencias/pruebas/load/resumen-carga.md; evidencias/pruebas/load/reporte-autocannon.md" },
  { id: "LOAD-02", tipo: "Carga", hu: ["HU-10"], req: ["RF-02", "RNF-05"], flujo: "Búsqueda de eventos", criterio: "10 usuarios concurrentes, 30 s, filtros cliente+año+lugar", pasos: "autocannon -c 10 -d 30 con token de colaborador", esperado: "0 errores, 0 no-2xx, p99 < 1000 ms", evidencia: "evidencias/pruebas/load/resumen-carga.md; evidencias/pruebas/load/reporte-autocannon.md" },
];

// ── Casos manuales ──────────────────────────────────────────────────────────
export const MANUAL: ManualCase[] = [
  { id: "MAN-01", hu: ["HU-03"], req: ["RF-06", "RNF-03"], titulo: "PDF de cotización frente al formato corporativo", precondiciones: "Cotización con ítems de 2 rubros, descuento e IVA.", pasos: ["Abrir el evento y la pestaña Cotizaciones.", "Descargar el PDF.", "Compararlo con la plantilla corporativa impresa o en PDF."], esperado: "Logo, firma, tipografía, colores, márgenes, tabla agrupada por rubro y totales coinciden con el formato corporativo.", captura: "MAN-01.png" },
  { id: "MAN-02", hu: ["HU-04"], req: ["RF-06", "RNF-03"], titulo: "PDF de orden de servicio frente al formato corporativo", precondiciones: "Orden con proveedor, fechas y anticipo.", pasos: ["Abrir la pestaña Órdenes de servicio.", "Descargar el PDF.", "Comparar con el formato corporativo."], esperado: "Encabezado, datos del proveedor, fechas, tabla por rubro y forma de pago con el formato corporativo.", captura: "MAN-02.png" },
  { id: "MAN-03", hu: ["HU-03"], req: ["RF-06"], titulo: "XLSX de cotización en Excel", precondiciones: "Cotización existente.", pasos: ["Descargar el XLSX.", "Abrirlo en Excel o LibreOffice.", "Intentar editar una celda protegida."], esperado: "Estilos y celdas combinadas correctos; la hoja está protegida.", captura: "MAN-03.png" },
  { id: "MAN-04", hu: ["HU-12"], req: ["RF-08"], titulo: "Arrastrar y soltar archivos", precondiciones: "Sesión de colaborador; evento abierto en Archivos.", pasos: ["Clic en Subir archivo.", "Arrastrar una foto JPG a la zona punteada.", "Elegir categoría Foto y guardar."], esperado: "La zona se resalta al arrastrar; el archivo aparece con nombre, categoría, fecha y autor.", captura: "MAN-04.png" },
  { id: "MAN-05", hu: ["HU-12"], req: ["RF-08"], titulo: "Categoría personalizada", precondiciones: "Evento abierto en Archivos.", pasos: ["Subir archivo y elegir «Personalizada».", "Escribir «Planos».", "Guardar."], esperado: "El archivo queda en la categoría Planos y aparece un filtro «Planos».", captura: "MAN-05.png" },
  { id: "MAN-06", hu: ["HU-13"], req: ["RF-08"], titulo: "Renombrar archivo y abrir el enlace", precondiciones: "Archivo subido.", pasos: ["Clic en el lápiz y cambiar el nombre.", "Guardar.", "Clic en Descargar."], esperado: "Cambia el nombre visible; la descarga abre el mismo archivo de antes.", captura: "MAN-06.png" },
  { id: "MAN-07", hu: ["HU-16"], req: ["RF-10"], titulo: "Autocompletado de proveedor en pantalla", precondiciones: "Proveedor «Sonido Total SAS» en el directorio.", pasos: ["Nueva orden de servicio.", "Escribir «Soni» en Proveedor.", "Elegir la sugerencia."], esperado: "Se llenan razón social, contacto, correo y celular.", captura: "MAN-07.png" },
  { id: "MAN-08", hu: ["HU-06"], req: ["RF-03"], titulo: "Descarga de la plantilla activa como colaborador", precondiciones: "Plantilla con v2 activa; sesión de colaborador.", pasos: ["Abrir Plantillas.", "Clic en el icono Descargar."], esperado: "Se descarga la v2; no hay botón de historial, publicar ni eliminar.", captura: "MAN-08.png" },
  { id: "MAN-09", hu: ["HU-18", "HU-05"], req: ["RF-04", "RNF-04"], titulo: "Historial de versiones visible para el admin", precondiciones: "Plantilla con v1 y v2; sesión de admin.", pasos: ["Abrir Plantillas.", "Clic en el icono de historial."], esperado: "Tabla con Ver., Changelog, Fecha y Autor; v2 marcada como activa.", captura: "MAN-09.png" },
  { id: "MAN-10", hu: ["HU-05"], req: ["RF-04"], titulo: "Publicar nueva versión arrastrando el archivo", precondiciones: "Sesión de admin.", pasos: ["Abrir el historial de una plantilla.", "Publicar nueva versión.", "Arrastrar el archivo, escribir la nota y Publicar."], esperado: "La nueva versión queda activa y la anterior sigue en el historial.", captura: "MAN-10.png" },
  { id: "MAN-11", hu: ["HU-15"], req: ["RF-09", "RNF-02"], titulo: "Portal en celular real", precondiciones: "Teléfono Android o iPhone.", pasos: ["Abrir /portal en el navegador del teléfono.", "Recorrer slider, galería y contacto.", "Tocar el teléfono y el correo."], esperado: "Sin desborde horizontal; textos legibles; tel: y mailto: abren las apps.", captura: "MAN-11.png" },
  { id: "MAN-12", hu: ["HU-14"], req: ["RF-09"], titulo: "Seleccionar fotos del portafolio", precondiciones: "Evento con más de 5 archivos de categoría Foto.", pasos: ["Portafolio → Agregar.", "Elegir el evento.", "Intentar seleccionar 6 fotos."], esperado: "Solo se ofrecen fotos de categoría Foto; la sexta no se puede seleccionar.", captura: "MAN-12.png" },
  { id: "MAN-13", hu: ["HU-14", "HU-15"], req: ["RF-09"], titulo: "Ocultar y reordenar en el portal", precondiciones: "Dos items visibles en el portafolio.", pasos: ["Cambiar el orden de un item.", "Ocultar el otro.", "Abrir /portal en otra ventana."], esperado: "El portal respeta el nuevo orden y no muestra el item oculto.", captura: "MAN-13.png" },
  { id: "MAN-14", hu: [], req: [], titulo: "Modo oscuro predeterminado y modo claro", precondiciones: "Navegador sin preferencia guardada.", pasos: ["Abrir /login y el panel.", "Cambiar a modo claro con el botón de tema.", "Recorrer Eventos, Cotizaciones y Plantillas."], esperado: "Arranca en oscuro; en claro los textos, badges y selects nativos mantienen contraste legible.", captura: "MAN-14.png" },
  { id: "MAN-15", hu: ["HU-09"], req: ["RF-07"], titulo: "Doble confirmación al eliminar usuario", precondiciones: "Sesión de admin y un usuario de prueba.", pasos: ["Usuarios → Eliminar.", "Confirmar en el primer diálogo.", "Confirmar en el segundo."], esperado: "Se piden dos confirmaciones; no se puede eliminar la cuenta propia.", captura: "MAN-15.png" },
  { id: "MAN-16", hu: ["HU-09"], req: ["RF-07", "RNF-06"], titulo: "Usuario desactivado no puede entrar", precondiciones: "Usuario colaborador activo.", pasos: ["Como admin, desactivar el usuario.", "En otra ventana, intentar login con ese usuario."], esperado: "El login falla; al reactivarlo vuelve a entrar.", captura: "MAN-16.png" },
  { id: "MAN-17", hu: ["HU-01", "HU-03"], req: ["RNF-01"], titulo: "Flujo completo cronometrado", precondiciones: "Sesión de colaborador; cronómetro.", pasos: ["Crear evento.", "Abrir el evento y crear una cotización con 3 ítems.", "Descargar el PDF.", "Anotar tiempo y clics."], esperado: "Cada acción frecuente en máximo 3 clics; el flujo completo en el tiempo objetivo del documento de tesis.", captura: "MAN-17.png" },
  { id: "MAN-18", hu: ["HU-17"], req: ["RF-11"], titulo: "Ficha del cliente con eventos y cotizaciones", precondiciones: "Cliente con 2 eventos y 1 cotización.", pasos: ["Clientes → abrir la ficha.", "Revisar eventos y cotizaciones listados."], esperado: "Lista sus eventos (todos, sin límite) y sus cotizaciones con consecutivo, estado y fecha.", captura: "MAN-18.png" },
  { id: "MAN-19", hu: ["HU-07"], req: ["RF-05"], titulo: "Editar producto desde la pantalla de catálogo", precondiciones: "Sesión de admin.", pasos: ["Catálogo → expandir un rubro.", "Clic en el lápiz de un producto.", "Cambiar nombre, unidad y precio y guardar."], esperado: "El diálogo abre con los datos actuales; al guardar, la tabla se actualiza sin recargar.", captura: "MAN-19.png" },
  { id: "MAN-20", hu: ["HU-09"], req: ["RF-07"], titulo: "Sesión abierta más de una hora", precondiciones: "Sesión iniciada.", pasos: ["Dejar el panel abierto más de 60 minutos.", "Navegar entre Eventos y Plantillas."], esperado: "La sesión se renueva sola; no se pide la contraseña de nuevo.", captura: "MAN-20.png" },
];
