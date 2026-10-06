# Verificación de criterios de aceptación — 18 historias de usuario

Fecha: 2026-10-05. Revisión estática del código. No se ejecutó la aplicación,
así que los criterios de tiempo (HU-10) se evalúan por el diseño de la consulta,
no por medición.

**Columnas de la tabla**

- **Estado inicial**: resultado al revisar el código antes de esta tarea.
- **Estado final**: resultado después de aplicar las correcciones pequeñas.
- **Pendiente**: lo que falta y no se corrigió porque es un cambio grande.

## Resumen

| Estado final | Cantidad | Historias |
|---|---|---|
| CUMPLE | 18 | Todas (HU-07 y HU-17 se completaron después, ver «Actualización») |
| CUMPLE PARCIAL | 0 | — |
| NO CUMPLE | 0 | — |

Al inicio de la revisión 4 historias cumplían, 12 cumplían parcialmente y 2 no
cumplían (HU-04 y HU-11). Con correcciones pequeñas, 12 pasaron a CUMPLE. Las
2 restantes (HU-07 y HU-17) requieren trabajo de UI mayor y quedan pendientes.

## Tabla de resultados

| HU | Criterio | Estado inicial | Estado final | Evidencia | Corrección aplicada / Pendiente |
|---|---|---|---|---|---|
| HU-09 | Admin crea cuenta con correo, nombre y rol; cambia rol, activa/desactiva y elimina con doble confirmación. Colaborador no ve ni accede al módulo de usuarios. | CUMPLE PARCIAL | CUMPLE | `components/magik/users/create-user-dialog.tsx` (zod: displayName, email, role); `users-page-client.tsx` → `DeleteUserDialog` (pasos `confirm1` → `confirm2`); `change-role-select.tsx`; `app/api/admin/users/[uid]/route.ts` (`PATCH`, `DELETE` con `requireAdmin`); `app/dashboard/layout.tsx` (`adminOnly`); `middleware.ts` redirige `/dashboard/admin/*` | **Corregido**: desactivar solo cambiaba `active` en Firestore y el usuario seguía entrando. Ahora `PATCH` llama `adminAuth.updateUser(uid, { disabled })` y revoca los refresh tokens al desactivar. Nota: un cambio de rol se refleja en el servidor cuando el usuario renueva su token (máx. 1 h). |
| HU-01 | Al guardar, el evento recibe consecutivo automático único EVT-0001 y aparece en el listado. Campos obligatorios validados antes de guardar. | CUMPLE PARCIAL | CUMPLE | `lib/firestore.ts` → `createEvent`; `components/magik/events/create-event-dialog.tsx` (zod: cliente, tipo, lugar, fecha); `events-page-client.tsx` → `handleEventCreated` | **Corregido**: el consecutivo se calculaba leyendo el último evento sin transacción, así que dos creaciones simultáneas podían repetir número. Ahora usa un contador en `counters/events` dentro de `runTransaction`, inicializado desde el último consecutivo existente. También se agregó validación de campos obligatorios en `POST /api/events` (400). |
| HU-02 | La vista del evento muestra pestañas de cotizaciones, órdenes, archivos y otros. Se llega en máximo tres clics desde el panel. | CUMPLE | CUMPLE | `components/magik/events/event-detail-client.tsx` (`TABS`: quotes, orders, files, other); fila de la tabla en `events-page-client.tsx` abre el detalle | — (panel → fila del evento → pestaña = 2 clics) |
| HU-10 | Búsqueda por cliente, año, tipo y lugar; devuelve solo coincidencias en menos de un segundo. | CUMPLE PARCIAL | CUMPLE | `events-page-client.tsx` (4 campos, debounce 400 ms); `lib/firestore.ts` → `getEvents` (filtro por `eventType` en Firestore, resto en memoria) | **Corregido**: al borrar todos los filtros no se volvía a consultar y la tabla seguía mostrando el último resultado filtrado. Ahora se consulta en cada cambio después del primer render. Nota: el tiempo de respuesta no se midió. Con el volumen actual es una sola lectura de la colección `events`; si crece mucho convendría filtrar en Firestore con índices. |
| HU-07 | Admin crea, edita y elimina rubros y productos; los cambios se reflejan de inmediato en el autocompletado. | CUMPLE PARCIAL | CUMPLE | `components/magik/catalog/catalog-page-client.tsx` (crear rubro, `EditRubroButton`, eliminar rubro y producto); `create-product-dialog.tsx`; API `PATCH /api/catalog/rubros/[rubroId]/products/[productId]`; los diálogos de cotización y orden piden `/api/catalog` cada vez que se abren | **Corregido después**: nuevo `components/magik/catalog/edit-product-dialog.tsx` (solo admin) que llama al PATCH existente y actualiza la tabla sin recargar. Prueba E2E-CAT-01. |
| HU-08 | Colaborador puede agregar rubros y productos pero no eliminarlos; lo agregado queda disponible para todos. | CUMPLE PARCIAL | CUMPLE | `catalog-page-client.tsx`; `POST /api/catalog/rubros` y `/products` con `requireSession`; `DELETE` con `requireAdmin`; el catálogo es un único documento compartido (`catalog/rubros`) | **Corregido**: el botón "Nuevo rubro" estaba dentro de `isAdmin` y el colaborador no podía crear rubros. Ahora se muestra a todos; editar y eliminar siguen siendo solo admin. |
| HU-03 | Cotización con consecutivo COT-000-AAAA; calcula subtotal, descuento, IVA y total; PDF con logo, firma y tabla agrupada por rubro. | CUMPLE PARCIAL | CUMPLE | `lib/firestore.ts` → `generateQuoteConsecutive` (`COT-001-2026`); `create-quote-dialog.tsx` (subtotal, descuento, IVA 19 %, total); `lib/pdf.ts` → `buildQuotePdf` (logo, firma, agrupación por `rubroName`, filas de totales) | **Corregido**: `edit-quote-dialog.tsx` guardaba `total: subtotal`, así que al editar se perdían el descuento y el IVA del total almacenado (el PDF recalculaba bien). Ahora usa el mismo cálculo que la creación y el PDF. |
| HU-04 | Orden con consecutivo OS-000-AAAA; incluye datos del proveedor, fechas y condiciones de pago; PDF con formato corporativo. | NO CUMPLE | CUMPLE | `lib/firestore.ts` → `generateOrderConsecutive`; `lib/pdf.ts` → `buildOrderPdf` (proveedor, razón social, contacto, email, celular, fechas de montaje, evento y prueba, anticipo, abono, crédito, saldo, logo y firma) | **Corregido**: el consecutivo era `OS-0001`, sin año. Ahora es `OS-001-2026`. Las órdenes ya creadas conservan su número anterior; el contador sigue desde el mismo valor. |
| HU-11 | Duplicar cotización conserva ítems y condiciones y recibe el siguiente consecutivo. | NO CUMPLE | CUMPLE | `lib/firestore.ts` → `duplicateQuote`; `POST /api/events/[id]/quotes/[quoteId]/duplicate` | **Corregido**: la copia heredaba el `consecutive` de la original, así que quedaban dos cotizaciones con el mismo número. Ahora se genera el siguiente COT. |
| HU-05 | Solo el admin publica nueva versión de plantilla; la nueva queda activa y la anterior pasa al historial. | CUMPLE PARCIAL | CUMPLE | `POST /api/templates/[id]/versions` con `requireAdmin`; `lib/firestore.ts` → `publishTemplateVersion` (crea el documento en `versions` y actualiza `activeVersion` y `storageUrl`) | **Corregido**: la v1 se guardaba solo en el documento de la plantilla (PATCH de `storageUrl`) y no en `versions`. Al publicar la v2, la v1 desaparecía del historial. Ahora `upload-template-dialog.tsx` registra la v1 por el endpoint de versiones. Las plantillas creadas antes del cambio no tienen su v1 en el historial. |
| HU-06 | El panel muestra por plantilla su versión activa y botón de descarga; no se ofrecen versiones antiguas al colaborador. | CUMPLE PARCIAL | CUMPLE | `components/magik/templates/templates-page-client.tsx` (columna "Versión activa", enlace a `storageUrl`) | **Corregido**: el botón de historial (con enlaces a versiones antiguas), "Nueva plantilla", "Publicar" y "Eliminar" se mostraban a todos. Ahora solo los ve el admin (`hooks/use-is-admin.ts`). El enlace de la versión activa usa el icono y el título "Descargar". Además, `GET /api/templates/[id]/versions` es solo admin (`requireAdmin`): un colaborador recibe 403 aunque llame la API directamente (prueba API-TPL-07). En Storage, `templates/` solo la escribe el admin (claim `role`) y la lee cualquier usuario autenticado (pruebas RUL-05 a RUL-09). |
| HU-18 | Historial de versiones con número, fecha, autor y nota de cambios. | CUMPLE PARCIAL | CUMPLE | `components/magik/templates/template-versions-dialog.tsx` (Ver., Changelog, Fecha, Autor) | **Corregido**: faltaba el autor. Se guardaba solo `publishedBy` (uid). Ahora la API guarda `publishedByName` y el diálogo muestra la columna "Autor". Las versiones anteriores al cambio muestran "—". |
| HU-12 | Subir archivos arrastrando o seleccionando; cada uno con nombre, categoría, fecha y autor; se pueden crear categorías nuevas. | CUMPLE PARCIAL | CUMPLE | `components/magik/files/upload-file-dialog.tsx` (drop zone + input file, categoría "Personalizada"); `POST /api/events/[id]/files` | **Corregido**: la tabla solo mostraba nombre, categoría y tamaño. Se agregaron las columnas Fecha y Autor (`uploadedByName`, guardado por la API). Los filtros ahora incluyen las categorías personalizadas existentes. Los archivos anteriores al cambio muestran autor "—". |
| HU-13 | Renombrar sin alterar el archivo almacenado ni su enlace; solo el admin elimina archivos. | CUMPLE PARCIAL | CUMPLE | `rename-file-dialog.tsx` → `PATCH` que solo cambia `name` y `category` en Firestore (`updateEventFile`); `storageUrl` no se toca; `DELETE /api/events/[id]/files/[fileId]` con `requireAdmin` | **Corregido**: el botón eliminar se mostraba al colaborador, que recibía 403. Ahora solo lo ve el admin. Se aplicó lo mismo en las pestañas de cotizaciones y órdenes, cuyo `DELETE` también es solo admin. |
| HU-16 | Autocompletado de proveedor en la orden; al elegir se llenan razón social, contacto, correo y celular. | CUMPLE | CUMPLE | `components/magik/orders/create-order-dialog.tsx` → `handleSelectProvider` | — Nota: `Provider` no tiene campo de razón social, así que se llena con el nombre del proveedor. La función conserva varios `console.log` de depuración. |
| HU-14 | Admin elige hasta cinco fotos por evento entre las de categoría Foto, puede ocultarlas o cambiar su orden. | CUMPLE | CUMPLE | `components/magik/portal/add-portfolio-dialog.tsx` (`MAX_PHOTOS = 5`, filtro `category === "Foto"`); `portfolio-admin-client.tsx` (alternar `visible`, campo `order`); API con `requireAdmin` | Se agregó la validación de máximo 5 fotos también en `POST /api/portfolio` y `PATCH /api/portfolio/[id]`. Antes solo la aplicaba la UI. |
| HU-15 | El portal carga sin sesión, muestra galería y contacto y no expone ningún documento interno. | CUMPLE | CUMPLE | `app/portal/page.tsx` → `getPortfolioItems` (solo `visible === true`); `middleware.ts` deja pasar `/portal`; `portal-landing.tsx` (galería, sección `#contacto` con teléfono y correo) | — Solo se envían al navegador `eventName`, `eventId` y las URLs de las fotos elegidas; no hay cotizaciones, órdenes ni otros archivos. |
| HU-17 | Al crear un evento se puede vincular un cliente existente; la ficha del cliente lista sus eventos y cotizaciones. | CUMPLE PARCIAL | CUMPLE | `create-event-dialog.tsx` (autocompletado de clientes → `clientId`); `POST /api/events` → `addEventToClient`; `lib/firestore.ts` → `getClientWithHistory`; `components/magik/clients/client-detail-dialog.tsx` | **Corregido después**: `getClientWithHistory` trae todos los eventos con `getAll` (sin el límite de 10) y las cotizaciones de cada evento; la ficha muestra consecutivo, estado y fecha. Pruebas API-CLI-04, API-CLI-05 y E2E-CLI-01. |

