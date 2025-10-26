/**
 * Utilidades para manejar fechas de vencimiento de tarjetas
 */

/**
 * Verifica si una tarjeta está vencida
 * @param expiryDate Fecha en formato MM/YY
 * @returns true si la tarjeta está vencida
 */
export const isCardExpired = (expiryDate?: string): boolean => {
  if (!expiryDate) return false;

  try {
    // Parsear MM/YY
    const [month, year] = expiryDate.split('/');
    if (!month || !year) return false;

    const expiryMonth = parseInt(month, 10);
    const expiryYear = parseInt(year, 10);

    // Convertir YY a YYYY
    const fullYear = 2000 + expiryYear;

    // Crear fecha del último día del mes de vencimiento
    const expiryDateObj = new Date(fullYear, expiryMonth, 0); // Último día del mes
    const today = new Date();

    // Comparar fechas (solo año y mes)
    const expiryYearMonth = new Date(fullYear, expiryMonth - 1);
    const todayYearMonth = new Date(today.getFullYear(), today.getMonth());

    return todayYearMonth > expiryYearMonth;
  } catch (error) {
    console.error('Error al verificar fecha de vencimiento:', error);
    return false;
  }
};

/**
 * Obtiene el estado de una tarjeta basado en su fecha de vencimiento
 * @param card Tarjeta a verificar
 * @returns Estado de la tarjeta
 */
export const getCardStatus = (card: { expiryDate?: string; status?: string }): "active" | "inactive" => {
  // Si la tarjeta ya tiene un estado definido, respetarlo
  if (card.status === "active" || card.status === "inactive") {
    return card.status;
  }

  // Si no tiene estado definido, verificar si está vencida
  return isCardExpired(card.expiryDate) ? "inactive" : "active";
};

/**
 * Valida y formatea una fecha de vencimiento durante la entrada del usuario
 * @param value Valor ingresado por el usuario
 * @returns Objeto con el valor formateado y si es válido
 */
export const validateAndFormatExpiryInput = (value: string): { formatted: string; isValid: boolean; error?: string } => {
  // Remover espacios y caracteres no numéricos
  const cleanValue = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
  
  // Si está vacío, es válido
  if (cleanValue.length === 0) {
    return { formatted: "", isValid: true };
  }
  
  // Si tiene 1-2 dígitos, solo formatear
  if (cleanValue.length <= 2) {
    return { formatted: cleanValue, isValid: true };
  }
  
  // Si tiene 3-4 dígitos, agregar la barra
  if (cleanValue.length <= 4) {
    const formatted = cleanValue.substring(0, 2) + "/" + cleanValue.substring(2, 4);
    
    // Validar mes (01-12)
    const month = parseInt(cleanValue.substring(0, 2), 10);
    if (month < 1 || month > 12) {
      return { formatted, isValid: false, error: "El mes debe estar entre 01 y 12" };
    }
    
    // Validar año (no puede ser menor al año actual)
    const year = parseInt(cleanValue.substring(2, 4), 10);
    const currentYear = new Date().getFullYear() % 100; // Obtener últimos 2 dígitos
    if (year < currentYear) {
      return { formatted, isValid: false, error: "El año no puede ser menor al actual" };
    }
    
    return { formatted, isValid: true };
  }
  
  // Si tiene más de 4 dígitos, truncar
  const truncated = cleanValue.substring(0, 4);
  const formatted = truncated.substring(0, 2) + "/" + truncated.substring(2, 4);
  
  // Validar mes y año
  const month = parseInt(truncated.substring(0, 2), 10);
  const year = parseInt(truncated.substring(2, 4), 10);
  const currentYear = new Date().getFullYear() % 100;
  
  if (month < 1 || month > 12) {
    return { formatted, isValid: false, error: "El mes debe estar entre 01 y 12" };
  }
  
  if (year < currentYear) {
    return { formatted, isValid: false, error: "El año no puede ser menor al actual" };
  }
  
  return { formatted, isValid: true };
};

/**
 * Formatea una fecha de vencimiento para mostrar
 * @param expiryDate Fecha en formato MM/YY
 * @returns Fecha formateada o mensaje de vencimiento
 */
export const formatExpiryDate = (expiryDate?: string): string => {
  if (!expiryDate) return "Sin fecha";

  if (isCardExpired(expiryDate)) {
    return `${expiryDate} (Vencida)`;
  }

  return expiryDate;
};

/**
 * Obtiene el color del estado de una tarjeta
 * @param card Tarjeta a verificar
 * @returns Clase CSS para el color
 */
export const getCardStatusColor = (card: { expiryDate?: string; status?: string }): string => {
  const cardStatus = getCardStatus(card);
  
  if (cardStatus === "inactive") {
    return "bg-red-100 text-red-800";
  }
  
  return "bg-green-100 text-green-800";
};

/**
 * Obtiene el texto del estado de una tarjeta
 * @param card Tarjeta a verificar
 * @returns Texto del estado
 */
export const getCardStatusText = (card: { expiryDate?: string; status?: string }): string => {
  const cardStatus = getCardStatus(card);
  
  if (cardStatus === "inactive") {
    if (isCardExpired(card.expiryDate)) {
      return "Vencida";
    }
    return "Inactiva";
  }
  
  return "Activa";
};
