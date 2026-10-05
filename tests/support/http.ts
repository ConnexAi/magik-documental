import request from "supertest";
import { BASE_URL } from "./env";
import { sessionCookie } from "./auth";

export const api = () => request(BASE_URL);

export type Who = "anon" | "forged" | "admin" | "collaborator";

// Cookie según el actor. "forged" = magik_role=admin escrito a mano en
// DevTools, sin token: el caso que antes autorizaba y ahora debe dar 401.
export async function cookieFor(who: Who): Promise<string | undefined> {
  if (who === "anon") return undefined;
  if (who === "forged") return "magik_role=admin";
  return sessionCookie(who);
}

type Method = "get" | "post" | "patch" | "put" | "delete";

export async function call(who: Who, method: Method, path: string, body?: unknown) {
  const cookie = await cookieFor(who);
  let req = api()[method](path);
  if (cookie) req = req.set("Cookie", cookie);
  if (body !== undefined) req = req.send(body as object);
  return req;
}