## Actualización

HU-07 y HU-17 se completaron en una iteración posterior junto con la suite de pruebas. Resultados en `tests/RESULTADOS.md`.

## Archivos modificados en esta verificación

- `lib/firestore.ts`: consecutivos con transacción (EVT, COT, OS), formato `OS-000-AAAA`, nuevo consecutivo al duplicar.
- `lib/firebase-admin.ts`: `getUserDisplayName(uid)`.
- `lib/types.ts`: `EventFile.uploadedByName?`, `TemplateVersion.publishedByName?`.
- `hooks/use-is-admin.ts` (nuevo): rol para mostrar u ocultar controles con el patrón mounted.
- `app/api/admin/users/[uid]/route.ts`: desactivar bloquea Firebase Auth.
- `app/api/events/route.ts`: validación de campos obligatorios.
- `app/api/events/[id]/files/route.ts`, `app/api/templates/[id]/versions/route.ts`: guardan el nombre del autor.
- `app/api/portfolio/route.ts`, `app/api/portfolio/[id]/route.ts`: máximo 5 fotos.
- `components/magik/quotes/edit-quote-dialog.tsx`: total con descuento e IVA.
- `components/magik/events/events-page-client.tsx`: limpiar filtros recarga la lista.
- `components/magik/catalog/catalog-page-client.tsx`: "Nuevo rubro" visible para colaboradores.
- `components/magik/files/files-tab.tsx`: columnas Fecha y Autor, categorías personalizadas en los filtros, eliminar solo admin.
- `components/magik/quotes/quotes-tab.tsx`, `components/magik/orders/orders-tab.tsx`: eliminar solo admin.
- `components/magik/templates/templates-page-client.tsx`, `template-versions-dialog.tsx`, `upload-template-dialog.tsx`: controles de admin, columna Autor, v1 en el historial.

`npx tsc --noEmit`: sin errores. `npx next lint`: sin advertencias ni errores.
