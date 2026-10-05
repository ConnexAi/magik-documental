// Catálogo de requisitos usado para la trazabilidad de las pruebas.
// Textos oficiales del documento de tesis (RF y RNF), sin modificaciones.
export const REQUISITOS_PROVISIONALES = false;

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

export interface RequisitoFuncional {
  nombre: string;
  descripcion: string;
  prioridad: string;
  roles: string;
}

export interface RequisitoNoFuncional {
  nombre: string;
  descripcion: string;
}

export const RF: Record<string, RequisitoFuncional> = {
  "RF-01": {
    nombre: "Gestión de eventos",
    descripcion: "El sistema permite crear, editar y consultar eventos. Cada evento tiene su propio espacio con secciones para cotizaciones, órdenes de servicio, fotos y otros documentos, identificado por consecutivo, nombre del cliente, lugar, tipo de evento y fecha. El administrador puede eliminar eventos; el colaborador solo puede crearlos y editarlos.",
    prioridad: "Alta",
    roles: "Admin, Colaborador",
  },
  "RF-02": {
    nombre: "Búsqueda avanzada",
    descripcion: "El sistema permite buscar eventos por consecutivo, nombre del cliente, año, tipo de evento y lugar. Dentro de un evento se puede buscar por tipo de documento. Tanto el administrador como el colaborador pueden duplicar una cotización anterior como base para una nueva.",
    prioridad: "Alta",
    roles: "Admin, Colaborador",
  },
  "RF-03": {
    nombre: "Plantillas en la nube",
    descripcion: "Las plantillas de cotizaciones y órdenes de servicio se almacenan en el sistema y son accesibles desde cualquier dispositivo. Siempre se muestra la versión más actualizada en el dashboard. Solo el administrador puede subir nuevas plantillas al sistema; los colaboradores pueden descargarlas o usarlas directamente desde el dashboard.",
    prioridad: "Alta",
    roles: "Admin, Colaborador",
  },
  "RF-04": {
    nombre: "Control de versiones de plantillas",
    descripcion: "Al actualizar una plantilla el sistema registra la versión anterior en el historial. Los colaboradores siempre acceden a la versión activa. Solo el administrador puede publicar una nueva versión oficial.",
    prioridad: "Alta",
    roles: "Admin",
  },
  "RF-05": {
    nombre: "Catálogo de rubros y productos",
    descripcion: "El sistema tiene un maestro de rubros y productos dentro de cada rubro. Al crear una orden o cotización el usuario selecciona rubros y productos con autocompletado. El administrador gestiona el catálogo completo: puede crear, editar y eliminar rubros y productos. El colaborador puede agregar entradas nuevas en campo cuando el elemento no existe, pero no puede eliminar los existentes.",
    prioridad: "Alta",
    roles: "Admin, Colaborador",
  },
  "RF-06": {
    nombre: "Generación de documentos corporativos",
    descripcion: "El sistema permite generar automáticamente cotizaciones y órdenes de servicio en formato PDF con el logo, formato y estructura corporativa de MAGIK Producciones. Tanto el administrador como el colaborador pueden generar documentos. Los campos variables son: cliente, fecha, rubros, productos, cantidades y precios. Ningún rol puede modificar la plantilla base desde esta funcionalidad.",
    prioridad: "Alta",
    roles: "Admin, Colaborador",
  },
  "RF-07": {
    nombre: "Roles y permisos",
    descripcion: "El sistema implementa dos roles con acceso autenticado. El administrador tiene control total: gestiona usuarios, plantillas, catálogo y portal. El colaborador puede crear eventos, generar documentos y subir archivos, pero no puede eliminar documentos críticos, modificar plantillas oficiales ni gestionar usuarios. Las rutas protegidas redirigen automáticamente según el rol activo.",
    prioridad: "Alta",
    roles: "Admin",
  },
  "RF-08": {
    nombre: "Gestión de archivos por evento",
    descripcion: "El sistema permite subir, nombrar, fechar y categorizar archivos dentro de cada evento. Si una categoría no existe, cualquier usuario puede crearla. Tanto el administrador como el colaborador pueden subir y renombrar archivos. Solo el administrador puede eliminar archivos del sistema.",
    prioridad: "Media",
    roles: "Admin, Colaborador",
  },
  "RF-09": {
    nombre: "Portal público de portafolio",
    descripcion: "El sistema tiene un portal público tipo portafolio, accesible por cualquier visitante sin necesidad de autenticación. El administrador define desde el dashboard qué fotos y eventos son visibles. Los documentos internos no son accesibles desde este portal.",
    prioridad: "Media",
    roles: "Admin",
  },
  "RF-10": {
    nombre: "Directorio de proveedores",
    descripcion: "El sistema tiene una base de datos de proveedores con nombre, contacto y productos asociados. Al redactar órdenes de servicio el sistema ofrece autocompletado para evitar errores. El administrador puede crear o eliminar proveedores.",
    prioridad: "Media",
    roles: "Admin, Colaborador",
  },
  "RF-11": {
    nombre: "Registro de clientes",
    descripcion: "El sistema mantiene un directorio de clientes con el historial de eventos y cotizaciones asociadas. Facilita reutilizar cotizaciones anteriores como base para nuevos clientes con perfil similar.",
    prioridad: "Baja",
    roles: "Admin",
  },
};

export const RNF: Record<string, RequisitoNoFuncional> = {
  "RNF-01": {
    nombre: "Usabilidad",
    descripcion: "Las acciones más frecuentes (crear evento, generar documento, buscar) deben completarse en máximo 3 clics desde la pantalla principal.",
  },
  "RNF-02": {
    nombre: "Disponibilidad en la nube",
    descripcion: "El sistema debe estar disponible desde navegadores modernos en computadores y dispositivos móviles sin instalación adicional.",
  },
  "RNF-03": {
    nombre: "Consistencia visual",
    descripcion: "El 100% de los PDFs generados deben seguir la plantilla corporativa aprobada por el administrador sin variaciones de formato.",
  },
  "RNF-04": {
    nombre: "Trazabilidad documental",
    descripcion: "Cada archivo almacenado debe tener visible su metadato de fecha y versión. El historial de versiones de plantillas debe estar accesible para el administrador.",
  },
  "RNF-05": {
    nombre: "Escalabilidad",
    descripcion: "El sistema debe funcionar correctamente con al menos 500 eventos registrados y 10 usuarios simultáneos sin degradación visible del rendimiento.",
  },
  "RNF-06": {
    nombre: "Seguridad de acceso",
    descripcion: "Las rutas protegidas del sistema deben redirigir automáticamente a usuarios sin los permisos requeridos. No debe ser posible acceder a información de otros roles mediante manipulación de URLs.",
  },
};
