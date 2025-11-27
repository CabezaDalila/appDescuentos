import { useGeolocation } from "@/hooks/useGeolocation";
import { Heart, MapPin } from "lucide-react";

interface Category {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  iconColor: string;
}

const categories: Category[] = [
  {
    id: "cerca",
    label: "Cerca",
    icon: MapPin,
    color: "bg-gradient-to-r from-blue-300/60 to-blue-400/60",
    iconColor: "text-white-400",
  },
  {
    id: "favoritos",
    label: "Favoritos",
    icon: Heart,
    color: "bg-gradient-to-r from-red-300/60 to-red-400/60",
    iconColor: "text-white-400",
  },
];

interface QuickActionsSectionProps {
  onCategoryClick: (categoryId: string) => void;
}

export function QuickActionsSection({
  onCategoryClick,
}: QuickActionsSectionProps) {
  const {
    position,
    error: locationError,
    loading: locationLoading,
    getCurrentPosition,
  } = useGeolocation();

  const handleCategoryClick = async (categoryId: string) => {
    if (categoryId === "cerca") {
      const currentPosition = await getCurrentPosition();

      if (currentPosition) {
        const url = `/search?location=true&lat=${currentPosition.latitude}&lng=${currentPosition.longitude}`;
        window.location.href = url;
      } else if (locationError) {
        onCategoryClick(categoryId);
      }
    } else {
      onCategoryClick(categoryId);
    }
  };

  return (
    <div className="w-full px-3 sm:px-4 lg:px-0 mb-4 sm:mb-5 lg:mb-6">
      <div className="flex justify-between items-center mb-2 sm:mb-3 lg:mb-4"></div>
      <div className="w-full flex items-center justify-between gap-2 sm:gap-3">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategoryClick(category.id)}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full border text-xs sm:text-sm transition-colors ${
              category.id === "cerca"
                ? "bg-blue-50/80 border-blue-200 text-blue-700 hover:bg-blue-100"
                : "bg-red-50/80 border-red-200 text-red-700 hover:bg-red-100"
            }`}
          >
            <category.icon
              className={`w-4 h-4 sm:w-4 sm:h-4 ${category.iconColor} ${
                category.id === "cerca" && locationLoading
                  ? "animate-pulse"
                  : ""
              }`}
            />
            <span className={`font-medium`}>{category.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
