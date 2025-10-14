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
    <div className="w-full px-3 sm:px-4 lg:px-0 mb-4 sm:mb-5 lg:mb-6">
      <div className="flex justify-between items-center mb-2 sm:mb-3 lg:mb-4">
        <h2 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">
          Explorar categorías
        </h2>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-1 xl:grid-cols-1 2xl:grid-cols-1 gap-2 sm:gap-3 lg:gap-3 xl:gap-4">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategoryClick(category.id)}
            className={`${category.color} rounded-lg sm:rounded-xl lg:rounded-lg xl:rounded-xl 2xl:rounded-2xl p-2.5 sm:p-3 lg:p-2.5 xl:p-3 2xl:p-4 text-white text-left hover:opacity-90 transition-all hover:scale-105 transform`}
          >
            <div className="flex items-center gap-2 lg:gap-2 xl:gap-3">
              <category.icon className="w-5 h-5 sm:w-6 sm:h-6 lg:w-5 lg:h-5 xl:w-6 xl:h-6 2xl:w-7 2xl:h-7 flex-shrink-0" />
              <div className="text-xs sm:text-sm lg:text-xs xl:text-sm 2xl:text-base font-semibold">
                {category.label}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
