import { ExploreCategory } from "@/constants/categories";
import { useRef, useState } from "react";

interface ExploreCategoriesSectionProps {
  categories: ExploreCategory[];
  onCategoryClick: (categoryId: string) => void;
  onViewAll: () => void;
}

export function ExploreCategoriesSection({
  categories,
  onCategoryClick,
}: ExploreCategoriesSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const categoriesPerView = 4;
  const totalPages = Math.ceil(categories.length / categoriesPerView);

  // Cache de estilos para evitar recalcular en cada render
  const getPillStyles = (id: string) => {
    const styles: Record<string, string> = {
      food: "bg-green-50 border border-green-200 text-green-700",
      fashion: "bg-pink-50 border border-pink-200 text-pink-700",
      technology: "bg-blue-50 border border-blue-200 text-blue-700",
      home: "bg-orange-50 border border-orange-200 text-orange-700",
      sports: "bg-purple-50 border border-purple-200 text-purple-700",
      beauty: "bg-red-50 border border-red-200 text-red-700",
      automotive: "bg-gray-50 border border-gray-200 text-gray-700",
      entertainment: "bg-yellow-50 border border-yellow-200 text-yellow-700",
      health: "bg-teal-50 border border-teal-200 text-teal-700",
      education: "bg-indigo-50 border border-indigo-200 text-indigo-700",
    };
    return styles[id] || "bg-gray-50 border border-gray-200 text-gray-700";
  };

  const currentCategories = categories.slice(
    currentIndex * categoriesPerView,
    currentIndex * categoriesPerView + categoriesPerView
  );

  // Umbral de swipe muy reducido para respuesta instantánea (20px)
  const minSwipeDistance = 20;

  // Función optimizada para cambiar de página sin animaciones
  const handleSwipe = (direction: "left" | "right") => {
    if (direction === "left" && currentIndex < totalPages - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else if (direction === "right" && currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    
    const diffX = touchStartX.current - e.touches[0].clientX;
    const diffY = touchStartY.current - e.touches[0].clientY;
    
    // Solo prevenir scroll si es claramente un swipe horizontal
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
      e.preventDefault();
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) {
      touchStartX.current = null;
      touchStartY.current = null;
      return;
    }

    const distance = touchStartX.current - e.changedTouches[0].clientX;
    const absDistance = Math.abs(distance);

    // Cambio inmediato sin animaciones para máxima velocidad
    if (absDistance > minSwipeDistance) {
      if (distance > 0) {
        handleSwipe("left");
      } else {
        handleSwipe("right");
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  return (
    <div className="w-full px-3 sm:px-4 lg:px-0 mb-4 sm:mb-5 lg:mb-6">
      <div className="flex justify-between items-center mb-2 sm:mb-3 lg:mb-4">
        <h2 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">
          Explorar categorías
        </h2>
      </div>

      {/* Contenedor del carrusel con soporte para swipe - versión optimizada */}
      <div
        className="relative"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{ touchAction: "pan-x pan-y" }}
      >
        {/* Grid de categorías (2x2) - sin transiciones para máxima velocidad */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:gap-3 xl:gap-4">
          {currentCategories.map((category) => (
            <button
              key={`${category.id}-${currentIndex}`}
              onClick={() => onCategoryClick(category.id)}
              className={`${getPillStyles(
                category.id
              )} rounded-md p-3 sm:p-4 text-left hover:bg-opacity-90 min-h-[56px] sm:min-h-[60px] active:opacity-80`}
            >
              <div className="flex items-center gap-2 lg:gap-2 xl:gap-3">
                <category.icon className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                <div className="text-xs sm:text-sm font-semibold">
                  {category.label}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
