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

/**
 * Verifica si una tarjeta está próxima a vencer (dentro de 3 meses)
 * @param expiry - Fecha en formato MM/YY
 * @returns true si está próxima a vencer
 */
export const isExpiringSoon = (expiry: string): boolean => {
  if (!expiry || !validateExpiry(expiry)) return false;
  
  const [month, year] = expiry.split('/');
  const cardYear = 2000 + parseInt(year); // Convertir a año completo
  const cardMonth = parseInt(month);
  
  const cardDate = new Date(cardYear, cardMonth - 1); // Mes es 0-indexado
  const threeMonthsFromNow = new Date();
  threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
  
  return cardDate <= threeMonthsFromNow;
};

/**
 * Obtiene el estado de la tarjeta basado en su fecha de vencimiento
 * @param expiry - Fecha en formato MM/YY
 * @returns 'expired' | 'expiring-soon' | 'valid'
 */
export const getCardExpiryStatus = (expiry: string): 'expired' | 'expiring-soon' | 'valid' => {
  if (!expiry) return 'valid';
  
  if (!validateExpiry(expiry)) return 'expired';
  
  if (isExpiringSoon(expiry)) return 'expiring-soon';
  
  return 'valid';
};
