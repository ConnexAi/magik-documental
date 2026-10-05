# Pruebas manuales — MAGIK Producciones

Casos que no tiene sentido automatizar: aspecto visual, interacción física (arrastrar, celular real) o tiempos de una persona. Ejecutarlos contra el entorno que se va a entregar (producción o una copia), no contra el emulador.

Para cada caso: seguir los pasos, marcar el resultado, anotar observaciones y guardar la captura con el nombre indicado en `evidencias/pruebas/manual/`.

**Ejecutado por:** ____________________ **Fecha:** ____________ **Entorno / URL:** ____________________

| ID | HU | RF/RNF | Caso | Captura | Resultado |
|---|---|---|---|---|---|
| MAN-01 | HU-03 | RF-05, RNF-06 | PDF de cotización frente al formato corporativo | MAN-01.png | ☐ Aprobado ☐ Fallido |
| MAN-02 | HU-04 | RF-06, RNF-06 | PDF de orden de servicio frente al formato corporativo | MAN-02.png | ☐ Aprobado ☐ Fallido |
| MAN-03 | HU-03 | RF-05 | XLSX de cotización en Excel | MAN-03.png | ☐ Aprobado ☐ Fallido |
| MAN-04 | HU-12 | RF-08 | Arrastrar y soltar archivos | MAN-04.png | ☐ Aprobado ☐ Fallido |
| MAN-05 | HU-12 | RF-08 | Categoría personalizada | MAN-05.png | ☐ Aprobado ☐ Fallido |
| MAN-06 | HU-13 | RF-08 | Renombrar archivo y abrir el enlace | MAN-06.png | ☐ Aprobado ☐ Fallido |
| MAN-07 | HU-16 | RF-06 | Autocompletado de proveedor en pantalla | MAN-07.png | ☐ Aprobado ☐ Fallido |
| MAN-08 | HU-06 | RF-07 | Descarga de la plantilla activa como colaborador | MAN-08.png | ☐ Aprobado ☐ Fallido |
| MAN-09 | HU-18, HU-05 | RF-07 | Historial de versiones visible para el admin | MAN-09.png | ☐ Aprobado ☐ Fallido |
| MAN-10 | HU-05 | RF-07 | Publicar nueva versión arrastrando el archivo | MAN-10.png | ☐ Aprobado ☐ Fallido |
| MAN-11 | HU-15 | RF-10, RNF-04 | Portal en celular real | MAN-11.png | ☐ Aprobado ☐ Fallido |
| MAN-12 | HU-14 | RF-09 | Seleccionar fotos del portafolio | MAN-12.png | ☐ Aprobado ☐ Fallido |
| MAN-13 | HU-14, HU-15 | RF-09, RF-10 | Ocultar y reordenar en el portal | MAN-13.png | ☐ Aprobado ☐ Fallido |
| MAN-14 | — | RNF-06 | Modo oscuro predeterminado y modo claro | MAN-14.png | ☐ Aprobado ☐ Fallido |
| MAN-15 | HU-09 | RF-01 | Doble confirmación al eliminar usuario | MAN-15.png | ☐ Aprobado ☐ Fallido |
| MAN-16 | HU-09 | RF-01, RNF-02 | Usuario desactivado no puede entrar | MAN-16.png | ☐ Aprobado ☐ Fallido |
| MAN-17 | HU-01, HU-03 | RNF-01 | Flujo completo cronometrado | MAN-17.png | ☐ Aprobado ☐ Fallido |
| MAN-18 | HU-17 | RF-11 | Ficha del cliente con eventos y cotizaciones | MAN-18.png | ☐ Aprobado ☐ Fallido |
| MAN-19 | HU-07 | RF-04 | Editar producto desde la pantalla de catálogo | MAN-19.png | ☐ Aprobado ☐ Fallido |
| MAN-20 | HU-09 | RF-01, RNF-02 | Sesión abierta más de una hora | MAN-20.png | ☐ Aprobado ☐ Fallido |

## MAN-01 · PDF de cotización frente al formato corporativo

