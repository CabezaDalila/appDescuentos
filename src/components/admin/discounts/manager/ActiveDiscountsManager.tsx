import { DiscountCard } from "@/components/admin/discounts/ui/DiscountCard";
import { DiscountForm } from "@/components/admin/discounts/ui/DiscountForm/DiscountForm";
import { DiscountsEmptyState } from "@/components/admin/discounts/ui/DiscountsEmptyState";
import { useDiscountForm } from "@/hooks/useDiscountForm";
import { parseAdminExpirationInput } from "@/lib/date-ar";
import { getApprovedDiscounts } from "@/lib/discounts";
import { db } from "@/lib/firebase/firebase";
import { ManualDiscount } from "@/types/admin";
import { Discount } from "@/types/discount";
import {
  doc,
  Timestamp,
  updateDoc,
  type DocumentData,
  type UpdateData,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export function ActiveDiscountsManager() {
  const [activeDiscounts, setActiveDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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

  const loadActiveDiscounts = async () => {
    try {
      setLoading(true);
      const discounts = await getApprovedDiscounts();
      setActiveDiscounts(discounts);
    } catch (error) {
      toast.error("Error cargando descuentos activos");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActiveDiscounts();
  }, []);

  const convertToManualDiscount = (discount: Discount): ManualDiscount => ({
    id: discount.id,
    title: discount.title || discount.name || "",
    origin: discount.origin || "",
    category: discount.category || "",
    expirationDate: discount.expirationDate || new Date(),
    description: discount.description || discount.descripcion || "",
    discountPercentage: discount.discountPercentage,
    discountAmount: discount.discountAmount,
    imageUrl: discount.imageUrl || discount.image || "",
    url: (discount as Discount & { url?: string }).url || "",
    isVisible: discount.isVisible ?? true,
    availableCredentials: discount.availableCredentials?.map((credential) => ({
      bank: credential.bank,
      type: credential.type,
      brand: credential.brand,
      level: credential.level,
    })),
    availableMemberships: discount.availableMemberships || [],
    membershipRequired: discount.membershipRequired || [],
    bancos: discount.bancos || [],
    location: discount.location,
  });

  const manualDiscounts = activeDiscounts.map(convertToManualDiscount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !editingDiscount?.id) return;
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const expDate = parseAdminExpirationInput(formData.expirationDate);
      if (!expDate) {
        toast.error("Revisá la fecha de expiración (dd/mm/aaaa)");
        setSubmitting(false);
        return;
      }
      const updateData: UpdateData<DocumentData> = {
        title: formData.title.trim(),
        name: formData.title.trim(),
        origin: formData.origin.trim(),
        category: formData.category!,
        description: formData.description.trim(),
        expirationDate: Timestamp.fromDate(expDate),
        isVisible: formData.isVisible,
        updatedAt: Timestamp.now(),
      };

      if (formData.discountPercentage?.trim()) {
        updateData.discountPercentage = parseFloat(formData.discountPercentage);
      }
      if (formData.discountAmount?.trim()) {
        updateData.discountAmount = parseFloat(formData.discountAmount);
      }
      if (formData.imageUrl?.trim()) {
        updateData.imageUrl = formData.imageUrl.trim();
        updateData.image = formData.imageUrl.trim();
      }
      if (formData.url?.trim()) {
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

      await updateDoc(doc(db, "discounts", editingDiscount.id), updateData);
      toast.success("Descuento activo actualizado correctamente");
      setShowForm(false);
      resetForm();
      await loadActiveDiscounts();
    } catch (error) {
      toast.error("Error al actualizar descuento activo");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleVisibility = async (id: string, currentVisibility: boolean) => {
    try {
      await updateDoc(doc(db, "discounts", id), {
        isVisible: !currentVisibility,
        updatedAt: Timestamp.now(),
      });
      toast.success(
        `Descuento ${!currentVisibility ? "mostrado" : "ocultado"} correctamente`
      );
      await loadActiveDiscounts();
    } catch (error) {
      toast.error("Error cambiando visibilidad");
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

      {manualDiscounts.length === 0 ? (
        <DiscountsEmptyState
          message="No hay descuentos activos para mostrar"
          subtitle="Los descuentos aprobados, visibles y no vencidos aparecerán aquí."
        />
      ) : (
        <div className="grid gap-4">
          {manualDiscounts.map((discount) => (
            <DiscountCard
              key={discount.id}
              discount={discount}
              isSelected={false}
              onSelect={() => {}}
              onEdit={handleEditDiscount}
              onDelete={() => {}}
              onToggleVisibility={handleToggleVisibility}
              deleting={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}
