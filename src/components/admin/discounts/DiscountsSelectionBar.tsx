import { Button } from "@/components/Share/button";
import { X } from "lucide-react";

interface DiscountsSelectionBarProps {
  selectedCount: number;
  onCancel: () => void;
  onAction: () => void;
  actionLabel: string;
  actionLoading?: boolean;
  actionVariant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  actionClassName?: string;
}

export function DiscountsSelectionBar({
  selectedCount,
  onCancel,
  onAction,
  actionLabel,
  actionLoading = false,
  actionVariant = "destructive",
  actionClassName,
}: DiscountsSelectionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-blue-800 font-medium">
          {selectedCount} descuentos seleccionados
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={actionLoading}
          className="text-gray-700 hover:text-gray-900 border-gray-300 hover:border-gray-400"
        >
          <X className="h-4 w-4 mr-1" />
          Cancelar
        </Button>
        <Button
          variant={actionVariant}
          size="sm"
          onClick={onAction}
          disabled={actionLoading}
          className={actionClassName}
        >
          {actionLoading ? "Procesando..." : actionLabel}
        </Button>
      </div>
    </div>
  );
}
