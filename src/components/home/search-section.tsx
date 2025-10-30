import { Discount } from "@/types/discount";
import { Search } from "lucide-react";
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
          className="w-full pl-10 sm:pl-12 lg:pl-14 pr-10 sm:pr-12 lg:pr-14 py-2.5 sm:py-3.5 lg:py-4 text-sm sm:text-base lg:text-lg text-gray-900 placeholder:text-gray-500 caret-purple-600 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 bg-white shadow-sm hover:shadow-md transition-all"
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
