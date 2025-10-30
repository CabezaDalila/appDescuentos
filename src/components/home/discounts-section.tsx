import CardDiscountCompact from "@/components/cardDiscount/CardDiscountCompact";
import { ArrowRight } from "lucide-react";
import { EmptyState } from "./empty-state";

interface HomePageDiscount {
  id: string;
  title: string;
  image: string;
  category: string;
  points: number;
  distance: string;
  expiration: string;
  discountPercentage: string;
  description: string;
  origin: string;
  status: "active" | "inactive" | "expired";
  isVisible: boolean;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

interface DiscountsSectionProps {
  discounts: HomePageDiscount[];
  loading: boolean;
  onDiscountClick: (discountId: string) => void;
  onViewAll: () => void;
}

export function DiscountsSection({
  discounts,
  loading,
  onDiscountClick,
  onViewAll,
}: DiscountsSectionProps) {
  return (
    <div className="w-full px-3 sm:px-4 lg:px-0 mb-4 sm:mb-6 lg:mb-8">
      <div className="flex justify-between items-center mb-2 sm:mb-3 lg:mb-4">
        <h2 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">
          Promociones destacadas
        </h2>
        <button
          onClick={onViewAll}
          className="flex items-center gap-1 text-purple-600 text-xs lg:text-sm font-medium hover:text-purple-700 transition-colors"
        >
          Ver todas <ArrowRight className="w-3 h-3 lg:w-4 lg:h-4" />
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
        {loading ? (
          <div className="col-span-full text-center py-6 sm:py-8 lg:py-12">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 lg:h-16 lg:w-16 border-b-2 border-primary mx-auto mb-3 sm:mb-4 lg:mb-6"></div>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600">
              Cargando descuentos...
            </p>
          </div>
        ) : discounts.length === 0 ? (
          <EmptyState type="no-discounts" />
        ) : (
          discounts.map((discount) => (
            <CardDiscountCompact
              key={discount.id}
              id={discount.id}
              title={discount.title}
              image={discount.image}
              category={discount.category}
              points={discount.points}
              distance={discount.distance}
              expiration={discount.expiration}
              discountPercentage={discount.discountPercentage}
              discountLocation={discount.location}
              onNavigateToDetail={() => onDiscountClick(discount.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
