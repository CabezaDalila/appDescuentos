/**
 * Utilidades para generar URLs del sitio
 */

/**
 * Genera la URL completa de un descuento
 * @param discountId ID del descuento
 * @returns URL completa del descuento
 */
export function getDiscountUrl(discountId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return `${baseUrl}/discount/${discountId}`;
}

/**
 * Genera la URL base del sitio
 * @returns URL base del sitio
 */
export function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}