**HU:** HU-03 · **RF/RNF:** RF-05, RNF-06 · **Captura:** `evidencias/pruebas/manual/MAN-01.png`

**Precondiciones:** Cotización con ítems de 2 rubros, descuento e IVA.

**Pasos:**

1. Abrir el evento y la pestaña Cotizaciones.
2. Descargar el PDF.
3. Compararlo con la plantilla corporativa impresa o en PDF.

**Resultado esperado:** Logo, firma, tipografía, colores, márgenes, tabla agrupada por rubro y totales coinciden con el formato corporativo.

- [ ] Aprobado
- [ ] Fallido

**Observaciones:** ______________________________________________

## MAN-02 · PDF de orden de servicio frente al formato corporativo

**HU:** HU-04 · **RF/RNF:** RF-06, RNF-06 · **Captura:** `evidencias/pruebas/manual/MAN-02.png`

**Precondiciones:** Orden con proveedor, fechas y anticipo.

**Pasos:**

1. Abrir la pestaña Órdenes de servicio.
2. Descargar el PDF.
3. Comparar con el formato corporativo.

**Resultado esperado:** Encabezado, datos del proveedor, fechas, tabla por rubro y forma de pago con el formato corporativo.

- [ ] Aprobado
- [ ] Fallido

**Observaciones:** ______________________________________________

## MAN-03 · XLSX de cotización en Excel

**HU:** HU-03 · **RF/RNF:** RF-05 · **Captura:** `evidencias/pruebas/manual/MAN-03.png`

**Precondiciones:** Cotización existente.

**Pasos:**

1. Descargar el XLSX.
2. Abrirlo en Excel o LibreOffice.
3. Intentar editar una celda protegida.

**Resultado esperado:** Estilos y celdas combinadas correctos; la hoja está protegida.

- [ ] Aprobado
- [ ] Fallido

**Observaciones:** ______________________________________________

## MAN-04 · Arrastrar y soltar archivos

**HU:** HU-12 · **RF/RNF:** RF-08 · **Captura:** `evidencias/pruebas/manual/MAN-04.png`

**Precondiciones:** Sesión de colaborador; evento abierto en Archivos.

**Pasos:**

1. Clic en Subir archivo.
2. Arrastrar una foto JPG a la zona punteada.
3. Elegir categoría Foto y guardar.

**Resultado esperado:** La zona se resalta al arrastrar; el archivo aparece con nombre, categoría, fecha y autor.

- [ ] Aprobado
- [ ] Fallido

**Observaciones:** ______________________________________________

## MAN-05 · Categoría personalizada

**HU:** HU-12 · **RF/RNF:** RF-08 · **Captura:** `evidencias/pruebas/manual/MAN-05.png`

**Precondiciones:** Evento abierto en Archivos.

**Pasos:**

1. Subir archivo y elegir «Personalizada».
2. Escribir «Planos».
3. Guardar.

**Resultado esperado:** El archivo queda en la categoría Planos y aparece un filtro «Planos».

- [ ] Aprobado
- [ ] Fallido

**Observaciones:** ______________________________________________

## MAN-06 · Renombrar archivo y abrir el enlace

**HU:** HU-13 · **RF/RNF:** RF-08 · **Captura:** `evidencias/pruebas/manual/MAN-06.png`

**Precondiciones:** Archivo subido.

**Pasos:**

1. Clic en el lápiz y cambiar el nombre.
2. Guardar.
3. Clic en Descargar.

**Resultado esperado:** Cambia el nombre visible; la descarga abre el mismo archivo de antes.

- [ ] Aprobado
- [ ] Fallido

**Observaciones:** ______________________________________________

## MAN-07 · Autocompletado de proveedor en pantalla

**HU:** HU-16 · **RF/RNF:** RF-06 · **Captura:** `evidencias/pruebas/manual/MAN-07.png`

**Precondiciones:** Proveedor «Sonido Total SAS» en el directorio.

**Pasos:**

1. Nueva orden de servicio.
2. Escribir «Soni» en Proveedor.
3. Elegir la sugerencia.

