import { Gift, Heart, MapPin, Zap } from "lucide-react";

interface Category {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  iconColor: string;
}

const categories: Category[] = [
  {
    id: "ofertas",
    label: "Ofertas",
    icon: Zap,
    color: "bg-gradient-to-br from-purple-500 to-purple-600",
    iconColor: "text-yellow-400",
  },
  {
    id: "cerca",
    label: "Cerca",
    icon: MapPin,
    color: "bg-gradient-to-br from-purple-500 to-purple-600",
    iconColor: "text-green-400",
  },
  {
    id: "favoritos",
    label: "Favoritos",
    icon: Heart,
    color: "bg-gradient-to-br from-purple-500 to-purple-600",
    iconColor: "text-red-400",
  },
  {
    id: "cupones",
    label: "Cupones",
    icon: Gift,
    color: "bg-gradient-to-br from-purple-500 to-purple-600",
    iconColor: "text-purple-400",
  },
];

interface QuickActionsSectionProps {
  onCategoryClick: (categoryId: string) => void;
}

export function QuickActionsSection({
  onCategoryClick,
}: QuickActionsSectionProps) {
  return (
    <div className="w-full px-3 sm:px-4 lg:px-0 mb-4 sm:mb-5 lg:mb-6">
      <div className="flex justify-between items-center mb-2 sm:mb-3 lg:mb-4">
        <h2 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">
          Acciones rápidas
        </h2>
      </div>
      <div className="grid grid-cols-4 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-1 gap-2 sm:gap-3 lg:gap-3 xl:gap-4">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategoryClick(category.id)}
            className="flex flex-col items-center gap-1 sm:gap-1.5 lg:gap-2 xl:gap-3 p-2 lg:p-2 xl:p-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div
              className={`w-12 h-12 sm:w-14 sm:h-14 lg:w-12 lg:h-12 xl:w-14 xl:h-14 2xl:w-16 2xl:h-16 rounded-full ${category.color} flex items-center justify-center shadow-lg hover:scale-105 transition-transform`}
            >
              <category.icon
                className={`w-5 h-5 sm:w-6 sm:h-6 lg:w-5 lg:h-5 xl:w-6 xl:h-6 2xl:w-7 2xl:h-7 ${category.iconColor}`}
              />
            </div>
            <span className="text-[10px] sm:text-xs lg:text-[10px] xl:text-xs 2xl:text-sm font-medium text-gray-700 text-center leading-tight">
              {category.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
