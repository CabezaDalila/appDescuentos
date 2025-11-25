import { DiscountCard } from "@/components/admin/discounts/ui/DiscountCard";
import { DiscountForm } from "@/components/admin/discounts/ui/DiscountForm/DiscountForm";
import { DiscountsEmptyState } from "@/components/admin/discounts/ui/DiscountsEmptyState";
import { DiscountsSelectAll } from "@/components/admin/discounts/ui/DiscountsSelectAll";
import { DiscountsSelectionBar } from "@/components/admin/discounts/ui/DiscountsSelectionBar";
import { useAuth } from "@/hooks/useAuth";
import { useDiscountForm } from "@/hooks/useDiscountForm";
import { approveDiscount, getPendingDiscounts } from "@/lib/discounts";
import { db } from "@/lib/firebase/firebase";
import { ManualDiscount } from "@/types/admin";
import { Discount } from "@/types/discount";
import { doc, Timestamp, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface DiscountApprovalManagerProps {
  className?: string;
}

export function DiscountApprovalManager({
  className,
}: DiscountApprovalManagerProps) {
  const [pendingDiscounts, setPendingDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [selectedDiscounts, setSelectedDiscounts] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const { user } = useAuth();

  // Usar el hook del formulario para reutilizar DiscountForm
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

  useEffect(() => {
    loadPendingDiscounts();
  }, []);

  const loadPendingDiscounts = async () => {
    try {
      setLoading(true);
      const discounts = await getPendingDiscounts();
      console.log(
        `[DiscountApprovalManager] Descuentos cargados: ${discounts.length}`
      );
      // Log del primer descuento para ver qué campos tiene
      if (discounts.length > 0) {
        console.log("[DiscountApprovalManager] Primer descuento:", {
          id: discounts[0].id,
          name: discounts[0].name,
          title: discounts[0].title,
          category: discounts[0].category,
          origin: discounts[0].origin,
          description: discounts[0].description,
          descripcion: discounts[0].descripcion,
        });
      }
      setPendingDiscounts(discounts);
    } catch (error) {
      console.error("Error cargando descuentos pendientes:", error);
      toast.error("Error al cargar descuentos pendientes");
    } finally {
      setLoading(false);
    }
  };

  // Convertir Discount a ManualDiscount para usar DiscountCard
  const convertToManualDiscount = (discount: Discount): ManualDiscount => {
    return {
      id: discount.id,
      title: discount.title || discount.name || "",
      origin: discount.origin || "",
      category: discount.category || "",
      expirationDate:
        discount.validUntil || discount.expirationDate || new Date(),
      description: discount.description || discount.descripcion || "",
      discountPercentage: discount.discountPercentage,
      discountAmount: discount.discountAmount,
      imageUrl: discount.imageUrl || discount.image || "",
      url: (discount as Discount & { url?: string }).url || "",
      isVisible: discount.isVisible ?? true,
      availableCredentials: discount.availableCredentials?.map((cred) => ({
        bank: cred.bank,
        type: cred.type,
        brand: cred.brand,
        level: cred.level,
      })),
      availableMemberships: discount.availableMemberships,
      location: discount.location,
    };
  };

  const manualDiscounts = pendingDiscounts.map(convertToManualDiscount);

  // Handler para el formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (submitting) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    if (!editingDiscount?.id || !user?.uid) return;

    try {
      setSubmitting(true);

      // Preparar los datos de actualización
      const updateData: any = {
        title: formData.title.trim(),
        name: formData.title.trim(), // Mantener compatibilidad
        origin: formData.origin.trim(),
        category: formData.category!,
        description: formData.description.trim(),
        validUntil: Timestamp.fromDate(new Date(formData.expirationDate)),
        expirationDate: Timestamp.fromDate(new Date(formData.expirationDate)),
        isVisible: formData.isVisible,
        updatedAt: Timestamp.now(),
      };

      // Agregar campos opcionales si existen
      if (
        formData.discountPercentage &&
        formData.discountPercentage.trim() !== ""
      ) {
        updateData.discountPercentage = parseFloat(formData.discountPercentage);
      }
      if (formData.discountAmount && formData.discountAmount.trim() !== "") {
        updateData.discountAmount = parseFloat(formData.discountAmount);
      }
      if (formData.imageUrl && formData.imageUrl.trim() !== "") {
        updateData.imageUrl = formData.imageUrl.trim();
        updateData.image = formData.imageUrl.trim(); // Mantener compatibilidad
      }
      if (formData.url && formData.url.trim() !== "") {
        updateData.url = formData.url.trim();
      }
      if (formData.availableCredentials.length > 0) {
        updateData.availableCredentials = formData.availableCredentials;
      }
      if (formData.availableMemberships.length > 0) {
        updateData.availableMemberships = formData.availableMemberships;
      }
      if (formData.locationAddress && formData.locationCoordinates) {
        updateData.location = {
          latitude: formData.locationCoordinates.lat,
          longitude: formData.locationCoordinates.lng,
          address: formData.locationAddress,
        };
      }

      // Actualizar el descuento
      const docRef = doc(db, "discounts", editingDiscount.id);
      await updateDoc(docRef, updateData);

      toast.success("Descuento actualizado correctamente");
      setShowForm(false);
      resetForm();
      loadPendingDiscounts();
    } catch (error) {
      console.error("Error actualizando descuento:", error);
      toast.error("Error al actualizar descuento");
    } finally {
      setSubmitting(false);
    }
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
    if (selectedDiscounts.length === manualDiscounts.length) {
      setSelectedDiscounts([]);
    } else {
      setSelectedDiscounts(manualDiscounts.map((d) => d.id!));
    }
  };

  // Aprobar múltiples descuentos
  const handleApproveSelected = async () => {
    if (selectedDiscounts.length === 0 || !user?.uid) return;

    try {
      setApproving(true);
      await Promise.all(
        selectedDiscounts.map((id) => approveDiscount(id, user.uid))
      );
      toast.success(
        `${selectedDiscounts.length} descuento(s) aprobado(s) correctamente`
      );
      setSelectedDiscounts([]);
      loadPendingDiscounts();
    } catch (error) {
      console.error("Error aprobando descuentos:", error);
      toast.error("Error al aprobar descuentos");
    } finally {
      setApproving(false);
    }
  };

  // Handler para editar (convierte Discount a ManualDiscount)
  const handleEdit = (discount: ManualDiscount) => {
    handleEditDiscount(discount);
  };

  // Estados de carga
  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Formulario para editar descuentos */}
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
        {pendingDiscounts.length === 0 ? (
          <DiscountsEmptyState
            message="No hay descuentos pendientes de aprobación"
            subtitle="Los descuentos de scraping aparecerán aquí cuando se ejecuten los scripts"
          />
        ) : (
          <div className="space-y-4">
            <DiscountsSelectionBar
              selectedCount={selectedDiscounts.length}
              onCancel={() => setSelectedDiscounts([])}
              onAction={handleApproveSelected}
              actionLabel={`Aprobar (${selectedDiscounts.length})`}
              actionLoading={approving}
              actionVariant="default"
              actionClassName="bg-green-600 hover:bg-green-700 text-white"
            />

            <DiscountsSelectAll
              totalCount={manualDiscounts.length}
              selectedCount={selectedDiscounts.length}
              onSelectAll={handleSelectAll}
            />

            {/* Lista de descuentos */}
            <div className="grid gap-4">
              {manualDiscounts.map((discount) => (
                <DiscountCard
                  key={discount.id}
                  discount={discount}
                  isSelected={selectedDiscounts.includes(discount.id!)}
                  onSelect={handleSelectDiscount}
                  onEdit={handleEdit}
                  onDelete={() => {}} // No permitir eliminar desde aquí
                  onToggleVisibility={() => {}} // No permitir cambiar visibilidad desde aquí
                  deleting={false}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