**Resultado esperado:** Se llenan razón social, contacto, correo y celular.

- [ ] Aprobado
- [ ] Fallido

**Observaciones:** ______________________________________________

## MAN-08 · Descarga de la plantilla activa como colaborador

**HU:** HU-06 · **RF/RNF:** RF-07 · **Captura:** `evidencias/pruebas/manual/MAN-08.png`

**Precondiciones:** Plantilla con v2 activa; sesión de colaborador.

**Pasos:**

1. Abrir Plantillas.
2. Clic en el icono Descargar.

**Resultado esperado:** Se descarga la v2; no hay botón de historial, publicar ni eliminar.

- [ ] Aprobado
- [ ] Fallido

**Observaciones:** ______________________________________________

## MAN-09 · Historial de versiones visible para el admin

**HU:** HU-18, HU-05 · **RF/RNF:** RF-07 · **Captura:** `evidencias/pruebas/manual/MAN-09.png`

**Precondiciones:** Plantilla con v1 y v2; sesión de admin.

**Pasos:**

1. Abrir Plantillas.
2. Clic en el icono de historial.

**Resultado esperado:** Tabla con Ver., Changelog, Fecha y Autor; v2 marcada como activa.

- [ ] Aprobado
- [ ] Fallido

**Observaciones:** ______________________________________________

## MAN-10 · Publicar nueva versión arrastrando el archivo

**HU:** HU-05 · **RF/RNF:** RF-07 · **Captura:** `evidencias/pruebas/manual/MAN-10.png`

**Precondiciones:** Sesión de admin.

**Pasos:**

1. Abrir el historial de una plantilla.
2. Publicar nueva versión.
3. Arrastrar el archivo, escribir la nota y Publicar.

**Resultado esperado:** La nueva versión queda activa y la anterior sigue en el historial.

- [ ] Aprobado
- [ ] Fallido

**Observaciones:** ______________________________________________

## MAN-11 · Portal en celular real

**HU:** HU-15 · **RF/RNF:** RF-10, RNF-04 · **Captura:** `evidencias/pruebas/manual/MAN-11.png`

**Precondiciones:** Teléfono Android o iPhone.

**Pasos:**

1. Abrir /portal en el navegador del teléfono.
2. Recorrer slider, galería y contacto.
3. Tocar el teléfono y el correo.

**Resultado esperado:** Sin desborde horizontal; textos legibles; tel: y mailto: abren las apps.

- [ ] Aprobado
- [ ] Fallido

**Observaciones:** ______________________________________________

## MAN-12 · Seleccionar fotos del portafolio

**HU:** HU-14 · **RF/RNF:** RF-09 · **Captura:** `evidencias/pruebas/manual/MAN-12.png`

**Precondiciones:** Evento con más de 5 archivos de categoría Foto.

**Pasos:**

1. Portafolio → Agregar.
2. Elegir el evento.
3. Intentar seleccionar 6 fotos.

**Resultado esperado:** Solo se ofrecen fotos de categoría Foto; la sexta no se puede seleccionar.

- [ ] Aprobado
- [ ] Fallido

**Observaciones:** ______________________________________________

## MAN-13 · Ocultar y reordenar en el portal

**HU:** HU-14, HU-15 · **RF/RNF:** RF-09, RF-10 · **Captura:** `evidencias/pruebas/manual/MAN-13.png`

**Precondiciones:** Dos items visibles en el portafolio.

**Pasos:**

1. Cambiar el orden de un item.
2. Ocultar el otro.
3. Abrir /portal en otra ventana.

**Resultado esperado:** El portal respeta el nuevo orden y no muestra el item oculto.

- [ ] Aprobado
- [ ] Fallido

**Observaciones:** ______________________________________________

## MAN-14 · Modo oscuro predeterminado y modo claro

**HU:** — · **RF/RNF:** RNF-06 · **Captura:** `evidencias/pruebas/manual/MAN-14.png`

**Precondiciones:** Navegador sin preferencia guardada.

