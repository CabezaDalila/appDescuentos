import { Discount } from "@/types/discount";
import { Search } from "lucide-react";

interface SearchSectionProps {
  searchTerm: string;
  searchResults: Discount[];
  isSearching: boolean;
  showSearchResults: boolean;
  onSearchChange: (value: string) => void;
  onSearchFocus: () => void;
  onSearchBlur: () => void;
  onClearSearch: () => void;
  onSelectResult: (discount: Discount) => void;
}

export function SearchSection({
  searchTerm,
  searchResults,
  isSearching,
  showSearchResults,
  onSearchChange,
  onSearchFocus,
  onSearchBlur,
  onClearSearch,
  onSelectResult,
}: SearchSectionProps) {
  return (
    <div className="w-full px-3 sm:px-4 lg:px-4 xl:px-6 2xl:px-8 mb-4 sm:mb-6">
      <div className="relative max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto">
        <Search className="absolute left-3 sm:left-4 lg:left-6 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
        <input
          type="text"
          placeholder="¿Qué estás buscando hoy?"
          value={searchTerm}
          className="w-full pl-10 sm:pl-12 lg:pl-14 pr-10 sm:pr-12 lg:pr-14 py-2.5 sm:py-3.5 lg:py-4 text-sm sm:text-base lg:text-lg border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 bg-white shadow-sm hover:shadow-md transition-all"
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={onSearchFocus}
          onBlur={onSearchBlur}
        />
        {searchTerm && (
          <button
            onClick={onClearSearch}
            className="absolute right-3 sm:right-4 lg:right-6 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}

        {/* Resultados de búsqueda */}
        {showSearchResults && (
          <div className="absolute top-full left-0 right-0 mt-1 sm:mt-2 lg:mt-3 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 sm:max-h-64 lg:max-h-80 overflow-y-auto">
            {isSearching ? (
              <div className="p-3 sm:p-4 lg:p-6 text-center text-gray-500">
                <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                <span className="text-xs sm:text-sm lg:text-base">
                  Buscando...
                </span>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="py-1 sm:py-2 lg:py-3">
                {searchResults.slice(0, 5).map((discount) => (
                  <button
                    key={discount.id}
                    onClick={() => onSelectResult(discount)}
                    className="w-full px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center justify-between gap-2 lg:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs sm:text-sm lg:text-base font-medium text-gray-900 truncate">
                          {discount.name || discount.title}
                        </div>
                        {discount.description && (
                          <div className="text-xs lg:text-sm text-gray-500 line-clamp-1 mt-0.5 lg:mt-1">
                            {discount.description}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 flex-shrink-0">
                        {discount.category && (
                          <span className="inline-block px-1.5 sm:px-2 lg:px-3 py-0.5 lg:py-1 text-[9px] sm:text-[10px] lg:text-xs bg-blue-100 text-primary-500 rounded-full">
                            {discount.category}
                          </span>
                        )}
                        {discount.discountPercentage && (
                          <span className="inline-block px-1.5 sm:px-2 lg:px-3 py-0.5 lg:py-1 text-[9px] sm:text-[10px] lg:text-xs bg-green-100 text-green-800 rounded-full">
                            {discount.discountPercentage}%
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : searchTerm.trim().length > 0 ? (
              <div className="p-3 sm:p-4 lg:p-6 text-center text-gray-500">
                <span className="text-xs sm:text-sm lg:text-base">
                  No se encontraron resultados para &quot;{searchTerm}&quot;
                </span>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
