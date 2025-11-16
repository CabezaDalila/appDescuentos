import { Discount } from "@/types/discount";
import { Filter, Search, X } from "lucide-react";
import { SearchDropdown } from "./SearchDropdown";

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
  // Props opcionales para filtros
  showFilterButton?: boolean;
  hasActiveFilters?: boolean;
  onFilterClick?: () => void;
  // Props para controlar el padding
  compact?: boolean;
  // Placeholder personalizado
  placeholder?: string;
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
  showFilterButton = false,
  hasActiveFilters = false,
  onFilterClick,
  compact = false,
  placeholder = "¿Qué estás buscando hoy?",
}: SearchSectionProps) {
  const paddingClass = compact
    ? "px-4"
    : "px-3 sm:px-4 lg:px-4 xl:px-6 2xl:px-8";
  const marginClass = compact ? "" : "mb-4 sm:mb-6";
  const inputPaddingRight = showFilterButton
    ? "pr-11"
    : searchTerm
    ? "pr-10 sm:pr-12 lg:pr-14"
    : "pr-10 sm:pr-12 lg:pr-14";
  const iconSize = compact ? "w-4 h-4" : "w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6";
  const iconLeft = compact ? "left-3.5" : "left-3 sm:left-4 lg:left-6";
  const inputPaddingLeft = compact ? "pl-10" : "pl-10 sm:pl-12 lg:pl-14";
  const inputPaddingY = compact ? "py-2.5" : "py-2.5 sm:py-3.5 lg:py-4";
  const inputTextSize = compact ? "text-sm" : "text-sm sm:text-base lg:text-lg";

  return (
    <div className={`w-full ${paddingClass} ${marginClass}`}>
      <div className="relative max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto">
        <Search
          className={`absolute ${iconLeft} top-1/2 transform -translate-y-1/2 text-gray-400 ${iconSize}`}
        />
        <input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          className={`w-full ${inputPaddingLeft} ${inputPaddingRight} ${inputPaddingY} ${inputTextSize} text-gray-900 placeholder:text-gray-500 caret-purple-600 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 bg-white shadow-sm hover:shadow-md transition-all`}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={onSearchFocus}
          onBlur={onSearchBlur}
        />
        {showFilterButton ? (
          <button
            onClick={onFilterClick}
            className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 rounded-lg transition-colors z-10 ${
              hasActiveFilters
                ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
                : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            }`}
            aria-label="Filtros"
          >
            <Filter className="w-4 h-4" />
          </button>
        ) : (
          searchTerm && (
            <button
              onClick={onClearSearch}
              className={`absolute right-3 sm:right-4 lg:right-6 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors`}
            >
              <X className={iconSize} />
            </button>
          )
        )}

        <SearchDropdown
          isOpen={showSearchResults}
          isSearching={isSearching}
          searchTerm={searchTerm}
          results={searchResults}
          onSelect={onSelectResult}
        />
      </div>
    </div>
  );
}
