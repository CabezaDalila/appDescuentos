import { Card, CardContent } from "@/components/Share/card";

interface PersonalizedOffer {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  discount: string;
  color: string;
}

const personalizedOffers: PersonalizedOffer[] = [
  {
    id: "restaurante-1",
    title: "50% en tu restaurante favorito",
    subtitle: "Bella Italia",
    category: "Restaurantes",
    discount: "50%",
    color: "bg-gradient-to-br from-purple-500 to-purple-600",
  },
  {
    id: "supermercado-1",
    title: "Reintegro en supermercados",
    subtitle: "Varios supermercados",
    category: "Supermercados",
    discount: "30%",
    color: "bg-gradient-to-br from-green-500 to-green-600",
  },
];

interface PersonalizedOffersSectionProps {
  onOfferClick: (offerId: string) => void;
}

export function PersonalizedOffersSection({
  onOfferClick,
}: PersonalizedOffersSectionProps) {
  return (
    <div className="w-full px-3 sm:px-4 mb-4 sm:mb-5">
      <div className="flex justify-between items-center mb-2 sm:mb-3">
        <div>
          <h2 className="text-sm sm:text-base font-semibold text-gray-900">
            Hecho para ti
          </h2>
          <p className="text-[10px] sm:text-xs text-gray-600">
            Basado en tus preferencias
          </p>
        </div>
      </div>
      <div className="space-y-2 sm:space-y-3">
        {personalizedOffers.map((offer) => (
          <Card
            key={offer.id}
            className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => onOfferClick(offer.id)}
          >
            <CardContent className="p-0">
              <div
                className={`${offer.color} p-2.5 sm:p-3 text-white relative`}
              >
                <div className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 bg-white/20 rounded-full px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-bold">
                  {offer.discount}
                </div>
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold mb-0.5 sm:mb-1">
                    {offer.discount}
                  </div>
                  <div className="text-[10px] sm:text-xs opacity-90">
                    {offer.category}
                  </div>
                </div>
              </div>
              <div className="p-2.5 sm:p-3">
                <div className="text-xs sm:text-sm font-medium text-gray-900 mb-0.5 sm:mb-1">
                  {offer.title}
                </div>
                <div className="text-[10px] sm:text-xs text-gray-600">
                  {offer.subtitle}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
