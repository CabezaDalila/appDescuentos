// Constantes para el panel de administración

export const ADMIN_CONSTANTS = {
  // Mensajes de éxito
  SUCCESS_MESSAGES: {
    DISCOUNT_CREATED: "Descuento creado correctamente",
    DISCOUNT_UPDATED: "Descuento actualizado correctamente",
    DISCOUNT_DELETED: "Descuento eliminado correctamente",
    DISCOUNT_VISIBILITY_CHANGED: (visible: boolean) =>
      `Descuento ${visible ? "mostrado" : "ocultado"} correctamente`,
    MULTIPLE_DISCOUNTS_DELETED: (count: number) =>
      `${count} descuentos eliminados correctamente`,
  },

  // Mensajes de error
  ERROR_MESSAGES: {
    LOAD_DISCOUNTS: "Error al cargar descuentos manuales",
    CREATE_DISCOUNT: "Error al crear el descuento",
    UPDATE_DISCOUNT: "Error al actualizar el descuento",
    DELETE_DISCOUNT: "Error al eliminar descuento",
    DELETE_MULTIPLE_DISCOUNTS: "Error al eliminar descuentos",
    TOGGLE_VISIBILITY: "Error al cambiar visibilidad del descuento",
    VALIDATION_REQUIRED_FIELDS:
      "Por favor completa todos los campos requeridos",
    NO_DISCOUNTS_SELECTED: "No hay descuentos seleccionados",
  },

  // Textos de la interfaz
  UI_TEXT: {
    HEADER_TITLE: "Descuentos Manuales",
    HEADER_DESCRIPTION:
      "Carga descuentos manualmente para complementar la extracción automática",
    NEW_DISCOUNT_BUTTON: "Nuevo Descuento",
    CANCEL_BUTTON: "Cancelar",
    SAVE_BUTTON: "Guardar Descuento",
    UPDATE_BUTTON: "Actualizar Descuento",
    DELETE_BUTTON: "Eliminar",
    EDIT_BUTTON: "Editar",
    SELECT_ALL: "Seleccionar todos",
    DISCOUNTS_COUNT: (count: number) => `${count} descuentos`,
    NO_DISCOUNTS_MESSAGE: "No hay descuentos manuales cargados.",
    NO_DISCOUNTS_SUBTITLE:
      "Crea el primero para comenzar a gestionar ofertas manualmente.",
  },

  // Configuración de formulario
  FORM_CONFIG: {
    REQUIRED_FIELDS: ["title", "origin", "category", "expirationDate"],
    DEFAULT_VISIBILITY: true,
    MIN_DATE: new Date().toISOString().split("T")[0],
  },

  // Configuración de confirmaciones
  CONFIRMATION_MESSAGES: {
    DELETE_SINGLE: (title: string) =>
      `¿Estás seguro de que quieres eliminar el descuento "${title}"? Esta acción no se puede deshacer.`,
    DELETE_MULTIPLE: (count: number) =>
      `¿Estás seguro de que quieres eliminar ${count} descuentos seleccionados? Esta acción no se puede deshacer.`,
  },
} as const;

// Tipos derivados de las constantes
export type SuccessMessageKey = keyof typeof ADMIN_CONSTANTS.SUCCESS_MESSAGES;
export type ErrorMessageKey = keyof typeof ADMIN_CONSTANTS.ERROR_MESSAGES;
export type UITextKey = keyof typeof ADMIN_CONSTANTS.UI_TEXT;
