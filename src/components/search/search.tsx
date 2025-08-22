import { Input } from "../Share/input";
import { useState, useEffect, useMemo, useCallback, ReactNode } from "react";

interface SearchProps {
  placeholder: string;
  value: string;
  onSearch: (searchTerm: string) => void;
  debounceMs?: number;
  // Nuevos props para dropdown de resultados
  results?: unknown[];
  isLoading?: boolean;
  renderResult?: (item: unknown, index: number, isActive: boolean) => ReactNode;
  onSelectResult?: (item: unknown, index: number) => void;
  minChars?: number;
}

export default function Search({ placeholder, value, onSearch, debounceMs = 300, results = [], isLoading = false, renderResult, onSelectResult, minChars = 1 }: SearchProps) {
  const [search, setSearch] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== value) {
        onSearch(search);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [search, onSearch, debounceMs, value]);

  useEffect(() => {
    setSearch(value);
  }, [value]);

  const handleSearchChange = (newValue: string) => {
    setSearch(newValue);
    setActiveIndex(-1);
  };

  const hasQueryToSearch = useMemo(() => (search?.length ?? 0) >= minChars, [search, minChars]);
  const shouldShowDropdown = isFocused && hasQueryToSearch && (isLoading || (results && results.length >= 0));

  const handleSelect = useCallback((item: unknown, index: number) => {
    onSelectResult?.(item, index);
  }, [onSelectResult]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!shouldShowDropdown) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(prev => {
        const next = Math.min((results?.length ?? 0) - 1, prev + 1);
        return next;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(prev => {
        const next = Math.max(-1, prev - 1);
        return next;
      });
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && results && results[activeIndex]) {
        e.preventDefault();
        handleSelect(results[activeIndex], activeIndex);
      }
    } else if (e.key === "Escape") {
      setActiveIndex(-1);
    }
  };

  return (
    <div className="relative">
      <Input 
        placeholder={placeholder} 
        type="search" 
        value={search} 
        onChange={(e) => {
          handleSearchChange(e.target.value);
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setTimeout(() => setIsFocused(false), 100);
        }}
        onKeyDown={handleKeyDown}
        className={`${isFocused ? "border-primary" : "border-gray-300"} text-gray-500`}
      />

      {shouldShowDropdown && (
        <div className="absolute top-full left-0 w-full bg-white shadow-md rounded-lg mt-1 z-20 border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="p-3 text-sm text-gray-500">Buscando...</div>
          ) : (
            <>
              {(results && results.length > 0) ? (
                <ul className="max-h-64 overflow-y-auto">
                  {results.map((item, index) => {
                    const isActive = index === activeIndex;
                    return (
                      <li
                        key={index}
                        className={`p-3 cursor-pointer transition-colors ${isActive ? "bg-blue-50" : "hover:bg-gray-50"}`}
                        onMouseEnter={() => setActiveIndex(index)}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelect(item, index);
                        }}
                      >
                        {renderResult ? (
                          renderResult(item, index, isActive)
                        ) : (
                          <div className="text-sm text-gray-800">{String(item)}</div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="p-3 text-sm text-gray-500">Sin resultados</div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}