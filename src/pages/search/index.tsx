import CardDiscountCompact from "@/components/cardDiscount/CardDiscountCompact";
import { EmptyState } from "@/components/home/empty-state";
import { getCategoryById } from "@/constants/categories";
import {
  getDiscountsBySearch,
  getHomePageDiscounts,
  getNearbyDiscounts,
} from "@/lib/discounts";
import { Discount } from "@/types/discount";
import { filterDiscountsByCategory } from "@/utils/category-mapping";
import { ArrowLeft, Filter, X } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

// Tipo para descuentos de la página de inicio
type HomePageDiscount = {
  id: string;
  title: string;
  image: string;
  category: string;
  discountPercentage: string;
  points: number;
  distance: string;
  expiration: string;
  description: string;
  origin: string;
  status: "active" | "inactive" | "expired";
  isVisible: boolean;
};

type SearchDiscount = Discount | HomePageDiscount;

export default function Search() {
  const router = useRouter();
  const { category, q, location, lat, lng } = router.query;

  const [filteredDiscounts, setFilteredDiscounts] = useState<SearchDiscount[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLocationFilter, setIsLocationFilter] = useState(false);

  const applyFilters = (data: SearchDiscount[], categoryParam?: string) => {
    let filtered = data;

    if (categoryParam && typeof categoryParam === "string") {
      setSelectedCategory(categoryParam);

      if (data.length > 0 && "name" in data[0]) {
        filtered = filterDiscountsByCategory(
          data as Discount[],
          categoryParam
        ) as SearchDiscount[];
      }
    } else {
      setSelectedCategory(null);
    }

    setFilteredDiscounts(filtered);
  };

  // Cargar descuentos y aplicar filtros
  useEffect(() => {
    const loadDiscounts = async () => {
      try {
        setLoading(true);
        let data: SearchDiscount[] = [];

        // Verificar si hay filtro de ubicación
        const hasLocationFilter = location === "true" && lat && lng;
        setIsLocationFilter(!!hasLocationFilter);

        if (hasLocationFilter) {
          const latitude = parseFloat(lat as string);
          const longitude = parseFloat(lng as string);

          data = await getNearbyDiscounts(latitude, longitude, 50);
        } else if (q && typeof q === "string") {
          data = await getDiscountsBySearch(q);
          setSearchTerm(q);
        } else {
          data = await getHomePageDiscounts();
        }

        // Aplicar filtros inmediatamente después de cargar los datos
        applyFilters(data, category as string);
      } catch (error) {
        console.error("Error cargando descuentos:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDiscounts();
  }, [q, category, location, lat, lng]);

  const handleClearCategory = () => {
    router.push("/search");
  };

  const handleClearSearch = () => {
    router.push("/search");
  };

  const handleClearLocation = () => {
    router.push("/search");
  };

  const handleDiscountClick = (discountId: string, distance?: string) => {
    // Si tenemos la distancia calculada, la pasamos como parámetro
    const url = distance
      ? `/discount/${discountId}?distance=${encodeURIComponent(distance)}`
      : `/discount/${discountId}`;
    router.push(url);
  };

  const categoryInfo = selectedCategory
    ? getCategoryById(selectedCategory)
    : null;

  return (
    <div className="w-full min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Volver</span>
          </button>
          <div className="w-20" /> {/* Spacer para centrar el título */}
        </div>
      </div>

      {/* Filtros activos */}
      {(selectedCategory || searchTerm || isLocationFilter) && (
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-2 flex-wrap">
            {searchTerm && (
              <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                <Filter className="w-3 h-3" />
                &ldquo;{searchTerm}&rdquo;
                <button
                  onClick={handleClearSearch}
                  className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedCategory && (
              <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                <Filter className="w-3 h-3" />
                {categoryInfo?.name}
                <button
                  onClick={handleClearCategory}
                  className="ml-1 hover:bg-purple-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {isLocationFilter && (
              <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                <Filter className="w-3 h-3" />
                Cerca de ti (50km)
                <button
                  onClick={handleClearLocation}
                  className="ml-1 hover:bg-green-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Contenido */}
      <div className="p-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando descuentos...</p>
          </div>
        ) : filteredDiscounts.length === 0 ? (
          <EmptyState
            type={
              isLocationFilter
                ? "no-nearby"
                : selectedCategory
                ? "filtered-empty"
                : searchTerm
                ? "no-results"
                : "no-discounts"
            }
            categoryName={categoryInfo?.name}
            onClearFilter={
              isLocationFilter
                ? handleClearLocation
                : selectedCategory
                ? handleClearCategory
                : undefined
            }
          />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {filteredDiscounts.length} descuento
                {filteredDiscounts.length !== 1 ? "s" : ""} encontrado
                {filteredDiscounts.length !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDiscounts.map((discount) => {
                // Determinar si es un HomePageDiscount o Discount
                const isHomePageDiscount = "title" in discount;

                return (
                  <CardDiscountCompact
                    key={discount.id}
                    title={
                      isHomePageDiscount
                        ? (discount as HomePageDiscount).title
                        : (discount as Discount).name || ""
                    }
                    image={
                      isHomePageDiscount
                        ? (discount as HomePageDiscount).image
                        : (discount as Discount).imageUrl || ""
                    }
                    category={discount.category || ""}
                    points={
                      isHomePageDiscount
                        ? (discount as HomePageDiscount).points
                        : 0
                    }
                    distance={
                      isHomePageDiscount
                        ? (discount as HomePageDiscount).distance
                        : "0.5 km"
                    }
                    expiration={
                      isHomePageDiscount
                        ? (discount as HomePageDiscount).expiration
                        : "30 días"
                    }
                    discountPercentage={
                      isHomePageDiscount
                        ? (discount as HomePageDiscount).discountPercentage ||
                          "0"
                        : (
                            discount as Discount
                          ).discountPercentage?.toString() || "0"
                    }
                    onNavigateToDetail={() => {
                      const distance = isHomePageDiscount
                        ? (discount as HomePageDiscount).distance
                        : undefined;
                      handleDiscountClick(discount.id, distance);
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
