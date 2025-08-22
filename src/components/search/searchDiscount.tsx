import Search from "@/components/search/search";
import { useEffect, useState } from "react";
import { getDiscountsBySearch } from "@/lib/firebase/discounts";
import { Discount } from "@/types/discount";

export default function SearchDiscount() {
  const [searchTerm, setSearchTerm] = useState("");
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDiscounts = async (value: string) => {
      setLoading(true);
      try {
        const data = await getDiscountsBySearch(value);
        setDiscounts(data);
      } catch (error) {
        console.error("Error al buscar descuentos:", error);
        setDiscounts([]);
      } finally {
        setLoading(false);
      }
    };

    if (searchTerm || discounts.length === 0) {
      fetchDiscounts(searchTerm);
    }
  }, [searchTerm]);

  const handleSearch = (value: string) => setSearchTerm(value);

  const handleSelect = (item: unknown) => {
    const discount = item as Discount;
    setSearchTerm(discount.name);
  };

  return (
    <div className="flex flex-col gap-4 mt-4 px-4">
      <Search
        placeholder="Buscar descuentos..."
        value={searchTerm}
        onSearch={handleSearch}
        results={discounts}
        isLoading={loading}
        minChars={1}
        onSelectResult={(item) => handleSelect(item)}
        renderResult={(item) => {
          const d = item as Discount;
          return (
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-sm font-medium text-gray-900">{d.name}</div>
                {d.description && (
                  <div className="text-xs text-gray-500 line-clamp-1">{d.description}</div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {d.category && (
                  <span className="inline-block px-2 py-0.5 text-[10px] bg-blue-100 text-primary-500 rounded-full">
                    {d.category}
                  </span>
                )}
                {d.discountPercentage && (
                  <span className="inline-block px-2 py-0.5 text-[10px] bg-green-100 text-green-800 rounded-full">
                    {d.discountPercentage}%
                  </span>
                )}
              </div>
            </div>
          );
        }}
      />
    </div>
  );
} 