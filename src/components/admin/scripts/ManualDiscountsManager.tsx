import { ConfirmationModal } from "@/components/Share/confirmation-modal";
import { DiscountCard } from "@/components/admin/discounts/DiscountCard";
import { DiscountForm } from "@/components/admin/discounts/DiscountForm";
import { DiscountsEmptyState } from "@/components/admin/discounts/DiscountsEmptyState";
import { DiscountsListHeader } from "@/components/admin/discounts/DiscountsListHeader";
import { DiscountsSelectAll } from "@/components/admin/discounts/DiscountsSelectAll";
import { DiscountsSelectionBar } from "@/components/admin/discounts/DiscountsSelectionBar";
import { useConfirmation } from "@/hooks/useConfirmation";
import { useDiscountForm } from "@/hooks/useDiscountForm";
import { useDiscounts } from "@/hooks/useDiscounts";
import { useState } from "react";
import toast from "react-hot-toast";

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
export function ManualDiscountsManager() {
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
    showForm,
    editingDiscount,
    setShowForm,
    setFormData,
    handleCategoryChange,
    handleEditDiscount,
    resetForm,
    validateForm,
  } = useDiscountForm();

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

      const discountData = {
        title: formData.title.trim(),
        origin: formData.origin.trim(),
        category: formData.category!,
        expirationDate: new Date(formData.expirationDate),
        description: formData.description.trim(),
        isVisible: formData.isVisible,
        ...(formData.availableCredentials.length > 0 && {
          availableCredentials: formData.availableCredentials,
        }),
        ...(formData.availableMemberships.length > 0 && {
          availableMemberships: formData.availableMemberships,
        }),
        ...(formData.discountPercentage &&
          formData.discountPercentage.trim() !== "" && {
            discountPercentage: parseFloat(formData.discountPercentage),
          }),
        ...(formData.discountAmount &&
          formData.discountAmount.trim() !== "" && {
            discountAmount: parseFloat(formData.discountAmount),
          }),
        ...(formData.imageUrl &&
          formData.imageUrl.trim() !== "" && {
            imageUrl: formData.imageUrl.trim(),
          }),
        ...(formData.url &&
          formData.url.trim() !== "" && {
            url: formData.url.trim(),
          }),
        ...(formData.locationAddress &&
          formData.locationCoordinates && {
            location: {
              latitude: formData.locationCoordinates.lat,
              longitude: formData.locationCoordinates.lng,
              address: formData.locationAddress,
            },
          }),
      };

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
      {/* Header */}
      <DiscountsListHeader
        title="Descuentos Manuales"
        description="Carga descuentos manualmente para complementar la extracción automática"
        showNewButton={true}
        showForm={showForm}
        onToggleForm={() => setShowForm(!showForm)}
        newButtonText="Nuevo Descuento"
        cancelButtonText="Cancelar"
      />

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
                  onEdit={handleEditDiscount}
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
