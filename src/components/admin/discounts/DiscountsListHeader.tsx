import { Badge } from "@/components/Share/badge";
import { Button } from "@/components/Share/button";
import { Plus, X } from "lucide-react";

interface DiscountsListHeaderProps {
  title: string;
  description?: string;
  count?: number;
  showNewButton?: boolean;
  showForm?: boolean;
  onToggleForm?: () => void;
  newButtonText?: string;
  cancelButtonText?: string;
}

export function DiscountsListHeader({
  title,
  description,
  showNewButton = false,
  showForm = false,
  onToggleForm,
  newButtonText = "Nuevo Descuento",
  cancelButtonText = "Cancelar",
}: DiscountsListHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        {description && <p className="text-gray-600 mt-1">{description}</p>}
      </div>
      {showNewButton && onToggleForm && (
        <Button onClick={onToggleForm} className="flex items-center gap-2">
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? cancelButtonText : newButtonText}
        </Button>
      )}
    </div>
  );
}

interface DiscountsSectionHeaderProps {
  title: string;
  count: number;
}

export function DiscountsSectionHeader({
  title,
  count,
}: DiscountsSectionHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <Badge variant="outline" className="text-gray-700 border-gray-300">
        {count} descuentos
      </Badge>
    </div>
  );
}
