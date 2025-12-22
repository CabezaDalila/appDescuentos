import CardDiscountCompact from "@/components/cardDiscount/CardDiscountCompact";
import { ArrowRight, TrendingUp } from "lucide-react";

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

interface TrendingSectionProps {
  discounts: HomePageDiscount[];
  onOfferClick: (offerId: string, url?: string) => void;
  onViewAll?: () => void;
  loading?: boolean;
}

export function TrendingSection({
  discounts,
  onOfferClick,
  onViewAll,
  loading = false,
}: TrendingSectionProps) {
  // Limitar a máximo 3 descuentos para que quepan bien en el ancho
  const limitedDiscounts = discounts.slice(0, 3);

  return (
    <div className="w-full px-3 sm:px-4 lg:px-0 mb-4 sm:mb-5 lg:mb-6">
      <div className="flex justify-between items-center mb-2 sm:mb-3 lg:mb-4">
        <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3">
          <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-purple-600" />
          <h2 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">
            Tendencias
          </h2>
        </div>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="flex items-center gap-1 text-purple-600 text-xs lg:text-sm font-medium hover:text-purple-700 transition-colors"
          >
            Ver todas <ArrowRight className="w-3 h-3 lg:w-4 lg:h-4" />
          </button>
        )}
      </div>
      {loading ? (
        <div className="grid grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 sm:h-40 lg:h-48 bg-gray-200 animate-pulse rounded-lg"
            />
          ))}
        </div>
      ) : limitedDiscounts.length > 0 ? (
        <div className="grid grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
          {limitedDiscounts.map((discount) => (
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
              onNavigateToDetail={(distance) => {
                const url =
                  distance &&
                  distance !== "Sin ubicación" &&
                  distance !== "Calculando..."
                    ? `/discount/${discount.id}?distance=${encodeURIComponent(
                        distance
                      )}`
                    : `/discount/${discount.id}`;
                onOfferClick(discount.id, url);
              }}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-4 lg:py-6 text-gray-500 text-sm lg:text-base">
          No hay descuentos de tendencias disponibles
        </div>
      )}
    </div>
  );
}
