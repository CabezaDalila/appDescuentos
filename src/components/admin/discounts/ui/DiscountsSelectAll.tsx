interface DiscountsSelectAllProps {
  totalCount: number;
  selectedCount: number;
  onSelectAll: () => void;
  label?: string;
}

export function DiscountsSelectAll({
  totalCount,
  selectedCount,
  onSelectAll,
  label = "Seleccionar todos",
}: DiscountsSelectAllProps) {
  return (
    <div className="flex items-center gap-2 pb-2 border-b">
      <input
        type="checkbox"
        checked={selectedCount === totalCount && totalCount > 0}
        onChange={onSelectAll}
        className="rounded border-gray-300"
      />
      <span className="text-sm font-medium text-gray-700">
        {label} ({totalCount} descuentos)
      </span>
    </div>
  );
}
