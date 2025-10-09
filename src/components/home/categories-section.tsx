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
    <div className="w-full px-3 sm:px-4 mb-4 sm:mb-5">
      <div className="flex justify-between items-center mb-2 sm:mb-3"></div>
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategoryClick(category.id)}
            className="flex flex-col items-center gap-1 sm:gap-1.5"
          >
            <div
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full ${category.color} flex items-center justify-center shadow-lg hover:scale-105 transition-transform`}
            >
              <category.icon
                className={`w-5 h-5 sm:w-6 sm:h-6 ${category.iconColor}`}
              />
            </div>
            <span className="text-[10px] sm:text-xs font-medium text-gray-700 text-center leading-tight">
              {category.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
