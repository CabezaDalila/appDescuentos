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
  const getPillStyles = (id: string) => {
    if (id === "food")
      return "bg-green-50 border border-green-200 text-green-700";
    if (id === "fashion")
      return "bg-pink-50 border border-pink-200 text-pink-700";
    if (id === "technology")
      return "bg-blue-50 border border-blue-200 text-blue-700";
    if (id === "home")
      return "bg-orange-50 border border-orange-200 text-orange-700";
    return "bg-gray-50 border border-gray-200 text-gray-700"; // fallback
  };
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
            className={`${getPillStyles(
              category.id
            )} rounded-md p-3 sm:p-4 text-left hover:bg-opacity-90 transition-transform hover:scale-[1.01] min-h-[56px] sm:min-h-[60px]`}
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
  );
}
