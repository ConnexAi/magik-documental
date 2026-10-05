import { BASE_URL } from "./env";
import { sessionCookie } from "./auth";

// Descarga binaria autenticada (PDF/XLSX) con fetch para obtener el Buffer
export async function download(path: string): Promise<{ status: number; type: string; disposition: string; buffer: Buffer }> {
  const res = await fetch(`${BASE_URL}${path}`, { headers: { cookie: await sessionCookie("collaborator") } });
  return {
    status: res.status,
    type: res.headers.get("content-type") ?? "",
    disposition: res.headers.get("content-disposition") ?? "",
    buffer: Buffer.from(await res.arrayBuffer()),
  };
}
