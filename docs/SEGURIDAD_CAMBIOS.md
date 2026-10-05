# Cambios de seguridad — verificación de sesión en API Routes

Antes, la mayoría de las API Routes autorizaba leyendo la cookie `magik_role`.
Esa cookie no es httpOnly, guarda el rol en texto plano y se puede editar desde
DevTools. Ahora toda autorización del servidor pasa por `lib/session.ts`:

- `requireSession(request)`: verifica `magik_token` con `firebase-admin`
  (`verifyIdToken`). Toma el rol del custom claim `role` y, si no existe, lo lee
  de `users/{uid}.role` con el Admin SDK. Responde 401 con `no_session`,
  `session_expired` o `invalid_session`.
- `requireAdmin(request)`: igual que `requireSession`, pero además responde
  403 `forbidden` si el rol no es `admin`.

`magik_role` sigue existiendo solo para la UI del cliente (sidebar, botones) y
para las redirecciones de `middleware.ts`. Ningún handler la usa para autorizar.

Convenciones de la tabla:

- **Cookie rol (any)**: `magik_role` igual a `admin` o `collaborator`, sin verificar el token.
- **Cookie rol = admin**: `magik_role === "admin"`, sin verificar el token.
- **+ token**: además verificaba `magik_token` con `verifyTokenSafe`, pero el rol seguía saliendo de la cookie.

