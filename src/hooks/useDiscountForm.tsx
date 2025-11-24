import { ManualDiscount } from "@/types/admin";
import { useCallback, useState } from "react";

interface DiscountFormData {
  title: string;
  origin: string;
  category: string;
  expirationDate: string;
  description: string;
  discountPercentage: string;
  discountAmount: string;
  imageUrl: string;
  url: string;
  isVisible: boolean;
  availableCredentials: Array<{
    brand: string;
    level: string;
    type: string;
    bank: string;
  }>;
  newCredentialType: string;
  newCredentialBrand: string;
  newCredentialLevel: string;
  newCredentialBank: string;
  availableMemberships: string[];
  newMembershipCategory: string;
  newMembershipEntity: string;
  locationAddress: string;
  locationCoordinates?: { lat: number; lng: number };
}

interface UseDiscountFormReturn {
  formData: DiscountFormData;
  showForm: boolean;
  editingDiscount: ManualDiscount | null;
  setShowForm: (show: boolean) => void;
  setFormData: React.Dispatch<React.SetStateAction<DiscountFormData>>;
  handleCategoryChange: (value: string) => void;
  handleEditDiscount: (discount: ManualDiscount) => void;
  resetForm: () => void;
  validateForm: () => boolean;
}

const initialFormData: DiscountFormData = {
  title: "",
  origin: "",
  category: "",
  expirationDate: "",
  description: "",
  discountPercentage: "",
  discountAmount: "",
  imageUrl: "",
  url: "",
  isVisible: true,
  availableCredentials: [],
  newCredentialType: "",
  newCredentialBrand: "",
  newCredentialLevel: "",
  newCredentialBank: "",
  availableMemberships: [],
  newMembershipCategory: "",
  newMembershipEntity: "",
  locationAddress: "",
  locationCoordinates: undefined,
};

export function useDiscountForm(): UseDiscountFormReturn {
  const [formData, setFormData] = useState<DiscountFormData>(initialFormData);
  const [showForm, setShowForm] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<ManualDiscount | null>(
    null
  );

  const handleCategoryChange = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
    }));
  }, []);

  const handleEditDiscount = useCallback((discount: ManualDiscount) => {
    setEditingDiscount(discount);
    setFormData({
      title: discount.title,
      origin: discount.origin,
      category: discount.category,
      expirationDate: discount.expirationDate
        ? new Date(discount.expirationDate).toISOString().split("T")[0]
        : "",
      description: discount.description,
      discountPercentage: discount.discountPercentage?.toString() || "",
      discountAmount: discount.discountAmount?.toString() || "",
      imageUrl: discount.imageUrl || "",
      url: discount.url || "",
      isVisible: discount.isVisible ?? true,
      availableCredentials:
        (
          discount as ManualDiscount & {
            availableCredentials?: Array<{
              brand: string;
              level: string;
              type: string;
              bank: string;
            }>;
          }
        ).availableCredentials || [],
      newCredentialType: "",
      newCredentialBrand: "",
      newCredentialLevel: "",
      newCredentialBank: "",
      availableMemberships:
        (discount as ManualDiscount & { availableMemberships?: string[] })
          .availableMemberships || [],
      newMembershipCategory: "",
      newMembershipEntity: "",
      // Campo de ubicación simplificado
      locationAddress:
        (discount as unknown as ManualDiscount).location?.address || "",
      locationCoordinates: (() => {
        const location = (discount as unknown as ManualDiscount).location;
        return location?.latitude && location?.longitude
          ? { lat: location.latitude, lng: location.longitude }
          : undefined;
      })(),
    });
    setShowForm(true);
  }, []);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setEditingDiscount(null);
  }, []);

  const validateForm = useCallback((): boolean => {
    return !!(
      formData.title.trim() &&
      formData.origin.trim() &&
      formData.category.trim() &&
      formData.expirationDate
    );
  }, [formData]);

  return {
    formData,
    showForm,
    editingDiscount,
    setShowForm,
    setFormData,
    handleCategoryChange,
    handleEditDiscount,
    resetForm,
    validateForm,
  };
}
