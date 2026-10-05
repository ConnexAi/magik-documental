import type { Provider, ServiceOrder } from "@/lib/types";

export type ProviderOrderFields = Required<
  Pick<
    ServiceOrder,
    "providerId" | "providerName" | "nitProveedor" | "razonSocial" | "contactoProveedor" | "emailProveedor" | "celularProveedor"
  >
>;

// Campos de la orden de servicio que se llenan al elegir un proveedor en el
// autocompletado. Provider no tiene NIT ni razón social propios: la razón
// social se toma del nombre y el NIT queda vacío para diligenciarlo a mano.
export function providerToOrderFields(p: Provider): ProviderOrderFields {
  return {
    providerId: p.id,
    providerName: p.name,
    nitProveedor: "",
    razonSocial: p.name,
    contactoProveedor: p.contact ?? "",
    emailProveedor: p.email ?? "",
    celularProveedor: p.phone ?? "",
  };
}
