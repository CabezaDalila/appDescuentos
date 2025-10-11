import {
  createManualDiscount,
  getManualDiscounts,
  updateManualDiscount,
} from "@/lib/admin";
import { deleteDiscount, deleteMultipleDiscounts } from "@/lib/discount-utils";
import { ManualDiscount } from "@/types/admin";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

interface UseDiscountsReturn {
  discounts: ManualDiscount[];
  loading: boolean;
  deleting: boolean;
  loadDiscounts: () => Promise<void>;
  createDiscount: (
    discountData: Omit<ManualDiscount, "id" | "createdAt" | "updatedAt">
  ) => Promise<void>;
  updateDiscount: (
    id: string,
    updates: Partial<ManualDiscount>
  ) => Promise<void>;
  deleteDiscountById: (id: string) => Promise<void>;
  deleteMultipleDiscountsByIds: (ids: string[]) => Promise<void>;
  toggleVisibility: (id: string, currentVisibility: boolean) => Promise<void>;
}

export function useDiscounts(): UseDiscountsReturn {
  const [discounts, setDiscounts] = useState<ManualDiscount[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const loadDiscounts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getManualDiscounts();
      setDiscounts(data);
    } catch (error) {
      if (error instanceof Error && error.message.includes("index")) {
        setDiscounts([]);
      } else {
        toast.error("Error al cargar descuentos manuales");
        console.error(error);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const createDiscount = useCallback(
    async (
      discountData: Omit<ManualDiscount, "id" | "createdAt" | "updatedAt">
    ) => {
      try {
        await createManualDiscount(discountData);
        toast.success("Descuento creado correctamente");

        const data = await getManualDiscounts();
        setDiscounts(data);
      } catch (error) {
        toast.error("Error al crear el descuento");
        console.error(error);
        throw error;
      }
    },
    [] // Sin dependencias para evitar ciclos
  );

  const updateDiscount = useCallback(
    async (id: string, updates: Partial<ManualDiscount>) => {
      try {
        await updateManualDiscount(id, updates);
        toast.success("Descuento actualizado correctamente");

        const data = await getManualDiscounts();
        setDiscounts(data);
      } catch (error) {
        toast.error("Error al actualizar el descuento");
        console.error(error);
        throw error;
      }
    },
    [] // Sin dependencias para evitar ciclos
  );

  const deleteDiscountById = useCallback(
    async (id: string) => {
      try {
        setDeleting(true);
        await deleteDiscount(id);
        toast.success("Descuento eliminado correctamente");

        const data = await getManualDiscounts();
        setDiscounts(data);
      } catch (error) {
        console.error("Error al eliminar descuento:", error);
        toast.error("Error al eliminar descuento");
        throw error;
      } finally {
        setDeleting(false);
      }
    },
    [] // Sin dependencias para evitar ciclos
  );

  const deleteMultipleDiscountsByIds = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) {
        toast.error("No hay descuentos seleccionados");
        return;
      }

      try {
        setDeleting(true);
        await deleteMultipleDiscounts(ids);
        toast.success(`${ids.length} descuentos eliminados correctamente`);
        const data = await getManualDiscounts();
        setDiscounts(data);
      } catch (error) {
        console.error("Error al eliminar descuentos:", error);
        toast.error("Error al eliminar descuentos");
        throw error;
      } finally {
        setDeleting(false);
      }
    },
    [] // Sin dependencias para evitar ciclos
  );

  const toggleVisibility = useCallback(
    async (id: string, currentVisibility: boolean) => {
      try {
        await updateDiscount(id, { isVisible: !currentVisibility });
        toast.success(
          `Descuento ${
            !currentVisibility ? "mostrado" : "ocultado"
          } correctamente`
        );
      } catch (error) {
        console.error("Error al cambiar visibilidad:", error);
        toast.error("Error al cambiar visibilidad del descuento");
      }
    },
    [updateDiscount]
  );

  useEffect(() => {
    loadDiscounts();
  }, [loadDiscounts]);

  return {
    discounts,
    loading,
    deleting,
    loadDiscounts,
    createDiscount,
    updateDiscount,
    deleteDiscountById,
    deleteMultipleDiscountsByIds,
    toggleVisibility,
  };
}
