import { ConfirmationModal } from "@/components/Share/confirmation-modal";
import { DiscountCard } from "@/components/admin/discounts/ui/DiscountCard";
import { DiscountForm } from "@/components/admin/discounts/ui/DiscountForm/DiscountForm";
import { DiscountsEmptyState } from "@/components/admin/discounts/ui/DiscountsEmptyState";
import { DiscountsSelectAll } from "@/components/admin/discounts/ui/DiscountsSelectAll";
import { DiscountsSelectionBar } from "@/components/admin/discounts/ui/DiscountsSelectionBar";
import { useConfirmation } from "@/hooks/useConfirmation";
import { useDiscountForm } from "@/hooks/useDiscountForm";
import { useDiscounts } from "@/hooks/useDiscounts";
import { deleteField } from "@/lib/firebase/firebase";
import { ManualDiscount } from "@/types/admin";
import { useState } from "react";
import toast from "react-hot-toast";

interface ManualDiscountsManagerProps {
  showForm?: boolean;
  onShowFormChange?: (show: boolean) => void;
}

/**
 * Componente principal para la gestión de descuentos manuales
 *
 * Este componente permite:
 * - Crear nuevos descuentos manuales
 * - Editar descuentos existentes
 * - Eliminar descuentos individuales o múltiples
 * - Controlar la visibilidad de los descuentos
 * - Selección múltiple para operaciones en lote
 *
 * @author [Tu Nombre] - Tesis de Grado
 * @version 1.0.0
 */
