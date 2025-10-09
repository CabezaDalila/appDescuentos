import CardDiscountCompact from "@/components/cardDiscount/CardDiscountCompact";
import { EmptyState } from "@/components/home/empty-state";
import { getCategoryById } from "@/constants/categories";
import { getDiscountsBySearch, getHomePageDiscounts } from "@/lib/discounts";
import { Discount } from "@/types/discount";
import { filterDiscountsByCategory } from "@/utils/category-mapping";
import { ArrowLeft, Filter, X } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function Search() {
  const router = useRouter();
  const { category, q } = router.query;

  const [filteredDiscounts, setFilteredDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Función para aplicar filtros
  const applyFilters = (data: Discount[], categoryParam?: string) => {
    let filtered = data;

    // Aplicar filtro de categoría si existe
    if (categoryParam && typeof categoryParam === "string") {
      setSelectedCategory(categoryParam);
      filtered = filterDiscountsByCategory(data, categoryParam);
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
        let data: Discount[] = [];

        if (q && typeof q === "string") {
          // Si hay término de búsqueda, buscar por texto
          data = await getDiscountsBySearch(q);
          setSearchTerm(q);
        } else {
          // Si no hay término de búsqueda, cargar todos los descuentos
          data = await getHomePageDiscounts();
        }

        // Aplicar filtros inmediatamente después de cargar los datos
        applyFilters(data, category as string);

        // Debug: mostrar todas las categorías disponibles
        console.log(
          "Descuentos cargados:",
          data.map((d) => ({
            title: d.title || d.name,
            category: d.category,
          }))
        );
      } catch (error) {
        console.error("Error cargando descuentos:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDiscounts();
  }, [q, category]);

  const handleClearCategory = () => {
    router.push("/search");
  };

  const handleClearSearch = () => {
    router.push("/search");
  };

  const handleDiscountClick = (discountId: string) => {
    router.push(`/discount/${discountId}`);
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
      {(selectedCategory || searchTerm) && (
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
              selectedCategory
                ? "filtered-empty"
                : searchTerm
                ? "no-results"
                : "no-discounts"
            }
            categoryName={categoryInfo?.name}
            onClearFilter={selectedCategory ? handleClearCategory : undefined}
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
              {filteredDiscounts.map((discount) => (
                <CardDiscountCompact
                  key={discount.id}
                  title={discount.name || discount.title || ""}
                  image={discount.imageUrl || discount.image || ""}
                  category={discount.category || ""}
                  points={0} // Ajustar según tu estructura de datos
                  distance="0.5 km" // Ajustar según tu estructura de datos
                  expiration="30 días" // Ajustar según tu estructura de datos
                  discountPercentage={
                    discount.discountPercentage?.toString() || "0"
                  }
                  onNavigateToDetail={() => handleDiscountClick(discount.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
