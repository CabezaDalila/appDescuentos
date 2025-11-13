/**
 * Utilidades para el manejo de tarjetas de membresía
 */

/**
 * Valida el formato de fecha de vencimiento de una tarjeta
 * @param expiry - Fecha en formato MM/YY
 * @returns true si el formato es válido y no es una fecha pasada
 */
export const validateExpiry = (expiry: string): boolean => {
  if (!expiry) return true; // Opcional
  
  const expiryRegex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
  if (!expiryRegex.test(expiry)) {
    return false;
  }
  
  const [month, year] = expiry.split('/');
  const currentYear = new Date().getFullYear() % 100; // Últimos 2 dígitos
  const currentMonth = new Date().getMonth() + 1;
  
  const cardYear = parseInt(year);
  const cardMonth = parseInt(month);
  
  // Verificar que no sea una fecha pasada
  if (cardYear < currentYear || (cardYear === currentYear && cardMonth < currentMonth)) {
    return false;
  }
  
  return true;
};

/**
 * Formatea automáticamente la entrada de fecha de vencimiento
 * @param value - Valor de entrada del usuario
 * @returns Valor formateado en MM/YY
 */
export const formatExpiryInput = (value: string): string => {
  let formatted = value.replace(/\D/g, ''); // Solo números
  if (formatted.length >= 2) {
    formatted = formatted.substring(0, 2) + '/' + formatted.substring(2, 4);
  }
  return formatted;
};

