import { Button } from "@/components/Share/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Share/select";
import { Label } from "@/components/Share/label";
import { ENTITIES_BY_CATEGORY } from "@/constants/membership";

interface MembershipSelectorProps {
  /** Membresías ya agregadas al descuento. */
  memberships: string[];
  /** Entidad seleccionada en el combo, aún sin agregar. */
  newEntity: string;
  error: string;
  onSelect: (value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

/**
 * Selector de membresías que aplican a un descuento (combo + chips).
 * Presentacional: la fuente de verdad (formData) vive en DiscountForm.
 */
export function MembershipSelector({
  memberships,
  newEntity,
  error,
  onSelect,
  onAdd,
  onRemove,
}: MembershipSelectorProps) {
  return (
    <div className="col-span-2">
      <div className="flex flex-col">
        <Label className="block mb-0.5">
          Membresías que aplican para este descuento
        </Label>

        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Select
              value={newEntity || undefined}
              onValueChange={(value) => {
                if (value && value.trim() !== "") onSelect(value);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Membresia" />
              </SelectTrigger>
              <SelectContent className="max-h-64 overflow-y-auto">
                {Object.entries(ENTITIES_BY_CATEGORY).flatMap(([, entities]) =>
                  (entities as readonly string[]).map((entity) => (
                    <SelectItem
                      key={entity}
                      value={String(entity)}
                      className="truncate"
                    >
                      {String(entity)}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Botón para agregar membresía */}
          <div className="flex-shrink-0 flex items-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAdd}
              disabled={!newEntity}
              className={`h-[42px] w-[42px] flex items-center justify-center text-lg font-bold transition-transform ${
                newEntity
                  ? "bg-green-500 hover:scale-105 text-white border-green-500"
                  : "bg-gray-100 text-gray-400 border-gray-300"
              }`}
            >
              +
            </Button>
          </div>
        </div>

        {/* Mostrar membresías seleccionadas */}
        {memberships.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {memberships.map((membership, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded border border-blue-200"
              >
                <span className="font-medium text-xs">{membership}</span>
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="hover:text-blue-600 hover:bg-blue-200 rounded p-0.5 transition-colors text-xs"
                  title="Eliminar membresía"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Mostrar error de membresías */}
        {error && (
          <div className="text-red-500 text-sm mt-2 px-2 py-1 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
