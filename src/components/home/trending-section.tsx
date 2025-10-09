import CardDiscountCompact from "@/components/cardDiscount/CardDiscountCompact";
import { Discount } from "@/types/discount";
import { TrendingUp } from "lucide-react";

interface TrendingSectionProps {
  discounts: Discount[];
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
              title={discount.name}
              image={discount.imageUrl || discount.image || "/imgDefault.svg"}
              category={discount.category}
              points={4.5} // Rating fijo ya que no está en la interfaz Discount
              distance="0.5 km" // Distancia fija ya que no está en la interfaz Discount
              expiration="30 días" // Expiración fija ya que no está en la interfaz Discount
              discountPercentage={
                discount.discountPercentage
                  ? `${discount.discountPercentage}%`
                  : "Oferta"
              }
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
