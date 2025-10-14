import { Badge } from "@/components/Share/badge";
import { Button } from "@/components/Share/button";
import { Card, CardContent } from "@/components/Share/card";
import { ConfirmationModal } from "@/components/Share/confirmation-modal";
import { DiscountCard } from "@/components/admin/discounts/DiscountCard";
import { DiscountForm } from "@/components/admin/discounts/DiscountForm";
import { useConfirmation } from "@/hooks/useConfirmation";
import { useDiscountForm } from "@/hooks/useDiscountForm";
import { useDiscounts } from "@/hooks/useDiscounts";
import { ADMIN_CONSTANTS } from "@/utils/admin";
import { Gift, Plus, X } from "lucide-react";
import { useState } from "react";

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

  // Handlers para operaciones de eliminación
  const handleDeleteDiscount = (discountId: string) => {
    const discount = discounts.find((d) => d.id === discountId);
    showConfirmation({
      title: "Eliminar Descuento",
      description: ADMIN_CONSTANTS.CONFIRMATION_MESSAGES.DELETE_SINGLE(
        discount?.title || "este descuento"
      ),
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
      description: ADMIN_CONSTANTS.CONFIRMATION_MESSAGES.DELETE_MULTIPLE(
        selectedDiscounts.length
      ),
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

    if (!validateForm()) {
      return;
    }

    try {
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {ADMIN_CONSTANTS.UI_TEXT.HEADER_TITLE}
          </h2>
          <p className="text-muted-foreground">
            {ADMIN_CONSTANTS.UI_TEXT.HEADER_DESCRIPTION}
          </p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm
            ? ADMIN_CONSTANTS.UI_TEXT.CANCEL_BUTTON
            : ADMIN_CONSTANTS.UI_TEXT.NEW_DISCOUNT_BUTTON}
        </Button>
      </div>

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
      />

      {/* Lista de Descuentos */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Descuentos Existentes</h3>
          <Badge variant="outline">
            {ADMIN_CONSTANTS.UI_TEXT.DISCOUNTS_COUNT(discounts.length)}
          </Badge>
        </div>

        {discounts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Gift className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                {ADMIN_CONSTANTS.UI_TEXT.NO_DISCOUNTS_MESSAGE}
                <br />
                {ADMIN_CONSTANTS.UI_TEXT.NO_DISCOUNTS_SUBTITLE}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Barra de acciones para selección múltiple */}
            {selectedDiscounts.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-blue-800 font-medium">
                    {selectedDiscounts.length} descuentos seleccionados
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDiscounts([])}
                    disabled={deleting}
                    className="text-gray-700 hover:text-gray-900 border-gray-300 hover:border-gray-400"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteSelected}
                    disabled={deleting}
                  >
                    {deleting
                      ? "Eliminando..."
                      : `Eliminar (${selectedDiscounts.length})`}
                  </Button>
                </div>
              </div>
            )}

            {/* Checkbox para seleccionar todos */}
            <div className="flex items-center gap-2 pb-2 border-b">
              <input
                type="checkbox"
                checked={
                  selectedDiscounts.length === discounts.length &&
                  discounts.length > 0
                }
                onChange={handleSelectAll}
                className="rounded border-gray-300"
              />
              <span className="text-sm font-medium">
                {ADMIN_CONSTANTS.UI_TEXT.SELECT_ALL} ({discounts.length}{" "}
                descuentos)
              </span>
            </div>

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
