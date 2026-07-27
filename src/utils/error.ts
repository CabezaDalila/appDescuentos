/**
 * Extrae un mensaje legible de un valor de error de tipo `unknown`
 * (lo que entrega un bloque catch bajo `strict`). Evita el uso de `any`.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "";
}
