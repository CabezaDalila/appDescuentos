import {
  deleteDiscountRow,
  deleteDiscountRows,
} from "@/lib/data/discounts-data";

// Eliminar un descuento específico por ID
export const deleteDiscount = async (discountId: string): Promise<void> => {
  try {
    await deleteDiscountRow(discountId);
  } catch (error) {
    console.error("Error al eliminar descuento:", error);
    throw error;
  }
};

// Eliminar múltiples descuentos por IDs
export const deleteMultipleDiscounts = async (
  discountIds: string[]
): Promise<void> => {
  try {
    await deleteDiscountRows(discountIds);
  } catch (error) {
    console.error("Error al eliminar descuentos:", error);
    throw error;
  }
};
