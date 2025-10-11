import CardDiscountCompact from "@/components/cardDiscount/CardDiscountCompact";
import { TrendingUp } from "lucide-react";

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

interface TrendingSectionProps {
  discounts: HomePageDiscount[];
  onOfferClick: (offerId: string) => void;
}

export function TrendingSection({
  discounts,
  onOfferClick,
}: TrendingSectionProps) {
  // Limitar a máximo 3 descuentos para que quepan bien en el ancho
  const limitedDiscounts = discounts.slice(0, 3);

  return (
    <div className="w-full px-3 sm:px-4 mb-4 sm:mb-5">
      <div className="flex justify-between items-center mb-2 sm:mb-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600" />
          <h2 className="text-sm sm:text-base font-semibold text-gray-900">
            Tendencias
          </h2>
        </div>
      </div>
      {limitedDiscounts.length > 0 ? (
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {limitedDiscounts.map((discount) => (
            <CardDiscountCompact
              key={discount.id}
              title={discount.title}
              image={discount.image}
              category={discount.category}
              points={discount.points}
              distance={discount.distance}
              expiration={discount.expiration}
              discountPercentage={discount.discountPercentage}
              onNavigateToDetail={() => onOfferClick(discount.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500 text-sm">
          No hay descuentos de tendencias disponibles
        </div>
      )}
    </div>
  );
}