export function ManualDiscountsManager({
  showForm: externalShowForm,
  onShowFormChange,
}: ManualDiscountsManagerProps = {}) {
  // Hooks personalizados para separar la lógica de negocio
  const {
    discounts,
    loading,
    deleting,
    createDiscount,
    updateDiscount,
    deleteDiscountById,
    deleteMultipleDiscountsByIds,
    toggleVisibility,
  } = useDiscounts();

  const {
    formData,
    showForm: internalShowForm,
    editingDiscount,
    setShowForm: setInternalShowForm,
    setFormData,
    handleCategoryChange,
    handleEditDiscount,
    resetForm,
    validateForm,
  } = useDiscountForm();

  // Usar el estado externo si se proporciona, sino usar el interno
  const showForm =
    externalShowForm !== undefined ? externalShowForm : internalShowForm;
  const setShowForm = (value: boolean) => {
    if (onShowFormChange) {
      onShowFormChange(value);
    } else {
      setInternalShowForm(value);
    }
  };

  const { confirmationModal, showConfirmation, hideConfirmation } =
    useConfirmation();

  // Estado local para selección múltiple
  const [selectedDiscounts, setSelectedDiscounts] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Handlers para operaciones de eliminación
  const handleDeleteDiscount = (discountId: string) => {
    const discount = discounts.find((d) => d.id === discountId);
    showConfirmation({
      title: "Eliminar Descuento",
      description: `¿Estás seguro de que deseas eliminar "${
        discount?.title || "este descuento"
      }"? Esta acción no se puede deshacer.`,
      variant: "destructive",
      onConfirm: () => deleteDiscountById(discountId),
    });
  };

  const handleDeleteSelected = () => {
    if (selectedDiscounts.length === 0) {
      return;
    }

    showConfirmation({
      title: "Eliminar Múltiples Descuentos",
      description: `¿Estás seguro de que deseas eliminar ${selectedDiscounts.length} descuento(s)? Esta acción no se puede deshacer.`,
      variant: "destructive",
      onConfirm: () => {
        deleteMultipleDiscountsByIds(selectedDiscounts);
        setSelectedDiscounts([]);
      },
    });
  };

  // Handler para editar que actualiza el estado externo si existe
  const handleEdit = (discount: ManualDiscount) => {
    handleEditDiscount(discount);
    setShowForm(true);
  };

  // Handlers para selección múltiple
  const handleSelectDiscount = (discountId: string) => {
    setSelectedDiscounts((prev) =>
      prev.includes(discountId)
        ? prev.filter((id) => id !== discountId)
        : [...prev, discountId]
    );
  };

  const handleSelectAll = () => {
    if (selectedDiscounts.length === discounts.length) {
      setSelectedDiscounts([]);
    } else {
      setSelectedDiscounts(discounts.map((d) => d.id!));
    }
  };

  // Handler para el formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (submitting) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      // Evitar duplicados por título cuando es creación
      if (!editingDiscount) {
        const normalizedTitle = formData.title.trim().toLowerCase();
        const duplicated = discounts.some(
          (d) => d.title?.trim().toLowerCase() === normalizedTitle
        );
        if (duplicated) {
          toast.error("Ya existe un descuento con el mismo título");
          setSubmitting(false);
          return;
        }
      }

      const discountData: any = {
        title: formData.title.trim(),
        origin: formData.origin.trim(),
        category: formData.category!,
        expirationDate: new Date(formData.expirationDate),
        description: formData.description.trim(),
        isVisible: formData.isVisible,
      };

      if (editingDiscount) {
        if (formData.availableCredentials.length > 0) {
          discountData.availableCredentials = formData.availableCredentials;
        } else {
          discountData.availableCredentials = deleteField();
        }

        if (formData.availableMemberships.length > 0) {
          discountData.availableMemberships = formData.availableMemberships;
        } else {
          discountData.availableMemberships = deleteField();
        }

        if (
          formData.discountPercentage &&
          formData.discountPercentage.trim() !== ""
        ) {
          discountData.discountPercentage = parseFloat(
            formData.discountPercentage
          );
        } else {
          discountData.discountPercentage = deleteField();
        }

        if (formData.discountAmount && formData.discountAmount.trim() !== "") {
          discountData.discountAmount = parseFloat(formData.discountAmount);
        } else {
          discountData.discountAmount = deleteField();
        }

        if (formData.imageUrl && formData.imageUrl.trim() !== "") {
          discountData.imageUrl = formData.imageUrl.trim();
        } else {
          discountData.imageUrl = deleteField();
        }

        if (formData.url && formData.url.trim() !== "") {
          discountData.url = formData.url.trim();
        } else {
          discountData.url = deleteField();
        }

        if (formData.locationAddress && formData.locationCoordinates) {
          discountData.location = {
            latitude: formData.locationCoordinates.lat,
            longitude: formData.locationCoordinates.lng,
            address: formData.locationAddress,
          };
        } else {
          discountData.location = deleteField();
        }
      } else {
        if (formData.availableCredentials.length > 0) {
          discountData.availableCredentials = formData.availableCredentials;
        }
        if (formData.availableMemberships.length > 0) {
          discountData.availableMemberships = formData.availableMemberships;
        }
        if (
          formData.discountPercentage &&
          formData.discountPercentage.trim() !== ""
        ) {
          discountData.discountPercentage = parseFloat(
            formData.discountPercentage
          );
        }
        if (formData.discountAmount && formData.discountAmount.trim() !== "") {
          discountData.discountAmount = parseFloat(formData.discountAmount);
        }
        if (formData.imageUrl && formData.imageUrl.trim() !== "") {
          discountData.imageUrl = formData.imageUrl.trim();
        }
        if (formData.url && formData.url.trim() !== "") {
          discountData.url = formData.url.trim();
        }
        if (formData.locationAddress && formData.locationCoordinates) {
          discountData.location = {
            latitude: formData.locationCoordinates.lat,
            longitude: formData.locationCoordinates.lng,
            address: formData.locationAddress,
          };
        }
      }

      if (editingDiscount) {
        await updateDiscount(editingDiscount.id!, discountData);
      } else {
        await createDiscount(discountData);
      }

      setShowForm(false);
      resetForm();
    } catch (error) {
      // El error ya se maneja en los hooks
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  // Estados de carga
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Formulario para crear y editar descuentos */}
      <DiscountForm
        formData={formData}
        editingDiscount={editingDiscount}
        showForm={showForm}
        onFormDataChange={setFormData}
        onCategoryChange={handleCategoryChange}
        onShowFormChange={setShowForm}
        onResetForm={resetForm}
        onSubmit={handleSubmit}
        submitting={submitting}
      />

      {/* Lista de Descuentos */}
      <div className="space-y-4">
        {discounts.length === 0 ? (
          <DiscountsEmptyState
            message="No hay descuentos manuales cargados."
            subtitle="Crea el primero para comenzar a gestionar ofertas manualmente."
          />
        ) : (
          <div className="space-y-4">
            <DiscountsSelectionBar
              selectedCount={selectedDiscounts.length}
              onCancel={() => setSelectedDiscounts([])}
              onAction={handleDeleteSelected}
              actionLabel={`Eliminar (${selectedDiscounts.length})`}
              actionLoading={deleting}
              actionVariant="destructive"
            />

            <DiscountsSelectAll
              totalCount={discounts.length}
              selectedCount={selectedDiscounts.length}
              onSelectAll={handleSelectAll}
              label="Seleccionar todos"
            />

            {/* Lista de descuentos */}
            <div className="grid gap-4">
              {discounts.map((discount) => (
                <DiscountCard
                  key={discount.id}
                  discount={discount}
                  isSelected={selectedDiscounts.includes(discount.id!)}
                  onSelect={handleSelectDiscount}
                  onEdit={handleEdit}
                  onDelete={handleDeleteDiscount}
                  onToggleVisibility={toggleVisibility}
                  deleting={deleting}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal de confirmación */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={hideConfirmation}
        onConfirm={confirmationModal.onConfirm}
        title={confirmationModal.title}
        description={confirmationModal.description}
        variant={confirmationModal.variant}
        isLoading={deleting}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />
    </div>
  );
}