| Ruta | Método | Auth antes | Auth después |
|---|---|---|---|
| /api/admin/users | GET | Cookie rol = admin | requireAdmin |
| /api/admin/users | POST | Cookie rol = admin | requireAdmin |
| /api/admin/users/[uid] | PATCH | Cookie rol = admin | requireAdmin |
| /api/admin/users/[uid] | DELETE | Cookie rol = admin + token (solo si existía) | requireAdmin (bloquea la auto-eliminación con `auth.uid`) |
| /api/auth/logout | POST | Pública | Pública (sin cambios) |
| /api/auth/session | POST | Verifica el idToken del body | Sin cambios (es la ruta que crea la sesión) |
| /api/auth/set-role | POST | Cookie rol = admin | requireAdmin |
| /api/catalog | GET | Cookie rol (any) | requireSession |
| /api/catalog | PUT | Cookie rol = admin | requireAdmin |
| /api/catalog/rubros | POST | Cookie rol (any) | requireSession |
| /api/catalog/rubros/[rubroId] | PATCH | Cookie rol = admin | requireAdmin |
| /api/catalog/rubros/[rubroId] | DELETE | Cookie rol = admin | requireAdmin |
| /api/catalog/rubros/[rubroId]/products | POST | Cookie rol (any) | requireSession |
| /api/catalog/rubros/[rubroId]/products/[productId] | PATCH | Cookie rol = admin | requireAdmin |
| /api/catalog/rubros/[rubroId]/products/[productId] | DELETE | Cookie rol = admin | requireAdmin |
| /api/clients | GET | Cookie rol (any) | requireSession |
| /api/clients | POST | Cookie rol = admin + token | requireSession |
| /api/clients/[id] | GET | Cookie rol (any) | requireSession |
| /api/clients/[id] | PATCH | Cookie rol = admin | requireAdmin |
| /api/clients/[id] | DELETE | Cookie rol = admin | requireAdmin |
| /api/events | GET | Cookie rol (any) | requireSession |
| /api/events | POST | Cookie rol (any) + token | requireSession |
| /api/events/[id] | GET | Cookie rol (any) | requireSession |
| /api/events/[id] | PATCH | Cookie rol (any) | requireSession |
| /api/events/[id] | DELETE | Cookie rol = admin | requireAdmin |
| /api/events/[id]/files | GET | Cookie rol (any) | requireSession |
| /api/events/[id]/files | POST | Cookie rol (any) + token | requireSession |
| /api/events/[id]/files/[fileId] | PATCH | Cookie rol (any) | requireSession |
| /api/events/[id]/files/[fileId] | DELETE | Cookie rol (any) | requireAdmin |
| /api/events/[id]/orders | GET | Cookie rol (any) | requireSession |
| /api/events/[id]/orders | POST | Cookie rol (any) + token | requireSession |
| /api/events/[id]/orders/[orderId] | GET | Cookie rol (any) | requireSession |
| /api/events/[id]/orders/[orderId] | PATCH | Cookie rol (any) | requireSession |
| /api/events/[id]/orders/[orderId] | DELETE | Cookie rol (any) | requireAdmin |
| /api/events/[id]/orders/[orderId]/pdf | GET | Cookie rol (any) | requireSession |
| /api/events/[id]/orders/[orderId]/xlsx | GET | Cookie rol (any) | requireSession |
| /api/events/[id]/quotes | GET | Cookie rol (any) | requireSession |
| /api/events/[id]/quotes | POST | Cookie rol (any) + token | requireSession |
| /api/events/[id]/quotes/[quoteId] | GET | Cookie rol (any) | requireSession |
| /api/events/[id]/quotes/[quoteId] | PATCH | Cookie rol (any) | requireSession |
| /api/events/[id]/quotes/[quoteId] | DELETE | Cookie rol (any) | requireAdmin |
| /api/events/[id]/quotes/[quoteId]/duplicate | POST | Cookie rol (any) | requireSession |
| /api/events/[id]/quotes/[quoteId]/pdf | GET | Cookie rol (any) | requireSession |
| /api/events/[id]/quotes/[quoteId]/xlsx | GET | Cookie rol (any) | requireSession |
| /api/portfolio | GET | Pública; la cookie de rol decidía si se veían los items ocultos | Pública; con sesión verificada devuelve todos, sin ella solo los visibles |
| /api/portfolio | POST | Cookie rol = admin + token | requireAdmin |
| /api/portfolio/[id] | PATCH | Cookie rol = admin + token | requireAdmin |
| /api/portfolio/[id] | DELETE | Cookie rol = admin + token | requireAdmin |
| /api/providers | GET | Cookie rol (any) | requireSession |
| /api/providers | POST | Cookie rol = admin + token | requireAdmin (RF-10) |
| /api/providers/[id] | PATCH | Cookie rol = admin | requireAdmin |
| /api/providers/[id] | DELETE | Cookie rol = admin | requireAdmin |
| /api/templates | GET | Cookie rol (any) | requireSession |
| /api/templates | POST | Cookie rol = admin + token | requireAdmin |
| /api/templates/[id] | GET | Cookie rol (any) | requireSession |
| /api/templates/[id] | PATCH | Cookie rol = admin + token | requireAdmin |
| /api/templates/[id] | DELETE | Cookie rol = admin | requireAdmin |
| /api/templates/[id]/versions | GET | Cookie rol (any) | requireAdmin (RF-04, HU-06) |
| /api/templates/[id]/versions | POST | Cookie rol = admin + token | requireAdmin |

## Cambios de permisos (no solo de mecanismo)

- **Más restrictivos**: DELETE de archivos, cotizaciones y órdenes de un evento
  pasa de cualquier rol a solo admin.
- **Más restrictivos (requisitos oficiales)**: POST `/api/providers` vuelve a ser
  solo admin (RF-10: el administrador crea o elimina proveedores) y GET
  `/api/templates/[id]/versions` pasa a solo admin (RF-04 y HU-06: el colaborador
  solo accede a la versión activa; el historial es del administrador).
- **Más abiertos**: POST `/api/clients` pasa de solo admin a cualquier sesión
  válida, para que un colaborador pueda crear clientes. Nota: RF-11 lista solo
  al rol Admin; revisar si debe volver a `requireAdmin`.

## Otros cambios

- `middleware.ts`: se agregó un comentario que aclara que solo redirige la
  navegación y que la autorización real ocurre en las API Routes.
- `lib/firebase.ts`: se eliminó la exportación `db = getFirestore(app)` del
  cliente, que nadie importaba. El navegador solo usa Auth y Storage.
