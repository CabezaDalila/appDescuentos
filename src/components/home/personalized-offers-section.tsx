import { Card, CardContent } from "@/components/Share/card";
import { getPersonalizedDiscounts } from "@/lib/discounts";
import Image from "next/image";
import { useEffect, useState } from "react";

interface HomePageDiscount {
  id: string;
  title: string;
  image: string;
  category: string;
  discountPercentage: string;
  points: number;
  distance: string;
  expiration: string;
  description: string;
  origin: string;
  status: "active" | "inactive" | "expired";
  isVisible: boolean;
}

interface PersonalizedOffersSectionProps {
  onOfferClick: (offerId: string) => void;
  userMemberships?: string[];
  userCredentials?: Array<{
    bank: string;
    type: string;
    brand: string;
    level: string;
  }>;
}

export function PersonalizedOffersSection({
  onOfferClick,
  userMemberships,
  userCredentials,
}: PersonalizedOffersSectionProps) {
  const [personalizedOffers, setPersonalizedOffers] = useState<
    HomePageDiscount[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPersonalizedDiscounts = async () => {
      if (
        (!userMemberships || userMemberships.length === 0) &&
        (!userCredentials || userCredentials.length === 0)
      ) {
        setLoading(false);
        return;
      }

      try {
        console.log("🔍 Debug - Llamando getPersonalizedDiscounts con:");
        console.log("  - userMemberships:", userMemberships);
        console.log("  - userCredentials:", userCredentials);

        const discounts = await getPersonalizedDiscounts(
          userMemberships || [],
          userCredentials || []
        );

        console.log(
          "🔍 Debug - Descuentos personalizados encontrados:",
          discounts
        );
        setPersonalizedOffers(discounts);
      } catch (error) {
        console.error("Error cargando descuentos personalizados:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPersonalizedDiscounts();
  }, [userMemberships, userCredentials]);

  return (
    <div className="w-full px-3 sm:px-4 mb-4 sm:mb-5">
      <div className="flex justify-between items-center mb-2 sm:mb-3">
        <div>
          <h2 className="text-sm sm:text-base font-semibold text-gray-900">
            Hecho para ti
          </h2>
          <p className="text-[10px] sm:text-xs text-gray-600">
            Basado en tus credenciales
          </p>
        </div>
      </div>
      {loading ? (
        <div className="space-y-2 sm:space-y-3">
          {[1, 2].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-gray-200 animate-pulse h-20"></div>
                <div className="p-2.5 sm:p-3 space-y-2">
                  <div className="h-4 bg-gray-200 animate-pulse rounded"></div>
                  <div className="h-3 bg-gray-200 animate-pulse rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : personalizedOffers.length === 0 ? (
        <Card className="overflow-hidden">
          <CardContent className="p-4 sm:p-5 text-center">
            <div className="text-gray-500 mb-2">
              <svg
                className="w-12 h-12 mx-auto mb-3 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
            </div>
            <p className="text-sm sm:text-base font-medium text-gray-900 mb-1">
              {!userMemberships || userMemberships.length === 0
                ? "Agrega tus credenciales"
                : "No hay descuentos para tus credenciales"}
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              {!userMemberships || userMemberships.length === 0
                ? "Ve a tu perfil y agrega tus tarjetas y membresías para ver descuentos personalizados"
                : "Pronto habrá nuevos descuentos disponibles"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {personalizedOffers.slice(0, 3).map((offer) => (
            <Card
              key={offer.id}
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => onOfferClick(offer.id)}
            >
              <CardContent className="p-0">
                <div className="relative h-24 sm:h-28">
                  <Image
                    src={offer.image}
                    alt={offer.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 bg-white/90 rounded-full px-1.5 sm:px-2 py-0.5 sm:py-1">
                    <span className="text-[10px] sm:text-xs font-bold text-gray-900">
                      {offer.discountPercentage}
                    </span>
                  </div>
                  <div className="absolute bottom-1.5 sm:bottom-2 left-1.5 sm:left-2 text-white">
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
                    {offer.origin}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
