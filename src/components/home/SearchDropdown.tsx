import { Discount } from "@/types/discount";

interface SearchDropdownProps {
  isOpen: boolean;
  isSearching: boolean;
  searchTerm: string;
  results: Discount[];
  onSelect: (discount: Discount) => void;
}

export function SearchDropdown({
  isOpen,
  isSearching,
  searchTerm,
  results,
  onSelect,
}: SearchDropdownProps) {
  if (!isOpen) return null;
  return (
    <div
      className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
      style={{ top: "100%" }}
    >
      {isSearching ? (
        <div className="p-4 text-sm text-gray-500">Buscando...</div>
      ) : results.length === 0 ? (
        <div className="p-4 text-sm text-gray-500">
          {searchTerm.trim().length > 0 ? "Sin resultados" : null}
        </div>
      ) : (
        <ul className="max-h-80 overflow-y-auto">
          {results.slice(0, 5).map((d) => (
            <li
              key={d.id}
              className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              onMouseDown={() => onSelect(d)}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {d.name || (d as any).title}
                  </div>
                  {(d as any).description && (
                    <div className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                      {(d as any).description}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {(d as any).category && (
                    <span className="inline-block px-2 py-0.5 text-[10px] bg-blue-100 text-primary-500 rounded-full">
                      {(d as any).category}
                    </span>
                  )}
                  {typeof (d as any).discountPercentage !== "undefined" && (
                    <span className="inline-block px-2 py-0.5 text-[10px] bg-green-100 text-green-800 rounded-full">
                      {(d as any).discountPercentage}%
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
