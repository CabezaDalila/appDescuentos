import { Filter, MapPin, Search, ShoppingCart } from "lucide-react";

interface EmptyStateProps {
  type: "no-discounts" | "no-results" | "filtered-empty" | "no-nearby";
  categoryName?: string;
  onClearFilter?: () => void;
  onViewAll?: () => void;
}

export function EmptyState({
  type,
  categoryName,
  onClearFilter,
  onViewAll,
}: EmptyStateProps) {
  const getContent = () => {
    switch (type) {
      case "no-discounts":
        return {
          icon: ShoppingCart,
          title: "¡Próximamente más descuentos!",
          description:
            "Estamos trabajando para traerte las mejores ofertas. ¡Vuelve pronto!",
          showButton: false,
        };

      case "no-results":
        return {
          icon: Search,
          title: "No encontramos resultados",
          description:
            "Intenta con otros términos de búsqueda o explora nuestras categorías.",
          showButton: false,
        };

      case "filtered-empty":
        return {
          icon: Filter,
          title: `Sin descuentos en ${categoryName}`,
          description:
            "No encontramos descuentos en esta categoría. Prueba explorando otras opciones.",
          showButton: true,
          buttonText: "Ver todos los descuentos",
        };

      case "no-nearby":
        return {
          icon: MapPin,
          title: "No hay descuentos cerca de ti",
          description:
            "No encontramos descuentos en un radio de 1,5km. Prueba explorando todas las ofertas disponibles.",
          showButton: true,
          buttonText: "Ver todos los descuentos",
        };
    }
  };

  const content = getContent();
  const IconComponent = content.icon;

  return (
    <div className="col-span-full text-center py-8 sm:py-12">
      <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <IconComponent className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
      </div>

      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
        {content.title}
      </h3>

      <p className="text-sm sm:text-base text-gray-600 mb-6 max-w-md mx-auto">
        {content.description}
      </p>

      {content.showButton && onClearFilter && (
        <button
          onClick={onClearFilter}
          className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors shadow-sm"
        >
          <Filter className="w-4 h-4" />
          {content.buttonText}
        </button>
      )}

      {onViewAll && type === "no-discounts" && (
        <button
          onClick={onViewAll}
          className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 text-sm font-medium transition-colors"
        >
          Explorar categorías
        </button>
      )}
    </div>
  );
}