**Pasos:**

1. Abrir /login y el panel.
2. Cambiar a modo claro con el botón de tema.
3. Recorrer Eventos, Cotizaciones y Plantillas.

**Resultado esperado:** Arranca en oscuro; en claro los textos, badges y selects nativos mantienen contraste legible.

- [ ] Aprobado
- [ ] Fallido

**Observaciones:** ______________________________________________

## MAN-15 · Doble confirmación al eliminar usuario

**HU:** HU-09 · **RF/RNF:** RF-01 · **Captura:** `evidencias/pruebas/manual/MAN-15.png`

**Precondiciones:** Sesión de admin y un usuario de prueba.

**Pasos:**

1. Usuarios → Eliminar.
2. Confirmar en el primer diálogo.
3. Confirmar en el segundo.

**Resultado esperado:** Se piden dos confirmaciones; no se puede eliminar la cuenta propia.

- [ ] Aprobado
- [ ] Fallido

**Observaciones:** ______________________________________________

## MAN-16 · Usuario desactivado no puede entrar

**HU:** HU-09 · **RF/RNF:** RF-01, RNF-02 · **Captura:** `evidencias/pruebas/manual/MAN-16.png`

**Precondiciones:** Usuario colaborador activo.

**Pasos:**

1. Como admin, desactivar el usuario.
2. En otra ventana, intentar login con ese usuario.

**Resultado esperado:** El login falla; al reactivarlo vuelve a entrar.

- [ ] Aprobado
- [ ] Fallido

**Observaciones:** ______________________________________________

## MAN-17 · Flujo completo cronometrado

**HU:** HU-01, HU-03 · **RF/RNF:** RNF-01 · **Captura:** `evidencias/pruebas/manual/MAN-17.png`

**Precondiciones:** Sesión de colaborador; cronómetro.

**Pasos:**

1. Crear evento.
2. Abrir el evento y crear una cotización con 3 ítems.
3. Descargar el PDF.
4. Anotar tiempo y clics.

**Resultado esperado:** Cada acción frecuente en máximo 3 clics; el flujo completo en el tiempo objetivo del documento de tesis.

- [ ] Aprobado
- [ ] Fallido

**Observaciones:** ______________________________________________

## MAN-18 · Ficha del cliente con eventos y cotizaciones

**HU:** HU-17 · **RF/RNF:** RF-11 · **Captura:** `evidencias/pruebas/manual/MAN-18.png`

**Precondiciones:** Cliente con 2 eventos y 1 cotización.

**Pasos:**

1. Clientes → abrir la ficha.
2. Revisar eventos y cotizaciones listados.

**Resultado esperado:** Lista sus eventos y cotizaciones. Brecha conocida: hoy solo lista eventos (ver docs/CRITERIOS_VERIFICACION.md).

- [ ] Aprobado
- [ ] Fallido

**Observaciones:** ______________________________________________

## MAN-19 · Editar producto desde la pantalla de catálogo

**HU:** HU-07 · **RF/RNF:** RF-04 · **Captura:** `evidencias/pruebas/manual/MAN-19.png`

**Precondiciones:** Sesión de admin.

**Pasos:**

1. Catálogo → expandir un rubro.
2. Buscar la opción de editar un producto.

**Resultado esperado:** Se puede cambiar nombre, unidad y precio. Brecha conocida: no existe la opción en la UI (la API sí).

- [ ] Aprobado
- [ ] Fallido

**Observaciones:** ______________________________________________

## MAN-20 · Sesión abierta más de una hora

**HU:** HU-09 · **RF/RNF:** RF-01, RNF-02 · **Captura:** `evidencias/pruebas/manual/MAN-20.png`

**Precondiciones:** Sesión iniciada.

**Pasos:**

1. Dejar el panel abierto más de 60 minutos.
2. Navegar entre Eventos y Plantillas.

**Resultado esperado:** La sesión se renueva sola; no se pide la contraseña de nuevo.

- [ ] Aprobado
- [ ] Fallido

**Observaciones:** ______________________________________________
