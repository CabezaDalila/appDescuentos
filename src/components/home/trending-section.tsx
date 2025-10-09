import { Card, CardContent } from "@/components/Share/card";
import { Heart, Star, TrendingUp } from "lucide-react";

interface TrendingOffer {
  id: string;
  title: string;
  category: string;
  discount: string;
  rating: number;
  image: string;
}

const trendingOffers: TrendingOffer[] = [
  {
    id: "restaurante-trending",
    title: "50% de descuento en restaurant...",
    category: "Restaurantes",
    discount: "50%",
    rating: 4.8,
    image: "/placeholder.jpg",
  },
  {
    id: "supermercado-trending",
    title: "30% de reintegro en...",
    category: "Supermercados",
    discount: "30%",
    rating: 4.5,
    image: "/placeholder.jpg",
  },
];

interface TrendingSectionProps {
  onOfferClick: (offerId: string) => void;
}

export function TrendingSection({ onOfferClick }: TrendingSectionProps) {
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
      <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {trendingOffers.map((offer) => (
          <Card
            key={offer.id}
            className="flex-shrink-0 w-40 sm:w-48 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => onOfferClick(offer.id)}
          >
            <CardContent className="p-0">
              <div className="relative">
                <div className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 bg-purple-500 text-white text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                  {offer.discount}
                </div>
                <button className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 p-0.5 sm:p-1 rounded-full bg-white/80 hover:bg-white transition-colors">
                  <Heart className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-600" />
                </button>
                <div className="w-full h-20 sm:h-24 bg-gray-200 rounded-t-lg flex items-center justify-center">
                  <div className="text-gray-400 text-sm sm:text-lg">📷</div>
                </div>
              </div>
              <div className="p-2 sm:p-3">
                <div className="flex justify-between items-center mb-1.5 sm:mb-2">
                  <span className="text-[9px] sm:text-xs bg-gray-100 text-gray-700 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                    {offer.category}
                  </span>
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-yellow-400 fill-current" />
                    <span className="text-[9px] sm:text-xs text-gray-600">
                      {offer.rating}
                    </span>
                  </div>
                </div>
                <div className="text-xs sm:text-sm font-medium text-gray-900 leading-tight">
                  {offer.title}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
