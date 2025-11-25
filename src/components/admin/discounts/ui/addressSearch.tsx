import { Input } from "@/components/Share/input";
import { Label } from "@/components/Share/label";
import { Loader2, MapPin, Search } from "lucide-react";
import { useCallback, useState } from "react";

interface AddressSearchProps {
  value: string;
  onChange: (
    address: string,
    coordinates?: { lat: number; lng: number }
  ) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  place_id: number;
}

export function AddressSearch({
  value,
  onChange,
  placeholder = "Buscar dirección...",
  label = "Dirección del Descuento",
  required = false,
}: AddressSearchProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Función para buscar direcciones usando Nominatim (OpenStreetMap)
  const searchAddresses = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
          `q=${encodeURIComponent(query)}&` +
          `format=json&` +
          `limit=5&` +
          `countrycodes=ar&` +
          `addressdetails=1&` +
          `extratags=1`
      );

      if (!response.ok) {
        throw new Error("Error en la búsqueda");
      }

      const results: NominatimResult[] = await response.json();
      setSuggestions(results);
    } catch (err) {
      console.error("Error buscando direcciones:", err);
      setError("Error buscando direcciones. Intenta de nuevo.");
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (query: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => searchAddresses(query), 300);
      };
    })(),
    [searchAddresses]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setError(null);

    if (newValue.length >= 3) {
      debouncedSearch(newValue);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: NominatimResult) => {
    const address = suggestion.display_name;
    const coordinates = {
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon),
    };

    onChange(address, coordinates);
    setSuggestions([]);
    setShowSuggestions(false);
    setError(null);
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Delay para permitir clicks en sugerencias
    setTimeout(() => setShowSuggestions(false), 200);
  };

  return (
    <div className="relative">
      <Label htmlFor="address-search">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {isLoading ? (
            <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
          ) : (
            <Search className="h-4 w-4 text-gray-400" />
          )}
        </div>

        <Input
          id="address-search"
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          className={`pl-10 pr-10 ${error ? "border-red-500" : ""}`}
          required={required}
        />

        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          <MapPin className="h-4 w-4 text-gray-400" />
        </div>
      </div>

      {/* Sugerencias */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.place_id}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">
                    {suggestion.display_name}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}
