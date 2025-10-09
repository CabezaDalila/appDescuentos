import { ExploreCategory } from "@/constants/categories";

interface ExploreCategoriesSectionProps {
  categories: ExploreCategory[];
  onCategoryClick: (categoryId: string) => void;
  onViewAll: () => void;
}

export function ExploreCategoriesSection({
  categories,
  onCategoryClick,
}: ExploreCategoriesSectionProps) {
  return (
    <div className="w-full px-3 sm:px-4 mb-4 sm:mb-5">
      <div className="flex justify-between items-center mb-2 sm:mb-3">
        <h2 className="text-sm sm:text-base font-semibold text-gray-900">
          Explorar categorías
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategoryClick(category.id)}
            className={`${category.color} rounded-lg sm:rounded-xl p-2.5 sm:p-3 text-white text-left hover:opacity-90 transition-all hover:scale-105 transform`}
          >
            <category.icon className="w-5 h-5 sm:w-6 sm:h-6 mb-1.5 sm:mb-2" />
            <div className="text-xs sm:text-sm font-semibold">
              {category.label}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
