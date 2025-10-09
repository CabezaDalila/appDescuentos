import { ManualDiscount } from "@/types/admin";
import { useCallback, useEffect, useState } from "react";

interface DiscountFormData {
  title: string;
  origin: string;
  category: string | undefined;
  expirationDate: string;
  description: string;
  discountPercentage: string;
  discountAmount: string;
  imageUrl: string;
  isVisible: boolean;
}

interface UseDiscountFormReturn {
  formData: DiscountFormData;
  selectedCategory: string | undefined;
  showForm: boolean;
  editingDiscount: ManualDiscount | null;
  setShowForm: (show: boolean) => void;
  setFormData: React.Dispatch<React.SetStateAction<DiscountFormData>>;
  setSelectedCategory: React.Dispatch<React.SetStateAction<string | undefined>>;
  handleCategoryChange: (value: string) => void;
  handleEditDiscount: (discount: ManualDiscount) => void;
  resetForm: () => void;
  validateForm: () => boolean;
}

const initialFormData: DiscountFormData = {
  title: "",
  origin: "",
  category: undefined,
  expirationDate: "",
  description: "",
  discountPercentage: "",
  discountAmount: "",
  imageUrl: "",
  isVisible: true,
};

export function useDiscountForm(): UseDiscountFormReturn {
  const [formData, setFormData] = useState<DiscountFormData>(initialFormData);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
    undefined
  );
  const [showForm, setShowForm] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<ManualDiscount | null>(
    null
  );

  // Sincronizar estados cuando cambie formData.category
  useEffect(() => {
    if (formData.category && formData.category !== selectedCategory) {
      setSelectedCategory(formData.category);
    }
  }, [formData.category, selectedCategory]);

  const handleCategoryChange = useCallback(
    (value: string) => {
      if (value && value.trim() !== "" && value !== selectedCategory) {
        setSelectedCategory(value);
        setFormData((prev) => ({
          ...prev,
          category: value,
        }));
      }
    },
    [selectedCategory]
  );

  const handleEditDiscount = useCallback((discount: ManualDiscount) => {
    console.log("handleEditDiscount llamado con:", discount);
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
      isVisible: discount.isVisible ?? true,
    });
    setSelectedCategory(discount.category);
    setShowForm(true);
  }, []);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setSelectedCategory(undefined);
    setEditingDiscount(null);
  }, []);

  const validateForm = useCallback((): boolean => {
    return !!(
      formData.title.trim() &&
      formData.origin.trim() &&
      formData.category &&
      formData.expirationDate
    );
  }, [formData]);

  return {
    formData,
    selectedCategory,
    showForm,
    editingDiscount,
    setShowForm,
    setFormData,
    setSelectedCategory,
    handleCategoryChange,
    handleEditDiscount,
    resetForm,
    validateForm,
  };
}
