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
    <div className="w-full px-3 sm:px-4 mb-4 sm:mb-6">
      <div className="flex justify-between items-center mb-2 sm:mb-3">
        <h2 className="text-sm sm:text-base font-semibold text-gray-900">
          Promociones destacadas
        </h2>
        <button
          onClick={onViewAll}
          className="flex items-center gap-1 text-purple-600 text-xs font-medium hover:text-purple-700"
        >
          Ver todas <ArrowRight className="w-3 h-3" />
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
        {loading ? (
          <div className="col-span-full text-center py-6 sm:py-8">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-primary mx-auto mb-3 sm:mb-4"></div>
            <p className="text-sm sm:text-base text-gray-600">
              Cargando descuentos...
            </p>
          </div>
        ) : discounts.length === 0 ? (
          <EmptyState type="no-discounts" />
        ) : (
          discounts.map((discount) => (
            <CardDiscountCompact
              key={discount.id}
              title={discount.title}
              image={discount.image}
              category={discount.category}
              points={discount.points}
              distance={discount.distance}
              expiration={discount.expiration}
              discountPercentage={discount.discountPercentage}
              onNavigateToDetail={() => onDiscountClick(discount.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
