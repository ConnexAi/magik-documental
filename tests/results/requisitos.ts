// Catálogo de requisitos usado para la trazabilidad de las pruebas.
//
// PROVISIONAL: el repositorio no contiene el listado oficial de RF/RNF del
// documento de tesis. Estos enunciados se derivaron de las 18 HU y de
// CLAUDE.md (RNF-01) para poder medir cobertura. Reemplazar los textos por
// los oficiales conservando los IDs, o ajustar los IDs y el mapeo de
// tests/results/catalog.ts si difieren.
export const REQUISITOS_PROVISIONALES = true;

export const HU: Record<string, string> = {
  "HU-01": "Crear evento con consecutivo EVT y validación de campos",
  "HU-02": "Vista del evento con pestañas en máximo tres clics",
  "HU-03": "Cotización COT-000-AAAA con totales y PDF corporativo",
  "HU-04": "Orden de servicio OS-000-AAAA con proveedor, fechas y pago",
  "HU-05": "Solo el admin publica versión de plantilla",
  "HU-06": "Panel de plantillas con versión activa y descarga",
  "HU-07": "Admin gestiona rubros y productos",
  "HU-08": "Colaborador agrega rubros y productos sin eliminarlos",
  "HU-09": "Gestión de usuarios y roles por el admin",
  "HU-10": "Búsqueda de eventos por cliente, año, tipo y lugar",
  "HU-11": "Duplicar cotización",
  "HU-12": "Subir archivos con metadatos y categorías",
  "HU-13": "Renombrar archivos; solo admin elimina",
  "HU-14": "Admin elige fotos del portafolio",
  "HU-15": "Portal público sin sesión ni documentos internos",
  "HU-16": "Autocompletado de proveedor en la orden",
  "HU-17": "Directorio de clientes vinculado a eventos",
  "HU-18": "Historial de versiones de plantillas",
};

export const RF: Record<string, string> = {
  "RF-01": "Gestión de usuarios y roles (HU-09)",
  "RF-02": "Gestión de eventos con consecutivo (HU-01, HU-02)",
  "RF-03": "Búsqueda de eventos (HU-10)",
  "RF-04": "Catálogo de rubros y productos (HU-07, HU-08)",
  "RF-05": "Cotizaciones (HU-03, HU-11)",
  "RF-06": "Órdenes de servicio y proveedores (HU-04, HU-16)",
  "RF-07": "Plantillas con control de versiones (HU-05, HU-06, HU-18)",
  "RF-08": "Archivos por evento (HU-12, HU-13)",
  "RF-09": "Gestión del portafolio (HU-14)",
  "RF-10": "Portal público (HU-15)",
  "RF-11": "Directorio de clientes (HU-17)",
};

export const RNF: Record<string, string> = {
  "RNF-01": "Usabilidad: acciones frecuentes en máximo 3 clics",
  "RNF-02": "Seguridad: autenticación y autorización por rol verificadas en el servidor",
  "RNF-03": "Rendimiento: búsqueda en menos de 1 segundo",
  "RNF-04": "Compatibilidad: portal adaptable a celular",
  "RNF-05": "Carga: 10 usuarios concurrentes sin errores",
  "RNF-06": "Interfaz: modo oscuro predeterminado e identidad visual corporativa",
};
