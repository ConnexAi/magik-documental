import { API_KEY, EMULATOR, USERS } from "./env";

type TestUser = keyof typeof USERS;

const tokenCache = new Map<TestUser, string>();

// Inicia sesión contra el Auth Emulator por REST y devuelve el ID token
// (incluye el custom claim "role" asignado en la semilla).
export async function getIdToken(user: TestUser): Promise<string> {
  const cached = tokenCache.get(user);
  if (cached) return cached;
  const { email, password } = USERS[user];
  const res = await fetch(
    `http://${EMULATOR.auth}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );
  if (!res.ok) throw new Error(`Login de ${email} en el emulador falló: ${res.status}`);
  const body = (await res.json()) as { idToken: string };
  tokenCache.set(user, body.idToken);
  return body.idToken;
}

// Cookies tal como las deja /api/auth/session después del login
export async function sessionCookie(user: TestUser): Promise<string> {
  const token = await getIdToken(user);
  return `magik_token=${token}; magik_role=${USERS[user].role}`;
}

// Caso crítico de seguridad: rol "admin" falsificado sin token válido
export const FORGED_ADMIN_COOKIE = "magik_role=admin";
export const FORGED_TOKEN_COOKIE = "magik_token=no-es-un-jwt; magik_role=admin";
